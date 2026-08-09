// Validate GitHub Actions workflow files BEFORE pushing them.
//
// WHY THIS EXISTS
// ---------------
// On 2026-08-09 a bulk edit added `if: steps.gate.outputs.run == 'true'` to
// every step, including one that already had `if: always()`. That produced two
// `if:` keys on a single step. GitHub rejected the whole file with
// "Invalid workflow file (Line: 298, Col: 9): 'if' is already defined", so the
// workflow did not merely fail, it could not start at all. Every scheduled and
// manual run died instantly, including the first Instagram publish.
//
// The check that was in place at the time was a Python `yaml.safe_load()`
// parse. It PASSED, because PyYAML silently keeps the last of a duplicate key.
// A file can therefore parse cleanly everywhere locally and still be rejected
// outright by Actions. js-yaml, by contrast, throws on duplicate keys, which is
// the behaviour that matches GitHub.
//
// A broken workflow cannot be caught by CI, because CI is the thing that will
// not run. It has to be caught before the push. Hence this script, and hence
// `npm run doctor` calling it.
//
// USAGE:
//   node scripts/validate-workflows.mjs            # all workflows
//   node scripts/validate-workflows.mjs <file...>  # specific files
//
// EXIT CODES:
//   0  all workflows valid
//   1  at least one problem found

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WF_DIR = path.join(ROOT, ".github", "workflows");

let yaml;
try {
  yaml = (await import("js-yaml")).default;
} catch {
  console.error(
    "js-yaml is not installed. Run `npm ci`, or install it with\n" +
      "  npm i -D js-yaml\n" +
      "Workflow validation cannot run without a YAML parser."
  );
  process.exit(1);
}

const problems = [];
const notes = [];

function problem(file, msg) {
  problems.push(`${path.basename(file)}: ${msg}`);
}

// ---------------------------------------------------------------------------

function checkDuplicateKeys(file, raw) {
  try {
    // js-yaml throws YAMLException on a duplicated mapping key, matching what
    // GitHub Actions does. This is the check that would have caught the outage.
    return yaml.load(raw, { filename: file, json: false });
  } catch (err) {
    problem(file, `will be REJECTED by GitHub. ${err.message.split("\n")[0]}`);
    return null;
  }
}

// Every `steps.<id>.outputs` / `steps.<id>.outcome` reference needs a step that
// actually declares `id: <id>`. A typo here fails silently: the expression just
// evaluates empty, so a gated step is skipped forever and nothing publishes.
function checkStepIdReferences(file, doc) {
  for (const [jobName, job] of Object.entries(doc.jobs || {})) {
    const steps = job.steps || [];
    const ids = new Set(steps.map((s) => s && s.id).filter(Boolean));
    const raw = JSON.stringify(job);
    const refs = new Set(
      [...raw.matchAll(/steps\.([A-Za-z0-9_-]+)\.(outputs|outcome|conclusion)/g)].map(
        (m) => m[1]
      )
    );
    for (const ref of refs) {
      if (!ids.has(ref)) {
        problem(
          file,
          `job "${jobName}" references steps.${ref}.* but no step declares id: ${ref}`
        );
      }
    }
  }
}

// upload-artifact@v4 ERRORS on a duplicate artefact name within a single run.
// With a matrix, a fixed name means every leg after the first fails its upload
// and turns the run red even when publishing succeeded.
function checkArtifactNames(file, doc) {
  for (const [jobName, job] of Object.entries(doc.jobs || {})) {
    const matrix = job.strategy && job.strategy.matrix;
    if (!matrix) continue;
    const matrixKeys = Object.keys(matrix).filter((k) => !k.startsWith("_"));
    for (const step of job.steps || []) {
      const uses = String((step && step.uses) || "");
      if (!/actions\/upload-artifact@v[4-9]/.test(uses)) continue;
      const name = String((step.with && step.with.name) || "");
      if (!name) {
        problem(file, `job "${jobName}" uploads an artefact with no name`);
        continue;
      }
      const varies = matrixKeys.some((k) => name.includes(`matrix.${k}`));
      if (!varies) {
        problem(
          file,
          `job "${jobName}" is a matrix job but artefact name "${name}" is ` +
            `constant. upload-artifact@v4 errors on duplicate names, so every ` +
            `leg after the first will fail. Add \${{ matrix.${matrixKeys[0]} }}.`
        );
      }
    }
  }
}

