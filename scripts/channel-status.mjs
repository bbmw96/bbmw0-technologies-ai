#!/usr/bin/env node
// Report which channels can actually publish right now.
//
// "Enabled" in channels.json means the pipeline WILL target it. Whether it can
// publish depends on credentials, which live in env vars in CI and in local
// files on a workstation. Those are two different things, and conflating them
// is how you end up with a green run that published nothing.
//
// USAGE: npm run channels
// EXIT: 0 if at least one channel is publish-ready, 1 if none are.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));

const channels = readJSON(path.join(ROOT, "scripts/data/channels.json")).channels || [];

// The pipeline runs in CI, so GitHub secrets are the source of truth, not the
// local machine. An earlier version only checked locally and reported the live
// channel as "waiting" purely because we had (correctly) deleted the local
// credentials file after rotation. That is exactly the kind of confidently
// wrong status that wastes an afternoon.
let ghSecrets = null;
function githubSecrets() {
  if (ghSecrets !== null) return ghSecrets;
  for (const bin of ["gh", "gh.exe"]) {
    const r = spawnSync(bin, ["secret", "list", "--repo", process.env.GH_REPO || "bbmw96/bbmw0-technologies-ai"],
      { encoding: "utf8", stdio: "pipe" });
    if (!r.error && r.status === 0) {
      ghSecrets = new Set((r.stdout || "").split("\n").map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
      return ghSecrets;
    }
  }
  ghSecrets = false; // gh unavailable, fall back to local-only reporting
  return ghSecrets;
}

/** What must be present for this channel to publish. Never reads any value. */
export function checkChannel(ch) {
  const missing = [];
  const secrets = githubSecrets();
  const have = (name) =>
    (secrets && secrets.has(name)) || !!process.env[name];

  if (ch.platform === "youtube") {
    const p = ch.secretPrefix;
    const localCreds = ch.credentialsFile && fs.existsSync(path.join(ROOT, ch.credentialsFile));
    if (!have(`${p}_REFRESH_TOKEN`) && !localCreds) missing.push(`${p}_REFRESH_TOKEN`);
    if (!have(`${p}_CLIENT_ID`) && !localCreds) missing.push(`${p}_CLIENT_ID`);
    if (!have(`${p}_CLIENT_SECRET`) && !localCreds) missing.push(`${p}_CLIENT_SECRET`);
  } else if (ch.platform === "instagram") {
    if (!have("IG_ACCESS_TOKEN")) missing.push("IG_ACCESS_TOKEN");
    if (!have("IG_USER_ID")) missing.push("IG_USER_ID");
  }
  return { ready: missing.length === 0, missing, source: secrets ? "GitHub secrets" : "local env only" };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("channel-status.mjs")) {
  const line = "=".repeat(72);
  console.log(line);
  console.log(" BBMW0 publishing channels");
  console.log(line);
  const src = githubSecrets() ? "GitHub secrets (authoritative, this is where CI reads from)"
                              : "local environment only (gh unavailable, so CI state is unknown)";
  console.log(` Checking: ${src}`);
  let ready = 0;
  for (const ch of channels) {
    const { ready: ok, missing } = checkChannel(ch);
    if (!ch.enabled) {
      console.log(`\n  [DISABLED] ${ch.id}  ${ch.handle}`);
      continue;
    }
    if (ok) { ready++; console.log(`\n  [READY]    ${ch.id}  ${ch.handle}  ${ch.platform}  ${ch.dailyCount}/day`); }
    else {
      console.log(`\n  [WAITING]  ${ch.id}  ${ch.handle}  ${ch.platform}`);
      missing.forEach((m) => console.log(`               missing: ${m}`));
      if (ch.platform === "youtube" && ch.secretPrefix !== "YT") {
        console.log(`               fix: npm run yt:rotate -- --channel=${ch.id}`);
      }
      if (ch.platform === "instagram") {
        console.log(`               fix: see scripts/RUNBOOK.md step 5`);
      }
    }
    console.log(`               niches: ${(ch.niches || []).join(", ")}`);
  }
  console.log(`\n${line}`);
  console.log(` ${ready} of ${channels.filter((c) => c.enabled).length} enabled channel(s) ready to publish`);
  console.log(line);
  process.exit(ready > 0 ? 0 : 1);
}
