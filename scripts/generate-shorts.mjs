#!/usr/bin/env node
// Generate N unique Daily Shorts.
//
// USAGE:
//   node scripts/generate-shorts.mjs --count=5
//   node scripts/generate-shorts.mjs --count=5 --date=2026-05-01
//   node scripts/generate-shorts.mjs --count=5 --niche=animals
//
// WHAT IT DOES:
//   1. Reads scripts/data/topics.json + copy-pools.json
//   2. Reads scripts/data/published.json (history of every video ever made)
//   3. Picks --count topics that have NEVER been published
//   4. For each: picks an UNUSED theme+font+audio combination (deterministic
//      shuffle based on date + topic id, so reruns produce same video)
//   5. Builds a beat list with randomised layout variants and randomised copy
//      from the pool (different eyebrow, sub, headings, CTAs each time)
//   6. Writes daily/<date>/<slug>.props.json (the Remotion --props file)
//   7. Writes daily/<date>/<slug>.meta.json (title, description, tags for YT)
//   8. Appends to scripts/data/published.json so the next run skips them
//
// NOTHING REPEATS. Every video gets a unique:
//   - topic (no topic ever runs twice)
//   - theme (12 options) + font (5) + audio (6) = 360 combos before content
//   - layout variants per beat (3^7 = 2187 layout permutations)
//   - copy slots filled from rotating pools
//   - title + description + tag set
//
// EXIT 0 on success. EXIT 1 on argument error. EXIT 2 if topic library
// runs out (you've published every topic .  add more to topics.json).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(__dirname, "data");

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
const PUBLISHED = path.join(DATA, "published.json");
const TOPICS = readJSON(path.join(DATA, "topics.json"));
const POOLS  = readJSON(path.join(DATA, "copy-pools.json"));

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
// let, not const: rich topics claim slots off the top of the batch and the
// padded ThemedShort path only covers the remainder.
let COUNT = parseInt(A.count || "5", 10);
const DATE  = A.date || new Date().toISOString().slice(0, 10);
const NICHE = A.niche || null;

if (!Number.isFinite(COUNT) || COUNT < 1 || COUNT > 50) {
  console.error("--count must be 1..50");
  process.exit(1);
}

// Stable PRNG seeded from date + topic id, so re-running for the same date
// produces the same videos (idempotent) but different dates differ.
function seededRand(seed) {
  let h = crypto.createHash("sha256").update(seed).digest();
  let i = 0;
  return () => {
    if (i >= h.length - 4) {
      h = crypto.createHash("sha256").update(h).digest();
      i = 0;
    }
    const v = h.readUInt32BE(i);
    i += 4;
    return v / 0xffffffff;
  };
}
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];

// Publish live by default. Override with --privacy=private|unlisted.
// Weekend specials get a longer runtime and the premium visual treatment.
// Not a different renderer: the same components, given more room to breathe
// and an extra beat, which is what actually reads as "produced" rather than
// "generated".
const IS_SPECIAL = A.special === true || A.special === "true";

const PRIVACY = ["private", "unlisted", "public"].includes(A.privacy) ? A.privacy : "public";

// Channel routing. Each channel owns a distinct set of niches so two owned
// channels never publish the same fact, which the compliance gate blocks and
// which reads as reuploading to YouTube.
const CHANNELS = readJSON(path.join(DATA, "channels.json"));
const CHANNEL = A.channel
  ? (CHANNELS.channels.find((c) => c.id === A.channel)
     || (() => { console.error(`Unknown channel "${A.channel}". Known: ${CHANNELS.channels.map(c => c.id).join(", ")}`); process.exit(1); })())
  : CHANNELS.channels.find((c) => c.enabled) || CHANNELS.channels[0];

// Load history.
const history = fs.existsSync(PUBLISHED)
  ? readJSON(PUBLISHED)
  : { topicsUsed: [], combosUsed: [], videos: [] };

// Pick unused topics.
const usedTopics = new Set(history.topicsUsed);
const channelNiches = new Set(CHANNEL.niches || []);

