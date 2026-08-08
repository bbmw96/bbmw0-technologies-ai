#!/usr/bin/env node
// Instagram Reels publisher via Composio.
//
// WHY THIS EXISTS ALONGSIDE instagram-upload.mjs
// The direct Meta path (instagram-upload.mjs) needs a Meta app, an Instagram
// Login flow, and a long-lived token you must refresh every 60 days or
// publishing dies silently. Composio already holds an ACTIVE, authenticated
// connection to @ai_game_odyssey and handles the token lifecycle itself, so
// this path skips all of that setup and all of that maintenance.
//
// Composio wraps the same two-step Meta handshake:
//   INSTAGRAM_POST_IG_USER_MEDIA          -> create the Reel container
//   INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH  -> publish it (polls for FINISHED
//                                            internally via max_wait_seconds)
//
// It still cURLs the video from a public URL, so publish-media.mjs is still
// required. That constraint is Meta's, not Composio's.
//
// USAGE:
//   node scripts/instagram-upload-composio.mjs \
//     --video-url="https://github.com/.../releases/download/media-2026-08-08/x.mp4" \
//     --caption="Honey never spoils." --tags="shorts,food,foodfacts"
//
// ENVIRONMENT:
//   COMPOSIO_API_KEY        project API key (never hardcode, never log)
//   COMPOSIO_IG_ACCOUNT_ID  connected account id, default instagram_sledge-got
//   IG_USER_ID              Instagram Business account id (numeric)
//
// EXIT CODES: 0 published, 1 bad arguments or config, 2 API failure

const API = "https://backend.composio.dev/api/v3/tools/execute";

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
const fail = (m, c = 1) => { console.error(m); process.exit(c); };

const KEY = process.env.COMPOSIO_API_KEY;
const ACCOUNT = process.env.COMPOSIO_IG_ACCOUNT_ID || "instagram_sledge-got";
const IG_USER_ID = process.env.IG_USER_ID;

if (!KEY)        fail("Missing COMPOSIO_API_KEY. Add it as a GitHub secret. Never paste it into a chat.");
if (!IG_USER_ID) fail("Missing IG_USER_ID (the numeric Instagram Business account id).");
if (!A["video-url"]) fail("Missing --video-url=<public https url to the mp4>");
if (!A.caption)      fail("Missing --caption=<caption text>");
if (!/^https:\/\//i.test(A["video-url"])) {
  fail("--video-url must be a public https URL. Instagram fetches the file itself.");
}

const CAPTION_MAX = 2200, HASHTAG_MAX = 30;
const tags = (A.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
const hashtags = tags.slice(0, HASHTAG_MAX).map((t) => `#${t.replace(/[^\p{L}\p{N}]/gu, "")}`);
let caption = A.caption;
if (hashtags.length) caption = `${caption}\n\n${hashtags.join(" ")}`;
if (caption.length > CAPTION_MAX) caption = caption.slice(0, CAPTION_MAX);

async function execTool(slug, argumentsObj) {
  const res = await fetch(`${API}/${slug}`, {
    method: "POST",
    headers: { "x-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ connected_account_id: ACCOUNT, arguments: argumentsObj }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`${slug}: non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`); }

  // Composio returns HTTP 200 with successful:false for tool-level failures,
  // so the status code alone is not a reliable success signal.
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  if (json.successful === false || json.error) {
    throw new Error(`${slug}: ${json.error || JSON.stringify(json).slice(0, 300)}`);
  }
  return json.data ?? json;
}

try {
  console.log(`Publishing Reel to Instagram via Composio`);
  console.log(`  Account:  ${ACCOUNT}`);
  console.log(`  IG user:  ${IG_USER_ID}`);
  console.log(`  Video:    ${A["video-url"]}`);

  const container = await execTool("INSTAGRAM_POST_IG_USER_MEDIA", {
    ig_user_id: IG_USER_ID,
    video_url: A["video-url"],
    caption,
    media_type: "REELS",
    share_to_feed: true,
  });

  // Response nesting varies, so probe rather than assume one shape.
  const creationId = container?.id || container?.data?.id || container?.response_data?.id;
  if (!creationId) {
    throw new Error(`No container id in response: ${JSON.stringify(container).slice(0, 300)}`);
  }
  console.log(`  Container: ${creationId}`);

  // Composio polls for FINISHED itself. Reels typically need 30-120s.
  const published = await execTool("INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH", {
    ig_user_id: IG_USER_ID,
    creation_id: String(creationId),
    max_wait_seconds: 180,
  });

  const mediaId = published?.id || published?.data?.id || published?.response_data?.id;
  if (!mediaId) throw new Error(`No media id in publish response: ${JSON.stringify(published).slice(0, 300)}`);
  console.log(`Published. Media ID: ${mediaId}`);

  try {
    const meta = await execTool("INSTAGRAM_GET_IG_MEDIA", { ig_media_id: String(mediaId), fields: "permalink" });
    const link = meta?.permalink || meta?.data?.permalink;
    if (link) console.log(`URL: ${link}`);
  } catch { /* permalink is a convenience, not a failure condition */ }

  process.exit(0);
} catch (err) {
  const m = String(err.message || err);
  console.error(`Upload failed: ${m}`);
  if (/api.?key|401|403|unauthor/i.test(m)) {
    console.error("COMPOSIO_API_KEY looks invalid or lacks scope for this toolkit.");
  }
  if (/connected_account|not found|404/i.test(m)) {
    console.error(`Connected account "${ACCOUNT}" may be wrong. List them in the Composio dashboard.`);
  }
  if (/video_url|fetch|ingest/i.test(m)) {
    console.error("Meta could not fetch the video. The URL must be public https, no redirects, no auth.");
  }
  process.exit(2);
}
