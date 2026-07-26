#!/usr/bin/env node
// Render every video in daily/<date>/ then optionally upload to YouTube.
//
// USAGE:
//   node scripts/render-batch.mjs --date=2026-05-01           # render only
//   node scripts/render-batch.mjs --date=2026-05-01 --upload  # render + upload
//
// What it does:
//   1. Finds every <slug>.props.json in daily/<date>/
//   2. Skips any slug that already has a recorded youtubeId (never re-uploads)
//   3. Runs `npx remotion render registry.tsx Daily out/<file>.mp4 --props=<...>`
//   4. If --upload: runs scripts/youtube-upload.mjs with the slug's meta.json
//   5. Records the returned YouTube video ID back into published.json
//   6. Logs everything to daily/<date>/render-log.txt
//
// Privacy: driven by meta.privacy written by the generator (default public).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// BOM-tolerant JSON reader. OneDrive and PowerShell both like to prepend a
// UTF-8 BOM, which makes JSON.parse throw. Strip it before parsing, always.
function readJSON(p) {
  const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${p}: ${err.message}`);
  }
}

// Auto-detect i9/RTX hardware. Use ~75% of logical CPU threads for Remotion workers.
const CONCURRENCY = Math.max(2, Math.floor(os.cpus().length * 0.75));

// On Windows, ANGLE translates OpenGL to Direct3D so the RTX GPU accelerates Chromium.
const GL_FLAGS = process.platform === "win32" ? "--gl=angle" : "";

function args(argv) {
  const o = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) o[a.slice(2)] = true;
      else o[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  return o;
}
const A = args(process.argv);
const DATE = A.date || new Date().toISOString().slice(0, 10);
const UPLOAD = !!A.upload;

const dir = path.join(ROOT, "daily", DATE);
if (!fs.existsSync(dir)) {
  console.error(`No daily/${DATE}/ directory. Run npm run gen:daily first.`);
  process.exit(1);
}

const propsFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".props.json"));
if (!propsFiles.length) {
  console.error(`No *.props.json in daily/${DATE}/`);
  process.exit(1);
}

fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
const log = [];
const logPath = path.join(dir, "render-log.txt");
const append = (s) => { log.push(s); fs.writeFileSync(logPath, log.join("\n") + "\n"); console.log(s); };

append(`Rendering ${propsFiles.length} Shorts for ${DATE} (concurrency=${CONCURRENCY}, GL=${GL_FLAGS || "default"})`);
let okCount = 0, failCount = 0, skipCount = 0, uploadCount = 0, blockedCount = 0;

// ---------------------------------------------------------------- compliance
// Nothing reaches YouTube without clearing the compliance gate. If the verdict
// is missing we run the gate rather than trusting an unreviewed batch: an
// absent verdict must never be read as approval.
let complianceBlocked = new Set();
if (UPLOAD) {
  const verdictPath = path.join(dir, "compliance-verdict.json");
  if (!fs.existsSync(verdictPath)) {
    append("No compliance verdict found. Running the gate before upload.");
    try {
      execSync(`node scripts/compliance-gate.mjs --date="${DATE}"`, { cwd: ROOT, stdio: "inherit" });
    } catch {
      // Exit code 1 means some videos were blocked, which is a normal outcome.
      // The verdict file is still written, so carry on and read it.
    }
  }
  if (!fs.existsSync(verdictPath)) {
    append("FATAL: compliance gate did not produce a verdict. Refusing to upload.");
    process.exit(1);
  }
  const verdict = readJSON(verdictPath);
  complianceBlocked = new Set(verdict.blocked || []);
  append(`Compliance: ${(verdict.allowed || []).length} cleared, ${complianceBlocked.size} blocked (policy v${verdict.policyVersion}).`);
  if (complianceBlocked.size) {
    append(`Blocked by compliance: ${[...complianceBlocked].join(", ")}`);
  }
}

const publishedPath = path.join(ROOT, "scripts/data/published.json");
const published = readJSON(publishedPath);
published.videos = published.videos || [];

// CRITICAL: the generator records a topic in topicsUsed at GENERATION time, so
// topicsUsed can never be the skip signal. It would skip every single video.
// The real signal is whether we already have a YouTube video ID for that slug.
const uploadedIds = new Set(
  published.videos.filter((v) => v && v.youtubeId).map((v) => v.id)
);

function recordUpload(slug, youtubeId, privacy) {
  const fresh = readJSON(publishedPath);
  fresh.videos = fresh.videos || [];
  const entry = fresh.videos.find((v) => v && v.id === slug);
  if (entry) {
    entry.youtubeId = youtubeId;
    entry.youtubeUrl = `https://youtu.be/${youtubeId}`;
    entry.uploadedAt = new Date().toISOString();
    entry.privacy = privacy;
  }
  fs.writeFileSync(publishedPath, JSON.stringify(fresh, null, 2) + "\n");
}