// ---------------------------------------------------------------- rich first
// A rich topic in topics-rich.json carries real researched content and renders
// as an Editorial Reel: no filler list, no generic trio, no invented number.
// A topic in topics.json carries ten words and has to be padded to fill the
// runtime. So rich topics are always preferred, and the ThemedShort path only
// fills whatever the rich pool cannot.
//
// There are three rich topics and the daily cadence is four per weekday per
// channel, so both paths run for now. As topics-rich.json grows, the padded
// path shrinks on its own without another change here.
//
// EVERYTHING BELOW IS DEFENSIVE ON PURPOSE. This runs unattended at 09:00
// against three live channels. A malformed rich topic, a missing file, a bad
// generator — any of it — must degrade to the old behaviour and still publish,
// never abort the run. Hence the try/catch returning an empty list.
let richChosen = [];
try {
  const RICH_FILE = path.join(DATA, "topics-rich.json");
  if (fs.existsSync(RICH_FILE)) {
    const rich = readJSON(RICH_FILE);
    // Usage is tracked as "reel:<id>", not "<id>".
    //
    // A rich topic deliberately shares its id with the thin topics.json entry
    // for the same subject — konami-code, first-bug-real and
    // copy-paste-inventor all exist in both files. Checking the bare id meant
    // every rich topic was already "used", because the padded version had
    // shipped weeks earlier, and the reel path silently produced nothing at
    // all. The prefix keeps the two ledgers apart: a subject can be covered
    // once as a padded Short and once, properly, as a Reel.
    //
    // Nothing here stops the same subject appearing twice close together. The
    // compliance gate's similarity rules already compare each candidate's
    // title and description against recent videos, so genuine repetition gets
    // flagged there rather than being silently prevented here.
    richChosen = (rich.topics || [])
      .filter((t) => t && t.verified === true)          // unverified never ships
      .filter((t) => !usedTopics.has(`reel:${t.id}`))
      .filter((t) => Array.isArray(t.beats) && t.beats.length)
      .filter((t) => (NICHE ? t.niche === NICHE
                            : (channelNiches.size ? channelNiches.has(t.niche) : true)))
      .sort((a, b) => crypto.createHash("sha256").update(DATE + a.id).digest("hex")
        .localeCompare(crypto.createHash("sha256").update(DATE + b.id).digest("hex")))
      .slice(0, COUNT);
  }
} catch (err) {
  console.log(`::warning::Rich topics unavailable (${err.message}). Falling back to ThemedShort for the whole batch.`);
  richChosen = [];
}

// --reels-only: publish a researched reel or publish nothing.
//
// The automatic schedule passes this. It replaces the hardcoded AUTO_HOLD list
// with a rule that manages itself: a channel publishes when it has something
// real to say and is skipped when it does not, so nothing templated ever
// reaches a channel unattended. yt-bbm0902 is not "on hold" any more — it is
// simply skipped until topics-rich.json covers animals, space, biology, food
// or weather, and it resumes on its own the week that changes.
//
// Exit 78 is the skip code the workflow already understands: a neutral result,
// not a failure. A quiet week is the correct outcome of having nothing
// researched, and it must not page anyone.
const REELS_ONLY = A["reels-only"] === true || A["reels-only"] === "true";
if (REELS_ONLY) {
  COUNT = 0;
  if (!richChosen.length) {
    console.log(
      `No unused verified rich topic for ${CHANNEL.id} (${CHANNEL.handle}). ` +
      `Skipping rather than falling back to a templated Short.\n` +
      `Add researched topics for its niches (${(CHANNEL.niches || []).join(", ") || "any"}) ` +
      `in scripts/data/topics-rich.json. See scripts/data/WRITING-TOPICS.md.`);
    process.exit(78);
  }
} else {
  // Manual runs keep the old behaviour: the padded path covers the remainder.
  COUNT = Math.max(0, COUNT - richChosen.length);
}

// Excluding richChosen ids matters: props and meta are written as
// <id>.props.json, so if both paths picked the same subject on the same day
// they would write to the same filenames and one would silently overwrite the
// other.
const richIds = new Set(richChosen.map((t) => t.id));
const candidates = TOPICS.topics.filter((t) =>
  !usedTopics.has(t.id) &&
  !richIds.has(t.id) &&
  (NICHE ? t.niche === NICHE
         : (channelNiches.size ? channelNiches.has(t.niche) : true))
);
if (candidates.length < COUNT) {
  console.error(`Only ${candidates.length} unused topics${NICHE ? ` for niche=${NICHE}` : ""}. Add more to scripts/data/topics.json or pick a smaller --count.`);
  process.exit(2);
}

