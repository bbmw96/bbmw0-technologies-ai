# BBMW0 publishing runbook

## Start here

```
npm run doctor
```

One command. Checks tooling, GitHub secrets, publishing liveness, CI history,
audio licensing, halal audio compliance, BOMs and channel readiness, then tells
you exactly what is blocking and the command to fix it.

Exit codes: 0 all clear, 1 warnings, 2 something is blocking publishing.

Both outages so far were invisible until someone went looking: a 7-day token
fuse nobody was watching, and a `git add` that silently staged nothing. This
command exists so neither can hide again.

Everything that cannot be automated, in the order it needs doing. Each step says
who does it and roughly how long it takes.

---

## 1. Go live on channel one (blocks everything else)

**You. About 5 minutes.** Nothing publishes until this is done.

The OAuth client secret was exposed in a chat window, so it is treated as
compromised. Replace the client, not just the token.

### 1a. New OAuth client

1. Open <https://console.cloud.google.com/apis/credentials>
2. Delete the OAuth client ending `...24sc39oamkcflkfklbd2arjhmcjim85q`
3. **Create Credentials** then **OAuth client ID** then **Desktop app**
4. Download the JSON and save it over `scripts/oauth-client.json`

### 1b. Rotate the token

Open a terminal. The working directory matters: running `npm` anywhere else
gives `ENOENT ... package.json`.

Note: this used to be a bash script and failed on Windows with a misleading
"gh CLI not found". Plain `bash` resolves to **WSL's** bash when Ubuntu is
installed, and WSL cannot see the Windows PATH, so it could not find the
Windows `gh`. It is now a Node script with no shell dependency.

```
cd /d "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"
npm run yt:rotate
```

Sign in with the account that owns **@bbmw.0** and approve YouTube upload
access. The script sets `YT_REFRESH_TOKEN`, `YT_CLIENT_ID`, `YT_CLIENT_SECRET`
and `YT_OAUTH_CLIENT_JSON` in GitHub for you. **No secret is printed.**

Do not use `npm run print:secrets`. It writes live credentials to the terminal
and is how the last set leaked. It now refuses unless explicitly overridden.

### 1c. Publish

```
gh workflow run daily-shorts.yml --repo bbmw96/bbmw0-technologies-ai -f count=5
gh run watch --repo bbmw96/bbmw0-technologies-ai
```

---

## 2. Unblock the influencer brief (403)

**You. About 1 minute.**

**Why this is needed at all:** your routine `bbm0902-daily-influencer-brief`
is configured to commit its output into `bbmw96/bbmw0-technologies`. It writes
`content/bbm0902/daily-briefs/<date>.md` and `content-log.csv`, commits locally,
then pushes. The push returns 403 because the Claude Code GitHub App has
read-only scope on that repo, so commit `a925fa6` and everything since is
stranded. Nothing to do with me needing access: it is your routine's own
configured destination.

You were right that `bbmw0-technologies` is the wrong home for this. It is the
company website repo, not a content store. So a dedicated repo now exists:

**`bbmw96/bbmw0-content-ops`** (private)

Point the routine there instead. That keeps website code and content operations
cleanly separated, and means you never have to widen write access on the
website repo.

1. Open the `bbm0902-daily-influencer-brief` routine
2. Change the repository to `bbmw96/bbmw0-content-ops`
3. Grant the Claude GitHub App write on that one repo at
   <https://github.com/settings/installations>

If you would rather leave it pointing at `bbmw0-technologies`, the fix is just
step 3 against that repo instead. Either works. The dedicated repo is cleaner.

## 3. Detach the Daily Content Report from verifiq

**You. About 30 seconds.**

**What I meant:** the `BBMW0 Daily Content Report` routine has
`bbmw96/verifiq` listed under Repositories. You are right that VERIFIQ has
nothing to do with the social accounts. That is exactly the problem: the routine
has an unrelated repo attached, so any repo context it pulls is the IFC
compliance checker rather than anything about content.

That routine only reads three social channels through Composio and emails a
summary. It does not need a repo at all.

Open the routine, click the pencil, and either remove the repository or set it
to `bbmw96/bbmw0-content-ops` so its context matches what it actually does.

Low priority. It is running fine. It just has a misleading attachment.

## 4. Enable channel two (@bbm0902)

**You for the sign-in, then it is automatic.**

The code is ready. `scripts/data/channels.json` has the entry with
`enabled: false`, allocated the niches animals, space, biology, food and
weather. Channel one keeps tech, app, productivity, science and history, so the
two never publish the same fact.

1. Repeat step 1a for a new Desktop OAuth client, saved as
   `scripts/oauth-client-bbm0902.json`
2. Run the auth flow signed in as **@bbm0902**, saving credentials to
   `scripts/yt-credentials-bbm0902.json`
3. Add GitHub secrets `YT2_REFRESH_TOKEN`, `YT2_CLIENT_ID`, `YT2_CLIENT_SECRET`,
   `YT2_OAUTH_CLIENT_JSON`
4. Set `enabled: true` on `yt-bbm0902` in `channels.json`

