#!/usr/bin/env node
// Instagram Reels publisher.
//
// Uses "Instagram API with Instagram Login" (Business Login for Instagram),
// NOT the older Facebook Login path. This matters: the Instagram Login path
// needs no Facebook account and no linked Facebook Page, which is the correct
// route for @ai_game_odyssey since its account has no Facebook attached.
//
// Consequences of that choice, all reflected below:
//   Host        graph.instagram.com        (not graph.facebook.com)
//   Auth        Authorization: Bearer      (not an access_token query param)
//   Permissions instagram_business_basic, instagram_business_content_publish
//               (not instagram_basic / instagram_content_publish, which are
//                the Facebook Login variants and will fail here)
//
// Instagram will not accept a file upload on this path. It cURLs the video
// from a public URL, so the MP4 must already be hosted and reachable.
//
// Publishing is a three-step handshake:
//   1. POST /<IG_ID>/media           create container, returns container id
//   2. GET  /<CONTAINER_ID>?fields=status_code   poll until FINISHED
//   3. POST /<IG_ID>/media_publish   publish the container
//
// USAGE:
//   node scripts/instagram-upload.mjs \
//     --video-url="https://cdn.example.com/daily-2026-07-26-honey.mp4" \
//     --caption="Honey never spoils." \
//     --tags="shorts,food,foodfacts"
//
// ENVIRONMENT:
//   IG_ACCESS_TOKEN   Instagram User access token (long-lived, 60 days)
//   IG_USER_ID        Instagram professional account id (a number, not @handle)
//
// EXIT CODES: 0 published, 1 bad arguments or config, 2 API failure

const API_VERSION = "v24.0";
const HOST = "https://graph.instagram.com";

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
const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER_ID = process.env.IG_USER_ID;

if (!TOKEN)   fail("Missing IG_ACCESS_TOKEN. See scripts/RUNBOOK.md step 5.");
if (!USER_ID) fail("Missing IG_USER_ID. This is the numeric account id, not the @handle.");
if (!A["video-url"]) fail("Missing --video-url=<public https url to the mp4>");
if (!A.caption)      fail("Missing --caption=<caption text>");
if (!/^https:\/\//i.test(A["video-url"])) {
  fail("--video-url must be a public https URL. Instagram fetches the file itself and cannot read a local path.");
}

const CAPTION_MAX = 2200;
const HASHTAG_MAX = 30;

const tags = (A.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
const hashtags = tags.slice(0, HASHTAG_MAX).map((t) => `#${t.replace(/[^\p{L}\p{N}]/gu, "")}`);
let caption = A.caption;
if (hashtags.length) caption = `${caption}\n\n${hashtags.join(" ")}`;
if (caption.length > CAPTION_MAX) {
  console.error(`Caption is ${caption.length} chars, limit ${CAPTION_MAX}. Trimming.`);
  caption = caption.slice(0, CAPTION_MAX);
}

async function ig(pathname, { method = "POST", body = null, query = null } = {}) {
  const url = new URL(`${HOST}/${API_VERSION}${pathname}`);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    const err = new Error(`${e.type || "HTTPError"} ${e.code ?? res.status}: ${e.message || res.statusText}`);
    err.code = e.code;
    throw err;
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // Instagram allows 100 API-published posts per rolling 24 hours. Check first
  // rather than discovering the limit mid-batch.
  try {
    const lim = await ig(`/${USER_ID}/content_publishing_limit`,
      { method: "GET", query: { fields: "config,quota_usage" } });
    const usage = lim?.data?.[0]?.quota_usage;
    if (usage !== undefined) console.log(`Publishing quota used: ${usage}/100 in the last 24h`);
  } catch { /* informational only, never block on it */ }

  console.log(`Publishing Reel to Instagram account ${USER_ID}`);
  console.log(`  Video:   ${A["video-url"]}`);

  // Step 1: container
  const container = await ig(`/${USER_ID}/media`, {
    body: { media_type: "REELS", video_url: A["video-url"], caption, share_to_feed: true },
  });
  const containerId = container.id;
  if (!containerId) throw new Error("No container id returned.");
  console.log(`  Container: ${containerId}`);

  // Step 2: poll. Meta advises checking about once a minute for no more than
  // five minutes, so this checks early once then backs off rather than hammering.
  const schedule = [15000, 30000, 30000, 45000, 60000, 60000, 60000];
  let status = "IN_PROGRESS";
  for (const wait of schedule) {
    await sleep(wait);
    const s = await ig(`/${containerId}`, { method: "GET", query: { fields: "status_code,status" } });
    status = s.status_code || "UNKNOWN";
    console.log(`  Status: ${status}`);
    if (status === "FINISHED" || status === "PUBLISHED") break;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Container ${status}: ${s.status || "no detail given"}`);
    }
  }
  if (status !== "FINISHED" && status !== "PUBLISHED") {
    throw new Error(`Container still ${status} after 5 minutes. Not publishing.`);
  }

  // Step 3: publish
  const published = await ig(`/${USER_ID}/media_publish`, { body: { creation_id: containerId } });
  const mediaId = published.id;
  console.log(`Published. Media ID: ${mediaId}`);

  try {
    const perma = await ig(`/${mediaId}`, { method: "GET", query: { fields: "permalink" } });
    if (perma.permalink) console.log(`URL: ${perma.permalink}`);
  } catch { /* permalink is a convenience, not a failure condition */ }

  process.exit(0);
} catch (err) {
  console.error(`Upload failed: ${err.message || err}`);
  const m = String(err.message || "");
  if (err.code === 190 || /access token/i.test(m)) {
    console.error("Token invalid or expired. Instagram long-lived tokens last 60 days and must be refreshed before they lapse.");
  }
  if (/permission|scope|OAuth/i.test(m)) {
    console.error("Missing instagram_business_content_publish, or the account is not a professional (Business or Creator) account.");
  }
  if (/media|url/i.test(m) && /fetch|download|curl/i.test(m)) {
    console.error("Instagram could not fetch the video. Confirm PUBLIC_MEDIA_BASE_URL is publicly reachable over https with no auth.");
  }
  process.exit(2);
}
