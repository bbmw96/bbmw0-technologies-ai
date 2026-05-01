# Full automation: daily Shorts + monthly long-form

This is the hands-off setup. Once configured, GitHub Actions runs every day and uploads 5 fresh Shorts to your YouTube channel as PRIVATE drafts. You review and promote them in YouTube Studio.

## What you're committing to

- **5 Shorts per day**, each with a different topic, theme, font, audio bed, layout, and copy.
- **1 long-form video on the 1st of each month**, ~30 minutes.
- **All uploads default to PRIVATE.** You promote them manually in YouTube Studio.
- **History tracked in `scripts/data/published.json`** — no topic ever runs twice.

You can stop the automation any time by disabling the workflows in the GitHub Actions tab.

## One-time setup

### 1. YouTube OAuth (local, ~5 min)

```bash
cd bbmw0-technologies-ai
npm install googleapis
# Follow scripts/README.md to create a Google Cloud OAuth desktop client,
# download oauth-client.json, save it to scripts/oauth-client.json, then:
npm run yt:auth
```

This writes `scripts/yt-credentials.json` with your refresh token.

### 2. Print and paste GitHub Secrets

```bash
node scripts/print-secrets.mjs
```

This prints 4 secrets to copy into GitHub repo Settings > Secrets and variables > Actions:

| Name | Value |
|---|---|
| `YT_OAUTH_CLIENT_JSON` | full client JSON (printed) |
| `YT_CLIENT_ID` | OAuth client id |
| `YT_CLIENT_SECRET` | OAuth client secret |
| `YT_REFRESH_TOKEN` | the captured refresh token |

(Optional: `AI_ENDPOINT` if you want CI to refresh topics via the 9-AI research pipeline.)

### 3. Push the workflows

```bash
git add .github/ scripts/ daily/ AUTOMATION.md
git commit -m "Automate daily Shorts + monthly long-form"
git push
```

That's it. The next 09:00 UTC the daily workflow will fire.

## Daily workflow at a glance

`.github/workflows/daily-shorts.yml`

```
09:00 UTC ── checkout ── install Node + ffmpeg ── restore secrets
   ── (optional) refresh topics via 9-AI research
   ── generate 5 unique props/meta files in daily/<date>/
   ── render 5 MP4s into out/
   ── upload all 5 to YouTube as PRIVATE
   ── commit history (so tomorrow won't repeat)
   ── upload videos + metadata as a 14-day artefact (just in case)
```

## Monthly workflow

`.github/workflows/monthly-longform.yml`

```
1st of month, 08:00 UTC ── checkout ── render LongForm composition
   ── upload to YouTube as PRIVATE ── 30-day artefact
```

## The 9-AI research team

`scripts/research-trends.mjs` calls your existing `/api/ai` Vercel route 9 times with 9 different system prompts. The 5 underlying providers (Claude, GPT, Gemini, Perplexity, Groq) get composed into 9 functional roles:

| # | Role | Backed by | What it does |
|---|---|---|---|
| 1 | Trend-Scout | Perplexity (live web) | finds currently trending topics |
| 2 | Niche-Mapper | Claude | clusters into niches, writes slugs |
| 3 | Hook-Writer | GPT | one-sentence punchy hooks |
| 4 | Punchline-Crafter | Llama via Groq | 4-6 word payoffs |
| 5 | Kid-Safety-Filter | Claude | strips anything not kid-safe |
| 6 | Repeat-Detector | local + Gemini | dedupes vs published history |
| 7 | Scoring-Judge | Claude | virality 1-10 |
| 8 | Tag-Curator | GPT | SEO tags |
| 9 | Synthesiser | local | picks top N, writes JSON |

Run manually any time:

```bash
node scripts/research-trends.mjs --niches=animals,space,science --count=20
```

Each role's input + output is logged to `scripts/data/trend-log.json` so you can audit which model contributed what.

**Honest constraint:** Perplexity is the only role with live web access. The other 4 providers add filtering, judgement, and synthesis on top — they don't browse YouTube directly. Trend currency comes from Perplexity; quality comes from the rest. Without `PERPLEXITY_API_KEY` configured on Vercel, the team falls back to pure-LLM brainstorming, which is still useful but less time-sensitive.

## Manual trigger

In GitHub > Actions > "Daily Shorts" > "Run workflow" lets you:
- pick a `count` (e.g. 3 or 10 instead of 5)
- pick a `niche` (e.g. only "space" today)
- toggle `research` on to refresh the topic library before generating

## Kill switches

| To stop... | Do this |
|---|---|
| One bad day | Cancel the running job in Actions |
| Pause uploads but keep rendering | Edit `daily-shorts.yml`, replace `--upload` with nothing in the render step |
| Pause everything | Disable the workflow in Actions tab |
| Roll back a published topic | Remove its entry from `scripts/data/published.json` to allow re-publishing |
| Burn it all down | Revoke OAuth at https://myaccount.google.com/permissions |

## Quotas (so this doesn't fail silently)

- YouTube Data API: 10,000 units/day default. One upload = ~1,600 units. 5 uploads/day = 8,000 units. **You'll be at 80% of quota every day.** Watch this. Request a quota bump in Google Cloud Console if it becomes a problem.
- AI provider quotas: research-trends.mjs makes ~9 calls per niche. With 10 niches that's 90 calls per research run. Keep it to once a week unless you've added paid keys.
- GitHub Actions free tier: 2,000 minutes/month for private repos, unlimited for public. Daily render takes ~10-15 minutes; monthly long-form takes ~60-120 minutes. Comfortably within free tier on a public repo.

## What can still go wrong

1. **"Mass-produced or repetitive content" strike.** YouTube can flag this even with full variation. Mitigations:
   - Keep `--privacy=private` for the first 30 days. Manually promote a slow trickle (1-2/day) until you build trust.
   - Mix in genuinely different content occasionally (a video shot on your phone, or a different composition entirely).
   - Don't rely on this as your only revenue stream.
2. **Refresh token expires.** Google OAuth refresh tokens can expire if unused for 6 months or after 6 grants. Re-run `npm run yt:auth` and update the secret.
3. **Topic library runs dry.** Generator hard-stops with "Only N unused topics" — the signal to add more seeds (run the AI research, or edit topics.json by hand).
4. **YouTube changes the policy.** Stay current with [YouTube's monetisation policies](https://support.google.com/youtube/answer/1311392). What's allowed today can change.

## What this isn't

- **Not autonomous AI agents that wake up and run themselves.** GitHub Actions cron is the trigger; everything else is deterministic code paths.
- **Not a guarantee of monetisation or virality.** It's a publishing pipeline, not a guarantee.
- **Not a replacement for review.** The "promote to public manually" step exists for a reason. Use it.
