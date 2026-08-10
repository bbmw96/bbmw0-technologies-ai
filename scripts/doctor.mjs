#!/usr/bin/env node
// One command that checks the whole system and says exactly what to do next.
//
// State is otherwise spread across GitHub secrets, Google Cloud, Composio,
// local files and CI history. This gathers it in one place, because the two
// outages so far were both invisible until someone went looking: a 7-day token
// fuse nobody was watching, and a git add that silently staged nothing.
//
// USAGE: npm run doctor
// EXIT:  0 all clear, 1 warnings, 2 something is blocking publishing

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = process.env.GH_REPO || "bbmw96/bbmw0-technologies-ai";
const rd = (p, f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8").replace(/^﻿/, "")); } catch (e) { if (f !== undefined) return f; throw e; } };

let blocking = 0, warnings = 0;
const B = (m, fix) => { blocking++; console.log(`  [BLOCKED] ${m}`); if (fix) console.log(`            fix: ${fix}`); };
const W = (m, fix) => { warnings++; console.log(`  [warn]    ${m}`); if (fix) console.log(`            fix: ${fix}`); };
const OK = (m) => console.log(`  [ok]      ${m}`);

function gh(args) {
  for (const bin of ["gh", "gh.exe"]) {
    const r = spawnSync(bin, args, { encoding: "utf8", stdio: "pipe" });
    if (!r.error) return r;
  }
  return null;
}

const line = "=".repeat(74);
console.log(line);
console.log(" BBMW0 system doctor");
console.log(line);

// ---------------------------------------------------------------- tooling
console.log("\nTOOLING");
const ghv = gh(["--version"]);
if (!ghv || ghv.status !== 0) B("GitHub CLI not found", "https://cli.github.com/");
else {
  OK(`gh ${(ghv.stdout || "").split("\n")[0].replace("gh version ", "").trim()}`);
  const auth = gh(["auth", "status"]);
  if (auth?.status !== 0) B("gh not authenticated", "gh auth login");
  else OK("gh authenticated");
}
const ff = spawnSync("ffmpeg", ["-version"], { encoding: "utf8", stdio: "pipe" });
if (ff.error) W("ffmpeg not found locally (CI installs its own)", "only needed to regenerate audio beds");
else OK("ffmpeg present");

// ---------------------------------------------------------------- secrets
console.log("\nGITHUB SECRETS");
const sec = gh(["secret", "list", "--repo", REPO]);
const have = new Set();
if (sec?.status === 0) {
  (sec.stdout || "").split("\n").map((l) => l.trim().split(/\s+/)[0]).filter(Boolean).forEach((n) => have.add(n));
} else {
  B("cannot read GitHub secrets", "check gh auth and repo access");
}
const need = {
  YT_REFRESH_TOKEN:     ["channel 1 publishing", "npm run yt:rotate"],
  YT_CLIENT_ID:         ["channel 1 publishing", "npm run yt:rotate"],
  YT_CLIENT_SECRET:     ["channel 1 publishing", "npm run yt:rotate"],
  YT_OAUTH_CLIENT_JSON: ["channel 1 publishing", "npm run yt:rotate"],
};
const optional = {
  YT2_REFRESH_TOKEN: ["channel 2 (@bbm0902)", "npm run yt:rotate -- --channel=yt-bbm0902"],
  COMPOSIO_API_KEY:  ["Instagram via Composio", "add in GitHub Settings, Secrets, Actions"],
  IG_USER_ID:        ["Instagram", "value is 26759002047072119"],
  AI_ENDPOINT:       ["AI topic auto-refill and the compliance AI panel", "your Vercel /api/ai URL"],
};
// "Could not check" is NOT the same as "missing". When gh is unavailable (no
// CLI, not authenticated, sandboxed shell) the secret list comes back empty,
// and reporting every secret as absent produces a screen of blockers that are
// all false. A health tool that invents problems is one you learn to ignore,
// which defeats the point of having it.
const secretsReadable = sec?.status === 0;
const report = (k, what, fix, blocking) => {
  if (!secretsReadable) return W(`${k}: cannot check (gh unavailable), assume unknown`);
  if (have.has(k)) return OK(`${k} set (${what})`);
  return blocking ? B(`${k} missing (${what})`, fix) : W(`${k} not set (${what})`, fix);
};
for (const [k, [what, fix]] of Object.entries(need)) report(k, what, fix, true);
for (const [k, [what, fix]] of Object.entries(optional)) report(k, what, fix, false);

// ------------------------------------------------------------ publishing
console.log("\nPUBLISHING HEALTH");
const pub = rd("scripts/data/published.json", { videos: [], topicsUsed: [] });
const uploaded = (pub.videos || []).filter((v) => v && v.youtubeId);
const topics = rd("scripts/data/topics.json", { topics: [] }).topics || [];
const unused = topics.length - (pub.topicsUsed || []).length;

if (!uploaded.length) {
  B("no upload has EVER been recorded in published.json",
    "either nothing has published, or the CI commit step is not persisting history");
} else {
  const last = uploaded.map((v) => v.uploadedAt).filter(Boolean).sort().pop();
  const days = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
  if (days === null) W(`${uploaded.length} uploads recorded but none carry a timestamp`);
  else if (days >= 3) B(`nothing published for ${days} days, the channel is dark`, "npm run yt:rotate then re-run the workflow");
  else OK(`${uploaded.length} uploads recorded, last ${days} day(s) ago`);
}
if (unused < 5) B(`only ${unused} unused topics left`, "add topics or set AI_ENDPOINT for auto-refill");
else if (unused < 10) W(`${unused} unused topics (${Math.floor(unused / 5)} days)`);
else OK(`${unused} unused topics (${Math.floor(unused / 5)} days at 5/day)`);

// ------------------------------------------------------------- CI history
console.log("\nRECENT CI RUNS");
const runs = gh(["run", "list", "--repo", REPO, "--workflow=daily-shorts.yml", "--limit", "5", "--json", "conclusion,createdAt"]);
if (runs?.status === 0) {
  try {
    const r = JSON.parse(runs.stdout || "[]");
    const fails = r.filter((x) => x.conclusion && x.conclusion !== "success").length;
    r.forEach((x) => console.log(`            ${(x.conclusion || "running").padEnd(10)} ${(x.createdAt || "").slice(0, 10)}`));
    if (fails >= 3) B(`${fails} of the last ${r.length} runs failed`, "check the newest run log");
    else if (fails) W(`${fails} of the last ${r.length} runs failed`);
    else OK("recent runs healthy");
  } catch { W("could not parse run history"); }
} else W("could not read CI run history");

// ---------------------------------------------------------------- content
console.log("\nCONTENT INTEGRITY");
const audio = rd("scripts/data/audio-licences.json", { tracks: [] });
const unknownAudio = (audio.tracks || []).filter((t) => !t.licence || t.licence === "UNKNOWN").length;
unknownAudio ? B(`${unknownAudio} audio bed(s) with no licence`, "record provenance or replace them")
             : OK(`${(audio.tracks || []).length} audio beds, all licensed (Owned Original)`);

const beds = fs.readFileSync(path.join(ROOT, "scripts/audio/generate-beds.sh"), "utf8");
/sine=|square=|triangle=|sawtooth=/.test(beds)
  ? B("tonal generator found in generate-beds.sh", "audio must be natural ambience only (halal rule)")
  : OK("audio sources are natural ambience only");

for (const f of ["scripts/data/topics.json", "scripts/data/copy-pools.json", "scripts/data/published.json"]) {
  const buf = fs.readFileSync(path.join(ROOT, f));
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) B(`UTF-8 BOM in ${f}`, `sed -i '1s/^\\xEF\\xBB\\xBF//' ${f}`);
}
OK("no UTF-8 BOMs in data files");

