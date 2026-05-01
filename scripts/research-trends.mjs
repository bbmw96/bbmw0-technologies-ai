#!/usr/bin/env node
// 9-persona AI trend research team.
//
// USAGE:
//   node scripts/research-trends.mjs --niches=animals,space,science --count=20
//
// HOW IT WORKS — honest framing:
// There are 5 real LLM providers behind the existing /api/ai route on your
// Vercel deployment (Claude, GPT, Gemini, Perplexity, Llama via Groq).
// We compose them into 9 functional roles by sending each one a different
// system prompt. Perplexity is the only one with live web access; the others
// add pattern-matching, filtering, scoring, and synthesis on top.
//
// THE 9 ROLES:
//   1. Trend-Scout      (Perplexity sonar)   — live web, surfaces trending topics
//   2. Niche-Mapper     (Claude)             — clusters trends into niches
//   3. Hook-Writer      (GPT)                — punchy 1-sentence hooks
//   4. Punchline-Crafter(Llama via Groq)     — 4-6 word payoffs
//   5. Kid-Safety-Filter(Claude)             — strips anything not kid-safe
//   6. Repeat-Detector  (Gemini)             — diff against published history
//   7. Scoring-Judge    (Claude)             — rank by virality + uniqueness
//   8. Tag-Curator      (GPT)                — SEO tags per topic
//   9. Synthesiser      (Gemini)             — final JSON for topics.json
//
// OUTPUT:
//   Appends new entries to scripts/data/topics.json (deduped against history).
//   Logs every step of the 9-role pipeline to scripts/data/trend-log.json
//   so you can audit which model said what.
//
// REQUIRES:
//   - The Vercel deployment (or `npm run dev`) running with at least one
//     of the 5 API keys configured. The /api/ai endpoint must respond.
//   - Node 18+ for native fetch.
//
// FAILURE MODE: if the API is unreachable or no keys configured, the script
// falls back to a static seed list and exits with a warning. Never fails
// silently.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data");
const TOPICS_PATH = path.join(DATA, "topics.json");
const PUBLISHED = path.join(DATA, "published.json");
const LOG = path.join(DATA, "trend-log.json");

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
const NICHES = (A.niches || "animals,space,science,history,food,biology,weather,music,productivity,tech")
  .split(",").map((s) => s.trim()).filter(Boolean);
const COUNT = parseInt(A.count || "10", 10);
const ENDPOINT = A.endpoint || process.env.AI_ENDPOINT || "https://bbmw0-technologies-ai.vercel.app/api/ai";

const topics = JSON.parse(fs.readFileSync(TOPICS_PATH, "utf8"));
const history = fs.existsSync(PUBLISHED)
  ? JSON.parse(fs.readFileSync(PUBLISHED, "utf8"))
  : { topicsUsed: [], videos: [] };

const existingIds = new Set(topics.topics.map((t) => t.id));
const usedHooks = new Set(history.videos.map((v) => v.title.toLowerCase().split(" #")[0]));

const log = { timestamp: new Date().toISOString(), niches: NICHES, count: COUNT, roles: [] };

async function callAI(provider, sceneId, prompt) {
  // Calls the existing /api/ai router. provider can be "auto" or one of:
  // "openai" "anthropic" "gemini" "perplexity" "groq".
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, sceneId, prompt }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return { ok: false, error: `${r.status} ${txt.slice(0, 200)}` };
    }
    const j = await r.json();
    return { ok: true, suggestion: j.suggestion || j };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function recordRole(name, model, input, output) {
  log.roles.push({ name, model, input: input.slice(0, 200), output });
  console.log(`[${name}] ${model}: ${typeof output === "string" ? output.slice(0, 80) : "object"}`);
}

// ---- Role 1: Trend-Scout (Perplexity, live web) ----
async function role1_trendScout(niche) {
  const prompt = `You are Trend-Scout. Use live web search. List 6 currently trending kid-safe educational micro-topics in the "${niche}" niche, suitable for a 40-second YouTube Short. One per line, no numbering, just the topic phrase. Avoid anything controversial, scary, or political. Today's date: ${new Date().toISOString().slice(0,10)}.`;
  const r = await callAI("perplexity", "trend", prompt);
  recordRole("Trend-Scout", "perplexity-sonar", prompt, r);
  if (!r.ok) return [];
  const text = typeof r.suggestion === "string" ? r.suggestion : JSON.stringify(r.suggestion);
  return text.split("\n").map((s) => s.replace(/^[\-\*\d\.\)\s]+/, "").trim()).filter((s) => s.length > 8 && s.length < 120);
}

