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
// Composio wraps Meta's three-step handshake. The tool SLUGS ARE RESOLVED AT
// RUNTIME, because which ones a key can execute varies by project and Composio
// renames and deprecates them. This key has:
//
//   INSTAGRAM_CREATE_MEDIA_CONTAINER -> create the Reel container
//   INSTAGRAM_GET_POST_STATUS        -> poll until Meta reports FINISHED
//   INSTAGRAM_CREATE_POST            -> publish it
//
// The middle step is not optional. INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH used
// to block internally via max_wait_seconds, so an earlier version of this file
// had no wait of its own. This key does not have that tool, and CREATE_POST
// publishes immediately — so without the poll Meta answers "Media ID is not
// available / please wait for a moment" (9007 / 2207027) every time.
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

// Transcoding wait. Meta rejects a publish until the container reports
// FINISHED; a Reel typically needs 30-120s. 240s of headroom, checked every
// 5s, so a slow encode succeeds rather than being abandoned one poll early.
const POLL_EVERY_MS = 5000;
const POLL_MAX_MS = 240000;
const BLIND_WAIT_MS = 90000;

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
// Mutable: entityId() replaces this with a real connection id when the
// configured COMPOSIO_IG_ACCOUNT_ID matches nothing the API returns.
let RESOLVED_ACCOUNT = ACCOUNT;

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
    console.log(`  id=${a.id}  toolkit=${a.toolkit?.slug || a.appName || "?"}  user=${a.user_id || a.entity_id || a.user?.id || "?"}  status=${a.status}`);
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

// The entity that owns the connected account.
//
// Composio rejects an execute that names a connected account without also
// naming its user:
//
//   HTTP 400 "User ID is required with connected account."
//   ActionExecute_ConnectedAccountEntityIdRequired
//
// Read it off the connection rather than guessing. A wrong entity id would
// either fail the same way or, worse, resolve to somebody else's connection.
// Cached because every execute needs it and it cannot change mid-run.
let _entityId;
async function entityId() {
  if (_entityId !== undefined) return _entityId;
  _entityId = process.env.COMPOSIO_ENTITY_ID || null;

  // Resolve from the LIST, not from /connected_accounts/<id>.
  //
  // The single-account fetch returned nothing usable, so this fell back to
  // "default" and Composio answered:
  //
  //   No connected account found with ID <id> for user ID default
  //   ActionExecute_ConnectedAccountNotFound
  //
  // The account exists — it just does not belong to "default". The list
  // endpoint demonstrably works (it returns all six connections), so read the
  // owner off the matching entry there. Guessing "default" was the mistake.
  if (!_entityId) {
    try {
      const r = await fetch(`${BASE}/connected_accounts?limit=100`, { headers: { "x-api-key": KEY } });
      const j = await r.json();
      const items = j?.items || j?.data || [];
      // Fall back to the live Instagram connection when the configured id
      // does not match one.
      //
      // The run still said "for user ID default", which means this lookup found
      // nothing — so COMPOSIO_IG_ACCOUNT_ID is not one of the ca_ ids the API
      // returns. The secret is opaque here (GitHub masks it), so it cannot be
      // checked by eye, and a wrong value looks identical to a right one.
      //
      // The API knows which Instagram connections exist and who owns them.
      // Prefer the configured id when it genuinely matches; otherwise use the
      // ACTIVE Instagram connection and say so. Being unable to read a secret
      // is not a reason to fail when the correct value is discoverable.
      const igOnly = items.filter((a) => (a.toolkit?.slug || "").toLowerCase() === "instagram");
      let mine = items.find((a) => a.id === ACCOUNT);
      if (!mine) {
        const active = igOnly.filter((a) => String(a.status).toUpperCase() === "ACTIVE");
        mine = active[0] || igOnly[0];
        if (mine) {
          console.log(`  Account:  COMPOSIO_IG_ACCOUNT_ID matched no connection; using ${mine.id} (${mine.status})`);
          if (active.length > 1) {
            console.log(`            NOTE ${active.length} active Instagram connections exist. Set`);
            console.log(`            COMPOSIO_IG_ACCOUNT_ID to the right one if this posts to the wrong account.`);
          }
          RESOLVED_ACCOUNT = mine.id;
        } else {
          console.log(`  Account:  no Instagram connection found at all.`);
        }
      }
      if (mine) {
        _entityId = mine.user_id || mine.entity_id || mine.entityId
          || mine.user?.id || mine.entity?.id || null;
        if (!_entityId) {
          // Do not fail silently into a guess: say what the record contains.
          console.log(`  Entity:   connection found but carries no user id. Fields: ${Object.keys(mine).join(", ")}`);
        }
      }
    } catch (e) { console.log(`  Entity:   lookup failed (${e.message})`); }
  }

  if (_entityId) {
    console.log(`  Entity:   ${_entityId}`);
  } else {
    // "default" is a guess, and it has already been wrong once. Say so plainly
    // rather than letting the next 404 look like a different problem.
    console.log(`  Entity:   unresolved. Falling back to "default", which Composio has already rejected once.`);
    console.log(`            Set COMPOSIO_ENTITY_ID to the user id that owns the connection to fix this properly.`);
    _entityId = "default";
  }
  return _entityId;
}

