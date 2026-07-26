#!/usr/bin/env bash
# Rotate the YouTube OAuth refresh token and push it straight to GitHub Secrets.
#
# WHY THIS EXISTS
# The documented flow was `npm run yt:auth` then `npm run print:secrets`, and
# print:secrets writes every credential to the terminal in plain text. That is
# how the previous client secret and refresh token ended up pasted into a chat
# window. This script never prints a secret value: each one is piped directly
# from the credentials file into `gh secret set` over stdin.
#
# You still have to sign in to Google yourself in the browser. That part cannot
# and should not be automated.
#
# USAGE: bash scripts/rotate-youtube-token.sh

set -euo pipefail

REPO="bbmw96/bbmw0-technologies-ai"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

CREDS="scripts/yt-credentials.json"
CLIENT="scripts/oauth-client.json"

echo "=============================================="
echo " Rotate YouTube token"
echo "=============================================="

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh CLI not found. https://cli.github.com/"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "ERROR: gh not authenticated. Run: gh auth login"; exit 1; }
[ -f "$CLIENT" ] || { echo "ERROR: $CLIENT missing. Download the OAuth desktop client JSON from Google Cloud Console."; exit 1; }

echo
echo "Step 1 of 3: Google sign-in"
echo "  A browser window will open. Sign in with the account that owns the"
echo "  channel, and approve YouTube upload access."
echo
node scripts/youtube-auth.mjs

[ -f "$CREDS" ] || { echo "ERROR: $CREDS was not created. Sign-in did not complete."; exit 1; }

# Fail early if Google returned no refresh_token. That happens when the app is
# already authorised; the fix is to revoke it and retry, not to reuse the old one.
node -e '
  const fs = require("fs");
  const c = JSON.parse(fs.readFileSync("scripts/yt-credentials.json","utf8").replace(/^﻿/,""));
  if (!c.refresh_token) {
    console.error("No refresh_token returned. Revoke the app at https://myaccount.google.com/permissions and run this again.");
    process.exit(1);
  }
' || exit 1

echo
echo "Step 2 of 3: pushing secrets to GitHub"
echo "  Values are piped directly into gh and are never displayed."

set_secret() {
  local name="$1" expr="$2"
  node -e "$expr" | gh secret set "$name" --repo "$REPO"
  echo "  set $name"
}

RD='const rd=p=>JSON.parse(require("fs").readFileSync(p,"utf8").replace(/^﻿/,""));'

set_secret "YT_REFRESH_TOKEN" \
  "${RD}process.stdout.write(rd('scripts/yt-credentials.json').refresh_token)"
set_secret "YT_CLIENT_ID" \
  "${RD}process.stdout.write(rd('scripts/yt-credentials.json').client_id)"
set_secret "YT_CLIENT_SECRET" \
  "${RD}process.stdout.write(rd('scripts/yt-credentials.json').client_secret)"
set_secret "YT_OAUTH_CLIENT_JSON" \
  "${RD}const c=rd('scripts/oauth-client.json').installed;process.stdout.write(JSON.stringify({installed:{client_id:c.client_id,client_secret:c.client_secret,auth_uri:c.auth_uri,token_uri:c.token_uri,redirect_uris:c.redirect_uris}}))"

echo
echo "Step 3 of 3: verifying"
gh secret list --repo "$REPO" | grep -E "^YT_" || true

echo
echo "Local credential files still contain live secrets."
read -r -p "Delete scripts/yt-credentials.json now? [Y/n] " ans
case "${ans:-Y}" in
  [Nn]*) echo "  Kept. Do not commit it: it is in .gitignore." ;;
  *)     rm -f "$CREDS"; echo "  Deleted." ;;
esac

echo
echo "Done. Trigger a publish run with:"
echo "  gh workflow run daily-shorts.yml --repo $REPO -f count=5"
