#!/usr/bin/env node
// Generate Editorial Reel props from rich topics.
//
//   node scripts/generate-reels.mjs --list
//   node scripts/generate-reels.mjs --id=konami-code --allow-unverified
//   node scripts/generate-reels.mjs --id=konami-code --out=daily/reel-demo
//
// WHY THIS EXISTS, AND WHY IT IS NOT generate-shorts.mjs
//
// generate-shorts.mjs takes a ten-word topic and has to fill thirty seconds.
// It cannot, so it pads: a generic three-item list keyed off the niche, a trio
// of imperatives, a call to action. And for one beat it printed a number drawn
// at random from a per-niche pool under the caption "Mind the number." The
// Nintendo video showed "5". That number meant nothing.
//
// This generator inverts the relationship. The topic decides the length. Beats
// come from the topic and only from the topic; if a topic has no real figure,
// it gets no figure beat, and the video is shorter. A short true video beats a
// long padded one, and there is no code path here that can invent a fact.
//
// TIMING
// Two modes, in order of preference:
//
//   1. voiceCuts — the narration has been measured with ffmpeg silencedetect
//      and the mid-point of each pause recorded in seconds. Cuts land on the
//      speaker's sentence breaks. This is how the Konami reel was timed.
//
//   2. Computed — no narration yet, so each beat gets the larger of what it
//      needs to finish animating and what it takes to read, plus a hold.
//
// Mode 2 is a floor, not a guess at good pacing. When narration arrives,
// measure it and move the topic to mode 1.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FPS = 30;

// --- timing constants, all derived from EditorialReel.tsx ------------------
// Words stagger in at STAGGER frames apart and each takes about SETTLE frames
// to finish its spring. A beat that is cut before its last word settles looks
// broken — that is exactly what happened when the opening beat was first cut
// to the narration, at 54 frames against the ~75 it needed.
const STAGGER = 2;
const SETTLE = 18;
const HOLD = 22;            // stillness after the last word lands
// Words per second. This is a READING pace, not a speaking one. Set to 2.6
// (roughly how fast a narrator talks) the first run gave a 32-word statement
// beat 300 frames — ten seconds on one card, in a twenty-seven second video.
// People read large on-screen type in bursts far faster than anyone says it,
// and the small supporting note is skimmed rather than read word by word.
const READ_WPS = 5.0;
const MIN_BEAT = 60;        // 2.0s
// 7.3s. Nothing in a vertical reel earns longer than this on a single card;
// if a beat wants more, its text is too long and should be split or cut.
const MAX_BEAT = 220;
const CODE_CHAR_STAGGER = 4; // CodeBeat advances a glyph every 4 frames

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;

/** Frames until the last element of a beat has finished animating. */
function animationCost(b) {
  switch (b.kind) {
    case "code": {
      // Glyphs stagger, THEN the caption starts: CodeBeat sets the caption
      // delay to chars.length * 4 + 10.
      const captionDelay = [...String(b.chars || "")].length * CODE_CHAR_STAGGER + 10;
      return captionDelay + words(b.caption) * STAGGER + SETTLE;
    }
    case "statement":
      return Math.max(4 + words(b.text) * STAGGER, 20 + words(b.note) * STAGGER) + SETTLE;
    case "credit":
      return Math.max(12 + words(b.name) * STAGGER, 26 + words(b.role) * STAGGER) + SETTLE;
    case "figure":
      // The number counts up on a spring as well as the context staggering in.
      return Math.max(30, 18 + words(b.context) * STAGGER) + SETTLE;
    case "kicker":
      return 2 + words(b.text) * 3 + SETTLE; // kicker staggers at 3, not 2
    case "sign":
      // +26 frames: the CTA is deliberately delayed so it reads as a closing
      // address rather than competing with the last line. The beat has to
      // outlast that delay or the ask is cut off mid-reveal, which is worse
      // than not asking.
      return Math.max(2 + words(b.line) * STAGGER, 30) + 26 + SETTLE;
    default:
      return 90;
  }
}

