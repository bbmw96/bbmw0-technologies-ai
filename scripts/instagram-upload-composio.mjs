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

  // Same resolver the upload path uses, so the two cannot disagree about
  // what this key can see.
  const ti = await instagramTools({ log: (m) => console.log(m) });
  console.log(`instagram tools visible to this key: ${ti.length} found`);
  for (const name of ti) console.log(`  ${name}`);

  const WANT = "INSTAGRAM_POST_IG_USER_MEDIA";
  if (ti.length) {
    const present = ti.includes(WANT);
    console.log(`  ${WANT} present in this key's tool list: ${present ? "YES" : "NO"}`);
    if (!present) {
      console.log(`  So the 404 is correct: the key can see Instagram tools, but not that one.`);
      console.log(`  Pick a slug from the list above that publishes media, and use it instead.`);
    }
  }
  // No conclusion is drawn here any more. instagramTools() logs exactly which
  // query it tried, what came back, and whether it trusted the result — which
  // is the evidence. The block that used to sit here announced "the key has no
  // Instagram toolkit" whenever the list was empty, including when the API was
  // simply unreachable. That is the same confident-wrong-diagnosis this file
  // was rewritten to remove, and it survived two attempts to remove it.

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

/** Return the Instagram tool slugs this key can actually execute.
 *
 *  Tries several query shapes and VERIFIES each result before trusting it,
 *  rather than assuming any one parameter name is honoured.
 *
 *  History, because both failure modes were mine:
 *   - ?toolkit_slugs=instagram was silently ignored and returned the whole
 *     catalogue alphabetically. Reading its length as "50 Instagram tools"
 *     was wrong.
 *   - Falling back to an unfiltered paged scan capped at 40 pages, which on a
 *     catalogue of thousands may never reach the letter I. That reported
 *     "(none)" — a conclusion drawn from an incomplete scan, which is exactly
 *     as misleading as the first error.
 *
 *  A result is only trusted when every item in it really is an Instagram tool.
 *  If a filter is ignored, the first item will belong to some other toolkit
 *  and the result is discarded. */
async function instagramTools({ log = () => {} } = {}) {
  const isIg = (t) => (t.toolkit?.slug || "").toLowerCase() === "instagram";
  const get = async (p) => {
    try {
      const r = await fetch(`${BASE}${p}`, { headers: { "x-api-key": KEY } });
      return { status: r.status, json: await r.json() };
    } catch (e) { return { error: e.message }; }
  };

  for (const q of [
    "/tools?toolkit_slug=instagram&limit=200",
    "/tools?toolkit_slugs=instagram&limit=200",
    "/tools?toolkits=instagram&limit=200",
    "/toolkits/instagram/tools?limit=200",
  ]) {
    const r = await get(q);
    const items = r.json?.items || r.json?.data || [];
    if (!Array.isArray(items) || !items.length) { log(`  ${q} -> HTTP ${r.status}, 0 items`); continue; }
    // The filter is only believed if it actually filtered.
    if (!items.every(isIg)) { log(`  ${q} -> HTTP ${r.status}, ${items.length} items but NOT instagram-only (ignored)`); continue; }
    log(`  ${q} -> HTTP ${r.status}, ${items.length} instagram tool(s) [trusted]`);
    return items.map((t) => t.slug).filter(Boolean);
  }

  // Last resort: full paged scan, no page cap beyond what the API reports.
  log(`  no filter honoured; scanning the full catalogue`);
  const out = [];
  let page = 1, pages = 1, scanned = 0;
  while (page <= pages) {
    const r = await get(`/tools?limit=100&page=${page}`);
    const items = r.json?.items || r.json?.data || [];
    if (!Array.isArray(items) || !items.length) break;
    scanned += items.length;
    pages = r.json?.total_pages || pages;
    for (const t of items) if (isIg(t) && t.slug) out.push(t.slug);
    page++;
  }
  log(`  scanned ${scanned} tool(s) across ${page - 1} page(s) of ${pages}; found ${out.length} instagram`);
  return out;
}

/** Fetch a tool's accepted input parameter names.
 *
 *  Needed because the tools this key actually has are NOT the ones this script
 *  was written against. It hardcoded INSTAGRAM_POST_IG_USER_MEDIA; the key has
 *  INSTAGRAM_CREATE_MEDIA_CONTAINER and INSTAGRAM_CREATE_POST instead — the
 *  same Meta handshake under different names, with different argument names.
 *
 *  Guessing those names is how this file spent three months returning 404. */
