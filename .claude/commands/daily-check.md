# /daily-check — bbmw0-technologies-ai pipeline health check

Run the real health-check script and report the result.

```bash
bash scripts/daily-report.sh
```

That single command performs all five checks and writes a full report to
`/tmp/bbmw0-content-report.log`:

1. **Latest workflow runs** — last 5 runs of `daily-shorts.yml`, flagging any
   conclusion that is not `success`. The script resolves the latest run ID
   itself with `jq`.
2. **OAuth health** — greps the latest run log for `invalid_grant`. If found,
   the fix is to rotate `YT_REFRESH_TOKEN` in GitHub repo Settings, Secrets and
   variables, Actions. Regenerate with `npm run yt:auth` then `npm run print:secrets`.
3. **Topic library** — total, used, unused, days remaining at 5/day, and the
   count already uploaded to YouTube.
4. **Data file integrity** — detects UTF-8 BOMs, which silently break
   `JSON.parse` and were the original cause of the pipeline outage.
5. **YouTube quota** — 1,600 units per upload against the 10,000/day limit.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Pipeline HEALTHY |
| 1 | Pipeline WARNING |
| 2 | Pipeline CRITICAL |

## Why this is a script and not inline commands

An earlier version of this file listed the raw shell commands, including
`gh run view <latest-run-id>`. `<latest-run-id>` is a human placeholder, not a
shell variable. Anything that executed this file directly as a shell script
failed on that line every time and logged the error to
`/tmp/bbmw0-content-report.log`. The logic now lives in
`scripts/daily-report.sh`, which resolves the run ID properly.

## Report the result

After running, present the log as a table and finish with one line:
`Pipeline: HEALTHY` / `Pipeline: WARNING — [issue]` / `Pipeline: CRITICAL — [issue]`
