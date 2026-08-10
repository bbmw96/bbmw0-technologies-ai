// Commit the publishing record back to the repo, safely, from a matrix leg.
//
// WHY THIS EXISTS
// ---------------
// Run #113 (2026-08-10) published four videos to @bbm0902 and then LOST every
// record of it. The log:
//
//   ! [rejected] main -> main (non-fast-forward)
//   Push rejected, rebasing and retrying (1 of 3)...
//   CONFLICT (add/add):  daily/2026-08-10/compliance-verdict.json
//   CONFLICT (content):  scripts/data/published.json
//   error: could not apply fbe6a69... Daily Shorts: 2026-08-10
//   fatal: You are not currently on a branch.
//   Push rejected, rebasing and retrying (2 of 3)...
//   error: Pulling is not possible because you have unmerged files.
//
// The mechanism matters. All three matrix legs check out the SAME commit at
// the start of the run. Leg 1 finishes and pushes its published.json. Leg 2
// then commits ITS published.json, built from the now-stale base, and the push
// is rejected. `git pull --rebase` cannot resolve that: both sides added the
// same paths and edited the same JSON, so it stops on a conflict, leaves a
// detached HEAD, and attempts 2 and 3 fail instantly on "unmerged files".
//
// max-parallel: 1 does NOT fix this. It serialises the jobs, but each one
// still started from the same base commit. Serial execution is not a fresh
// base. Retrying a rebase of a snapshot built on stale data can never converge.
//
// The fix is to stop committing a whole-file snapshot and commit a DELTA
// instead. Every attempt: fetch, reset hard to the real origin/main, re-apply
// what this leg produced on top of it, then commit. That converges no matter
// how many legs run, in any order, in parallel or not, because each attempt
// starts from the truth rather than from a guess about it.
//
// USAGE:
//   node scripts/commit-history.mjs --date=2026-08-10 --channel=yt-bbm0902
//
// EXIT CODES:
//   0  pushed, or genuinely nothing to commit
//   1  could not push after every attempt (records at risk, loud error)

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const argOf = (name, dflt = "") => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};

const DATE = argOf("date") || new Date().toISOString().slice(0, 10);
const CHANNEL = argOf("channel") || "default";
const ATTEMPTS = Number(argOf("attempts", "6")) || 6;

const abs = (p) => path.join(ROOT, p);
const say = (m) => console.log(m);

function git(args, opts = {}) {
  const r = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.quiet ? "pipe" : ["ignore", "pipe", "pipe"],
  });
  if (!opts.quiet) {
    if (r.stdout && r.stdout.trim()) say(r.stdout.trimEnd());
    if (r.stderr && r.stderr.trim()) say(r.stderr.trimEnd());
  }
  return r;
}

// BOM-tolerant, because OneDrive has added them to these files before.
function readJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
  } catch {
    return fallback;
  }
}
const writeJSON = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};

// ---------------------------------------------------------------------------
// STEP 1: snapshot what this leg produced, IN MEMORY, before touching git.
// `git reset --hard` below will wipe the working tree, so nothing may be read
// from disk after that point.
// ---------------------------------------------------------------------------

const DAILY_DIR = abs(path.join("daily", DATE));

const ours = {
  published: readJSON(abs("scripts/data/published.json"), null),
  complianceLog: readJSON(abs("scripts/data/compliance-log.json"), null),
  topics: readJSON(abs("scripts/data/topics.json"), null),
  trendLog: readJSON(abs("scripts/data/trend-log.json"), null),
  daily: {},
};

if (fs.existsSync(DAILY_DIR)) {
  for (const name of fs.readdirSync(DAILY_DIR)) {
    const full = path.join(DAILY_DIR, name);
    if (fs.statSync(full).isFile()) ours.daily[name] = fs.readFileSync(full);
  }
}

say(`Snapshotted ${Object.keys(ours.daily).length} file(s) from daily/${DATE}`);

// ---------------------------------------------------------------------------
// Merge helpers. Each one takes THEIRS (fresh from origin) and OURS, and
// returns the union. They must be commutative: leg order is not guaranteed.
// ---------------------------------------------------------------------------

