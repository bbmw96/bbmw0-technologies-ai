# Adding channel two (@bbm0902)

The pipeline code is done. This is credentials only, about 10 minutes.

@bbm0902 is a different YouTube channel, so it needs its own Google sign-in and
its own OAuth client. You cannot reuse @bbmw.0's token: it authorises that
account, not this one.

## 1. Second OAuth client

<https://console.cloud.google.com/apis/credentials?project=yt-shorts-engine>

Create Credentials → OAuth client ID → **Desktop app** → name it
`BBMW0 bbm0902 Publisher` → Create → Download JSON → save as:

```
scripts\oauth-client-bbm0902.json
```

Same project is fine. One project can hold many clients, and YouTube Data API
v3 is already enabled there.

## 2. Sign in as @bbm0902

```
npm run yt:rotate -- --channel=yt-bbm0902
```

**Sign in with the Google account that owns @bbm0902, not @bbmw.0.** If the
browser is already signed in as the wrong account, use a private window or sign
out first. This is the single most common mistake here, and the failure is
silent: it will happily publish to the wrong channel.

That writes `YT2_REFRESH_TOKEN`, `YT2_CLIENT_ID`, `YT2_CLIENT_SECRET` and
`YT2_OAUTH_CLIENT_JSON` to GitHub without displaying any of them.

## 3. Confirm and publish

```
npm run channels
gh workflow run daily-shorts.yml --repo bbmw96/bbmw0-technologies-ai -f channel=yt-bbm0902 -f count=3
```

## Why the niches differ

@bbmw.0 gets tech, app, productivity, science, history.
@bbm0902 gets animals, space, biology, food, weather.

Deliberate. Two owned channels publishing the same fact is a mass-produced
content signal across the whole estate and can read to YouTube as reuploading.
The compliance gate blocks cross-channel duplicates at 45% title similarity,
stricter than the 55% used within a single channel. Separating the niches means
that rule should never need to fire.
