#!/usr/bin/env node
// Instagram CAROUSEL publisher via Composio. Written for ig-blankdiscussions.
//
// WHY THIS IS A SEPARATE FILE FROM instagram-upload-composio.mjs
// That script drives Meta's SINGLE-media handshake (one container, one
// publish) and hardcodes media_type: "REELS". A carousel is a genuinely
// different, three-tier shape: N child image containers, then ONE parent
// carousel container that lists them, then publish the PARENT. Bolting that
// onto the Reels script would mean branching almost every line of it. The
// two scripts share the same low-level Composio plumbing (entity
// resolution, execTool, the "ask the API, don't guess" tool-discovery
// helpers) copied rather than factored into a shared module for now - see
// the note at the bottom of this file for why, and do factor it out the
// next time either file needs a real change.
//
// THE THREE CALLS, VERIFIED LIVE AGAINST THIS PROJECT'S OWN COMPOSIO KEY ON
// 10 Sep 2026 (via COMPOSIO_SEARCH_TOOLS / COMPOSIO_GET_TOOL_SCHEMAS) RATHER
// THAN GUESSED:
//
//   INSTAGRAM_POST_IG_USER_MEDIA          -> one call per slide, image_url +
//                                             is_carousel_item:true, returns
//                                             a child creation_id
//   INSTAGRAM_CREATE_CAROUSEL_CONTAINER   -> ig_user_id + children (ordered
//                                             creation_ids) + caption,
//                                             returns a parent creation_id.
//                                             Instagram requires 2-10 items.
//                                             Rejects a personal account.
//   INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH  -> publish the PARENT creation_id
//                                             (not the children). Waits for
//                                             FINISHED internally up to
//                                             max_wait_seconds.
//
// Unlike the Reels script this file does not need to discover CONTAINER_TOOLS
// / PUBLISH_TOOLS candidates at runtime: those three slugs were confirmed
// present and schema-verified for this project's key this session. The
// runtime instagramTools() check is kept anyway, as a guard that fails
// loudly and clearly if Composio ever renames or deprecates one of them,
// rather than silently doing the wrong thing.
//
// USAGE:
//   node scripts/instagram-upload-carousel-composio.mjs \
//     --images="https://.../slide1.jpg,https://.../slide2.jpg,..." \
//     --caption="..."
//
// ENVIRONMENT:
//   COMPOSIO_API_KEY        project API key (never hardcode, never log)
//   COMPOSIO_IG_ACCOUNT_ID  connected account id for THIS channel
//                           (ig-blankdiscussions: instagram_demob-runite)
//   IG_USER_ID              Instagram Business/Creator account id (numeric)
//                           (ig-blankdiscussions: 28477523595198052)
//   Both of the above are identifiers, not credentials - render-batch.mjs
//   and any caller can read them straight from channels.json's
//   composioConnection / igUserId fields for the target channel rather than
//   treating them as secrets.
//
// EXIT CODES: 0 published, 1 bad arguments or config, 2 API failure

const API = "https://backend.composio.dev/api/v3/tools/execute";
const BASE = "https://backend.composio.dev/api/v3";

// Images publish near-instantly (unlike video transcoding), but "near" is
// not "always" - Meta still returns a status while a container is briefly
// IN_PROGRESS. Short bounds are enough; these are not the multi-minute Reels
// timings.
const POLL_EVERY_MS = 2000;
const CHILD_POLL_MAX_MS = 30000;
const PARENT_MAX_WAIT_S = 90;

const MIN_ITEMS = 2, MAX_ITEMS = 10;

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
const ACCOUNT = process.env.COMPOSIO_IG_ACCOUNT_ID;
const IG_USER_ID = process.env.IG_USER_ID;
let RESOLVED_ACCOUNT = ACCOUNT;

if (!KEY) fail("Missing COMPOSIO_API_KEY. Add it as a GitHub secret. Never paste it into a chat.");

if (A.diagnose) {
  await diagnose("requested");
  process.exit(0);
}

if (!ACCOUNT)     fail("Missing COMPOSIO_IG_ACCOUNT_ID. Set it to the target channel's composioConnection (see scripts/data/channels.json).");
if (!IG_USER_ID)  fail("Missing IG_USER_ID. Set it to the target channel's igUserId (see scripts/data/channels.json).");
if (!A.images)    fail("Missing --images=<comma-separated public https image URLs, 2-10, in slide order>");
if (!A.caption)   fail("Missing --caption=<caption text>");