function mergePublished(theirs, oursP) {
  if (!oursP) return theirs;
  const out = theirs && typeof theirs === "object" ? theirs : { videos: [], topicsUsed: [] };
  out.videos = Array.isArray(out.videos) ? out.videos : [];
  out.topicsUsed = Array.isArray(out.topicsUsed) ? out.topicsUsed : [];

  // Key on id + channelId. The same topic slug can legitimately exist on two
  // channels; those are different videos and both records must survive.
  const key = (v) => `${v && v.id}::${(v && v.channelId) || "default"}`;
  const seen = new Map(out.videos.map((v) => [key(v), v]));
  let added = 0;
  for (const v of oursP.videos || []) {
    const k = key(v);
    const existing = seen.get(k);
    if (!existing) {
      seen.set(k, v);
      out.videos.push(v);
      added++;
    } else if (!existing.youtubeId && v.youtubeId) {
      // Ours knows the upload actually happened. That always wins over a
      // record that has no id, which is the whole point of this file.
      Object.assign(existing, v);
      added++;
    }
  }
  const before = out.topicsUsed.length;
  out.topicsUsed = [...new Set([...out.topicsUsed, ...(oursP.topicsUsed || [])])];
  say(`  published.json: +${added} video record(s), +${out.topicsUsed.length - before} topic(s) used`);
  return out;
}

function mergeArrayish(theirs, oursA, label, keyFn) {
  if (!oursA) return theirs;
  const pick = (o) => (Array.isArray(o) ? o : Array.isArray(o && o.entries) ? o.entries : null);
  const t = pick(theirs), o = pick(oursA);
  if (!t || !o) return theirs || oursA;
  const seen = new Set(t.map(keyFn));
  let added = 0;
  for (const e of o) {
    const k = keyFn(e);
    if (seen.has(k)) continue;
    seen.add(k);
    t.push(e);
    added++;
  }
  if (added) say(`  ${label}: +${added} entr(ies)`);
  return Array.isArray(theirs) ? t : { ...theirs, entries: t };
}

function mergeTopics(theirs, oursT) {
  if (!oursT) return theirs;
  if (!theirs) return oursT;
  const t = Array.isArray(theirs.topics) ? theirs.topics : [];
  const seen = new Set(t.map((x) => x && (x.id || x.slug || x.title)));
  let added = 0;
  for (const x of oursT.topics || []) {
    const k = x && (x.id || x.slug || x.title);
    if (seen.has(k)) continue;
    seen.add(k);
    t.push(x);
    added++;
  }
  if (added) say(`  topics.json: +${added} topic(s)`);
  return { ...theirs, topics: t };
}

