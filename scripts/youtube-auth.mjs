// One-time YouTube OAuth setup.
// Run this once on your local machine to capture a refresh token.
// After that, scripts/youtube-upload.mjs can upload videos unattended.
//
// USAGE:
//   1) Create a Google Cloud project (https://console.cloud.google.com)
//   2) Enable "YouTube Data API v3"
//   3) Create OAuth 2.0 Client ID for "Desktop app"
//   4) Save the JSON as scripts/oauth-client.json
//   5) Run: npm run yt:auth
//   6) Open the printed URL, sign in, copy the code back into the terminal.
//   7) Refresh token is saved to scripts/yt-credentials.json (gitignored).
//
// SCOPES: youtube.upload (private uploads only). Set videos public from
// YouTube Studio after review until you trust the automation.

import { google } from "googleapis";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_PATH = path.join(__dirname, "oauth-client.json");
const CREDS_PATH = path.join(__dirname, "yt-credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

if (!fs.existsSync(CLIENT_PATH)) {
  console.error(
    `Missing ${CLIENT_PATH}.\n` +
    "Download it from Google Cloud Console:\n" +
    "  APIs & Services > Credentials > Create Credentials > OAuth client ID > Desktop app\n" +
    "Save the downloaded JSON to scripts/oauth-client.json and re-run."
  );
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(CLIENT_PATH, "utf8"));
const cfg = raw.installed || raw.web;
if (!cfg || !cfg.client_id || !cfg.client_secret) {
  console.error("oauth-client.json does not look like a Desktop OAuth client. Re-download from Google Cloud Console.");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(
  cfg.client_id,
  cfg.client_secret,
  "urn:ietf:wg:oauth:2.0:oob" // legacy out-of-band; we'll prompt on console
);

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n1) Open this URL in a browser, sign in to the YouTube account you want to publish from:\n");
console.log(url);
console.log("\n2) After approving, Google will show a code. Copy it and paste it below.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Paste the code here: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2.getToken(code.trim());
    if (!tokens.refresh_token) {
      console.error(
        "\nNo refresh_token returned. This usually means you've already authorised this client.\n" +
        "Revoke access at https://myaccount.google.com/permissions and try again."
      );
      process.exit(1);
    }
    fs.writeFileSync(
      CREDS_PATH,
      JSON.stringify(
        {
          client_id: cfg.client_id,
          client_secret: cfg.client_secret,
          refresh_token: tokens.refresh_token,
        },
        null,
        2
      ) + "\n"
    );
    console.log(`\nSaved ${CREDS_PATH}. You're ready. Run npm run yt:upload to publish a video.\n`);
  } catch (err) {
    console.error("Token exchange failed:", err.message || err);
    process.exit(1);
  }
});
