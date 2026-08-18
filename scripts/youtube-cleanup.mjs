#!/usr/bin/env node
// Progressive cleanup of the pre-reel back catalogue.
//
// WHY THIS EXISTS
// Before the Editorial Reel format, this channel published "ThemedShort"
// videos whose one factual claim was assembled from a copy pool rather than
// researched — e.g. "the spacebar is used more than all letters combined".
// Nobody measured that. A viewer who checks one and finds it invented has no
// reason to trust the next, and YouTube's inauthentic-content policy is
// assessed at CHANNEL level, so a grid full of unsourced claims is a standing
// risk to the whole account, not just to those videos.
//
// The videos are UNLISTED, not deleted. Unlisting removes them from the grid,
// from search and from recommendations, but keeps the URL alive and the action
// reversible. Deletion is irreversible and buys nothing extra.
//
// Runs in weekly batches on purpose. A single bulk pass of ~82 privacy edits
// looks like automated abuse from the API's side and gives no chance to notice
// a misclassification; ten a week is auditable.
//
// AUTH: uses the operator's own OAuth refresh token from the channel's
// credentialsFile (see scripts/data/channels.json). videos.update requires the
// channel owner's consent — an API key cannot do it.
//
// USAGE
//   node scripts/youtube-cleanup.mjs --audit                    # read-only
//   node scripts/youtube-cleanup.mjs --audit --channel=yt-bbm0902
//   node scripts/youtube-cleanup.mjs --unlist --limit=10        # one batch
//   node scripts/youtube-cleanup.mjs --unlist --ids=abc,def     # explicit
//   ... add --dry-run to any --unlist to see the plan and change nothing.
//
// EXIT: 0 ok, 1 bad arguments/config, 2 API failure.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOG_PATH = path.join(ROOT, "scripts/data/cleanup-log.json");
const rd = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));

function args(argv) {
  const o = {};
  for (const a of argv.slice(2)) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq === -1) o[a.slice(2)] = true;
    else o[a.slice(2, eq)] = a.slice(eq + 1);
  }
  return o;
}
const A = args(process.argv);
const fail = (m, c = 1) => { console.error(m); process.exit(c); };

const CHANNEL_ID = A.channel || "yt-bbmw0";
const DRY = !!A["dry-run"];
const LIMIT = Number(A.limit || 10);

const chan = (rd(path.join(ROOT, "scripts/data/channels.json")).channels || [])
  .find((c) => c.id === CHANNEL_ID);
if (!chan) fail(`Unknown channel ${CHANNEL_ID}. Check scripts/data/channels.json.`);
if (chan.platform !== "youtube") fail(`${CHANNEL_ID} is ${chan.platform}, not youtube. Instagram has no unlist equivalent.`);

const credPath = path.join(ROOT, chan.credentialsFile);
if (!fs.existsSync(credPath)) {
  fail(`Missing ${chan.credentialsFile}. Run npm run yt:rotate, or set the ${chan.secretPrefix}_* secrets and let CI materialise it.`);
}
const cred = rd(credPath);

