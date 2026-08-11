#!/usr/bin/env node
// Preflight a day's batch before anything is rendered or uploaded.
//
//   node scripts/preflight-daily.mjs --date=2026-08-12
//
// WHY
// The upload path reads a dozen fields out of <slug>.meta.json and passes them
// straight into a shell command. A missing one does not fail at generation, or
// at compliance, or during the render — it fails at the upload step, after
// several minutes of rendering, against a live channel, with a message about a
// malformed command rather than a missing field.
//
// That was survivable while a person wrote every topic. It is not now: the
// weekend research task adds topics unattended, generate-shorts builds meta
// from whatever those topics contain, and nobody sees the result until it is
// already publishing. This check runs in about a second and fails loudly
// before any of that.
//
// It deliberately duplicates knowledge held in render-batch.mjs. That is the
// point of a preflight — if the two ever disagree, this one fails and the
// batch stops, which is the safe direction.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const A = {};
for (const a of process.argv.slice(2)) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (m) A[m[1]] = m[2] === undefined ? true : m[2];
}
const DATE = A.date || new Date().toISOString().slice(0, 10);
const dir = path.join(ROOT, "daily", DATE);

if (!fs.existsSync(dir)) {
  console.log(`preflight: no daily/${DATE}/ — nothing to check.`);
  process.exit(0);
}

const propsFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".props.json"));
if (!propsFiles.length) {
  console.log(`preflight: daily/${DATE}/ has no props files — nothing to check.`);
  process.exit(0);
}

// Fields render-batch reads when building the upload command. Splitting them
// by platform matters: categoryId is meaningless to Instagram and would be a
// false alarm, while a missing one on YouTube is a failed upload.
const COMMON = ["slug", "file", "title", "description", "tags", "privacy", "channelId", "platform"];
const BY_PLATFORM = { youtube: ["categoryId"], instagram: [] };

const channels = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "data", "channels.json"), "utf8"));
const problems = [];
const note = (slug, msg) => problems.push(`${slug}: ${msg}`);

for (const pf of propsFiles) {
  const slug = pf.replace(/\.props\.json$/, "");
  const metaPath = path.join(dir, `${slug}.meta.json`);

  if (!fs.existsSync(metaPath)) { note(slug, "no .meta.json beside the props"); continue; }

  let meta, props;
  try { meta = JSON.parse(fs.readFileSync(metaPath, "utf8")); }
  catch (e) { note(slug, `meta.json will not parse: ${e.message}`); continue; }
  try { props = JSON.parse(fs.readFileSync(path.join(dir, pf), "utf8")); }
  catch (e) { note(slug, `props.json will not parse: ${e.message}`); continue; }

  for (const f of COMMON) {
    if (meta[f] === undefined || meta[f] === null || meta[f] === "") note(slug, `meta.${f} is missing or empty`);
  }
  for (const f of BY_PLATFORM[meta.platform] || []) {
    if (meta[f] === undefined || meta[f] === null || meta[f] === "") {
      note(slug, `meta.${f} is missing, and ${meta.platform} uploads need it`);
    }
  }

  if (!Array.isArray(meta.tags) || !meta.tags.length) note(slug, "meta.tags is empty");
  if (typeof meta.title === "string" && meta.title.length > 100) {
    note(slug, `title is ${meta.title.length} chars; YouTube truncates at 100`);
  }

  // A draft must never reach a render, let alone an upload.
  if (props._DRAFT) note(slug, "props are stamped _DRAFT — an unverified topic reached the batch");

  // Composition has to agree between props and meta, or render-batch renders
  // one thing while the log and history record another.
  const declared = props._composition || "Daily";
  if (!["Daily", "Reel"].includes(declared)) note(slug, `unknown _composition "${declared}"`);
  if (declared === "Reel" && meta.composition !== "Reel") note(slug, "props say Reel but meta.composition does not");

  if (!Array.isArray(props.beats) || !props.beats.length) note(slug, "props have no beats");
  else {
    const total = props.beats.reduce((s, b) => s + (b.durationInFrames || 0), 0);
    const secs = total / 30;
    if (!total) note(slug, "beats have no durations");
    // 180s is the Shorts ceiling, and render-batch passes --shorts
    // unconditionally. Over that, YouTube will not treat it as a Short.
    else if (secs > 180) note(slug, `${secs.toFixed(1)}s exceeds the 180s Shorts limit but --shorts is passed`);
    else if (secs < 5) note(slug, `${secs.toFixed(1)}s is too short to be a real video`);
  }

  // Every referenced audio file must exist, or the render produces a silent
  // video rather than an error.
  for (const key of ["audioUrl", "voiceUrl"]) {
    if (props[key] && !fs.existsSync(path.join(ROOT, "public", props[key]))) {
      note(slug, `${key} "${props[key]}" is not on disk`);
    }
  }

  const ch = (channels.channels || []).find((c) => c.id === meta.channelId);
  if (!ch) note(slug, `channelId "${meta.channelId}" is not in channels.json`);
  else if (ch.platform !== meta.platform) note(slug, `meta.platform "${meta.platform}" disagrees with channels.json ("${ch.platform}")`);
}

console.log(`preflight ${DATE}: ${propsFiles.length} item(s) checked.`);
if (!problems.length) {
  console.log("All clear. Every field the upload path reads is present.");
  process.exit(0);
}
console.log(`\n${problems.length} problem(s):`);
for (const p of problems) console.log(`  - ${p}`);
console.log(`\nStopping before render. Fix these rather than letting the batch fail at upload.`);
process.exit(1);