```
gh workflow run daily-shorts.yml --repo bbmw96/bbmw0-technologies-ai -f channel=yt-bbm0902 -f count=3
```

---

## 5. Enable Instagram (@ai_game_odyssey)

**You. About 30 minutes.**

**Correction to an earlier version of this runbook.** It said you need a
Facebook Page and App Review taking days. That was out of date and wrong for
your situation. Meta shipped **Instagram API with Instagram Login** in July 2024,
which supports content publishing with **no Facebook account and no linked
Page**. Your account is already a Business account on up866106@gmail.com with no
Facebook attached, which is exactly what this path is for.

`scripts/instagram-upload.mjs` has been rewritten to use it:

| | Instagram Login (what we use) | Facebook Login (what we do not) |
|---|---|---|
| Host | `graph.instagram.com` | `graph.facebook.com` |
| Needs a Facebook Page | No | Yes |
| Permissions | `instagram_business_basic`, `instagram_business_content_publish` | `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` |
| Auth | `Authorization: Bearer` | `access_token` query param |

Using the Facebook-Login permission names on this path fails, which is a common
and confusing dead end.

### Steps

1. <https://developers.facebook.com/apps> then **Create app**
2. Add the **Instagram** product and choose **Business Login for Instagram**
3. Under permissions request `instagram_business_basic` and
   `instagram_business_content_publish`
4. Run the login flow as **@ai_game_odyssey** and exchange for a **long-lived**
   token. Short-lived tokens expire in an hour and will fail overnight
5. Get the numeric Instagram account id, which is not the @handle
6. Add GitHub secrets:
   - `IG_ACCESS_TOKEN`
   - `IG_USER_ID`
   - `PUBLIC_MEDIA_BASE_URL` (where rendered MP4s are publicly served over https)
7. Set `enabled: true` on `ig-aigameodyssey` in `scripts/data/channels.json`

### Media hosting is solved

Instagram cURLs the video from a public URL rather than accepting an upload, so
the MP4 must be reachable over https at the moment of publishing.

`scripts/publish-media.mjs` handles this by attaching the rendered videos to a
**GitHub Release** on `bbmw0-technologies-ai`, tagged `media-<date>`. Release
assets on a public repo are publicly fetchable, free, and do not bloat the git
history. The renderer calls it automatically, so there is nothing to configure.

Options considered and rejected:

| Approach | Why not |
|---|---|
| Commit MP4s to the repo | About 3MB x 5/day is roughly 5GB/year of permanent history |
| Vercel static hosting | Same problem: files must live in the repo |
| Workflow artifacts | **Require auth to download, so Instagram cannot fetch them.** They look public but are not |
| Vercel Blob or S3 | Works, but adds a paid dependency and more secrets |

Set `PUBLIC_MEDIA_BASE_URL` only if you want to override this with your own CDN.

**One dependency worth knowing:** this relies on `bbmw0-technologies-ai` staying
**public**. Make it private and release assets start requiring auth, and
Instagram fetches will fail. `publish-media.mjs` checks visibility first and
stops with a clear message rather than letting it fail opaquely later.

**Long-lived tokens last 60 days.** Diarise the refresh. When it lapses,
publishing stops and the daily report tells you after the fact.

Rate limit is 100 API-published posts per rolling 24 hours, far above your 2/day.

## Daily operation, once live

```
npm run report:daily                      # health check, exits 0/1/2
npm run compliance -- --date=$(date +%F)  # review a batch before it uploads
gh run list --repo bbmw96/bbmw0-technologies-ai --workflow=daily-shorts.yml
```

The pipeline runs itself at 09:00 UTC daily. Watch the report for:

| Signal | Meaning |
|---|---|
| `invalid_grant` | Token expired, redo step 1b |
| Topics unused below 10 | Auto-refill triggers, needs `AI_ENDPOINT` set |
| Over 40% blocked in a week | The generator is producing non-compliant output |
| Audio unknown licence above 0 | Someone added a bed without provenance |
| Tonal generator found | Instrumental audio reintroduced, breaks the halal rule |

---

## What is deliberately not automated

- **Signing in to Google or Meta.** Requires your password. It should stay that way.
- **Granting GitHub App permissions.** Requires your GitHub session.
- **Making the first videos public.** Watch the first few yourself before trusting the automation.

## Honest state of things

- Channel one: code ready, **blocked on step 1**
- Channel two: code ready, **blocked on step 4**
- Instagram: code ready and untested against the live API, **blocked on step 5**
- Content ops repo: `bbmw96/bbmw0-content-ops` created and seeded
- Media hosting: solved via GitHub Releases, no configuration needed

## Repository check

All 18 repos under `bbmw96` were audited. **There is no separate YouTube repo.**
`bbmw0-technologies-ai` is the video pipeline, and nothing was duplicated. The
only content-related repos are that one and the new `bbmw0-content-ops`.

The Instagram publisher has never run against a live account. Expect a round of
debugging on first use. The container-then-publish handshake, the status polling
and the error paths are built to the current documented spec, but Meta's error
messages are unhelpful and the usual culprits are a missing
`PUBLIC_MEDIA_BASE_URL` or the wrong permission names.