const images = A.images.split(",").map((s) => s.trim()).filter(Boolean);
if (images.length < MIN_ITEMS || images.length > MAX_ITEMS) {
  fail(`--images has ${images.length} item(s). Instagram carousels require between ${MIN_ITEMS} and ${MAX_ITEMS}.`);
}
for (const u of images) {
  if (!/^https:\/\//i.test(u)) fail(`Not a public https URL: ${u}. Instagram fetches every slide itself.`);
}

const CAPTION_MAX = 2200, HASHTAG_MAX = 30;
const tags = (A.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
const hashtags = tags.slice(0, HASHTAG_MAX).map((t) => `#${t.replace(/[^\p{L}\p{N}]/gu, "")}`);
let caption = A.caption;
if (hashtags.length) caption = `${caption}\n\n${hashtags.join(" ")}`;
if (caption.length > CAPTION_MAX) caption = caption.slice(0, CAPTION_MAX);

/** Ask the key what it can actually see. Run on any failure. See
 *  instagram-upload-composio.mjs's identical helper for why this exists:
 *  guessing about API keys and connected accounts from a 404 has been wrong
 *  before, twice, on the sibling script. */
async function diagnose(label) {
  const get = async (path) => {
    try {
      const r = await fetch(`${BASE}${path}`, { headers: { "x-api-key": KEY } });
      const t = await r.text();
      try { return { status: r.status, json: JSON.parse(t) }; }
      catch { return { status: r.status, text: t.slice(0, 300) }; }
    } catch (e) { return { error: e.message }; }
  };
  console.log(`\n--- Composio carousel diagnostics (${label}) ---`);
  const igAccts = await get("/connected_accounts?toolkit_slugs=instagram&limit=50");
  const igList = igAccts.json?.items || igAccts.json?.data || [];
  console.log(`instagram connected accounts: HTTP ${igAccts.status}, ${Array.isArray(igList) ? igList.length : "?"} found`);
  for (const a of (Array.isArray(igList) ? igList : [])) {
    console.log(`  id=${a.id}  status=${a.status}  name=${a.name || a.nickname || "-"}`);
  }
  console.log(`  (this script was passed COMPOSIO_IG_ACCOUNT_ID="${ACCOUNT}" — it must match an id above)`);
  const ti = await instagramTools({ log: (m) => console.log(m) });
  console.log(`instagram tools visible to this key: ${ti.length} found`);
  for (const WANT of ["INSTAGRAM_POST_IG_USER_MEDIA", "INSTAGRAM_CREATE_CAROUSEL_CONTAINER", "INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH"]) {
    console.log(`  ${WANT}: ${ti.includes(WANT) ? "present" : "MISSING — Composio has likely renamed or deprecated it"}`);
  }
  console.log(`--- end diagnostics ---\n`);
}

// Identical resolution strategy to instagram-upload-composio.mjs: read the
// owning entity off the LIST endpoint, never guess "default". See that
// file's entityId() for the full history of why.
let _entityId;
async function entityId() {
  if (_entityId !== undefined) return _entityId;
  _entityId = process.env.COMPOSIO_ENTITY_ID || null;
  if (!_entityId) {
    try {
      const r = await fetch(`${BASE}/connected_accounts?limit=100`, { headers: { "x-api-key": KEY } });
      const j = await r.json();
      const items = j?.items || j?.data || [];
      const igOnly = items.filter((a) => (a.toolkit?.slug || "").toLowerCase() === "instagram");
      let mine = items.find((a) => a.id === ACCOUNT);
      if (!mine) {
        const active = igOnly.filter((a) => String(a.status).toUpperCase() === "ACTIVE");
        mine = active.find((a) => a.id === ACCOUNT) || null;
        if (!mine) {
          console.log(`  Account:  COMPOSIO_IG_ACCOUNT_ID "${ACCOUNT}" matched no connection.`);
          console.log(`            This channel's connection must be named explicitly — unlike the Reels`);
          console.log(`            script, this one does NOT fall back to "the active Instagram connection",`);
          console.log(`            because with two Instagram channels connected that fallback would be a`);
          console.log(`            coin flip between accounts. Fix COMPOSIO_IG_ACCOUNT_ID instead.`);
        }
      }
      if (mine) {
        RESOLVED_ACCOUNT = mine.id;
        _entityId = mine.user_id || mine.entity_id || mine.entityId || mine.user?.id || mine.entity?.id || null;
        if (!_entityId) console.log(`  Entity:   connection found but carries no user id. Fields: ${Object.keys(mine).join(", ")}`);
      }
    } catch (e) { console.log(`  Entity:   lookup failed (${e.message})`); }
  }
  if (_entityId) {
    console.log(`  Entity:   ${_entityId}`);
  } else {
    console.log(`  Entity:   unresolved. Falling back to "default".`);
    _entityId = "default";
  }
  return _entityId;
}

async function execTool(slug, argumentsObj) {
  const uid = await entityId();
  const res = await fetch(`${API}/${slug}`, {
    method: "POST",
    headers: { "x-api-key": KEY, "Content-Type": "application/json" },
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
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  if (json.successful === false || json.error) {
    throw new Error(`${slug}: ${json.error || JSON.stringify(json).slice(0, 300)}`);
  }
  return json.data ?? json;
}

async function instagramTools({ log = () => {} } = {}) {
  const isIg = (t) => (t.toolkit?.slug || "").toLowerCase() === "instagram";
  const get = async (p) => {
    try {
      const r = await fetch(`${BASE}${p}`, { headers: { "x-api-key": KEY } });
      return { status: r.status, json: await r.json() };
    } catch (e) { return { error: e.message }; }
  };
  for (const q of ["/tools?toolkit_slug=instagram&limit=200", "/toolkits/instagram/tools?limit=200"]) {
    const r = await get(q);
    const items = r.json?.items || r.json?.data || [];
    if (!Array.isArray(items) || !items.length) { log(`  ${q} -> HTTP ${r.status}, 0 items`); continue; }
    if (!items.every(isIg)) { log(`  ${q} -> not instagram-only (ignored)`); continue; }
    log(`  ${q} -> HTTP ${r.status}, ${items.length} instagram tool(s) [trusted]`);
    return items.map((t) => t.slug).filter(Boolean);
  }
  return [];
}

async function getStatus(creationId) {
  const st = await execTool("INSTAGRAM_GET_POST_STATUS", { creation_id: String(creationId), fields: "status_code,status" });
  return String(st?.status_code || st?.data?.status_code || st?.status || st?.data?.status || "").toUpperCase();
}

try {
  console.log(`Publishing carousel to Instagram via Composio`);
  console.log(`  Account:  ${ACCOUNT}`);
  console.log(`  IG user:  ${IG_USER_ID}`);
  console.log(`  Slides:   ${images.length}`);

  const available = await instagramTools({ log: (m) => console.log(m) });
  for (const need of ["INSTAGRAM_POST_IG_USER_MEDIA", "INSTAGRAM_CREATE_CAROUSEL_CONTAINER", "INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH"]) {
    if (!available.includes(need)) {
      throw new Error(`This key cannot see ${need} any more. Available instagram tools: ${available.join(", ") || "(none)"}`);
    }
  }

  // Step 1: one child container per slide, in order. Order of the children
  // array (not the order these calls happen to finish in, which is why this
  // is a sequential for-loop rather than Promise.all) is what determines
  // slide order in the published carousel.
  const childIds = [];
  for (const [i, url] of images.entries()) {
    const child = await execTool("INSTAGRAM_POST_IG_USER_MEDIA", {
      ig_user_id: IG_USER_ID,
      image_url: url,
      is_carousel_item: true,
    });
    const id = child?.id || child?.data?.id || child?.response_data?.id;
    if (!id) throw new Error(`Slide ${i + 1}: no container id in response: ${JSON.stringify(child).slice(0, 300)}`);
    console.log(`  Child ${i + 1}/${images.length}: ${id}`);
    childIds.push(String(id));
  }

  // Step 2: every child must reach FINISHED before the parent container can
  // be created — the schema is explicit that pending or failed items block
  // carousel creation. Images are typically instant; this is a short,
  // bounded wait rather than the Reels script's multi-minute one.
  for (const [i, id] of childIds.entries()) {
    const deadline = Date.now() + CHILD_POLL_MAX_MS;
    let code = "";
    while (Date.now() < deadline) {
      code = await getStatus(id);
      if (code.includes("FINISHED")) break;
      if (code.includes("ERROR") || code.includes("EXPIRED")) {
        throw new Error(`Slide ${i + 1} (container ${id}) failed processing: ${code}`);
      }
      await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
    }
    if (!code.includes("FINISHED")) {
      throw new Error(`Slide ${i + 1} (container ${id}) never reached FINISHED within ${CHILD_POLL_MAX_MS / 1000}s (last: ${code || "unknown"}).`);
    }
  }
  console.log(`  All ${childIds.length} slide(s) FINISHED.`);

  // Step 3: the parent carousel container.
  const parent = await execTool("INSTAGRAM_CREATE_CAROUSEL_CONTAINER", {
    ig_user_id: IG_USER_ID,
    children: childIds,
    caption,
  });
  const parentId = parent?.id || parent?.data?.id || parent?.response_data?.id;
  if (!parentId) throw new Error(`No parent container id in response: ${JSON.stringify(parent).slice(0, 300)}`);
  console.log(`  Parent container: ${parentId}`);

  // Step 4: publish the PARENT, never a child.
  const published = await execTool("INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH", {
    ig_user_id: IG_USER_ID,
    creation_id: String(parentId),
    max_wait_seconds: PARENT_MAX_WAIT_S,
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
  console.error(`Carousel publish failed: ${m}`);
  if (/image_url|fetch|ingest/i.test(m)) {
    console.error("Meta could not fetch an image. Every URL must be public https, direct, no redirects, no auth, JPEG, under 8MB.");
  }
  await diagnose("after failure").catch(() => {});
  process.exit(2);
}

// FOLLOW-UP, NOT DONE YET: this file and instagram-upload-composio.mjs now
// duplicate entityId()/execTool()/instagramTools() almost verbatim. That was
// a deliberate short-term tradeoff to ship the carousel path without touching
// a script that publishes real content every day — but the next time either
// file needs a real change, factor the shared plumbing into
// scripts/lib/composio-instagram.mjs first, so a fix in one stops being able
// to silently not apply to the other.