async function execTool(slug, argumentsObj) {
  const uid = await entityId();
  const res = await fetch(`${API}/${slug}`, {
    method: "POST",
    headers: { "x-api-key": KEY, "Content-Type": "application/json" },
    // user_id and entity_id both sent: Composio has used each name across API
    // versions, the error text says "entity_id", and an unrecognised extra
    // field is ignored. Sending both costs nothing and avoids another round
    // trip to discover which one this deployment wants.
    body: JSON.stringify({
      connected_account_id: RESOLVED_ACCOUNT,
      user_id: uid,
      entity_id: uid,
      arguments: argumentsObj,
    }),
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

  // Wait for Meta to finish transcoding before publishing.
  //
  // The comment that used to sit here said "Composio polls for FINISHED
  // itself". That was true of INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH, which
  // takes max_wait_seconds and blocks. This key does not have that tool — it
  // has INSTAGRAM_CREATE_POST, which publishes immediately and does not wait.
  // Swapping the tools silently removed the wait, and Meta answered:
  //
  //   "Media ID is not available" / "The media is not ready for publishing,
  //    please wait for a moment"   (code 9007, subcode 2207027)
  //
  // Which is Meta being polite about being asked too early. A Reel needs
  // roughly 30-120s to transcode.
  if (available.includes("INSTAGRAM_GET_POST_STATUS")) {
    const sParams = await toolParams("INSTAGRAM_GET_POST_STATUS");
    const deadline = Date.now() + POLL_MAX_MS;
    let last = "";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
      let st;
      try {
        st = await execTool("INSTAGRAM_GET_POST_STATUS", sParams.length
          ? mapArgs(sParams, [
              [["ig_container_id", "container_id", "creation_id", "media_container_id", "id"], String(creationId)],
              [["fields"], "status_code,status"],
            ])
          : { creation_id: String(creationId), fields: "status_code,status" });
      } catch (e) {
        // A transient status read must not abort a container that is fine.
        console.log(`  status check failed (${String(e.message).slice(0, 120)}) — retrying`);
        continue;
      }
      const code = String(
        st?.status_code || st?.data?.status_code || st?.status || st?.data?.status || "",
      ).toUpperCase();
      if (code !== last) { console.log(`  Status:   ${code || "(none)"}`); last = code; }
      if (code.includes("FINISHED")) break;
      if (code.includes("ERROR") || code.includes("EXPIRED")) {
        throw new Error(`Meta rejected the media while processing: ${JSON.stringify(st).slice(0, 300)}`);
      }
    }
    if (!last.includes("FINISHED")) {
      // Publishing anyway would reproduce the exact 9007 this loop exists to
      // prevent, so stop and say what state it reached.
      throw new Error(`Container ${creationId} never reached FINISHED within ${POLL_MAX_MS / 1000}s (last status: ${last || "unknown"}).`);
    }
  } else {
    // No status tool: fall back to a flat wait rather than publishing instantly.
    console.log(`  No INSTAGRAM_GET_POST_STATUS available; waiting ${BLIND_WAIT_MS / 1000}s before publishing.`);
    await new Promise((r) => setTimeout(r, BLIND_WAIT_MS));
  }

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