// ---------------------------------------------------------------- auth
async function accessToken() {
  const body = new URLSearchParams({
    client_id: cred.client_id,
    client_secret: cred.client_secret,
    refresh_token: cred.refresh_token,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    // Deliberately prints the error CODE, never the token or the secret.
    const code = j.error || `HTTP ${r.status}`;
    if (String(code).includes("invalid_grant")) {
      fail(`Refresh token for ${CHANNEL_ID} has expired or been revoked. Rotate it (npm run yt:rotate) and rerun.`, 2);
    }
    fail(`Token exchange failed for ${CHANNEL_ID}: ${code}`, 2);
  }
  return j.access_token;
}

async function api(tokenValue, endpoint, params, init = {}) {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  const r = await fetch(u, {
    ...init,
    headers: { Authorization: `Bearer ${tokenValue}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j?.error?.message || `HTTP ${r.status}`;
    throw new Error(`${endpoint}: ${msg}`);
  }
  return j;
}

// ------------------------------------------------------- catalogue read
async function fetchUploads(tokenValue) {
  const me = await api(tokenValue, "channels", { part: "contentDetails,snippet,statistics", mine: "true" });
  const ch = me.items?.[0];
  if (!ch) fail("The token authenticated but returned no channel. Wrong account?", 2);
  const uploads = ch.contentDetails?.relatedPlaylists?.uploads;

  const ids = [];
  let pageToken;
  do {
    const page = await api(tokenValue, "playlistItems", {
      part: "contentDetails", playlistId: uploads, maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const it of page.items || []) ids.push(it.contentDetails.videoId);
    pageToken = page.nextPageToken;
  } while (pageToken);

  // videos.list caps at 50 ids per call.
  const vids = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const res = await api(tokenValue, "videos", {
      part: "id,snippet,status,statistics", id: batch.join(","), maxResults: "50",
    });
    vids.push(...(res.items || []));
  }
  return { channel: ch, videos: vids };
}

// ---------------------------------------------------------- classifier
// A video is KEPT if published.json records it as a reel (themeId "reel").
// Everything else on a YouTube channel predates the reel format and carries
// the copy-pool claim, so it is a cleanup candidate. Unknown-to-history
// videos are treated as candidates but flagged, so a human can look.
function classify(videos, pub) {
  const byId = new Map();
  for (const v of pub.videos || []) if (v.youtubeId) byId.set(v.youtubeId, v);
  return videos.map((v) => {
    const rec = byId.get(v.id);
    const isReel = rec?.themeId === "reel";
    return {
      id: v.id,
      title: v.snippet?.title || "",
      publishedAt: v.snippet?.publishedAt || "",
      privacy: v.status?.privacyStatus || "?",
      views: Number(v.statistics?.viewCount || 0),
      themeId: rec?.themeId ?? null,
      inHistory: !!rec,
      verdict: isReel ? "keep" : "cleanup",
    };
  });
}

// ------------------------------------------------------------ the work
// videos.update REPLACES the parts it is given. Only `status` is sent, and the
// whole existing status object is echoed back with privacyStatus changed —
// omitting a field here silently resets it (selfDeclaredMadeForKids especially).
async function unlist(tokenValue, id) {
  const cur = await api(tokenValue, "videos", { part: "status", id });
  const st = cur.items?.[0]?.status;
  if (!st) throw new Error(`${id}: not found or not owned by this channel`);
  if (st.privacyStatus === "unlisted" || st.privacyStatus === "private") {
    return { id, skipped: `already ${st.privacyStatus}` };
  }
  const body = {
    id,
    status: {
      privacyStatus: "unlisted",
      embeddable: st.embeddable,
      license: st.license,
      publicStatsViewable: st.publicStatsViewable,
      selfDeclaredMadeForKids: st.selfDeclaredMadeForKids ?? false,
    },
  };
  await api(tokenValue, "videos", { part: "status" }, { method: "PUT", body: JSON.stringify(body) });
  return { id, from: st.privacyStatus, to: "unlisted" };
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) {
    return {
      _comment:
        "Progressive unlisting of pre-reel ThemedShort videos whose single factual claim came from a copy pool rather than research. Unlisted, not deleted, so every action here is reversible. Written by scripts/youtube-cleanup.mjs.",
      batches: [],
      unlisted: [],
    };
  }
  return rd(LOG_PATH);
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}

// ---------------------------------------------------------------- main
const token = await accessToken();
const pub = rd(path.join(ROOT, "scripts/data/published.json"));
const { channel, videos } = await fetchUploads(token);
const rows = classify(videos, pub);

const stats = channel.statistics || {};
console.log(`\nChannel: ${channel.snippet?.title} (${CHANNEL_ID})`);
console.log(`  subscribers ${stats.subscriberCount ?? "?"}  |  views ${stats.viewCount ?? "?"}  |  uploads ${videos.length}`);

const done = new Set(loadLog().unlisted.map((u) => u.id));
const candidates = rows
  .filter((r) => r.verdict === "cleanup" && r.privacy === "public" && !done.has(r.id))
  .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

console.log(`  reels kept: ${rows.filter((r) => r.verdict === "keep").length}`);
console.log(`  cleanup candidates still public: ${candidates.length}`);
console.log(`  already unlisted: ${rows.filter((r) => r.privacy !== "public").length}\n`);

if (A.audit) {
  for (const r of rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    const mark = r.verdict === "keep" ? "KEEP " : "clean";
    const hist = r.inHistory ? "" : "  [not in published.json]";
    console.log(`  ${mark} ${r.privacy.padEnd(8)} ${r.publishedAt.slice(0, 10)} ${String(r.views).padStart(5)}v ${r.id}  ${r.title.slice(0, 58)}${hist}`);
  }
  console.log(`\n${rows.length} videos.\n`);
  process.exit(0);
}

if (!A.unlist) fail("Nothing to do. Pass --audit (read-only) or --unlist.");

let targets;
if (A.ids) {
  const wanted = String(A.ids).split(",").map((s) => s.trim()).filter(Boolean);
  targets = wanted.map((id) => rows.find((r) => r.id === id) || { id, title: "(not in uploads)", verdict: "cleanup" });
  const keeps = targets.filter((t) => t.verdict === "keep");
  if (keeps.length) fail(`Refusing: ${keeps.map((k) => k.id).join(", ")} ${keeps.length === 1 ? "is a reel" : "are reels"}. Reels are the good format — they stay public.`);
} else {
  targets = candidates.slice(0, LIMIT);
}

if (!targets.length) {
  console.log("No candidates left. The back catalogue is clean.\n");
  process.exit(0);
}

console.log(`${DRY ? "DRY RUN — would unlist" : "Unlisting"} ${targets.length}:`);
for (const t of targets) console.log(`  ${t.id}  ${String(t.title).slice(0, 60)}`);
console.log();

if (DRY) process.exit(0);

const results = [];
for (const t of targets) {
  try {
    const r = await unlist(token, t.id);
    results.push({ ...r, title: t.title, publishedAt: t.publishedAt, channel: CHANNEL_ID });
    console.log(`  ok      ${t.id}  ${r.skipped ? r.skipped : "public -> unlisted"}`);
  } catch (e) {
    results.push({ id: t.id, title: t.title, channel: CHANNEL_ID, error: e.message });
    console.error(`  FAILED  ${t.id}  ${e.message}`);
  }
  await new Promise((res) => setTimeout(res, 400)); // be polite to the quota
}

const log = loadLog();
const changed = results.filter((r) => !r.error);
log.batches.push({
  ranAt: new Date().toISOString(),
  channel: CHANNEL_ID,
  attempted: results.length,
  succeeded: changed.length,
  failed: results.filter((r) => r.error).length,
});
log.unlisted.push(...changed.map((r) => ({
  id: r.id, channel: r.channel, title: r.title,
  publishedAt: r.publishedAt, unlistedAt: new Date().toISOString(),
  ...(r.skipped ? { note: r.skipped } : {}),
})));
log.remainingPublicCandidates = Math.max(0, candidates.length - changed.length);
saveLog(log);

console.log(`\n${changed.length}/${results.length} done. ${log.remainingPublicCandidates} candidates left on ${CHANNEL_ID}.`);
console.log(`Logged to scripts/data/cleanup-log.json\n`);
if (results.some((r) => r.error)) process.exit(2);
