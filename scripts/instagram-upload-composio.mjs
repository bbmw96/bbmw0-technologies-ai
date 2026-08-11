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
// Declared up here, not beside diagnose(). diagnose is a hoisted function and
// is called during argument handling near the top of the file; a const defined
// further down would still be in its temporal dead zone at that point and
// throw a ReferenceError instead of running.
const BASE = "https://backend.composio.dev/api/v3";

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

// --diagnose is checked HERE, above the upload-argument validation, because it
// publishes nothing and therefore needs none of those arguments. Placed after
// them, the first diagnose run died on "Missing --video-url" before reaching
// the code it was written to run.
if (A.diagnose) {
  await diagnose("requested");
  process.exit(0);
}

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

/** Ask the key what it can actually see, and print it.
 *
 *  Run on any failure, because the guesses this file used to print were wrong
 *  and cost real time. A run failed with:
 *
 *    Tool INSTAGRAM_POST_IG_USER_MEDIA not found  (Tool_ToolNotFound, 404)
 *
 *  and this script responded "COMPOSIO_API_KEY looks invalid" and "connected
 *  account may be wrong". Both were false. The key authenticated, and the
 *  account was connected and Active. INSTAGRAM_POST_IG_USER_MEDIA is also a
 *  real tool — it is listed in Composio's own Instagram toolkit.
 *
 *  A 404 on a tool that exists means the key cannot SEE it: wrong project,
 *  toolkit not enabled for that key, or the connected account living in a
 *  different project from the one the key belongs to. None of that is
 *  guessable from here — so stop guessing and ask the API. */
async function diagnose(label) {
  const get = async (path) => {
    try {
      const r = await fetch(`${BASE}${path}`, { headers: { "x-api-key": KEY } });
      const t = await r.text();
      try { return { status: r.status, json: JSON.parse(t) }; }
      catch { return { status: r.status, text: t.slice(0, 300) }; }
    } catch (e) { return { error: e.message }; }
  };

  console.log(`\n--- Composio diagnostics (${label}) ---`);

  // Ask specifically for Instagram as well as listing everything. The plain
  // list could be paginated, default-filtered, or scoped to one project, and
  // "it was not in the first page" looks identical to "it does not exist".
  const igAccts = await get("/connected_accounts?toolkit_slugs=instagram&limit=50");
  const igList = igAccts.json?.items || igAccts.json?.data || [];
  console.log(`instagram connected accounts: HTTP ${igAccts.status}, ${Array.isArray(igList) ? igList.length : "?"} found`);
  for (const a of (Array.isArray(igList) ? igList : [])) {
    console.log(`  id=${a.id}  status=${a.status}  name=${a.name || a.nickname || "-"}`);
  }
  if (Array.isArray(igList) && igList.length === 0 && igAccts.status === 200) {
    console.log(`  Raw response: ${JSON.stringify(igAccts.json).slice(0, 400)}`);
  }

  // Which project is this key actually in? If the key and the connection sit
  // in different projects, every list above is correct and still unhelpful.
  const proj = await get("/projects");
  console.log(`projects visible to this key: HTTP ${proj.status} ${JSON.stringify(proj.json || proj.text || "").slice(0, 300)}`);

  const accts = await get("/connected_accounts?limit=100");
  const list = accts.json?.items || accts.json?.data || [];
  console.log(`connected accounts: HTTP ${accts.status}, ${Array.isArray(list) ? list.length : "?"} found`);
  for (const a of (Array.isArray(list) ? list : []).slice(0, 10)) {
    console.log(`  id=${a.id}  toolkit=${a.toolkit?.slug || a.appName || "?"}  name=${a.name || a.nickname || "-"}  status=${a.status}`);
  }
  console.log(`  (this script was passed ACCOUNT="${ACCOUNT}" — it must match an id above, not a nickname)`);

  const tools = await get("/tools?toolkit_slugs=instagram&limit=50");
  const ti = tools.json?.items || tools.json?.data || [];
  console.log(`instagram tools visible to this key: HTTP ${tools.status}, ${Array.isArray(ti) ? ti.length : "?"} found`);
  for (const t of (Array.isArray(ti) ? ti : []).slice(0, 40)) console.log(`  ${t.slug || t.name}`);
  // Only conclude anything when the request actually SUCCEEDED. On a network
  // error, status is undefined and the list is empty for a reason that has
  // nothing to do with the key — and announcing "no toolkit" there would be
  // the same confident-wrong-diagnosis this rewrite exists to remove.
  if (tools.error || tools.status === undefined) {
    console.log(`  Could not reach the API (${tools.error || "no response"}). No conclusion drawn.`);
  } else if (tools.status >= 400) {
    console.log(`  Request rejected with HTTP ${tools.status}. The key is being refused, not empty-handed.`);
  } else if (Array.isArray(ti) && ti.length === 0) {
    console.log(`  NONE, and the request succeeded — so the key is genuinely seeing an`);
    console.log(`  Instagram toolkit with no tools in it. Confirm in the Composio dashboard`);
    console.log(`  that the API key and the connected account are in the SAME project.`);
  }
  console.log(`--- end diagnostics ---\n`);
}

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

  // Only one guess survives, because it is the one the error text actually
  // supports: Meta reporting it could not fetch the file.
  //
  // The other two hints that used to live here — "API key looks invalid" and
  // "connected account may be wrong" — fired on any 404 and were both wrong
  // when it mattered. They read as findings, were quoted as findings, and sent
  // an investigation to the Composio dashboard twice for nothing. A confident
  // wrong diagnosis is worse than none: it stops people looking at the real
  // error, which in that run was three lines further down.
  if (/video_url|fetch|ingest/i.test(m)) {
    console.error("Meta could not fetch the video. The URL must be public https, no redirects, no auth.");
  }

  // Instead of guessing, ask the API what this key can see and print it.
  await diagnose("after failure").catch(() => {});
  process.exit(2);
}
