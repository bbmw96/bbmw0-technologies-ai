#!/usr/bin/env node
// One-time helper. After running `npm run yt:auth` locally, this prints the
// values you need to paste into GitHub repo Secrets so the daily/monthly
// workflows can authenticate.
//
// USAGE:  node scripts/print-secrets.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(__dirname, "oauth-client.json");
const CREDS  = path.join(__dirname, "yt-credentials.json");

if (!fs.existsSync(CLIENT) || !fs.existsSync(CREDS)) {
  console.error("Run `npm run yt:auth` first so oauth-client.json and yt-credentials.json exist.");
  process.exit(1);
}

const oauth = JSON.parse(fs.readFileSync(CLIENT, "utf8"));
const creds = JSON.parse(fs.readFileSync(CREDS, "utf8"));

const oauthMin = oauth.installed || oauth.web;

console.log("\nGo to: https://github.com/bbmw96/bbmw0-technologies-ai/settings/secrets/actions");
console.log("Click 'New repository secret' four times. Use these names + values:\n");
console.log("=".repeat(72));
console.log("Name:  YT_OAUTH_CLIENT_JSON");
console.log("Value: " + JSON.stringify({ installed: oauthMin }));
console.log("-".repeat(72));
console.log("Name:  YT_CLIENT_ID");
console.log("Value: " + creds.client_id);
console.log("-".repeat(72));
console.log("Name:  YT_CLIENT_SECRET");
console.log("Value: " + creds.client_secret);
console.log("-".repeat(72));
console.log("Name:  YT_REFRESH_TOKEN");
console.log("Value: " + creds.refresh_token);
console.log("=".repeat(72));
console.log("\nOptional (only if you want AI trend research in CI):");
console.log("Name:  AI_ENDPOINT");
console.log("Value: https://bbmw0-technologies-ai.vercel.app/api/ai");
console.log("\nDone. Workflows will pick these up on the next run.\n");