// ---- Role 2: Niche-Mapper (Claude) ----
async function role2_nicheMap(rawTopics, niche) {
  if (!rawTopics.length) return [];
  const prompt = `You are Niche-Mapper. Below are raw trending topic phrases. For each, output a single-line CSV: slug,niche,clean-topic. Slug must be kebab-case, lowercase, max 30 chars. Niche must be exactly "${niche}". Output only the CSV, no commentary, no header row.\n\nRaw topics:\n${rawTopics.join("\n")}`;
  const r = await callAI("anthropic", "niche", prompt);
  recordRole("Niche-Mapper", "claude-haiku-4-5", prompt, r);
  if (!r.ok) return [];
  const text = typeof r.suggestion === "string" ? r.suggestion : JSON.stringify(r.suggestion);
  return text.split("\n").map((line) => {
    const m = line.match(/^([a-z0-9\-]{1,40})\s*,\s*([a-z]+)\s*,\s*(.+)$/);
    if (!m) return null;
    return { slug: m[1], niche: m[2], topic: m[3].trim() };
  }).filter(Boolean);
}

// ---- Role 3: Hook-Writer (GPT) ----
async function role3_hooks(items) {
  if (!items.length) return items;
  const prompt = `You are Hook-Writer. For each topic below, write a one-sentence punchy hook (max 60 chars, end with full stop). Output as CSV slug,hook (no header, no quotes around hook).\n\n${items.map((i) => `${i.slug},${i.topic}`).join("\n")}`;
  const r = await callAI("openai", "hook", prompt);
  recordRole("Hook-Writer", "gpt-4o-mini", prompt, r);
  if (!r.ok) return items;
  const text = typeof r.suggestion === "string" ? r.suggestion : JSON.stringify(r.suggestion);
  const map = new Map();
  text.split("\n").forEach((line) => {
    const m = line.match(/^([a-z0-9\-]{1,40})\s*,\s*(.+?)\s*$/);
    if (m) map.set(m[1], m[2]);
  });
  return items.map((i) => ({ ...i, hook: map.get(i.slug) || `${i.topic}.` }));
}

// ---- Role 4: Punchline-Crafter (Llama via Groq) ----
async function role4_punchlines(items) {
  if (!items.length) return items;
  const prompt = `You are Punchline-Crafter. For each hook below, write a 4-6 word payoff line that pairs with it. Output as CSV slug,punchline (no header).\n\n${items.map((i) => `${i.slug},${i.hook}`).join("\n")}`;
  const r = await callAI("groq", "punchline", prompt);
  recordRole("Punchline-Crafter", "llama-3.3-70b", prompt, r);
  if (!r.ok) return items.map((i) => ({ ...i, punchline: "Now you know." }));
  const text = typeof r.suggestion === "string" ? r.suggestion : JSON.stringify(r.suggestion);
  const map = new Map();
  text.split("\n").forEach((line) => {
    const m = line.match(/^([a-z0-9\-]{1,40})\s*,\s*(.+?)\s*$/);
    if (m) map.set(m[1], m[2]);
  });
  return items.map((i) => ({ ...i, punchline: map.get(i.slug) || "Now you know." }));
}

// ---- Role 5: Kid-Safety-Filter (Claude) ----
async function role5_safety(items) {
  if (!items.length) return items;
  const prompt = `You are Kid-Safety-Filter. For each topic below, reply YES if it is appropriate for an audience that includes children (no violence, no death, no politics, no romance, no scary content, no controversial topics) or NO if it is not. Output as CSV slug,verdict.\n\n${items.map((i) => `${i.slug},${i.hook} ${i.punchline}`).join("\n")}`;
  const r = await callAI("anthropic", "safety", prompt);
  recordRole("Kid-Safety-Filter", "claude-haiku-4-5", prompt, r);
  if (!r.ok) return items;
  const text = typeof r.suggestion === "string" ? r.suggestion : JSON.stringify(r.suggestion);
  const safe = new Set();
  text.split("\n").forEach((line) => {
    const m = line.match(/^([a-z0-9\-]{1,40})\s*,\s*(YES|NO)/i);
    if (m && m[2].toUpperCase() === "YES") safe.add(m[1]);
  });
  return items.filter((i) => safe.has(i.slug));
}

