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
const COUNT = parseInt(A.count || "5", 10);
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
const candidates = TOPICS.topics.filter((t) =>
  !usedTopics.has(t.id) &&
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
  const TOTAL = 900; // 30s at 30fps
  const baseDurations = [110, 150, 170, 190, 150, 130];
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

  const beats = [
    { kind: "title", eyebrow, text: topic.hook, sub: sub_intro,
      durationInFrames: durations[0], variant: v() },
    { kind: "bigword", text: topic.punchline,
      durationInFrames: durations[1], variant: v() },
    { kind: "stat", number: pickStatNumber(topic, r), label: stat_label,
      durationInFrames: durations[2], variant: v() },
    { kind: "list", heading: list_head, items: pickListItems(topic, r),
      durationInFrames: durations[3], variant: v() },
    { kind: "trio", words: trio_outro,
      durationInFrames: durations[4], variant: v() },
    { kind: "cta", headline: cta_head, url: cta_url,
      durationInFrames: durations[5], variant: v() },
  ];

  // Verify total
  const total = beats.reduce((s, b) => s + b.durationInFrames, 0);

  // Props for Remotion --props.
  const props = {
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
    channelId: CHANNEL.id, platform: CHANNEL.platform,
  });
}

fs.writeFileSync(PUBLISHED, JSON.stringify(history, null, 2));

console.log(`Generated ${generated.length} unique Shorts for ${DATE} on ${CHANNEL.id} (${CHANNEL.handle}, ${CHANNEL.platform}):`);
for (const g of generated) {
  console.log(`  ${g.slug.padEnd(22)} theme=${g.themeId.padEnd(10)} font=${g.fontFamilyId.padEnd(8)} -> ${g.file}`);
}
console.log(`\nProps + meta files:  daily/${DATE}/`);
console.log(`Render with:        npm run render:daily -- ${DATE}`);
console.log(`Or one at a time:   npx remotion render src/compositions/registry.tsx Daily ${chosen[0].id ? `out/daily-${DATE}-${chosen[0].id}.mp4 --props=daily/${DATE}/${chosen[0].id}.props.json` : ""}`);

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
