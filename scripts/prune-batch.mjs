#!/usr/bin/env node
// Remove items from a day's batch, leaving only the ones named.
//
//   node scripts/prune-batch.mjs --date=2026-08-11 --platform=instagram --keep=konami-code
//
// WHY
// render-batch renders and uploads every props file in daily/<date>/, so a
// manual dispatch cannot publish just one video — asking for --count=1 limits
// what is GENERATED, not what is uploaded from a folder that already has
// earlier attempts sitting in it.
//
// On 2026-08-11 that folder held konami-code plus four videos from the old
// filler generator, all unpublished because Instagram had never worked. Firing
// the dispatch as-is would have made the account's first automated post a
// batch of five, four of them the exact templated content this pipeline was
// changed to stop making.
//
// Removes props and meta only. published.json is untouched, so the topics stay
// marked used and nothing is silently re-queued.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const A = {};
for (const a of process.argv.slice(2)) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (m) A[m[1]] = m[2] === undefined ? true : m[2];
}

const DATE = A.date || new Date().toISOString().slice(0, 10);
const PLATFORM = A.platform;
const KEEP = new Set(String(A.keep || "").split(",").map((s) => s.trim()).filter(Boolean));
const dir = path.join(ROOT, "daily", DATE);

if (!fs.existsSync(dir)) { console.log(`No daily/${DATE}/ — nothing to prune.`); process.exit(0); }
if (!KEEP.size) { console.error("Refusing to run without --keep=<slug>[,<slug>]. That would empty the batch."); process.exit(1); }

const removed = [], kept = [];
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".meta.json"))) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const slug = meta.slug || f.replace(/\.meta\.json$/, "");
  if (PLATFORM && meta.platform !== PLATFORM) continue;   // leave other platforms alone
  if (KEEP.has(slug)) { kept.push(slug); continue; }
  for (const ext of [".props.json", ".meta.json"]) {
    const p = path.join(dir, `${slug}${ext}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  removed.push(slug);
}

console.log(`daily/${DATE}${PLATFORM ? ` (platform=${PLATFORM})` : ""}`);
console.log(`  kept:    ${kept.join(", ") || "(none)"}`);
console.log(`  removed: ${removed.join(", ") || "(none)"}`);