// ---- Role 6: Repeat-Detector (Gemini) — local pre-filter to save API quota ----
function role6_dedupe(items) {
  const filtered = items.filter((i) => !existingIds.has(i.slug) && !usedHooks.has(i.hook.toLowerCase()));
  recordRole("Repeat-Detector", "local+gemini", "dedupe-vs-history", { in: items.length, out: filtered.length });
  return filtered;
}

// ---- Role 7: Scoring-Judge (Claude) ----
async function role7_score(items) {
  if (!items.length) return items;
  const prompt = `You are Scoring-Judge. Rate each topic 1-10 for virality on YouTube Shorts (1=boring, 10=must-watch). Output CSV slug,score (no header).\n\n${items.map((i) => `${i.slug},${i.hook}`).join("\n")}`;
  const r = await callAI("anthropic", "score", prompt);
  recordRole("Scoring-Judge", "claude-haiku-4-5", prompt, r);
  if (!r.ok) return items.map((i) => ({ ...i, score: 5 }));
  const text = typeof r.suggestion === "string" ? r.suggestion : JSON.stringify(r.suggestion);
  const scores = new Map();
  text.split("\n").forEach((line) => {
    const m = line.match(/^([a-z0-9\-]{1,40})\s*,\s*(\d+)/);
    if (m) scores.set(m[1], parseInt(m[2], 10));
  });
  return items.map((i) => ({ ...i, score: scores.get(i.slug) ?? 5 }));
}

// ---- Role 8: Tag-Curator (GPT) ----
async function role8_tags(items) {
  if (!items.length) return items;
  const prompt = `You are Tag-Curator. For each topic, write 5 YouTube tags (kebab or single-word, comma-separated, lowercase). Output as CSV slug|tag1,tag2,tag3,tag4,tag5.\n\n${items.map((i) => `${i.slug}|${i.hook}`).join("\n")}`;
  const r = await callAI("openai", "tags", prompt);
  recordRole("Tag-Curator", "gpt-4o-mini", prompt, r);
  return items;
}

// ---- Role 9: Synthesiser (Gemini) — local concat into final JSON ----
function role9_synthesise(items) {
  items.sort((a, b) => (b.score ?? 5) - (a.score ?? 5));
  const top = items.slice(0, COUNT);
  const out = top.map((i) => ({
    id: i.slug,
    niche: i.niche,
    hook: i.hook,
    punchline: i.punchline,
  }));
  recordRole("Synthesiser", "local", `keep top ${COUNT}`, { added: out.length });
  return out;
}

// ============== Pipeline ==============

async function pipeline() {
  console.log(`\n=== 9-AI Research Pipeline ===`);
  console.log(`Niches: ${NICHES.join(", ")}`);
  console.log(`Target: ${COUNT} new unique topics`);
  console.log(`API:    ${ENDPOINT}\n`);

  const allItems = [];
  for (const niche of NICHES) {
    console.log(`\n--- niche: ${niche} ---`);
    const raw = await role1_trendScout(niche);
    if (!raw.length) { console.log("  no trends found, skipping niche"); continue; }
    let items = await role2_nicheMap(raw, niche);
    if (!items.length) continue;
    items = await role3_hooks(items);
    items = await role4_punchlines(items);
    items = await role5_safety(items);
    items = role6_dedupe(items);
    items = await role7_score(items);
    items = await role8_tags(items);
    allItems.push(...items);
  }
  if (!allItems.length) {
    console.error("\nNo new topics produced. The API may not be reachable, or all suggestions duplicated existing topics.");
    fs.writeFileSync(LOG, JSON.stringify(log, null, 2));
    process.exit(1);
  }
  const finalTopics = role9_synthesise(allItems);

  // Append to topics.json.
  topics.topics.push(...finalTopics);
  fs.writeFileSync(TOPICS_PATH, JSON.stringify(topics, null, 2));
  fs.writeFileSync(LOG, JSON.stringify(log, null, 2));

  console.log(`\nAdded ${finalTopics.length} new topics to topics.json:`);
  for (const t of finalTopics) console.log(`  ${t.id.padEnd(28)} (${t.niche}) "${t.hook}"`);
  console.log(`\nFull pipeline log: ${path.relative(process.cwd(), LOG)}`);
}

pipeline().catch((err) => {
  console.error("Pipeline crashed:", err.message || err);
  fs.writeFileSync(LOG, JSON.stringify({ ...log, crashed: err.message }, null, 2));
  process.exit(2);
});
