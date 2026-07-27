#!/usr/bin/env node
// Rotate the YouTube OAuth refresh token and push it straight to GitHub Secrets.
//
// WHY NODE AND NOT BASH
// The previous version was a .sh script. On Windows, `bash` resolves to WSL's
// bash when Ubuntu is installed, which is a separate Linux environment with its
// own PATH. It cannot see the Windows `gh` install, so the script died with a
// misleading "gh CLI not found" even though gh was present and working in cmd.
// Node runs natively, resolves gh from the Windows PATH, and works identically
// on macOS and Linux. No shell dependency at all.
//
// WHY NOT print:secrets
// That command writes every credential to the terminal, which is how the
// previous client secret and refresh token ended up pasted into a chat window.
// Here each value is piped into `gh secret set` over STDIN. It never appears in
// argv (visible in process listings), never in a log, never on screen.
//
// You still sign in to Google yourself. That part should not be automated.
//
// USAGE: npm run yt:rotate

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = process.env.GH_REPO || "bbmw96/bbmw0-technologies-ai";

// --channel=<id> rotates a specific channel from the registry. Each YouTube
// channel needs its OWN Google sign-in and its own OAuth client: a token
// authorises one account, and reusing @bbmw.0's token would silently publish
// to the wrong channel.
const channelArg = process.argv.find((a) => a.startsWith("--channel="));
const CHANNEL_ID = channelArg ? channelArg.slice("--channel=".length) : null;

const readRegistry = () =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/data/channels.json"), "utf8").replace(/^\uFEFF/, ""));

let CHANNEL = null;
if (CHANNEL_ID) {
  CHANNEL = (readRegistry().channels || []).find((c) => c.id === CHANNEL_ID);
  if (!CHANNEL) {
    console.error(`Unknown channel "${CHANNEL_ID}". Known: ${(readRegistry().channels || []).map((c) => c.id).join(", ")}`);
    process.exit(1);
  }
  if (CHANNEL.platform !== "youtube") {
    console.error(`Channel "${CHANNEL_ID}" is ${CHANNEL.platform}, not youtube. See scripts/RUNBOOK.md step 5.`);
    process.exit(1);
  }
}

const PREFIX = CHANNEL ? CHANNEL.secretPrefix : "YT";
const SUFFIX = PREFIX === "YT" ? "" : `-${CHANNEL_ID.replace(/^yt-/, "")}`;
const CREDS = path.join(ROOT, CHANNEL?.credentialsFile || "scripts/yt-credentials.json");
const CLIENT = path.join(ROOT, `scripts/oauth-client${SUFFIX}.json`);

const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const line = "=".repeat(46);

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts });
}

/** Windows needs PATHEXT resolution, so try a few forms before giving up. */
function findGh() {
  for (const candidate of ["gh", "gh.exe"]) {
    const r = run(candidate, ["--version"], { stdio: "pipe" });
    if (!r.error && r.status === 0) return candidate;
  }
  // Common install locations, in case PATH is not set in this shell.
  const guesses = [
    "C:\\Program Files\\GitHub CLI\\gh.exe",
    "C:\\Program Files (x86)\\GitHub CLI\\gh.exe",
    path.join(process.env.LOCALAPPDATA || "", "GitHubCLI\\bin\\gh.exe"),
    "/usr/bin/gh", "/usr/local/bin/gh", "/opt/homebrew/bin/gh",
  ];
  for (const g of guesses) {
    try {
      if (g && fs.existsSync(g)) {
        const r = run(g, ["--version"], { stdio: "pipe" });
        if (!r.error && r.status === 0) return g;
      }
    } catch { /* keep looking */ }
  }
  return null;
}

console.log(line);
console.log(" Rotate YouTube token");
if (CHANNEL) {
  console.log(` Channel: ${CHANNEL.id}  ${CHANNEL.handle}`);
  console.log(` SIGN IN AS ${CHANNEL.handle}, not any other account.`);
}
console.log(line);