// -------------------------------------------------------------- workflows
// A workflow GitHub rejects does not fail loudly, it never starts. On
// 2026-08-09 a duplicate `if:` key made the file invalid and every run died
// instantly, including the first Instagram publish. CI cannot catch this,
// because CI is the thing that will not run. So check it here.
console.log("\nWORKFLOWS");
try {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/validate-workflows.mjs")], {
    encoding: "utf8",
  });
  if (r.status === 0) {
    OK("all workflow files valid (GitHub will accept them)");
  } else {
    const detail = String(r.stdout || "")
      .split("\n")
      .filter((l) => l.trim().startsWith("x "))
      .map((l) => l.trim().slice(2))
      .join("; ");
    B(`invalid workflow file: ${detail || "see npm run validate:workflows"}`,
      "run `npm run validate:workflows` and fix before pushing");
  }
} catch (err) {
  W(`could not validate workflows: ${err.message}`);
}

// ---------------------------------------------------------------- channels
console.log("\nCHANNELS");
for (const ch of (rd("scripts/data/channels.json", { channels: [] }).channels || [])) {
  const p = ch.secretPrefix;
  const ready = ch.platform === "youtube"
    ? have.has(`${p}_REFRESH_TOKEN`)
    : (have.has("COMPOSIO_API_KEY") || have.has("IG_ACCESS_TOKEN"));
  // Same distinction as above: unknown is not the same as not ready.
  const mark = !secretsReadable ? "[unknown]" : ready ? "[ok]     " : "[waiting]";
  console.log(`  ${mark} ${ch.id.padEnd(20)} ${ch.handle.padEnd(20)} ${ch.platform}`);
}

// ---------------------------------------------------------------- verdict
console.log(`\n${line}`);
if (blocking) console.log(` ${blocking} BLOCKING issue(s), ${warnings} warning(s). Publishing is not healthy.`);
else if (warnings) console.log(` No blockers. ${warnings} warning(s).`);
else console.log(" All clear.");
console.log(line);
process.exit(blocking ? 2 : warnings ? 1 : 0);
