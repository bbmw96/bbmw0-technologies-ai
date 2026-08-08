// One-time YouTube OAuth setup using the modern localhost loopback flow
// (Google deprecated the legacy OOB code-paste flow in 2022).
//
// USAGE:  npm run yt:auth
//
// REQUIRES: scripts/oauth-client.json with at minimum:
//   { "installed": { "client_id": "...", "client_secret": "..." } }
//
// Saves a refresh token to scripts/yt-credentials.json so the upload
// script can run unattended.

import { google } from "googleapis";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Overridable so a second channel can use its own client and credentials file.
// Declared BEFORE first use: `const` is hoisted but not initialised, so calling
// argOf above this line throws "Cannot access 'argOf' before initialization".
const argOf = (n) => {
  const f = process.argv.find((a) => a.startsWith(`--${n}=`));
  return f ? f.slice(n.length + 3) : null;
};

const CLIENT_PATH = argOf("client") || path.join(__dirname, "oauth-client.json");
const CREDS_PATH  = argOf("out")    || path.join(__dirname, "yt-credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

if (!fs.existsSync(CLIENT_PATH)) {
  console.error(
    `Missing ${CLIENT_PATH}.\n` +
    "Create it manually (Google removed the Download-JSON button):\n" +
    '  { "installed": { "client_id": "...", "client_secret": "..." } }\n' +
    "See scripts/README.md for the full one-liner."
  );
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(CLIENT_PATH, "utf8"));
const cfg = raw.installed || raw.web;
if (!cfg?.client_id || !cfg?.client_secret) {
  console.error("oauth-client.json must contain installed.client_id and installed.client_secret.");
  process.exit(1);
}

// Stand up a one-shot HTTP server on a random localhost port.
const server = http.createServer();
server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const oauth2 = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, redirectUri);
  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });

  console.log("\n1. Open this URL in your browser:\n");
  console.log(authUrl);
  console.log(
    "\n2. If you see 'App not verified', click 'Advanced' then 'Go to YT Shorts Engine (unsafe)'.\n" +
    "   That's normal for a personal Desktop client. Sign in with the YouTube account you want to publish from.\n"
  );
  console.log("3. Waiting for Google to redirect you back here...\n");
});

server.on("request", async (req, res) => {
  const reqUrl = url.parse(req.url, true);
  if (reqUrl.pathname !== "/callback") {
    res.writeHead(404).end("Not found");
    return;
  }
  const { code, state: gotState, error } = reqUrl.query;
  if (error) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<h1>OAuth error: ${error}</h1>`);
    console.error("OAuth error:", error);
    server.close(); process.exit(1);
  }
  // Re-derive the OAuth client (state captured via closure isn't stable across requests,
  // but our one-shot server only handles one /callback so we recreate it).
  const cfg2 = (raw.installed || raw.web);
  const port = server.address().port;
  const oauth2 = new google.auth.OAuth2(cfg2.client_id, cfg2.client_secret, `http://127.0.0.1:${port}/callback`);
  try {
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h1>No refresh_token returned</h1><p>Revoke this app at https://myaccount.google.com/permissions and retry.</p>");
      console.error("No refresh_token. Revoke at https://myaccount.google.com/permissions and re-run.");
      server.close(); process.exit(1);
    }
    fs.writeFileSync(CREDS_PATH, JSON.stringify({
      client_id: cfg2.client_id,
      client_secret: cfg2.client_secret,
      refresh_token: tokens.refresh_token,
    }, null, 2) + "\n");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Done.</h1><p>You can close this tab and return to your terminal.</p>");
    console.log(`\nSaved ${path.relative(process.cwd(), CREDS_PATH)}.\nRun npm run print:secrets to see the GitHub secret values.\n`);
    server.close(); process.exit(0);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h1>Token exchange failed</h1><pre>${(err.message || err).toString()}</pre>`);
    console.error("Token exchange failed:", err.message || err);
    server.close(); process.exit(1);
  }
});