for (const propsFile of propsFiles) {
  const slug = propsFile.replace(/\.props\.json$/, "");
  const metaPath = path.join(dir, `${slug}.meta.json`);
  const meta = readJSON(metaPath);
  const propsAbs = path.join(dir, propsFile);
  const outFile = path.join(ROOT, meta.file);

  append(`\n--- ${slug} ---`);

  if (UPLOAD && uploadedIds.has(slug)) {
    append(`  SKIPPED: already uploaded to YouTube. Clear its youtubeId in published.json to re-run.`);
    skipCount++;
    continue;
  }
  append(`  theme=${meta.themeId} font=${meta.fontFamilyId} audio=${meta.audioUrl} privacy=${meta.privacy}`);

  // Reuse an existing render if one is already on disk and non-trivial in size.
  let needsRender = true;
  if (fs.existsSync(outFile)) {
    try {
      if (fs.statSync(outFile).size > 100_000) {
        append(`  reusing existing render: ${meta.file}`);
        needsRender = false;
        okCount++;
      }
    } catch { /* fall through and re-render */ }
  }

  if (needsRender) {
    const renderCmd = [
      "npx remotion render",
      "src/compositions/registry.tsx Daily",
      `"${outFile}"`,
      `--props="${propsAbs}"`,
      `--concurrency=${CONCURRENCY}`,
      GL_FLAGS,
    ].filter(Boolean).join(" ");

    try {
      execSync(renderCmd, { cwd: ROOT, stdio: "inherit" });
      append(`  rendered: ${meta.file}`);
      okCount++;
    } catch (err) {
      append(`  FAILED render: ${err.message || err}`);
      failCount++;
      continue;
    }
  }

  if (UPLOAD && complianceBlocked.has(slug)) {
    append(`  BLOCKED BY COMPLIANCE: not uploaded. See daily/${DATE}/compliance-verdict.json.`);
    blockedCount++;
    continue;
  }

  if (UPLOAD) {
    try {
      const tags = (meta.tags || []).join(",");
      const cmd = [
        "node", "scripts/youtube-upload.mjs",
        `--file="${outFile}"`,
        `--title="${meta.title.replace(/"/g, '\\"')}"`,
        `--description="${meta.description.replace(/\n/g, "\\n").replace(/"/g, '\\"')}"`,
        `--tags="${tags}"`,
        `--category=${meta.categoryId}`,
        `--privacy=${meta.privacy}`,
        "--shorts",
      ].join(" ");

      // Capture stdout so we can pull the video ID out, but still show progress.
      const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] });
      process.stdout.write(out);

      const m = out.match(/Video ID:\s*([A-Za-z0-9_-]{6,})/);
      if (m) {
        recordUpload(slug, m[1], meta.privacy);
        uploadedIds.add(slug);
        append(`  uploaded ${meta.privacy}: https://youtu.be/${m[1]}`);
      } else {
        append(`  uploaded, but no video ID found in output. Not recorded.`);
      }
      uploadCount++;
    } catch (err) {
      append(`  FAILED upload: ${err.message || err}`);
      failCount++;
    }
  }
}

append(`\n=== Done. ${okCount} rendered, ${uploadCount} uploaded, ${skipCount} skipped, ${blockedCount} blocked by compliance, ${failCount} failed. ===`);
if (failCount > 0) process.exit(1);