/** Total words a viewer has to actually read in a beat. */
function readingLoad(b) {
  const fields = {
    code: [b.caption],
    statement: [b.lead, b.text, b.note],
    credit: [b.year, b.name, b.role],
    figure: [b.value, b.unit, b.context],
    kicker: [b.text],
    // The CTA is not in the beat data - it comes from the composition - but it
    // is on screen and has to be read, so it counts toward the beat's length.
    sign: [b.line, b.handle, "Subscribe for more"],
  }[b.kind] || [];
  return fields.reduce((s, f) => s + words(f), 0);
}

const clamp = (n) => Math.max(MIN_BEAT, Math.min(MAX_BEAT, Math.round(n)));

/** Mode 2: each beat gets what it needs, independently. */
function computeDurations(beats) {
  return beats.map((b) =>
    clamp(Math.max(animationCost(b) + HOLD, (readingLoad(b) / READ_WPS) * FPS + HOLD)),
  );
}

/** Mode 1: cuts land on measured pauses in the narration. */
function durationsFromCuts(beats, cuts, delayFrames, tailFrames) {
  if (cuts.length < beats.length) {
    throw new Error(
      `voiceCuts has ${cuts.length} entries but there are ${beats.length} beats. ` +
      `One cut per beat is required — the last is where the narration ends.`,
    );
  }
  const out = [];
  let prev = 0;
  for (let i = 0; i < beats.length; i++) {
    const boundary = Math.round(cuts[i] * FPS) + delayFrames;
    out.push(boundary - prev);
    prev = boundary;
  }
  // The final beat runs past the end of the narration so the sign card is the
  // last thing on screen, in silence, rather than cutting on the last syllable.
  out[out.length - 1] += tailFrames;
  return out;
}

// --- args ------------------------------------------------------------------
const A = {};
for (const a of process.argv.slice(2)) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (m) A[m[1]] = m[2] === undefined ? true : m[2];
}

// fileURLToPath, not URL.pathname. pathname is percent-encoded, so the repo
// living under "Video Editing" turned into "Video%20Editing" and every read
// failed. It also handles the leading slash on Windows drive letters.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RICH = path.join(ROOT, "scripts", "data", "topics-rich.json");
const db = JSON.parse(fs.readFileSync(RICH, "utf8"));
const topics = db.topics || [];

if (A.list || !A.id) {
  console.log(`\nRich topics in ${path.relative(ROOT, RICH)}:\n`);
  for (const t of topics) {
    const mark = t.verified ? "verified  " : "UNVERIFIED";
    const timing = t.voiceCuts ? "voice-timed" : "computed   ";
    console.log(`  ${mark}  ${timing}  ${String(t.id).padEnd(22)} ${t.beats.length} beats`);
  }
  const unver = topics.filter((t) => !t.verified).length;
  console.log(`\n${topics.length} topics, ${unver} unverified.`);
  if (unver) {
    console.log(
      `\nUnverified topics will not generate without --allow-unverified, and\n` +
      `anything generated that way is stamped as a draft. Fill in sources and\n` +
      `set verified:true once the claims have actually been checked.`,
    );
  }
  if (!A.id) { console.log(`\nPick one with --id=<id>\n`); process.exit(0); }
}

const topic = topics.find((t) => t.id === A.id);
if (!topic) {
  console.error(`No rich topic with id "${A.id}". Run --list to see them.`);
  process.exit(1);
}

// --- the gate --------------------------------------------------------------
// This is the whole point of the file. A topic that has not been checked
// cannot quietly become a video.
if (!topic.verified && !A["allow-unverified"]) {
  console.error(
    `\n"${topic.id}" is not verified, so it will not be generated.\n\n` +
    (topic.reviewNote ? `  Review note: ${topic.reviewNote}\n\n` : "") +
    `  To check it off: fill "sources" in scripts/data/topics-rich.json with\n` +
    `  references you have actually read, confirm every claim in the beats,\n` +
    `  then set "verified": true.\n\n` +
    `  To render a draft locally anyway, pass --allow-unverified. The props\n` +
    `  will be stamped as a draft so it cannot be mistaken for finished work.\n`,
  );
  process.exit(2);
}

// --- build -----------------------------------------------------------------
const beats = topic.beats.map((b) => ({ ...b }));
const delayFrames = topic.voiceDelayInFrames || 0;
const durations = topic.voiceCuts
  ? durationsFromCuts(beats, topic.voiceCuts, delayFrames, Number(A.tail || 45))
  : computeDurations(beats);

