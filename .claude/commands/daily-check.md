# /daily-check — bbmw0-technologies-ai pipeline health check

Run ALL of the following checks in one pass and produce a clear status report.

## 1. Latest workflow runs

```bash
gh run list --repo bbmw96/bbmw0-technologies-ai --workflow=daily-shorts.yml --limit=5 --json databaseId,status,conclusion,startedAt,displayTitle
```

Flag any `conclusion` that is not `success`. For the most recent run, grab its ID.

## 2. OAuth health (invalid_grant check)

```bash
gh run view <latest-run-id> --repo bbmw96/bbmw0-technologies-ai --log 2>&1 | grep -i "invalid_grant" | head -5
```

If any output appears: report "OAuth token expired — rotate YT_REFRESH_TOKEN in GitHub repo Secrets (Settings, Secrets and variables, Actions). Follow the AUTOMATION.md Security cleanup section."

## 3. Topic library status

```bash
node -e "
const t = JSON.parse(require('fs').readFileSync('./scripts/data/topics.json', 'utf8'));
const p = JSON.parse(require('fs').readFileSync('./scripts/data/published.json', 'utf8'));
const used = new Set(p.topicsUsed || []);
const unused = t.topics.filter(x => !used.has(x.id));
const byNiche = unused.reduce((a, x) => { a[x.niche] = (a[x.niche] || 0) + 1; return a; }, {});
console.log('Total topics:', t.topics.length);
console.log('Used:', used.size);
console.log('Unused:', unused.length);
console.log('Days remaining at 5/day:', Math.floor(unused.length / 5));
console.log('Breakdown by niche:', JSON.stringify(byNiche, null, 2));
"
```

Status thresholds:
- 10+ unused: green
- 5-9 unused: warning (auto-refill will trigger on next CI run)
- less than 5 unused: critical (auto-refill is running but AI_ENDPOINT must be set)

## 4. YouTube quota estimate

Each upload costs approximately 1,600 API units. Daily quota is 10,000 units.
At 5 videos per day: 5 x 1,600 = 8,000 units used, 2,000 remaining headroom.

Check if recent runs uploaded more than 5 videos (stale files re-uploaded before the skip fix). If so, calculate actual quota used.

## 5. Output format

Present the report as a clean table:

| Check | Status | Detail |
|-------|--------|--------|
| Last 5 runs | ... | ... |
| OAuth | ... | ... |
| Topics unused | ... | ... |
| Quota headroom | ... | ... |

End with one line: "Pipeline: HEALTHY" / "Pipeline: WARNING — [issue]" / "Pipeline: CRITICAL — [issue]"