const GH = findGh();
if (!GH) {
  console.error("\nERROR: could not find the GitHub CLI.");
  console.error("Install it from https://cli.github.com/ then reopen your terminal.");
  console.error("If it IS installed, its folder is not on this shell's PATH.");
  process.exit(1);
}
console.log(`  gh: ${GH}`);

const auth = run(GH, ["auth", "status"], { stdio: "pipe" });
if (auth.status !== 0) {
  console.error("\nERROR: gh is not authenticated. Run:  gh auth login");
  process.exit(1);
}
console.log("  gh: authenticated");

if (!fs.existsSync(CLIENT)) {
  console.error(`\nERROR: ${CLIENT} is missing.`);
  console.error("Download the Desktop OAuth client JSON from Google Cloud Console and save it there.");
  process.exit(1);
}

console.log("\nStep 1 of 3: Google sign-in");
console.log("  A browser window will open. Sign in with the account that owns");
console.log("  the channel and approve YouTube upload access.\n");

const authRun = run(process.execPath,
  [path.join(ROOT, "scripts/youtube-auth.mjs"),
   `--client=${CLIENT}`, `--out=${CREDS}`],
  { stdio: "inherit" });
if (authRun.status !== 0) { console.error("\nSign-in did not complete."); process.exit(1); }

if (!fs.existsSync(CREDS)) {
  console.error(`\nERROR: ${CREDS} was not created. Sign-in did not complete.`);
  process.exit(1);
}

const creds = readJSON(CREDS);
if (!creds.refresh_token) {
  console.error("\nERROR: Google returned no refresh_token.");
  console.error("That happens when the app is already authorised. Revoke it at");
  console.error("https://myaccount.google.com/permissions and run this again.");
  console.error("Do not reuse the old token: it is the one being rotated.");
  process.exit(1);
}

console.log("\nStep 2 of 3: pushing secrets to GitHub");
console.log("  Values are piped over stdin and are never displayed.");

const client = readJSON(CLIENT).installed || readJSON(CLIENT).web || {};
const secrets = {
  [`${PREFIX}_REFRESH_TOKEN`]: creds.refresh_token,
  [`${PREFIX}_CLIENT_ID`]: creds.client_id || client.client_id,
  [`${PREFIX}_CLIENT_SECRET`]: creds.client_secret || client.client_secret,
  [`${PREFIX}_OAUTH_CLIENT_JSON`]: JSON.stringify({
    installed: {
      client_id: client.client_id,
      client_secret: client.client_secret,
      auth_uri: client.auth_uri || "https://accounts.google.com/o/oauth2/auth",
      token_uri: client.token_uri || "https://oauth2.googleapis.com/token",
      redirect_uris: client.redirect_uris || ["http://localhost"],
    },
  }),
};

let failed = 0;
for (const [name, value] of Object.entries(secrets)) {
  if (!value) { console.error(`  SKIP ${name}: no value found`); failed++; continue; }
  const r = run(GH, ["secret", "set", name, "--repo", REPO],
    { input: value, stdio: ["pipe", "inherit", "inherit"] });
  if (r.status === 0) console.log(`  set  ${name}`);
  else { console.error(`  FAIL ${name}`); failed++; }
}
if (failed) { console.error(`\n${failed} secret(s) failed. Nothing else will work until they are set.`); process.exit(1); }

console.log("\nStep 3 of 3: verifying");
const list = run(GH, ["secret", "list", "--repo", REPO], { stdio: "pipe" });
(list.stdout || "").split("\n").filter((l) => l.startsWith(PREFIX)).forEach((l) => console.log("  " + l.trim()));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("\nDelete the local credentials file (it holds a live token)? [Y/n] ", (ans) => {
  if (/^n/i.test(ans.trim())) console.log("  Kept. It is gitignored, do not commit it.");
  else { fs.unlinkSync(CREDS); console.log("  Deleted."); }
  rl.close();
  console.log("\nDone. Publish with:");
  console.log(`  ${GH.includes(" ") ? `"${GH}"` : GH} workflow run daily-shorts.yml --repo ${REPO} -f count=5`);
});
