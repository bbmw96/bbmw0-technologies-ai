# Deploy BBMW0 Technologies AI

Two ways to ship this to a public URL anyone can use.

---

## Option A — One‑click Vercel deploy (easiest, ~2 minutes)

1. **Click the button** in the README:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbbmw96%2Fbbmw0-technologies-ai)

2. **Sign in to Vercel** with your GitHub account (free tier is fine).

3. **Pick a project name** — Vercel suggests `bbmw0-technologies-ai`. Keep it or rename.

4. Click **Deploy**.

5. Wait ~90 seconds. You'll get a URL like `https://bbmw0-technologies-ai.vercel.app`.

That's it. Anyone in the world can now open that URL — on iPhone, Android, desktop — and use the editor in any of 10 languages.

> **Heads-up:** without API keys, the AI Fill button uses a local heuristic. To unlock real LLMs, see [Connect AI providers](#connect-ai-providers) below.

---

## Option B — Manual (for full control)

```bash
# 1. Install the Vercel CLI
npm i -g vercel

# 2. Inside the project folder
cd "C:\Users\BBMW0\OneDrive\Documents\Claude\Projects\Video Editing\bbmw0-technologies-ai"
vercel

# Follow the prompts: it auto-detects Vite, picks the right build command, and deploys.

# 3. To make it the production URL:
vercel --prod
```

---

## Connect AI providers

The AI Fill bar can call **OpenAI · Anthropic · Gemini · Perplexity · Groq (Llama)** — alone, or all together (consensus mode).

Add API keys in Vercel:

1. Open your project at <https://vercel.com/dashboard>.
2. Click your `bbmw0-technologies-ai` project.
3. Go to **Settings → Environment Variables**.
4. Add any of these (you only need one to make the AI Bar real):

   | Name | Get a key |
   |---|---|
   | `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
   | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
   | `GOOGLE_GEMINI_API_KEY` | https://aistudio.google.com/apikey *(free tier)* |
   | `PERPLEXITY_API_KEY` | https://www.perplexity.ai/settings/api |
   | `GROQ_API_KEY` | https://console.groq.com/keys *(free tier)* |

5. Redeploy from the **Deployments** tab, or push any commit.

**Cheapest path to real AI:** Groq has a generous free tier and runs Llama 3 — set `GROQ_API_KEY` and you're done. Free tier is enough for thousands of "Fill" taps a month. Gemini also has a free tier.

**Picking which provider runs:** the AI Bar in the app has a flag‑pill on the left. Tap it to choose:

- **Auto** — uses the highest‑priority configured provider.
- **All (consensus)** — calls every configured provider in parallel and merges answers (most common value wins per field).
- **Specific** — pin to Claude / GPT / Gemini / Perplexity / Llama.
- **Local heuristic** — never calls the network, useful offline.

---

## Custom domain (optional)

In Vercel: **Settings → Domains → Add**. Point a CNAME from your domain to `cname.vercel-dns.com`. You'll have HTTPS automatically.

---

## Render videos in the cloud

Currently `npm run render:short` and `npm run render:tutorial` need to run on a machine with Node + Chrome. To make rendering work for hosted users (so they tap "Export" and get an MP4):

- Add `@remotion/lambda` and an AWS account (~$0.001 per render).
- Or use [Remotion Cloud Run](https://www.remotion.dev/docs/cloudrun/setup) for a Google Cloud version.

This is a "next step" — see the roadmap in the README.