// A matrix job whose legs all commit to the same branch will race unless
// max-parallel is 1. This bit us conceptually before; keep it enforced.
function checkMatrixConcurrency(file, doc) {
  for (const [jobName, job] of Object.entries(doc.jobs || {})) {
    const strategy = job.strategy;
    if (!strategy || !strategy.matrix) continue;
    const commits = (job.steps || []).some((s) =>
      /git\s+(commit|push)/.test(String((s && s.run) || ""))
    );
    if (commits && strategy["max-parallel"] !== 1) {
      problem(
        file,
        `job "${jobName}" pushes commits from a matrix without max-parallel: 1. ` +
          `Legs will race and clobber each other.`
      );
    }
    if (commits && strategy["fail-fast"] !== false) {
      notes.push(
        `${path.basename(file)}: job "${jobName}" has fail-fast on. One ` +
          `channel failing will cancel the others.`
      );
    }
  }
}

// A step that must run after a possible failure needs always() in its `if`.
// Without it the step is skipped, which is how upload records were being lost.
function checkAlwaysOnRecoverySteps(file, doc) {
  const recovery = /commit history|clean ?up|upload artefact|upload artifact|health report/i;
  for (const [jobName, job] of Object.entries(doc.jobs || {})) {
    for (const step of job.steps || []) {
      const name = String((step && step.name) || "");
      if (!recovery.test(name)) continue;
      const cond = String((step && step.if) || "");
      if (!cond.includes("always()")) {
        problem(
          file,
          `job "${jobName}" step "${name}" looks like a recovery step but its ` +
            `if does not include always(). It will be skipped when an earlier ` +
            `step fails, which is exactly when it is needed.`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------

const argFiles = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const files = argFiles.length
  ? argFiles.map((f) => (path.isAbsolute(f) ? f : path.join(ROOT, f)))
  : fs.existsSync(WF_DIR)
    ? fs
        .readdirSync(WF_DIR)
        .filter((f) => /\.ya?ml$/i.test(f))
        .map((f) => path.join(WF_DIR, f))
    : [];

if (!files.length) {
  console.log("No workflow files found.");
  process.exit(0);
}

console.log("Validating GitHub Actions workflows");
console.log("");

for (const file of files) {
  // A BOM makes Actions reject the file too, and OneDrive has added them here
  // before. Strip for parsing, but report it, because the pushed file is what
  // GitHub sees.
  let raw = fs.readFileSync(file, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) {
    problem(file, "starts with a UTF-8 BOM. GitHub will reject it.");
    raw = raw.slice(1);
  }
  if (raw.includes("\r\n")) {
    notes.push(`${path.basename(file)}: contains CRLF line endings.`);
  }

  const doc = checkDuplicateKeys(file, raw);
  if (!doc || typeof doc !== "object") {
    console.log(`  [FAIL] ${path.basename(file)}`);
    continue;
  }

  const before = problems.length;
  checkStepIdReferences(file, doc);
  checkArtifactNames(file, doc);
  checkMatrixConcurrency(file, doc);
  checkAlwaysOnRecoverySteps(file, doc);
  const ok = problems.length === before;
  console.log(`  [${ok ? "ok" : "FAIL"}] ${path.basename(file)}`);
}

console.log("");

if (notes.length) {
  console.log("Notes:");
  for (const n of notes) console.log(`  - ${n}`);
  console.log("");
}

if (problems.length) {
  console.log(`${problems.length} problem(s) found:`);
  for (const p of problems) console.log(`  x ${p}`);
  console.log("");
  console.log("Fix these before pushing. A workflow GitHub rejects does not");
  console.log("fail loudly, it simply never runs.");
  process.exit(1);
}

console.log("All workflows valid.");
process.exit(0);
