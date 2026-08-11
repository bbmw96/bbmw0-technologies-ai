#!/usr/bin/env node
// Master the ambient beds, and register the results.
//
//   node scripts/audio/normalise-beds.mjs           # report only
//   node scripts/audio/normalise-beds.mjs --write   # do it
//
// WHY
// The beds in public/sounds/ are synthesised from filtered noise by
// generate-beds.sh and were never levelled. They sit around -37dB mean and
// -23dB peak. Mixed into a video at a bed volume of 0.45 they contribute
// almost nothing: a rendered Short measures about -44dB, which on a phone is
// silence. Twelve videos shipped that way.
//
// This writes loudnorm'd copies to public/sounds/norm/ at I=-18, TP=-2, which
// land near -21dB mean and -8dB peak, and registers each one in
// audio-licences.json so the compliance gate accepts them.
//
// WHY COPIES, NOT IN PLACE
// The originals are referenced by published props files. Rewriting them would
// silently change the audio of videos already shipped and recorded, and would
// leave no way to hear what the old mix actually was.
//
// ON THE HALAL REVIEW
// loudnorm is gain and limiting. It does not and cannot introduce a tone,
// melody, beat or instrument — the output is the same filtered noise, louder.
// The reviewed property of the source is preserved by construction, and each
// derived record says so and names its parent. This is a derivation argument,
// not a fresh review: if you want the copies reviewed in their own right,
// listen to them and update the records.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOUNDS = path.join(ROOT, "public", "sounds");
const NORM = path.join(SOUNDS, "norm");
const LICENCES = path.join(ROOT, "scripts", "data", "audio-licences.json");
const POOLS = path.join(ROOT, "scripts", "data", "copy-pools.json");

const WRITE = process.argv.includes("--write");
const TARGET_I = -18, TARGET_TP = -2;

// Bed volume for the daily Shorts once the beds are mastered. These videos
// have no narration, so the bed is the entire soundtrack and wants to sit near
// the top. 0.9 against a -21dB source lands about -22dB mean, -9dB peak.
const DAILY_BED_VOL = 0.9;

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function levels(file) {
  // spawnSync, not execFileSync. volumedetect prints to stderr and ffmpeg
  // exits 0, so execFileSync returns only stdout (empty) and never throws —
  // the first run of this script reported every level as "?" for that reason.
  const r = spawnSync("ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8" });
  const out = String(r.stderr || "");
  const mean = /mean_volume:\s*(-?[\d.]+)/.exec(out);
  const max = /max_volume:\s*(-?[\d.]+)/.exec(out);
  return { mean: mean ? Number(mean[1]) : null, max: max ? Number(max[1]) : null };
}

const sources = fs.readdirSync(SOUNDS)
  .filter((f) => f.endsWith(".mp3"))
  // konami-keen is narration, not a bed. It came out of a TTS engine already
  // levelled, and running it through loudnorm would only add a generation of
  // lossy re-encoding for nothing.
  .filter((f) => f.startsWith("bbmw0-"));

if (WRITE) fs.mkdirSync(NORM, { recursive: true });

const rows = [];
for (const f of sources) {
  const src = path.join(SOUNDS, f);
  const dst = path.join(NORM, f);
  const before = levels(src);

  if (WRITE && !fs.existsSync(dst)) {
    sh("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", src,
      "-af", `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=11`,
      "-ar", "48000", "-b:a", "192k", dst]);
  }

  const exists = fs.existsSync(dst);
  const after = exists ? levels(dst) : { mean: null, max: null };
  rows.push({ f, before, after, exists });
  const fmt = (l) => (l.mean === null ? "  ?  " : `${String(l.mean).padStart(6)} / ${String(l.max).padStart(6)}`);
  console.log(`  ${f.padEnd(28)} ${fmt(before)}  ->  ${exists ? fmt(after) : "(not written)"}`);
}

if (!WRITE) {
  console.log(`\nReport only. Re-run with --write to create public/sounds/norm/ and register the files.`);
  process.exit(0);
}

// --- register in audio-licences.json --------------------------------------
const lic = JSON.parse(fs.readFileSync(LICENCES, "utf8"));
lic.tracks = lic.tracks || [];
let added = 0;
for (const { f } of rows) {
  const rel = `sounds/norm/${f}`;
  if (lic.tracks.some((t) => t.file === rel)) continue;
  const parent = lic.tracks.find((t) => t.file === `sounds/${f}`);
  if (!parent) {
    console.log(`  ! no parent licence record for sounds/${f} — skipping ${rel}`);
    continue;
  }
  const buf = fs.readFileSync(path.join(NORM, f));
  lic.tracks.push({
    ...parent,
    file: rel,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    bytes: buf.length,
    derived_from: `sounds/${f}`,
    derivation: `ffmpeg loudnorm I=${TARGET_I} TP=${TARGET_TP} LRA=11, resampled to 48kHz, 192kbps. Gain and limiting only.`,
    halal_note: `${parent.halal_note} This copy is that file with gain and limiting applied; loudnorm cannot introduce tone, melody, beat or instrument, so the reviewed property is preserved by derivation rather than by fresh review.`,
    verified_on: new Date().toISOString().slice(0, 10),
  });
  added++;
}
if (added) fs.writeFileSync(LICENCES, JSON.stringify(lic, null, 2) + "\n");
console.log(`\naudio-licences.json: ${added} record(s) added.`);

// --- point the daily pool at the mastered copies ---------------------------
const pools = JSON.parse(fs.readFileSync(POOLS, "utf8"));
let moved = 0;
for (const a of pools.audios || []) {
  const m = /^sounds\/(bbmw0-.*\.mp3)$/.exec(a.url);
  if (!m) continue;
  if (!fs.existsSync(path.join(NORM, m[1]))) continue;
  a.url = `sounds/norm/${m[1]}`;
  a.vol = DAILY_BED_VOL;
  moved++;
}
if (moved) fs.writeFileSync(POOLS, JSON.stringify(pools, null, 2) + "\n");
console.log(`copy-pools.json: ${moved} bed(s) repointed at sounds/norm/ at volume ${DAILY_BED_VOL}.`);