async function toolParams(slug) {
  try {
    const r = await fetch(`${BASE}/tools/${slug}`, { headers: { "x-api-key": KEY } });
    const j = await r.json();
    const props = j?.input_parameters?.properties || j?.parameters?.properties || j?.inputParameters?.properties;
    return props ? Object.keys(props) : [];
  } catch { return []; }
}

/** Build an argument object using whichever alias the tool actually accepts. */
function mapArgs(accepted, wanted) {
  const out = {};
  for (const [aliases, value] of wanted) {
    if (value === undefined) continue;
    const key = aliases.find((a) => accepted.includes(a));
    if (key) out[key] = value;
  }
  return out;
}

/** Pick the first candidate that this key can actually see. */
function choose(available, candidates, role) {
  const hit = candidates.find((c) => available.includes(c));
  if (hit) return hit;
  throw new Error(
    `No usable ${role} tool. Tried ${candidates.join(", ")}. ` +
    `This key's Instagram tools: ${available.length ? available.join(", ") : "(none)"}`,
  );
}

try {
  console.log(`Publishing Reel to Instagram via Composio`);
  console.log(`  Account:  ${ACCOUNT}`);
  console.log(`  IG user:  ${IG_USER_ID}`);
  console.log(`  Video:    ${A["video-url"]}`);

  // Resolve the tool slugs at runtime instead of hardcoding them.
  //
  // INSTAGRAM_POST_IG_USER_MEDIA was hardcoded and returned 404
  // Tool_ToolNotFound on every attempt since May. The slug is real — it is in
  // Composio's published Instagram toolkit — but whether a given API key can
  // execute it depends on that key's project, and Composio has renamed and
  // deprecated tools in this toolkit before (CREATE_MEDIA_CONTAINER and
  // CREATE_POST are both marked deprecated in the current docs).
  //
  // Hardcoding a slug means the script breaks silently whenever the catalogue
  // moves. Asking the key what it can run costs one request and cannot go
  // stale. If nothing matches, the error names every Instagram tool the key
  // DOES have, so the next fix is a substitution rather than another
  // investigation.
  const available = await instagramTools({ log: (m) => console.log(m) });
  console.log(`  Tools:    ${available.length} instagram tool(s) available to this key`);

  const CONTAINER_TOOLS = [
    "INSTAGRAM_POST_IG_USER_MEDIA",
    "INSTAGRAM_CREATE_MEDIA_CONTAINER",
    "INSTAGRAM_CREATE_CAROUSEL_CONTAINER",
  ];
  const PUBLISH_TOOLS = [
    "INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH",
    "INSTAGRAM_CREATE_POST",
  ];
  const containerTool = choose(available, CONTAINER_TOOLS, "container");
  const publishTool = choose(available, PUBLISH_TOOLS, "publish");
  console.log(`  Using:    ${containerTool} -> ${publishTool}`);

  const cParams = await toolParams(containerTool);
  console.log(`  ${containerTool} accepts: ${cParams.join(", ") || "(schema unavailable)"}`);
  const containerArgs = cParams.length
    ? mapArgs(cParams, [
        [["ig_user_id", "ig_id", "instagram_account_id", "user_id"], IG_USER_ID],
        [["video_url", "media_url", "url"], A["video-url"]],
        [["caption", "text"], caption],
        [["media_type", "type"], "REELS"],
        [["share_to_feed"], true],
      ])
    // No schema: fall back to the original shape rather than sending nothing.
    : { ig_user_id: IG_USER_ID, video_url: A["video-url"], caption, media_type: "REELS", share_to_feed: true };

  const container = await execTool(containerTool, containerArgs);

  // Response nesting varies, so probe rather than assume one shape.
  const creationId = container?.id || container?.data?.id || container?.response_data?.id;
  if (!creationId) {
    throw new Error(`No container id in response: ${JSON.stringify(container).slice(0, 300)}`);
  }
  console.log(`  Container: ${creationId}`);

  // Composio polls for FINISHED itself. Reels typically need 30-120s.
  const pParams = await toolParams(publishTool);
  console.log(`  ${publishTool} accepts: ${pParams.join(", ") || "(schema unavailable)"}`);
  const publishArgs = pParams.length
    ? mapArgs(pParams, [
        [["ig_user_id", "ig_id", "instagram_account_id", "user_id"], IG_USER_ID],
        [["creation_id", "container_id", "media_container_id", "id"], String(creationId)],
        [["max_wait_seconds", "timeout"], 180],
      ])
    : { ig_user_id: IG_USER_ID, creation_id: String(creationId), max_wait_seconds: 180 };

  const published = await execTool(publishTool, publishArgs);

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