// Stable order: sha256(date + id) so the same date always picks the same set.
candidates.sort((a, b) => {
  const ha = crypto.createHash("sha256").update(DATE + a.id).digest("hex");
  const hb = crypto.createHash("sha256").update(DATE + b.id).digest("hex");
  return ha.localeCompare(hb);
});
const chosen = candidates.slice(0, COUNT);

// Output dir.
const OUTDIR = path.join(ROOT, "daily", DATE);
fs.mkdirSync(OUTDIR, { recursive: true });

const generated = [];
for (const topic of chosen) {
  const r = seededRand(`${DATE}|${topic.id}`);

  // 1. Theme + font + audio. Avoid the same theme used in this same batch.
  const usedThisBatch = new Set(generated.map((g) => g.themeId));
  const themeOptions = POOLS.themes.filter((t) => !usedThisBatch.has(t));
  const themeId = pick(themeOptions.length ? themeOptions : POOLS.themes, r);
  const fontFamilyId = pick(POOLS.fonts, r);
  const audio = pick(POOLS.audios, r);

  // 2. Build beats .  fixed structural skeleton (intro / fact / payoff / cta)
  //    but every slot is filled from a copy pool with randomised variant.
  const eyebrow   = pick(POOLS.eyebrows, r);
  const sub_intro = pick(POOLS.subs_intro, r);
  const trio_outro = pick(POOLS.trio_outros, r);
  const list_head = pick(POOLS.list_headings, r);
  const stat_label = pick(POOLS.stat_labels, r);
  const cta_head  = pick(POOLS.cta_headlines, r);
  const cta_url   = pick(POOLS.cta_urls, r);

  // Randomised layout variants per beat (1, 2, or 3).
  const v = () => 1 + Math.floor(r() * 3);

  // PACING. The first published batch used [180,210,240,270,150,150] over 40s,
  // which held single static cards for up to NINE seconds. On Shorts that is
  // fatal: viewers swipe when nothing changes, and the videos read as a
  // slideshow rather than as edited video.
  //
  // Now 30s total with a front-loaded curve. The hook gets the shortest hold
  // because the first two seconds decide whether anyone stays, and no beat
  // exceeds 6s. Combined with the continuous drift and grain in Cinematic.tsx,
  // nothing on screen is ever motionless.
  // 30s standard, 45s for weekend specials. Longer only works because the
  // pacing curve keeps individual holds short; a 45s video with 8s cards would
  // be worse than a 30s one, not better.
  const TOTAL = IS_SPECIAL ? 1350 : 900;
  const baseDurations = IS_SPECIAL
    ? [120, 150, 160, 190, 160, 150, 150, 170] // 8 beats, none over ~6.5s
    : [110, 150, 170, 190, 150, 130];          // 6 beats
  // Jitter +/- 20 frames, then re-balance so the total stays exact.
  let durations = baseDurations.map((d) => d + Math.floor((r() - 0.5) * 40));
  const totalNow = durations.reduce((s, d) => s + d, 0);
  // Spread the correction across all beats rather than dumping it into one,
  // which previously pushed a single beat back up to 7s and defeated the point.
  const spread = Math.trunc((TOTAL - totalNow) / durations.length);
  durations = durations.map((d) => Math.max(80, d + spread));
  // Absorb any remainder one frame at a time, shortest beat first, so no
  // single beat can drift long.
  let remainder = TOTAL - durations.reduce((s, d) => s + d, 0);
  while (remainder !== 0) {
    const idx = remainder > 0
      ? durations.indexOf(Math.min(...durations))
      : durations.indexOf(Math.max(...durations));
    durations[idx] += remainder > 0 ? 1 : -1;
    remainder += remainder > 0 ? -1 : 1;
  }

  // HARD CAP on any single beat. Jitter plus correction could still push one
  // beat past 7s, which is the exact slideshow problem the rebuild exists to
  // fix. Enforce it as an invariant rather than trusting the arithmetic:
  // trim anything over the cap and give the frames to the shortest beat.
  const MAX_BEAT = 195; // 6.5s at 30fps
  const MIN_BEAT = 80;  // 2.7s, below this a beat cannot be read
  for (let pass = 0; pass < 40; pass++) {
    const over = durations.findIndex((d) => d > MAX_BEAT);
    if (over === -1) break;
    const excess = durations[over] - MAX_BEAT;
    durations[over] = MAX_BEAT;
    const shortest = durations.indexOf(Math.min(...durations));
    durations[shortest] += excess;
  }
  // If capping could not absorb the total (too few beats for the runtime),
  // fail loudly rather than silently shipping a slideshow.
  const finalTotal = durations.reduce((s, d) => s + d, 0);
  if (finalTotal !== TOTAL) {
    console.error(`Beat durations sum to ${finalTotal}, expected ${TOTAL}. ` +
      `Add beats rather than lengthening them.`);
    process.exit(1);
  }
  if (durations.some((d) => d > MAX_BEAT || d < MIN_BEAT)) {
    console.error(`A beat is outside ${MIN_BEAT}-${MAX_BEAT} frames: ${durations.join(", ")}`);
    process.exit(1);
  }

  // The stat beat used to sit third. It has been removed.
  //
  // pickStatNumber drew a number at random from a per-niche pool and printed
  // it at 300px under a label like "Mind the number." Nothing tied that number
  // to the topic. The 11 August video about Nintendo's founding showed "5",
  // chosen at random from the history pool, with no relationship to Nintendo
  // whatsoever — presented with the full visual authority of a statistic.
  //
  // The other padding beats are merely empty. This one asserted a false fact
  // four times a day across three channels. A topic in topics.json carries a
  // hook and a punchline and nothing numeric, so there is no honest number to
  // put here. Restore the beat only when topics carry real, sourced figures.
  //
  // Its frames go back to the beats that hold the actual fact, capped at
  // MAX_BEAT so nothing outstays being read. Any frames that will not fit
  // simply shorten the video, which is the correct trade.
  let spare = durations[2];
  for (const i of [0, 1, 3, 4, 5]) {
    if (spare <= 0) break;
    const give = Math.min(spare, MAX_BEAT - durations[i]);
    durations[i] += give;
    spare -= give;
  }

  const beats = [
    { kind: "title", eyebrow, text: topic.hook, sub: sub_intro,
      durationInFrames: durations[0], variant: v() },
    { kind: "bigword", text: topic.punchline,
      durationInFrames: durations[1], variant: v() },
    { kind: "list", heading: list_head, items: pickListItems(topic, r),
      durationInFrames: durations[3], variant: v() },
    { kind: "trio", words: trio_outro,
      durationInFrames: durations[4], variant: v() },
    { kind: "cta", headline: cta_head, url: cta_url,
      durationInFrames: durations[5], variant: v() },
  ];

  // Specials insert two extra beats before the CTA so the added runtime buys
  // more moments rather than longer holds. Reusing the existing kinds keeps
  // one renderer and one set of layout variants.
  if (IS_SPECIAL) {
    const cta = beats.pop();
    beats.push(
      { kind: "bigword", text: topic.hook, durationInFrames: durations[6], variant: v() },
      { kind: "trio", words: pick(POOLS.trio_journeys, r), durationInFrames: durations[7], variant: v() },
      { ...cta, durationInFrames: durations[5] },
    );
  }

  // Verify total
  const total = beats.reduce((s, b) => s + b.durationInFrames, 0);

  // Props for Remotion --props.
  const props = {
    special: IS_SPECIAL,
    themeId,
    fontFamilyId,
    audioUrl: audio.url,
    audioVolume: audio.vol,
    beats,
  };

  // Metadata for YouTube uploader.
  // Tags must match the topic's niche or YouTube surfaces the video to the
  // wrong audience. Base tags are fixed per niche; the extra rotates so no two
  // videos in a niche carry an identical tag set.
  const NICHE_TAGS = {
    animals:      ["shorts", "animals", "wildlife", "nature", "animalfacts"],
    space:        ["shorts", "space", "astronomy", "universe", "spacefacts"],
    biology:      ["shorts", "biology", "human body", "science", "howitworks"],
    science:      ["shorts", "science", "physics", "sciencefacts", "learn"],
    history:      ["shorts", "history", "historyfacts", "past", "education"],
    food:         ["shorts", "food", "foodfacts", "cooking", "didyouknow"],
    weather:      ["shorts", "weather", "nature", "sky", "sciencefacts"],
    music:        ["shorts", "music", "musicfacts", "sound", "learn"],
    productivity: ["shorts", "productivity", "tips", "lifehacks", "workflow"],
    tech:         ["shorts", "tech", "coding", "developer", "techfacts"],
    app:          ["shorts", "app", "opensource", "videoediting", "creator"],
  };
  const NICHE_EXTRAS = {
    animals:      ["zoology", "creatures", "amazinganimals"],
    space:        ["cosmos", "planets", "nasa"],
    biology:      ["anatomy", "cells", "lifescience"],
    science:      ["chemistry", "experiment", "stem"],
    history:      ["ancienthistory", "thisdayinhistory", "civilisation"],
    food:         ["foodscience", "kitchen", "nutrition"],
    weather:      ["meteorology", "storms", "climate"],
    music:        ["musictheory", "instruments", "composer"],
    productivity: ["keyboardshortcuts", "efficiency", "studytips"],
    tech:         ["programming", "software", "computerscience"],
    app:          ["indiedev", "webapp", "pwa"],
  };
  const baseTags = NICHE_TAGS[topic.niche] || ["shorts", "facts", "didyouknow", "learning"];
  const extras = NICHE_EXTRAS[topic.niche] || ["facts", "trivia", "education"];
  const tagList = [...baseTags, pick(extras, r)];
  const titleTag = pick(POOLS.title_tags, r);
  const descIntro = pick(POOLS.description_intros, r);
  const meta = {
    slug: topic.id,
    date: DATE,
    title: `${topic.hook} ${titleTag}`.slice(0, 100),
    description:
      `${descIntro}\n\n${topic.hook} ${topic.punchline}\n\n` +
      `Made with BBMW0 Technologies AI. Open-source, mobile-first video editor.\n` +
      `https://bbmw0-technologies-ai.vercel.app\n\n${titleTag}`,
    tags: tagList,
    categoryId: CHANNEL.categoryId || (topic.niche === "tech" || topic.niche === "app" ? "28" : "27"),
    privacy: A.privacy ? PRIVACY : (CHANNEL.privacy || PRIVACY),
    channelId: CHANNEL.id,
    special: IS_SPECIAL,
    platform: CHANNEL.platform,
    handle: CHANNEL.handle,
    file: `out/daily-${DATE}-${topic.id}.mp4`,
    propsFile: `daily/${DATE}/${topic.id}.props.json`,
    durationInFrames: total,
    themeId,
    fontFamilyId,
    audioUrl: audio.url,
    niche: topic.niche,
  };

  fs.writeFileSync(path.join(OUTDIR, `${topic.id}.props.json`), JSON.stringify(props, null, 2));
  fs.writeFileSync(path.join(OUTDIR, `${topic.id}.meta.json`), JSON.stringify(meta, null, 2));
  generated.push({ themeId, ...meta });

  // Update history.
  history.topicsUsed.push(topic.id);
  history.combosUsed.push(`${themeId}|${fontFamilyId}|${audio.url}`);
  history.videos.push({
    id: topic.id, date: DATE, themeId, fontFamilyId, audioUrl: audio.url,
    title: meta.title, description: meta.description, niche: topic.niche,
    channelId: CHANNEL.id,
    special: IS_SPECIAL, platform: CHANNEL.platform,
  });
}

