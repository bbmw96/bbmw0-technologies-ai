# BBMW0 publishing runbook

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
gives `ENOENT ... package.json`, which is what happened before.

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

`bbm0902-daily-influencer-brief` generates its brief correctly but every push
fails with 403. The Claude Code GitHub App has read-only scope on
`bbmw96/bbmw0-technologies`, so commit `a925fa6` and everything after it is
stranded locally.

1. Open <https://github.com/settings/installations>
2. Click **Claude**, then **Repository access**
3. Ensure `bbmw96/bbmw0-technologies` is selected with **Read and write**

Then re-run the routine. The stranded commits will push.

---

## 3. Fix the routine repo association

**You. About 30 seconds.**

`BBMW0 Daily Content Report` is attached to `bbmw96/verifiq`, which is the IFC
compliance product and unrelated to social reporting. Harmless, but it means the
routine has no useful repo context.

Open the routine, click the pencil icon, change the repository to
`bbmw96/bbmw0-technologies-ai`.

---

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

**You. This is the longest one, allow an hour.** It is a genuine platform
integration, not a config change.

Instagram will not accept a file upload. It fetches the video from a public
https URL, so the MP4 must be hosted before publishing. That is the main
architectural difference from YouTube.

### Prerequisites

- The account must be **Business or Creator**, not personal
- It must be linked to a Facebook Page
- A Meta app with the **instagram_content_publish** permission
- App Review approval, which takes days, unless the account is a test user

### Steps

1. <https://developers.facebook.com/apps> then create an app of type **Business**
2. Add the **Instagram Graph API** product
3. Generate a **long-lived** access token with `instagram_content_publish` and
   `instagram_basic`. Short-lived tokens expire in an hour and will fail overnight
4. Find the Instagram Business account id, which is a number and not the @handle
5. Add GitHub secrets:
   - `IG_ACCESS_TOKEN`
   - `IG_USER_ID`
   - `PUBLIC_MEDIA_BASE_URL` (where rendered MP4s are publicly served)
6. Set `enabled: true` on `ig-aigameodyssey` in `channels.json`

**Long-lived tokens last 60 days.** Diarise the refresh, or publishing stops
silently. The daily report will flag the failures, but only after they happen.

---

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

The Instagram publisher has never run against a real account. Expect one or two
rounds of debugging on first use. The container-then-publish handshake and the
60 to 90 second transcode wait are handled, but Meta's error messages are
famously unhelpful and the most common cause is the account not being a Business
account.