// Whichever mode produced the numbers, every beat still has to be able to
// finish drawing itself. Voice-timed cuts are authoritative for WHERE the cut
// falls, but if the narration moves on before the picture has finished, that
// is worth knowing about rather than silently shipping.
const tooShort = [];
beats.forEach((b, i) => {
  const need = animationCost(b);
  if (durations[i] < need) tooShort.push({ i, kind: b.kind, has: durations[i], need });
});

const props = {
  ...(topic.verified ? {} : {
    _DRAFT: "UNVERIFIED TOPIC. Generated with --allow-unverified. The factual " +
            "claims in these beats have not been checked against a source. Do " +
            "not publish this. See reviewNote in scripts/data/topics-rich.json.",
  }),
  // WITHOUT THIS LINE THE VIDEO IS RENDERED BY THE WRONG COMPOSITION.
  //
  // render-batch.mjs reads _composition and falls back to "Daily" — ThemedShort
  // — when the field is absent. ThemedShort ignores `beats` entirely and draws
  // its own blurred pastel gradient. So a reel generated here, rendered through
  // that path, came out looking exactly like the old padded Shorts: same wash,
  // same template, none of the editorial layout. The palettes were never the
  // problem; they are near-black and were being thrown away.
  //
  // That is precisely what shipped to Instagram and YouTube, and why the new
  // format was indistinguishable from the format it replaced.
  _composition: "Reel",
  _generatedBy: `scripts/generate-reels.mjs from topics-rich.json (${topic.id})`,
  _timing: topic.voiceCuts
    ? `Cuts land on pauses measured in ${topic.voice} with ffmpeg silencedetect, ` +
      `offset by voiceDelayInFrames=${delayFrames} so the opening beat finishes ` +
      `before the narration starts. Re-measure if the narration is regenerated.`
    : `No narration yet. Each beat is the larger of the time it needs to finish ` +
      `animating and the time it takes to read, plus a ${HOLD}-frame hold. This ` +
      `is a floor, not considered pacing — measure a real read and switch this ` +
      `topic to voiceCuts.`,
  palette: topic.palette,
  ...(topic.voice ? { voiceUrl: topic.voice, voiceVolume: topic.voiceVolume ?? 1, voiceDelayInFrames: delayFrames } : {}),
  ...(topic.bed ? { audioUrl: topic.bed.url, audioVolume: topic.bed.volume ?? 0.34 } : {}),
  beats: beats.map((b, i) => ({ ...b, durationInFrames: durations[i] })),
};

const outDir = path.join(ROOT, A.out || path.join("daily", "reels"));
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${topic.id}.props.json`);
fs.writeFileSync(outFile, JSON.stringify(props, null, 2) + "\n");

// --- report ----------------------------------------------------------------
const total = durations.reduce((s, d) => s + d, 0);
console.log(`\n${topic.id}${topic.verified ? "" : "   [DRAFT — UNVERIFIED]"}`);
console.log(`  mode    ${topic.voiceCuts ? "voice-timed" : "computed"}`);
console.log(`  beats   ${beats.map((b, i) => `${b.kind}:${durations[i]}`).join("  ")}`);
console.log(`  total   ${total} frames (${(total / FPS).toFixed(2)}s)`);
console.log(`  out     ${path.relative(ROOT, outFile)}`);

if (tooShort.length) {
  console.log(`\n  WARNING — beats cut before they finish animating:`);
  for (const t of tooShort) {
    console.log(`    beat ${t.i} (${t.kind}): has ${t.has} frames, needs ${t.need}`);
  }
  console.log(`  The content will be mid-stagger at the cut. Lengthen the beat,`);
  console.log(`  shorten its text, or re-time the narration.`);
}

if (total / FPS > 60) console.log(`\n  NOTE: over 60s — too long for a Short or a Reel.`);
if (total / FPS < 12) console.log(`\n  NOTE: under 12s — likely too thin to hold anyone.`);

console.log(`\nRender it:\n  npx remotion render src/compositions/registry.tsx Reel --props=${path.relative(ROOT, outFile).replace(/\\/g, "/")} out/${topic.id}.mp4\n`);
