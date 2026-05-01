#!/usr/bin/env node
// Render every video in daily/<date>/ then optionally upload to YouTube.
//
// USAGE:
//   node scripts/render-batch.mjs --date=2026-05-01           # render only
//   node scripts/render-batch.mjs --date=2026-05-01 --upload  # render + upload
//
// What it does:
//   1. Finds every <slug>.props.json in daily/<date>/
//   2. For each, runs `npx remotion render registry.tsx Daily out/<file>.mp4 --props=<...>`
//   3. If --upload: runs scripts/youtube-upload.mjs with the slug's meta.json
//   4. Logs everything to daily/<date>/render-log.txt
//
// Privacy default: PRIVATE. You must promote videos in YouTube Studio
// after manual review until you trust the automation.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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

append(`Rendering ${propsFiles.length} Shorts for ${DATE}`);
let okCount = 0, failCount = 0;

for (const propsFile of propsFiles) {
  const slug = propsFile.replace(/\.props\.json$/, "");
  const metaPath = path.join(dir, `${slug}.meta.json`);
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const propsAbs = path.join(dir, propsFile);
  const outFile = path.join(ROOT, meta.file);

  append(`\n--- ${slug} ---`);
  append(`  theme=${meta.themeId} font=${meta.fontFamilyId} audio=${meta.audioUrl}`);

  try {
    execSync(
      `npx remotion render src/compositions/registry.tsx Daily "${outFile}" --props="${propsAbs}"`,
      { cwd: ROOT, stdio: "inherit" }
    );
    append(`  rendered: ${meta.file}`);
    okCount++;
  } catch (err) {
    append(`  FAILED render: ${err.message || err}`);
    failCount++;
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
      execSync(cmd, { cwd: ROOT, stdio: "inherit" });
      append(`  uploaded: ${meta.title}`);
    } catch (err) {
      append(`  FAILED upload: ${err.message || err}`);
    }
  }
}

append(`\n=== Done. ${okCount} rendered, ${failCount} failed. ===`);
if (UPLOAD) append("All uploads default to PRIVATE — promote them in YouTube Studio after manual review.");