// ---------------------------------------------------------------- reels
// Rich topics render as Editorial Reels. Rather than reimplement the beat
// timing here, this shells out to generate-reels.mjs — the same script that
// produced and verified the three reels by hand, including the voice-cut
// timing. One implementation, already tested, no second copy to drift.
//
// Each topic is wrapped individually: one bad rich topic loses its own slot
// and nothing else. The batch still publishes.
for (const topic of richChosen) {
  try {
    execFileSync(process.execPath,
      [path.join(__dirname, "generate-reels.mjs"), `--id=${topic.id}`, `--out=daily/${DATE}`],
      { cwd: ROOT, stdio: "pipe" });

    const propsPath = path.join(OUTDIR, `${topic.id}.props.json`);
    const props = readJSON(propsPath);
    if (!Array.isArray(props.beats) || !props.beats.length) throw new Error("no beats in generated props");
    if (props._DRAFT) throw new Error("generator marked this a draft");

    // render-batch reads this to choose the composition. Absent, it renders
    // Daily, which is what every existing props file wants.
    props._composition = "Reel";
    fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

    const total = props.beats.reduce((s, b) => s + (b.durationInFrames || 0), 0);
    const pub = topic.publish || {};
    const firstText = props.beats.map((b) => b.text || b.caption).find(Boolean) || topic.id;
    const bodyLines = props.beats
      .map((b) => [b.text || b.caption, b.note || b.role || b.context].filter(Boolean).join(" "))
      .filter(Boolean);

    // House style forbids em-dashes in the title and description. They read
    // well on screen, so the beats keep them; this only rewrites the copy
    // lifted into the metadata. A comma carries the same pause.
    const noDash = (s) => String(s).replace(/\s*—\s*/g, ", ");

    const meta = {
      slug: topic.id,
      date: DATE,
      title: noDash(pub.title || firstText).slice(0, 100),
      description: noDash(pub.description || (
        `${bodyLines.join("\n\n")}\n\n` +
        `Sources:\n${(topic.sources || []).map((s) => `- ${String(s).split(" — ")[0]}`).join("\n")}\n\n` +
        `Made with BBMW0 Technologies AI. Open-source, mobile-first video editor.\n` +
        `https://bbmw0-technologies-ai.vercel.app`
      )),
      tags: pub.tags || ["shorts", topic.niche, "facts", "didyouknow", "history"].filter(Boolean),
      categoryId: CHANNEL.categoryId || (topic.niche === "tech" || topic.niche === "app" ? "28" : "27"),
      privacy: A.privacy ? PRIVACY : (CHANNEL.privacy || PRIVACY),
      channelId: CHANNEL.id,
      special: IS_SPECIAL,
      platform: CHANNEL.platform,
      handle: CHANNEL.handle,
      file: `out/daily-${DATE}-${topic.id}.mp4`,
      propsFile: `daily/${DATE}/${topic.id}.props.json`,
      durationInFrames: total,
      audioUrl: props.audioUrl || "",
      niche: topic.niche,
      composition: "Reel",
    };
    fs.writeFileSync(path.join(OUTDIR, `${topic.id}.meta.json`), JSON.stringify(meta, null, 2));
    generated.push({ themeId: "reel", ...meta });

    history.topicsUsed.push(`reel:${topic.id}`);
    history.videos.push({
      id: topic.id, date: DATE, themeId: "reel", fontFamilyId: "reel",
      audioUrl: props.audioUrl || "", title: meta.title, description: meta.description,
      niche: topic.niche, channelId: CHANNEL.id,
      special: IS_SPECIAL, platform: CHANNEL.platform,
    });
  } catch (err) {
    console.log(`::warning::Reel generation failed for ${topic.id} (${err.message}). Skipping this one; the rest of the batch is unaffected.`);
  }
}

