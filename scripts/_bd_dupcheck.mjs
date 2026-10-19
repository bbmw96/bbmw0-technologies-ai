#!/usr/bin/env node
// HARD GATE for @blankdiscussions. Run BEFORE building, rendering or publishing anything.
//
// WHY THIS EXISTS
// On 19 Oct 2026 eight "multilingual" zina reels were built and published that
// repeated the same verses and hadith already live as the 18 Oct reels AND as
// the 17/18 Oct carousels. The build never audited what was already posted. The
// owner had to delete them by hand. Nothing in the pipeline refused, so this does.
//
// RULE: a verse or hadith that has EVER been published in ANY format (carousel,
// reel, either channel) is blocked. Deleting the repeat does not make it fresh.
// Only an explicit owner instruction for that specific ref unlocks it, and it
// must be passed as --owner-approved="<ref>: <what the owner said>".
//
// USAGE
//   node scripts/_bd_dupcheck.mjs quran:24:2 quran:25:68-70 bukhari:6810
//   node scripts/_bd_dupcheck.mjs --slug=quran-24-4-5 --slug=bukhari-6810
//   node scripts/_bd_dupcheck.mjs --list            # print the whole ledger
// EXIT: 0 every ref is new, 3 at least one ref already published (do NOT build).
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const COLL = { bukhari: "bukhari", muslim: "muslim", tirmidhi: "tirmidhi", abudawud: "abudawud", nasai: "nasai", ibnmajah: "ibnmajah", malik: "malik", nawawi: "nawawi", "hadith-qudsi": "hadith-qudsi" };

function expand(k) {
  // quran:S:A or quran:S:A-B  -> set of "q:S:A"; hadith:coll:N -> "h:coll:N"
  const q = /^quran:(\d+):(\d+)(?:-(\d+))?$/.exec(k);
  if (q) { const s = +q[1], a = +q[2], b = q[3] ? +q[3] : a; const o = []; for (let i = a; i <= b; i++) o.push(`q:${s}:${i}`); return o; }
  const h = /^([a-z-]+):(\d+)$/.exec(k);
  if (h && COLL[h[1]]) return [`h:${h[1]}:${h[2]}`];
  return null;
}
function slugToRef(slug) {
  const s = slug.replace(/^reel-/, "").replace(/-reel$/, "");
  let m = /^quran-(\d+)-(\d+)(?:-(\d+))?$/.exec(s);
  if (m) return `quran:${m[1]}:${m[2]}${m[3] ? "-" + m[3] : ""}`;
  m = /^(bukhari|muslim|tirmidhi|abudawud|nasai|ibnmajah|malik|nawawi|hadith-qudsi)-(\d+)$/.exec(s);
  if (m) return `${m[1]}:${m[2]}`;
  return null;
}
function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (f.name === "node_modules" || f.name === ".git") continue; walk(p, out); }
    else if (/blankdiscussions/.test(p) && /\.meta\.json$/.test(f.name)) out.push(p);
  }
}
const ledger = new Map(); // verse key -> [where]
function add(ref, where) { const ks = expand(ref); if (!ks) return; for (const k of ks) { if (!ledger.has(k)) ledger.set(k, []); ledger.get(k).push(where); } }

const metas = []; walk(path.join(ROOT, "daily"), metas);
for (const f of metas) {
  let j; try { j = JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, "")); } catch { continue; }
  const pub = j.published && (j.published.mediaId || j.published.permalink);
  if (!pub) continue;
  const slug = j.slug || path.basename(f).replace(".meta.json", "");
  const r = slugToRef(slug);
  if (r) add(r, `${slug} (${(j.published.publishedAt || "").slice(0, 10)}, ${path.relative(ROOT, f)})`);
}
// Multi-ref reels and anything whose slug is not a ref: scripts/data/bd-extra-refs.json
const extraF = path.join(ROOT, "scripts/data/bd-extra-refs.json");
if (fs.existsSync(extraF)) { const e = JSON.parse(fs.readFileSync(extraF, "utf8")); for (const [slug, refs] of Object.entries(e.posts || {})) for (const r of refs) add(r, `${slug} (extra-refs)`); }

const argv = process.argv.slice(2);
if (argv.includes("--list")) { for (const [k, v] of [...ledger].sort()) console.log(k, "<-", v.join(" | ")); console.log(`\n${ledger.size} verses/hadith already published`); process.exit(0); }

const approved = argv.filter(a => a.startsWith("--owner-approved=")).map(a => a.slice(17));
const cand = [];
for (const a of argv) {
  if (a.startsWith("--slug=")) { const r = slugToRef(a.slice(7)); if (!r) { console.error(`Cannot read a ref from slug ${a.slice(7)}; pass quran:S:A or coll:N instead.`); process.exit(1); } cand.push(r); }
  else if (!a.startsWith("--")) cand.push(a);
}
if (!cand.length) { console.error("Give at least one ref, e.g. quran:24:2 or bukhari:6810 (or --list)."); process.exit(1); }
let bad = 0;
for (const c of cand) {
  const ks = expand(c); if (!ks) { console.error(`BAD REF ${c}`); bad++; continue; }
  const hits = ks.filter(k => ledger.has(k));
  const ok = approved.some(x => x.startsWith(c + ":"));
  if (hits.length && !ok) { bad++; console.log(`BLOCKED  ${c}: already published`); for (const k of hits) console.log(`           ${k}  <- ${[...new Set(ledger.get(k))].join(" | ")}`); }
  else if (hits.length) console.log(`OVERRIDE ${c}: owner-approved repeat`);
  else console.log(`NEW      ${c}`);
}
if (bad) { console.log(`\n${bad} ref(s) blocked. Do not build, render or publish them. Pick unposted refs.`); process.exit(3); }
console.log("\nAll refs are new. Still confirm against the live Instagram inventory before publishing (see CLAUDE.md).");
