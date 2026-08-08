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

# ------------------------------------------------------------- 6. Compliance
say "6. COMPLIANCE GATE"
say "----------------------------------------------"
if [ ! -f scripts/data/compliance-log.json ]; then
  say "  No compliance history yet. The gate runs on the next publish."
else
  COMP=$(node -e '
    const fs = require("fs");
    const rd = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^\ufeff/, ""));
    try {
      const log = rd("./scripts/data/compliance-log.json");
      const runs = log.runs || [];
      if (!runs.length) { console.log("NORUNS=1"); process.exit(0); }
      const last = runs[runs.length - 1];
      console.log("LAST_DATE=" + last.date);
      console.log("REVIEWED=" + last.reviewed);
      console.log("PASSED=" + last.passed);
      console.log("BLOCKED=" + last.blocked);
      const recent = runs.slice(-7);
      const tot = recent.reduce((a, r) => a + (r.reviewed || 0), 0);
      const blk = recent.reduce((a, r) => a + (r.blocked || 0), 0);
      console.log("WEEK_TOTAL=" + tot);
      console.log("WEEK_BLOCKED=" + blk);
      const reasons = {};
      recent.forEach(r => (r.results || []).forEach(v => (v.blocks || []).forEach(b => { reasons[b] = (reasons[b] || 0) + 1; })));
      const top = Object.entries(reasons).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k,v]) => k + " x" + v).join(", ");
      console.log("TOPREASONS=" + (top || "none"));
    } catch (e) { console.log("ERROR=" + e.message); }
  ' 2>&1)
  if echo "$COMP" | grep -q "^ERROR="; then
    say "  Could not read compliance log: ${COMP#ERROR=}"
    escalate WARNING "compliance log unreadable"
  elif echo "$COMP" | grep -q "^NORUNS="; then
    say "  Compliance log exists but has no runs recorded yet."
  else
    eval "$(echo "$COMP" | grep -E '^(LAST_DATE|REVIEWED|PASSED|BLOCKED|WEEK_TOTAL|WEEK_BLOCKED)=')"
    TOPREASONS=$(echo "$COMP" | sed -n 's/^TOPREASONS=//p')
    say "  Last run:          $LAST_DATE"
    say "  Reviewed:          $REVIEWED"
    say "  Cleared:           $PASSED"
    say "  Blocked:           $BLOCKED"
    say "  Last 7 runs:       $WEEK_BLOCKED blocked of $WEEK_TOTAL reviewed"
    say "  Top block reasons: $TOPREASONS"
    if [ "${BLOCKED:-0}" -gt 0 ]; then
      escalate WARNING "$BLOCKED video(s) blocked by compliance on $LAST_DATE"
    fi
    if [ "${WEEK_TOTAL:-0}" -gt 0 ] && [ "$(( WEEK_BLOCKED * 100 / WEEK_TOTAL ))" -gt 40 ]; then
      escalate CRITICAL "over 40% of videos blocked this week, the generator is producing non-compliant output"
    fi
  fi
fi

# --------------------------------------------------- 7. Audio licence exposure
say ""
say "7. AUDIO LICENCE EXPOSURE"
say "----------------------------------------------"
if [ ! -f scripts/data/audio-licences.json ]; then
  say "  audio-licences.json missing. Copyright provenance is unrecorded."
  escalate CRITICAL "no audio licence manifest"
else
  AUD=$(node -e '
    const fs = require("fs");
    const rd = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^\ufeff/, ""));
    const m = rd("./scripts/data/audio-licences.json");
    const t = m.tracks || [];
    const unknown = t.filter(x => !x.licence || x.licence === "UNKNOWN");
    console.log("TOTAL=" + t.length);
    console.log("UNKNOWN=" + unknown.length);
    console.log("UNKNOWNLIST=" + unknown.map(x => x.file).join(", "));
  ' 2>&1)
  eval "$(echo "$AUD" | grep -E '^(TOTAL|UNKNOWN)=')"
  UNKNOWNLIST=$(echo "$AUD" | sed -n 's/^UNKNOWNLIST=//p')
  say "  Tracks recorded:   $TOTAL"
  say "  Unknown licence:   $UNKNOWN"
  if [ "${UNKNOWN:-0}" -gt 0 ]; then
    say "  At risk: $UNKNOWNLIST"
    say "  Every video using these carries Content ID claim risk."
    escalate WARNING "$UNKNOWN audio track(s) have no recorded licence"
  else
    say "  All audio beds have a recorded licence."
  fi
fi

# --------------------------------------------------------- 8. Halal integrity
say ""
say "8. HALAL INTEGRITY"
say "----------------------------------------------"
TONAL=$(grep -cE "sine=|square=|triangle=|sawtooth=" scripts/audio/generate-beds.sh 2>/dev/null || echo 0)
if [ "$TONAL" -gt 0 ]; then
  say "  $TONAL tonal generator(s) in generate-beds.sh. Audio must be natural ambience only."
  escalate CRITICAL "tonal/instrumental audio source reintroduced"
else
  say "  Audio sources:     natural ambience only (no tonal generators)"
fi
if [ -f scripts/data/halal-topic-audit.json ]; then
  HB=$(node -e 'const a=JSON.parse(require("fs").readFileSync("./scripts/data/halal-topic-audit.json","utf8"));console.log((a.blocked||0)+" "+(a.needs_review||0)+" "+(a.total||0))' 2>/dev/null)
  set -- $HB
  say "  Topic library:     $3 topics, $1 blocked, $2 need context review"
  if [ "${1:-0}" -gt 0 ]; then
    escalate WARNING "$1 topic(s) in the library violate the halal rules"
  fi
else
  say "  No topic audit found. Regenerate it after changing rules or topics."
fi

# ------------------------------------------------------------- 9. Channels
say ""
say "9. PUBLISHING CHANNELS"
say "----------------------------------------------"
if [ ! -f scripts/data/channels.json ]; then
  say "  channels.json missing."
  escalate WARNING "no channel registry"
else
  node -e '
    const fs=require("fs");
    const rd=p=>JSON.parse(fs.readFileSync(p,"utf8").replace(/^\ufeff/,""));
    const c=rd("./scripts/data/channels.json").channels||[];
    const pub=rd("./scripts/data/published.json").videos||[];
    for(const ch of c){
      const n=pub.filter(v=>v&&v.channelId===ch.id).length;
      const up=pub.filter(v=>v&&v.channelId===ch.id&&v.youtubeId).length;
      console.log("  "+(ch.enabled?"LIVE    ":"disabled")+"  "+ch.id.padEnd(18)+ch.handle.padEnd(20)+ch.platform.padEnd(11)+"generated="+n+" published="+up);
    }
    const live=c.filter(x=>x.enabled).length;
    console.log("  ---");
    console.log("  "+live+" of "+c.length+" channels enabled");
  ' >> "$LOG" 2>&1
  [ "$QUIET" -eq 0 ] && node -e '
    const fs=require("fs");
    const rd=p=>JSON.parse(fs.readFileSync(p,"utf8").replace(/^\ufeff/,""));
    const c=rd("./scripts/data/channels.json").channels||[];
    const pub=rd("./scripts/data/published.json").videos||[];
    for(const ch of c){
      const n=pub.filter(v=>v&&v.channelId===ch.id).length;
      const up=pub.filter(v=>v&&v.channelId===ch.id&&v.youtubeId).length;
      console.log("  "+(ch.enabled?"LIVE    ":"disabled")+"  "+ch.id.padEnd(18)+ch.handle.padEnd(20)+ch.platform.padEnd(11)+"generated="+n+" published="+up);
    }
  '
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