function mergeVerdict(theirsRaw, oursRaw) {
  const theirs = theirsRaw ? JSON.parse(theirsRaw.toString("utf8")) : null;
  const oursV = JSON.parse(oursRaw.toString("utf8"));
  if (!theirs) return Buffer.from(JSON.stringify(oursV, null, 2) + "\n");
  const byslug = new Map((theirs.results || []).map((r) => [r.slug, r]));
  for (const r of oursV.results || []) if (!byslug.has(r.slug)) byslug.set(r.slug, r);
  const results = [...byslug.values()];
  const merged = {
    ...theirs,
    results,
    allowed: results.filter((r) => !(r.blocks || []).length).map((r) => r.slug),
    blocked: results.filter((r) => (r.blocks || []).length).map((r) => r.slug),
  };
  return Buffer.from(JSON.stringify(merged, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// STEP 2: attempt loop. Each attempt starts from the real origin/main.
// ---------------------------------------------------------------------------

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  say(`\n--- attempt ${attempt} of ${ATTEMPTS} ---`);

  git(["fetch", "origin", "main"]);
  // Abort any rebase left over from a previous tool, then hard-align. This is
  // what makes the retry converge: we never rebase a stale snapshot.
  git(["rebase", "--abort"], { quiet: true });
  git(["merge", "--abort"], { quiet: true });
  git(["checkout", "-B", "main", "origin/main"], { quiet: true });
  git(["reset", "--hard", "origin/main"], { quiet: true });
  // `reset --hard` restores tracked files but leaves UNTRACKED ones alone, so
  // this leg's freshly written daily/ files would survive and get staged under
  // their original shared names, reintroducing the very collision this script
  // exists to avoid. Clean the directory so the tree is exactly
  // origin/main plus the delta we deliberately re-apply below.
  git(["clean", "-fdq", `daily/${DATE}`], { quiet: true });

  // Re-apply our delta onto the fresh tree.
  say("Re-applying this leg's records onto origin/main:");

  if (ours.published) {
    const p = abs("scripts/data/published.json");
    writeJSON(p, mergePublished(readJSON(p, { videos: [], topicsUsed: [] }), ours.published));
  }
  if (ours.complianceLog) {
    const p = abs("scripts/data/compliance-log.json");
    const merged = mergeArrayish(
      readJSON(p, []), ours.complianceLog, "compliance-log.json",
      (e) => `${e && (e.date || "")}::${e && (e.slug || e.id || "")}::${e && (e.channelId || "")}`
    );
    writeJSON(p, merged);
  }
  if (ours.topics) {
    const p = abs("scripts/data/topics.json");
    writeJSON(p, mergeTopics(readJSON(p, { topics: [] }), ours.topics));
  }
  if (ours.trendLog) {
    const p = abs("scripts/data/trend-log.json");
    writeJSON(p, mergeArrayish(readJSON(p, []), ours.trendLog, "trend-log.json",
      (e) => JSON.stringify(e)));
  }

  fs.mkdirSync(DAILY_DIR, { recursive: true });
  for (const [name, buf] of Object.entries(ours.daily)) {
    const dest = path.join(DAILY_DIR, name);

    if (name === "render-log.txt") {
      // Per-date shared name, so two legs both create it and collide. Give it
      // a per-channel name instead: both logs survive and nothing conflicts.
      fs.writeFileSync(path.join(DAILY_DIR, `render-log-${CHANNEL}.txt`), buf);
      continue;
    }
    if (name === "compliance-verdict.json" && fs.existsSync(dest)) {
      fs.writeFileSync(dest, mergeVerdict(fs.readFileSync(dest), buf));
      continue;
    }
    if (name === "media-urls.json" && fs.existsSync(dest)) {
      const t = readJSON(dest, { urls: {} });
      const o = JSON.parse(buf.toString("utf8"));
      writeJSON(dest, { ...t, urls: { ...(t.urls || {}), ...(o.urls || {}) } });
      continue;
    }
    // Per-video meta/props: unique filenames, safe to write as-is.
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, buf);
  }

  // Stage one path at a time. `git add a b c` is all-or-nothing: one missing
  // path stages NOTHING, which is how history silently stopped persisting once
  // before.
  for (const p of [
    "scripts/data/published.json",
    "scripts/data/topics.json",
    "scripts/data/compliance-log.json",
    "scripts/data/trend-log.json",
    `daily/${DATE}`,
  ]) {
    if (fs.existsSync(abs(p))) git(["add", p], { quiet: true });
  }

  if (git(["diff", "--cached", "--quiet"], { quiet: true }).status === 0) {
    say("Nothing to commit: this leg's records are already on origin/main.");
    process.exit(0);
  }

  const staged = git(["diff", "--cached", "--name-only"], { quiet: true }).stdout || "";
  say("Committing:");
  for (const f of staged.trim().split("\n")) say(`  ${f}`);

  git(["commit", "-m", `Daily Shorts ${DATE} (${CHANNEL}) [skip ci]`], { quiet: true });

  if (git(["push", "origin", "main"]).status === 0) {
    say(`\nPushed on attempt ${attempt}.`);
    process.exit(0);
  }

  say("Push rejected. Another leg pushed first; re-deriving from the new origin/main.");
  // Small jittered backoff so two legs racing do not lock-step forever.
  const wait = 2000 + Math.floor(Math.random() * 3000);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait);
}

console.log(
  `::error title=History not saved::Could not push after ${ATTEMPTS} attempts. ` +
    `The youtubeId and topicsUsed records for ${CHANNEL} on ${DATE} are NOT saved, ` +
    `so those topics may be published again. Re-run this job to retry.`
);
process.exit(1);