fs.writeFileSync(PUBLISHED, JSON.stringify(history, null, 2));

console.log(`Generated ${generated.length} unique Shorts for ${DATE} on ${CHANNEL.id} (${CHANNEL.handle}, ${CHANNEL.platform}):`);
for (const g of generated) {
  // Defaults, because a Reel has no theme or font: those are ThemedShort's
  // knobs. Without them this line threw on the first hybrid batch AFTER the
  // props, meta and ledger had all been written — a non-zero exit on work that
  // had actually succeeded, which in the 09:00 workflow reads as a failed run.
  const theme = g.themeId || (g.composition === "Reel" ? "reel" : "?");
  const font = g.fontFamilyId || (g.composition === "Reel" ? "editorial" : "?");
  console.log(`  ${g.slug.padEnd(22)} theme=${theme.padEnd(10)} font=${font.padEnd(8)} -> ${g.file}`);
}
console.log(`\nProps + meta files:  daily/${DATE}/`);
// --date=, not a positional. render-batch parses named flags only, so a bare
// date is silently ignored and it falls back to today — which, followed
// literally, re-renders the current day's whole batch instead of the one you
// asked for. This hint said the wrong thing and cost a confusing ten minutes.
console.log(`Render with:        npm run render:daily -- --date=${DATE}`);
// Guarded. In --reels-only mode the padded path is switched off entirely, so
// `chosen` is empty and chosen[0].id threw — the second time a cosmetic
// summary line has crashed this script AFTER props, meta and the ledger were
// all written correctly. A run that did its job must not exit non-zero
// because of a hint at the end of the log.
//
// Prefer a real example from whatever was actually generated.
const example = generated[0];
if (example) {
  const comp = example.composition === "Reel" ? "Reel" : "Daily";
  console.log(`Or one at a time:   npx remotion render src/compositions/registry.tsx ${comp} out/daily-${DATE}-${example.slug}.mp4 --props=daily/${DATE}/${example.slug}.props.json`);
}

