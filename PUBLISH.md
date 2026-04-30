# How to publish — step by step

This file walks you through publishing the project to GitHub and rendering the YouTube Short. Should take ~10 minutes total.

## 1. Push to GitHub

You need:
- [Git](https://git-scm.com/download/win) installed
- A GitHub account (you have one)
- Optional: the [GitHub CLI `gh`](https://cli.github.com/) — makes step (b) one command

### Option A — using the GitHub CLI (fastest)

```powershell
cd "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"

git init -b main
git add .
git commit -m "Initial commit: BBMW0 Technologies AI"

# Create the repo on GitHub AND push, in one step:
gh repo create bbmw0-technologies-ai --public --source=. --remote=origin --push
```

If you've never used `gh` on this machine, it'll prompt you to log in once.

### Option B — without `gh` (manual)

1. Go to <https://github.com/new>, create a repo called `bbmw0-technologies-ai`. **Don't** initialize with a README, .gitignore, or license — we already have those.
2. Copy the repo URL it shows you (looks like `https://github.com/<you>/bbmw0-technologies-ai.git`).
3. Run:

   ```powershell
   cd "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"

   git init -b main
   git add .
   git commit -m "Initial commit: BBMW0 Technologies AI"
   git remote add origin https://github.com/<you>/bbmw0-technologies-ai.git
   git push -u origin main
   ```

That's it — the project is now public on GitHub. Open the repo URL and the README renders the badges, screenshots, and feature list.

---

## 2. Install + run locally

```powershell
cd "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"
npm install
npm run dev
```

Vite will print something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

Open the **Network** URL on your phone (same Wi‑Fi as your PC) to use the editor with real touch.

---

## 3. Render the 60‑second YouTube Short

```powershell
cd "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"
npm run render:short
```

First run downloads a Chrome Headless Shell (~150 MB) — happens once. After that:
- Output: `out/short.mp4`
- Resolution: 1080 × 1920 (vertical, perfect for Shorts)
- Length: 60.0 s exactly
- Codec: H.264 + AAC (universal compatibility)

---

## 4. Upload to YouTube Shorts

1. Open the YouTube app on your phone.
2. Tap **+** → **Create a Short**.
3. Tap the gallery icon and pick `out/short.mp4` (transfer it to your phone first via USB, AirDrop, or Google Drive).
4. Title suggestion: **"I built a Shorts editor in one day. Here's how."**
5. Description suggestion:

   > Mobile-first, AI-assisted Shorts editor built on Remotion. Open source: https://github.com/<you>/bbmw0-technologies-ai
   >
   > #remotion #typescript #react #shortsapp #buildinpublic

6. Hashtags help the Shorts algorithm — keep them in the description, not the title.

---

## 5. After it's live

A few things you can do next:

- Pin the Short on your channel.
- Tweet/X-post the GitHub URL with the Short embedded — links from social tend to send the first 100 stargazers.
- Submit to <https://news.ycombinator.com/submit> with the title "Show HN: BBMW0 Technologies AI – mobile‑first Shorts editor on Remotion".
- Add a 30‑second GIF of the editor at the top of the README (use `ffmpeg` to trim part of `short.mp4`):

  ```powershell
  ffmpeg -ss 26 -t 4 -i out\short.mp4 -vf "fps=15,scale=540:-1" out\demo.gif
  ```

Good luck. 🚀
