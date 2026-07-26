#!/usr/bin/env bash
# BBMW0 Daily Content Report
#
# Standalone health check for the daily Shorts pipeline. This is a REAL shell
# script. Do not try to execute .claude/commands/daily-check.md directly: that
# file is a Claude Code slash command containing the placeholder <latest-run-id>,
# which a shell cannot substitute. Running it as a script is what caused the
# repeated "error has been logged to /tmp/bbmw0-content-report.log" failures.
#
# USAGE:
#   bash scripts/daily-report.sh
#   bash scripts/daily-report.sh --quiet     # log only, no stdout
#
# EXIT CODES: 0 = healthy, 1 = warning, 2 = critical

set -uo pipefail

REPO="bbmw96/bbmw0-technologies-ai"
WORKFLOW="daily-shorts.yml"
LOG="/tmp/bbmw0-content-report.log"
QUIET=0
[ "${1:-}" = "--quiet" ] && QUIET=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || { echo "Cannot cd to $PROJECT_ROOT"; exit 2; }

: > "$LOG"
say() { echo "$*" >> "$LOG"; [ "$QUIET" -eq 0 ] && echo "$*"; }

STATUS="HEALTHY"
ISSUES=""
escalate() {
  # $1 = WARNING|CRITICAL, $2 = message
  if [ "$1" = "CRITICAL" ]; then STATUS="CRITICAL"
  elif [ "$STATUS" != "CRITICAL" ]; then STATUS="WARNING"; fi
  ISSUES="${ISSUES}  - $2"$'\n'
}

say "=============================================="
say " BBMW0 Daily Content Report"
say " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
say " Repo: $REPO"
say "=============================================="
say ""

# ---------------------------------------------------------------- 1. Workflow
say "1. LATEST WORKFLOW RUNS"
say "----------------------------------------------"
LATEST_RUN_ID=""
if ! command -v gh >/dev/null 2>&1; then
  say "  gh CLI not installed. Skipping workflow checks."
  say "  Install: https://cli.github.com/"
  escalate WARNING "gh CLI missing, cannot verify workflow runs"
elif ! gh auth status >/dev/null 2>&1; then
  say "  gh CLI not authenticated. Run: gh auth login"
  escalate WARNING "gh CLI not authenticated"
else
  RUNS_JSON=$(gh run list --repo "$REPO" --workflow="$WORKFLOW" --limit=5 \
      --json databaseId,status,conclusion,startedAt,displayTitle 2>/dev/null)
  if [ -z "$RUNS_JSON" ] || [ "$RUNS_JSON" = "[]" ]; then
    say "  No runs found for $WORKFLOW."
    escalate WARNING "no workflow runs found"
  else
    # This is the line the slash command could not express: resolve the real ID.
    LATEST_RUN_ID=$(echo "$RUNS_JSON" | jq -r '.[0].databaseId // empty')
    echo "$RUNS_JSON" | jq -r '.[] | "  [\(.conclusion // .status)] \(.startedAt) run \(.databaseId) \(.displayTitle)"' >> "$LOG"
    [ "$QUIET" -eq 0 ] && echo "$RUNS_JSON" | jq -r '.[] | "  [\(.conclusion // .status)] \(.startedAt) run \(.databaseId) \(.displayTitle)"'

    FAILED=$(echo "$RUNS_JSON" | jq -r '[.[] | select(.conclusion != null and .conclusion != "success")] | length')
    LAST_CONCLUSION=$(echo "$RUNS_JSON" | jq -r '.[0].conclusion // "in_progress"')
    say ""
    say "  Latest run: $LATEST_RUN_ID ($LAST_CONCLUSION)"
    if [ "$LAST_CONCLUSION" != "success" ] && [ "$LAST_CONCLUSION" != "in_progress" ]; then
      escalate CRITICAL "most recent run concluded '$LAST_CONCLUSION'"
    elif [ "$FAILED" -gt 0 ]; then
      escalate WARNING "$FAILED of last 5 runs did not succeed"
    fi
  fi
fi
say ""

# ------------------------------------------------------------------- 2. OAuth
say "2. OAUTH HEALTH"
say "----------------------------------------------"
if [ -n "$LATEST_RUN_ID" ]; then
  OAUTH_HITS=$(gh run view "$LATEST_RUN_ID" --repo "$REPO" --log 2>/dev/null \
      | grep -i "invalid_grant" | head -5)
  if [ -n "$OAUTH_HITS" ]; then
    say "  OAuth token EXPIRED. Refresh token rejected:"
    say "$OAUTH_HITS"
    say ""
    say "  FIX: rotate YT_REFRESH_TOKEN in GitHub repo Settings,"
    say "       Secrets and variables, Actions. Regenerate with:"
    say "       npm run yt:auth  then  npm run print:secrets"
    escalate CRITICAL "OAuth refresh token expired, rotate YT_REFRESH_TOKEN"
  else
    say "  No invalid_grant errors in the latest run. Token healthy."
  fi
