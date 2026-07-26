#!/usr/bin/env node
// BBMW0 Compliance Gate
//
// The only thing standing between the generator and a public YouTube upload.
// Runs three independent layers over every candidate video and returns a
// verdict per video plus a machine-readable audit trail.
//
//   Layer 1  Deterministic rules   objective, offline, always runs
//   Layer 2  Repetition analysis   defends the mass-produced content policy
//   Layer 3  AI review panel       judgement calls, majority vote
//
// USAGE
//   node scripts/compliance-gate.mjs --date=2026-07-26
//   node scripts/compliance-gate.mjs --date=2026-07-26 --strict
//   node scripts/compliance-gate.mjs --date=2026-07-26 --json
//
// EXIT CODES
//   0  every video passed
//   1  at least one video blocked
//   2  gate could not run (missing files, bad config)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runRules, SEVERITY } from "./compliance/rules.mjs";
import { checkRepetition } from "./compliance/similarity.mjs";
import { runPanel } from "./compliance/ai-panel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "scripts/data");

function readJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
  } catch (err) {
    if (fallback !== undefined) return fallback;
    console.error(`FATAL: cannot read ${p}: ${err.message}`);
    process.exit(2);
  }
}

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
const DATE = A.date || new Date().toISOString().slice(0, 10);
const JSON_OUT = !!A.json;

const policy = readJSON(path.join(DATA, "compliance-policy.json"));
if (A.strict) policy.enforcement.strict_mode = true;
const audioLicences = readJSON(path.join(DATA, "audio-licences.json"), { tracks: [] });
const published = readJSON(path.join(DATA, "published.json"), { videos: [] });
const allHistory = published.videos || [];

const dir = path.join(ROOT, "daily", DATE);
if (!fs.existsSync(dir)) {
  console.error(`No daily/${DATE}/ directory. Nothing to review.`);
  process.exit(2);
}

const metaFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".meta.json"));
if (!metaFiles.length) {
  console.error(`No *.meta.json in daily/${DATE}/.`);
  process.exit(2);
}

// Load the whole batch first: repetition is a property of the set, not the item.
const batch = metaFiles.map((f) => {
  const slug = f.replace(/\.meta\.json$/, "");
  const meta = readJSON(path.join(dir, f));
  const props = readJSON(path.join(dir, `${slug}.props.json`), { beats: [] });
  return { slug, meta, props, ...meta, id: slug };
});

// The generator records each video in published.json at generation time, so the
// candidates are already in history by the time the gate runs. Comparing a video
// against itself produced phantom "combination already used" blocks. Exclude the
// current batch from history; same-batch collisions are checked separately.
const batchIds = new Set(batch.map((b) => b.slug));
const history = allHistory.filter((v) => v && !batchIds.has(v.id));

const results = [];

for (const item of batch) {
  const { slug, meta, props } = item;
  const findings = [];

  // Layer 1
  findings.push(...runRules(meta, props, policy, audioLicences));

  // Layer 2
  const rep = checkRepetition(
    { id: slug, title: meta.title, description: meta.description,
      themeId: meta.themeId, fontFamilyId: meta.fontFamilyId,
      audioUrl: meta.audioUrl, niche: meta.niche },
    history, batch, policy
  );
  findings.push(...rep.findings);

  // Layer 3
  const panel = await runPanel(meta, props, policy);
  findings.push(...panel.findings);

  // strict_mode promotes every warning to a block
  const effective = findings.map((f) =>
    policy.enforcement.strict_mode && f.severity === SEVERITY.WARN
      ? { ...f, severity: SEVERITY.BLOCK, promoted: true }
      : f
  );

  const blocks = effective.filter((f) => f.severity === SEVERITY.BLOCK);
  const warns = effective.filter((f) => f.severity === SEVERITY.WARN);

  results.push({
    slug,
    verdict: blocks.length ? "BLOCK" : warns.length ? "PASS_WITH_WARNINGS" : "PASS",
    title: meta.title,
    niche: meta.niche,
    blocks,
    warnings: warns,
    info: effective.filter((f) => f.severity === SEVERITY.INFO),
    similarity: rep.scores,
    aiPanel: {
      available: panel.available,
      passRatio: panel.passRatio ?? null,
      skipped: panel.skipped ?? null,
      reviews: (panel.reviews || []).map((r) => ({
        reviewer: r.reviewer, provider: r.provider,
        verdict: r.verdict, ok: r.ok, reason: r.reason, error: r.error,
      })),
    },
  });
}

