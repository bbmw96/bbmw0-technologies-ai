#!/usr/bin/env node
// Confirm which YouTube channel a set of credentials actually authorises.
//
// WHY THIS EXISTS
// rotate-youtube-token.mjs prints "SIGN IN AS @handle" but cannot enforce it.
// If you are already signed into the wrong Google account, the flow completes
// happily and the pipeline then publishes to the WRONG CHANNEL. That failure is
// silent and only visible once videos appear somewhere unexpected.
//
// LIMITATION, FOUND THE HARD WAY
// This calls channels.list(mine=true), which needs youtube.readonly. The
// pipeline only requests youtube.upload, the narrowest scope that does the job,
// so this returns "Request had insufficient authentication scopes".
//
// Broadening the scope purely to enable a pre-flight check was not worth
// re-authorising every channel and widening the permission. The wrong-channel
// check therefore lives in render-batch instead: the videos.insert response
// carries snippet.channelId, so a wrong-account authorisation is caught on
// video ONE and the batch halts.
//
// Kept because it works if you ever add youtube.readonly for another reason.
//
// USAGE:
//   node scripts/verify-channel.mjs --channel=yt-bbm0902
//   node scripts/verify-channel.mjs                  (defaults to first enabled)
//
// EXIT: 0 match, 1 config problem, 2 MISMATCH (wrong account authorised)

import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const rd = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));

const flag = process.argv.find((a) => a.startsWith("--channel="));
const wantedId = flag ? flag.slice("--channel=".length) : null;

const registry = rd(path.join(ROOT, "scripts/data/channels.json"));
const ch = wantedId
  ? (registry.channels || []).find((c) => c.id === wantedId)
  : (registry.channels || []).find((c) => c.enabled && c.platform === "youtube");

if (!ch) { console.error(`Unknown channel "${wantedId}".`); process.exit(1); }
if (ch.platform !== "youtube") { console.error(`${ch.id} is ${ch.platform}, not youtube.`); process.exit(1); }

const credsPath = path.join(ROOT, ch.credentialsFile || "scripts/yt-credentials.json");
if (!fs.existsSync(credsPath)) {
  console.error(`No local credentials at ${ch.credentialsFile}.`);
  console.error(`This check only works right after rotation, before the file is deleted.`);
  process.exit(1);
}

const creds = rd(credsPath);
const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret);
oauth2.setCredentials({ refresh_token: creds.refresh_token });
const youtube = google.youtube({ version: "v3", auth: oauth2 });

try {
  const res = await youtube.channels.list({ part: ["snippet"], mine: true });
  const item = res.data.items?.[0];
  if (!item) {
    console.error("No channel returned. The account may have no YouTube channel.");
    process.exit(2);
  }
  const actualId = item.id;
  const title = item.snippet?.title;
  const handle = item.snippet?.customUrl;

  console.log(`  Expected : ${ch.handle}  (${ch.channelId})`);
  console.log(`  Authorised: ${handle || title}  (${actualId})`);

  if (ch.channelId && actualId !== ch.channelId) {
    console.error("");
    console.error("MISMATCH. These credentials publish to the WRONG channel.");
    console.error(`Re-run: npm run yt:rotate -- --channel=${ch.id}`);
    console.error("Sign out of Google first, or use a private window, then sign in as the right account.");
    process.exit(2);
  }
  console.log("");
  console.log(`  MATCH. ${ch.id} will publish to ${handle || title}.`);
  process.exit(0);
} catch (err) {
  console.error(`Verification failed: ${err.message || err}`);
  if (/invalid_grant/i.test(String(err.message))) {
    console.error("The refresh token is invalid or expired. Re-run the rotation.");
  }
  process.exit(2);
}
