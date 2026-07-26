#!/usr/bin/env node
// Instagram Reels publisher (Meta Graph API).
//
// Instagram will not accept a file upload. It fetches the video from a public
// URL you provide, which means the MP4 must already be hosted somewhere
// reachable before this runs. That is the single biggest difference from the
// YouTube path and the most common reason this fails.
//
// The API is a two-step handshake:
//   1. POST /{ig-user-id}/media          -> creates a container, returns id
//   2. poll GET /{container-id}?fields=status_code until FINISHED
//   3. POST /{ig-user-id}/media_publish  -> publishes the container
//
// USAGE:
//   node scripts/instagram-upload.mjs \
//     --video-url="https://cdn.example.com/daily-2026-07-26-honey.mp4" \
//     --caption="Honey never spoils." \
//     --tags="shorts,food,foodfacts"
//
// ENVIRONMENT:
//   IG_ACCESS_TOKEN   long-lived token with instagram_content_publish
//   IG_USER_ID        Instagram Business account id (not the @handle)
//
// EXIT CODES: 0 published, 1 bad arguments or config, 2 API failure

const GRAPH = "https://graph.facebook.com/v21.0";

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

function fail(msg, code = 1) { console.error(msg); process.exit(code); }

const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER_ID = process.env.IG_USER_ID;

if (!TOKEN)   fail("Missing IG_ACCESS_TOKEN. See scripts/RUNBOOK.md.");
if (!USER_ID) fail("Missing IG_USER_ID. See scripts/RUNBOOK.md.");
if (!A["video-url"]) fail("Missing --video-url=<public https url to the mp4>");
if (!A.caption)      fail("Missing --caption=<caption text>");

if (!/^https:\/\//i.test(A["video-url"])) {
  fail("--video-url must be a public https URL. Instagram fetches the file itself and cannot read a local path.");
}

// Caption limits are enforced here as a last line of defence. The compliance
// gate should already have caught anything over the limit.
const CAPTION_MAX = 2200;
const HASHTAG_MAX = 30;

const tags = (A.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
const hashtags = tags.slice(0, HASHTAG_MAX).map((t) => `#${t.replace(/[^\p{L}\p{N}]/gu, "")}`);
let caption = A.caption;
if (hashtags.length) caption = `${caption}\n\n${hashtags.join(" ")}`;
if (caption.length > CAPTION_MAX) {
  console.error(`Caption is ${caption.length} chars, limit is ${CAPTION_MAX}. Truncating hashtags.`);
  caption = caption.slice(0, CAPTION_MAX);
}

async function graph(pathname, params, method = "POST") {
  const url = new URL(`${GRAPH}${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = method === "GET"
    ? await fetch(`${url}?${body}`)
    : await fetch(url, { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`${e.type || "HTTPError"} ${e.code || res.status}: ${e.message || res.statusText}`);
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  console.log(`Publishing Reel to Instagram user ${USER_ID}`);
  console.log(`  Video:   ${A["video-url"]}`);
  console.log(`  Caption: ${caption.split("\n")[0].slice(0, 60)}...`);

  // Step 1: container
  const container = await graph(`/${USER_ID}/media`, {
    media_type: "REELS",
    video_url: A["video-url"],
    caption,
    share_to_feed: "true",
  });
  const containerId = container.id;
  if (!containerId) throw new Error("No container id returned.");
  console.log(`  Container: ${containerId}`);

  // Step 2: wait for Instagram to finish downloading and transcoding.
  // This genuinely takes 30 to 90 seconds for a 40s Reel. Publishing before
  // status is FINISHED returns a misleading "media not ready" error.
  const MAX_WAIT_MS = 5 * 60 * 1000;
  const started = Date.now();
  let status = "IN_PROGRESS";
  while (Date.now() - started < MAX_WAIT_MS) {
    await sleep(5000);
    const s = await graph(`/${containerId}`, { fields: "status_code,status" }, "GET");
    status = s.status_code || "UNKNOWN";
    process.stdout.write(`\r  Status: ${status} (${Math.round((Date.now() - started) / 1000)}s)   `);
    if (status === "FINISHED") break;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Container ${status}: ${s.status || "no detail"}`);
    }
  }
  process.stdout.write("\n");
  if (status !== "FINISHED") throw new Error(`Container not ready after ${MAX_WAIT_MS / 1000}s (last status ${status}).`);

  // Step 3: publish
  const published = await graph(`/${USER_ID}/media_publish`, { creation_id: containerId });
  const mediaId = published.id;
  console.log(`Published. Media ID: ${mediaId}`);

  // Surface the permalink so render-batch can record it, mirroring YouTube.
  try {
    const perma = await graph(`/${mediaId}`, { fields: "permalink" }, "GET");
    if (perma.permalink) console.log(`URL: ${perma.permalink}`);
  } catch { /* permalink is a convenience, not a failure condition */ }

  process.exit(0);
} catch (err) {
  console.error(`Upload failed: ${err.message || err}`);
  if (/190|access token/i.test(String(err.message))) {
    console.error("The access token is invalid or expired. Instagram long-lived tokens last 60 days and must be refreshed.");
  }
  if (/permission|scope/i.test(String(err.message))) {
    console.error("The app is missing instagram_content_publish, or the account is not a Business/Creator account linked to a Facebook Page.");
  }
  process.exit(2);
}