else
  say "  Skipped: no run ID available."
fi
say ""

# ------------------------------------------------------------ 3. Topic library
say "3. TOPIC LIBRARY"
say "----------------------------------------------"
if ! command -v node >/dev/null 2>&1; then
  say "  Node not found. Cannot check topic library."
  escalate CRITICAL "node missing"
else
  TOPIC_OUT=$(node -e '
    const fs = require("fs");
    const rd = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
    try {
      const t = rd("./scripts/data/topics.json");
      const p = rd("./scripts/data/published.json");
      const used = new Set(p.topicsUsed || []);
      const unused = t.topics.filter(x => !used.has(x.id));
      const byNiche = unused.reduce((a, x) => { a[x.niche] = (a[x.niche] || 0) + 1; return a; }, {});
      const uploaded = (p.videos || []).filter(v => v && v.youtubeId).length;
      console.log("TOTAL=" + t.topics.length);
      console.log("USED=" + used.size);
      console.log("UNUSED=" + unused.length);
      console.log("DAYS=" + Math.floor(unused.length / 5));
      console.log("UPLOADED=" + uploaded);
      console.log("NICHES=" + Object.entries(byNiche).map(([k,v]) => k + ":" + v).join(", "));
    } catch (e) {
      console.log("ERROR=" + e.message);
    }
  ' 2>&1)

  if echo "$TOPIC_OUT" | grep -q "^ERROR="; then
    say "  ${TOPIC_OUT#ERROR=}"
    escalate CRITICAL "topic library unreadable: ${TOPIC_OUT#ERROR=}"
  else
    eval "$(echo "$TOPIC_OUT" | grep -E '^(TOTAL|USED|UNUSED|DAYS|UPLOADED)=')"
    NICHES=$(echo "$TOPIC_OUT" | sed -n 's/^NICHES=//p')
    say "  Total topics:      $TOTAL"
    say "  Used:              $USED"
    say "  Unused:            $UNUSED"
    say "  Days left at 5/day: $DAYS"
    say "  Uploaded to YT:    $UPLOADED"
    say "  Unused by niche:   $NICHES"
    if   [ "$UNUSED" -lt 5 ];  then escalate CRITICAL "only $UNUSED topics left, auto-refill needs AI_ENDPOINT set"
    elif [ "$UNUSED" -lt 10 ]; then escalate WARNING  "$UNUSED topics left, auto-refill triggers on next run"
    fi
  fi
fi
say ""

# -------------------------------------------------------------- 4. Data health
say "4. DATA FILE INTEGRITY"
say "----------------------------------------------"
BOM_FOUND=0
for f in scripts/data/topics.json scripts/data/copy-pools.json scripts/data/published.json; do
  if [ ! -f "$f" ]; then
    say "  MISSING: $f"
    escalate CRITICAL "$f missing"
    continue
  fi
  if [ "$(head -c 3 "$f" | od -An -tx1 | tr -d ' \n')" = "efbbbf" ]; then
    say "  BOM DETECTED: $f  (this breaks JSON.parse)"
    BOM_FOUND=1
    escalate CRITICAL "UTF-8 BOM in $f, strip with: sed -i '1s/^\xEF\xBB\xBF//' $f"
  else
    say "  OK (no BOM): $f"
  fi
done
[ "$BOM_FOUND" -eq 0 ] && say "  All data files parse cleanly."
say ""

# ------------------------------------------------------------------- 5. Quota
say "5. YOUTUBE API QUOTA"
say "----------------------------------------------"
PER_UPLOAD=1600
DAILY_QUOTA=10000
PLANNED=5
EST=$(( PER_UPLOAD * PLANNED ))
say "  Cost per upload:   ${PER_UPLOAD} units"
say "  Planned uploads:   ${PLANNED}/day"
say "  Estimated usage:   ${EST} of ${DAILY_QUOTA} units"
say "  Headroom:          $(( DAILY_QUOTA - EST )) units"
if [ "$EST" -gt "$DAILY_QUOTA" ]; then
  escalate CRITICAL "planned uploads exceed daily quota"
elif [ "$EST" -gt $(( DAILY_QUOTA * 8 / 10 )) ]; then
  say "  NOTE: above 80% of quota. A single retry storm will exhaust it."
fi
say ""

# ------------------------------------------------------------------- Verdict
say "=============================================="
if [ -n "$ISSUES" ]; then
  say " ISSUES FOUND:"
  printf '%s' "$ISSUES" >> "$LOG"
  [ "$QUIET" -eq 0 ] && printf '%s' "$ISSUES"
fi
say " Pipeline: $STATUS"
say "=============================================="
say ""
say "Full report saved to $LOG"

case "$STATUS" in
  HEALTHY)  exit 0 ;;
  WARNING)  exit 1 ;;
  CRITICAL) exit 2 ;;
esac
