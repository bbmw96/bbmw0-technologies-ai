// Render still frames from real props so the look can be REVIEWED before it
// ships, without waiting on a full render or an upload.
//
// WHY THIS EXISTS
// ---------------
// The visual work up to now was done blind. Nobody involved had actually
// watched a finished video: judgements were made from YouTube thumbnails,
// which show one frame of one beat and hide the thing that was actually wrong
// (every video used the same composition). A design loop where you cannot see
// the output produces exactly that failure, repeatedly.
//
// This renders one still per beat, for several videos, and writes them to
// previews/<date>/. The workflow commits them, so they can be opened in the
// repo and compared side by side. Five videos in a row should look like five
// different videos. If they do not, that is visible here in about a minute
// instead of after a publish.
//
// Stills are used rather than video on purpose: `remotion still` skips
// encoding entirely, so a full sweep costs seconds per frame rather than
// minutes per video.
//
// USAGE:
//   node scripts/render-previews.mjs --date=2026-08-10        # that day's props
//   node scripts/render-previews.mjs --date=... --limit=5     # cap videos
//   node scripts/render-previews.mjs --date=... --perBeat=1   # frames per beat
//
// EXIT CODES:
//   0  rendered (or nothing to render, which is not an error)
//   1  a still failed to render

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const argOf = (n, d = "") => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const DATE = argOf("date") || new Date().toISOString().slice(0, 10);
const LIMIT = Number(argOf("limit", "6")) || 6;
const GL = argOf("gl", "swangle");

const readJSON = (p, f) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, "")); }
  catch { return f; }
};

const dailyDir = path.join(ROOT, "daily", DATE);
if (!fs.existsSync(dailyDir)) {
  console.log(`No daily/${DATE} directory. Nothing to preview.`);
  process.exit(0);
}

const propsFiles = fs
  .readdirSync(dailyDir)
  .filter((f) => f.endsWith(".props.json"))
  .sort()
  .slice(0, LIMIT);

if (!propsFiles.length) {
  console.log(`No props files in daily/${DATE}. Nothing to preview.`);
  process.exit(0);
}

const outDir = path.join(ROOT, "previews", DATE);
fs.mkdirSync(outDir, { recursive: true });

console.log(`Rendering previews for ${propsFiles.length} video(s) from daily/${DATE}\n`);

let rendered = 0;
let failed = 0;
const index = [];

for (const file of propsFiles) {
  const slug = file.replace(/\.props\.json$/, "");
  const propsPath = path.join(dailyDir, file);
  const props = readJSON(propsPath, null);
  if (!props) { console.log(`  skip ${slug}: unreadable props`); continue; }

  const beats = props.beats || [];
  // Sample the MIDDLE of each beat. The start of a beat is mid-transition, so
  // an early frame shows a half-animated state rather than the composition,
  // which is misleading when the point is to judge layout.
  let cursor = 0;
  const shots = [];
  for (const b of beats) {
    const dur = b.durationInFrames || 0;
    if (dur > 0) shots.push({ kind: b.kind || "beat", frame: cursor + Math.floor(dur / 2) });
    cursor += dur;
  }

  console.log(`  ${slug}  theme=${props.themeId} font=${props.fontFamilyId}  ${shots.length} beat(s)`);

  for (const [i, shot] of shots.entries()) {
    const name = `${slug}--${String(i + 1).padStart(2, "0")}-${shot.kind}.png`;
    const outFile = path.join(outDir, name);
    const cmd = [
      "npx remotion still",
      "src/compositions/registry.tsx Daily",
      `"${outFile}"`,
      `--props="${propsPath}"`,
      `--frame=${shot.frame}`,
      GL ? `--gl=${GL}` : "",
    ].filter(Boolean).join(" ");

    try {
      execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
      const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
      console.log(`     ${name}  ${kb}KB`);
      index.push({ slug, beat: shot.kind, frame: shot.frame, file: `previews/${DATE}/${name}`,
                   themeId: props.themeId, fontFamilyId: props.fontFamilyId,
                   channelId: props.channelId || (props.meta && props.meta.channelId) || null });
      rendered++;
    } catch (err) {
      const detail = (err.stderr ? String(err.stderr) : err.message || "").split("\n").slice(-4).join(" | ");
      console.log(`     FAILED ${name}: ${detail}`);
      failed++;
    }
  }
}

// A contact sheet so the whole set can be judged at a glance, which is the
// only view that answers "do these look like different videos".
const rows = index.map((s) =>
  `<figure><img src="${path.basename(path.dirname(s.file))}/${path.basename(s.file)}" loading="lazy">` +
  `<figcaption>${s.slug}<br><span>${s.beat} · ${s.themeId} · ${s.fontFamilyId}</span></figcaption></figure>`
).join("\n");

fs.writeFileSync(
  path.join(ROOT, "previews", `${DATE}.html`),
  `<!doctype html><meta charset="utf-8"><title>BBMW0 previews ${DATE}</title>
<style>
 body{background:#111;color:#eee;font:14px/1.4 system-ui;margin:24px}
 h1{font-size:16px;font-weight:600;letter-spacing:.04em}
 .grid{display:flex;flex-wrap:wrap;gap:14px;margin-top:18px}
 figure{margin:0;width:180px}
 img{width:180px;border-radius:8px;display:block;background:#000}
 figcaption{font-size:11px;margin-top:6px;color:#bbb}
 figcaption span{color:#777}
</style>
<h1>BBMW0 preview sheet — ${DATE} — ${rendered} frame(s)</h1>
<p style="color:#888;font-size:12px">If two videos here share a composition, the layout rotation is not working.</p>
<div class="grid">
${rows}
</div>`
);

fs.writeFileSync(path.join(ROOT, "previews", `${DATE}.json`), JSON.stringify(index, null, 2) + "\n");

console.log(`\n${rendered} still(s) rendered, ${failed} failed.`);
console.log(`Contact sheet: previews/${DATE}.html`);
process.exit(failed ? 1 : 0);