// ============== helpers ==============

function pickStatNumber(topic, r) {
  // Generate a topic-themed stat number. Different niches lean different ways.
  const pools = {
    space:    ["13.8B", "1B", "100B", "5x", "365.25", "0.001", "299792"],
    animals:  ["100", "3", "5x", "1000", "12", "9"],
    science:  ["7", "5x", "0", "100", "10", "42"],
    history:  ["1896", "38", "500", "200", "20", "5"],
    food:     ["3000", "100", "0", "365"],
    biology:  ["30", "1", "5", "100", "70", "37"],
    weather:  ["7", "100", "10", "20"],
    music:    ["2x", "12", "440"],
    productivity: ["1 sec", "3 keys", "Tab", "Ctrl+F"],
    tech:     ["10x", "90%", "1ms", "0"],
    app:      ["10", "5", "0", "9:16"],
  };
  const pool = pools[topic.niche] || ["1", "2", "3", "5", "10"];
  return pool[Math.floor(r() * pool.length)];
}

function pickListItems(topic, r) {
  // Each topic could ship with bespoke items; for now, generate three short
  // related items based on the niche. Generator-side variation is fine for
  // the avoid-repetition goal .  what matters is that no two videos match.
  const banks = {
    animals:  [["Built for their world", "Most are misunderstood", "There's always more"], ["Watch closer", "Listen too", "Think how"]],
    food:     [["Origin matters", "Storage too", "Then, science"], ["Where", "How", "Why"]],
    space:    [["Distance is wild", "Time is weirder", "Scale breaks brains"], ["Look up", "Wait longer", "Be amazed"]],
    history:  [["Records are sparse", "Witnesses are rare", "Truth is fragile"], ["Read more", "Cross-check", "Stay curious"]],
    science:  [["Experiments first", "Then a theory", "Then peer review"], ["Observe", "Hypothesise", "Verify"]],
    biology:  [["Cells are the start", "Systems emerge", "Behaviour follows"], ["Tiny scale", "Vast reach", "Open question"]],
    weather:  [["Pressure drives wind", "Heat drives rain", "Spin drives storms"], ["Watch the sky", "Note the change", "Stay safe"]],
    music:    [["Frequency is pitch", "Time is rhythm", "Layers are harmony"], ["Hear it", "Feel it", "Make it"]],
    productivity:[["Less mouse, more keys", "Fewer apps, more focus", "Smaller batches, faster wins"], ["Notice", "Reduce", "Repeat"]],
    tech:     [["The model is simple", "The result is fast", "The reason is design"], ["Read the spec", "Try it small", "Ship it"]],
    app:      [["Phone first design", "Vertical preview", "One-tap export"], ["Open it", "Try it", "Share it"]],
  };
  const bank = banks[topic.niche] || [["One", "Two", "Three"]];
  return bank[Math.floor(r() * bank.length)];
}
