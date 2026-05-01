# YouTube uploader

Two scripts. One you run once. One you run for every upload.

## Setup (one time)

1. **Google Cloud project.** Go to https://console.cloud.google.com and create a project (or pick an existing one).
2. **Enable the API.** APIs & Services > Library > "YouTube Data API v3" > Enable.
3. **OAuth consent screen.** APIs & Services > OAuth consent screen. Pick "External", fill in app name, your email, save. Add yourself as a test user.
4. **OAuth client.** APIs & Services > Credentials > Create Credentials > OAuth client ID > Application type "Desktop app". Download the JSON.
5. **Save the JSON** to `scripts/oauth-client.json` in this repo.
6. **Install deps and authenticate:**
   ```bash
   npm install googleapis
   npm run yt:auth
   ```
7. Open the printed URL, sign in to the YouTube account you want to publish from, copy the code back into the terminal. A `scripts/yt-credentials.json` file gets written with your refresh token.

Both `oauth-client.json` and `yt-credentials.json` are in `.gitignore`. Never commit them.

## Upload a video

```bash
npm run yt:upload -- \
  --file=out/whyvertical.mp4 \
  --title="Vertical first. Always." \
  --description="Why every preview in BBMW0 Technologies AI is 9:16 by default." \
  --tags="shorts,videoeditor,opensource,react,remotion" \
  --category=28 \
  --privacy=private \
  --shorts
```

Defaults to **private**. Always private until you trust the automation. Switch to `--privacy=public` once you've reviewed a few in YouTube Studio.

The `--shorts` flag appends `#Shorts` to the title and description so YouTube treats it as a Short.

### Categories

Common ones:

| ID | Category |
|----|----------|
| 22 | People & Blogs |
| 27 | Education |
| 28 | Science & Technology |
| 24 | Entertainment |

Full list: https://developers.google.com/youtube/v3/docs/videoCategories/list

## Quotas

The YouTube Data API has a daily quota (default 10,000 units per project). One upload costs ~1,600 units. So you can do ~6 uploads per day on the default quota — enough for the planned 5 Shorts/day.

If you hit the limit, request a quota increase in Google Cloud Console.

## What the scripts do NOT do

- They do not research trends.
- They do not pick titles or topics for you.
- They do not schedule.
- They do not auto-publish without a video file.

They just take an MP4 + metadata and upload it. You (or a separate scheduler — Windows Task Scheduler, GitHub Actions, Vercel cron) decide what gets uploaded when.