// ---------------------------------------------------------------- audit trail
const auditPath = path.join(DATA, "compliance-log.json");
const audit = readJSON(auditPath, { _comment: "Append-only audit trail of every compliance decision. Retain this: it is the evidence trail if a policy decision is ever appealed.", runs: [] });
audit.runs.push({
  timestamp: new Date().toISOString(),
  date: DATE,
  policyVersion: policy.version,
  strictMode: policy.enforcement.strict_mode,
  reviewed: results.length,
  passed: results.filter((r) => r.verdict !== "BLOCK").length,
  blocked: results.filter((r) => r.verdict === "BLOCK").length,
  results: results.map((r) => ({
    slug: r.slug, verdict: r.verdict,
    blocks: r.blocks.map((b) => b.rule),
    warnings: r.warnings.map((w) => w.rule),
    similarity: r.similarity,
    aiPassRatio: r.aiPanel.passRatio,
  })),
});
if (audit.runs.length > 500) audit.runs = audit.runs.slice(-500);
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + "\n");

// Machine-readable verdict consumed by render-batch.mjs
const verdictPath = path.join(dir, "compliance-verdict.json");
fs.writeFileSync(verdictPath, JSON.stringify({
  date: DATE,
  generatedAt: new Date().toISOString(),
  policyVersion: policy.version,
  strictMode: policy.enforcement.strict_mode,
  allowed: results.filter((r) => r.verdict !== "BLOCK").map((r) => r.slug),
  blocked: results.filter((r) => r.verdict === "BLOCK").map((r) => r.slug),
  results,
}, null, 2) + "\n");

// ---------------------------------------------------------------- report
if (JSON_OUT) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const line = "=".repeat(64);
  console.log(line);
  console.log(` BBMW0 Compliance Gate  |  ${DATE}  |  policy v${policy.version}`);
  if (policy.enforcement.strict_mode) console.log(" STRICT MODE: warnings are treated as blocks.");
  console.log(line);

  for (const r of results) {
    const badge = r.verdict === "BLOCK" ? "BLOCKED"
      : r.verdict === "PASS_WITH_WARNINGS" ? "PASS (warnings)" : "PASS";
    console.log(`\n[${badge}] ${r.slug}`);
    console.log(`  ${r.title}`);
    console.log(`  similarity: title ${(r.similarity.worstTitleSimilarity * 100).toFixed(0)}%` +
      (r.similarity.worstTitleAgainst ? ` vs ${r.similarity.worstTitleAgainst}` : "") +
      `, description ${(r.similarity.worstDescriptionSimilarity * 100).toFixed(0)}%`);
    console.log(`  ai panel:   ${r.aiPanel.available ? `${(r.aiPanel.passRatio * 100).toFixed(0)}% passed` : `not run (${r.aiPanel.skipped || "unavailable"})`}`);
    for (const b of r.blocks)   console.log(`    BLOCK  ${b.rule}: ${b.message}`);
    for (const w of r.warnings) console.log(`    warn   ${w.rule}: ${w.message}`);
    for (const i of r.info)     console.log(`    note   ${i.rule}: ${i.message}`);
  }

  const blocked = results.filter((r) => r.verdict === "BLOCK");
  console.log(`\n${line}`);
  console.log(` Reviewed ${results.length}  |  Cleared ${results.length - blocked.length}  |  Blocked ${blocked.length}`);
  if (blocked.length) console.log(` Blocked: ${blocked.map((r) => r.slug).join(", ")}`);
  console.log(` Verdict written to daily/${DATE}/compliance-verdict.json`);
  console.log(` Audit trail: scripts/data/compliance-log.json`);
  console.log(line);
}

process.exit(results.some((r) => r.verdict === "BLOCK") ? 1 : 0);
