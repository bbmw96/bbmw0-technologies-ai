<div align="center">

<img src="public/icon-512.png" alt="BBMW0 Technologies AI" width="120" height="120" />

# BBMW0 Technologies AI

### Mobile‑first, Shorts‑native video editor.

Touch UI · 9:16 by default · 10 languages · PWA‑installable
**Multi‑LLM consensus AI** (Claude · GPT · Gemini · Perplexity · Llama) · Built on Remotion

<br/>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbbmw96%2Fbbmw0-technologies-ai&env=ANTHROPIC_API_KEY,OPENAI_API_KEY,GOOGLE_GEMINI_API_KEY,PERPLEXITY_API_KEY,GROQ_API_KEY&envDescription=Optional%20%E2%80%94%20add%20any%20one%20to%20enable%20the%20real%20AI%20Bar.%20All%20optional%3B%20editor%20works%20without%20keys.&envLink=https%3A%2F%2Fgithub.com%2Fbbmw96%2Fbbmw0-technologies-ai%2Fblob%2Fmain%2FDEPLOY.md%23connect-ai-providers)

**☝️ Click that to publish your own copy in 90 seconds.** Free. No setup.

[Try it](#try-it) · [AI providers](#ai-providers) · [Install on phone](#install-on-iphone--android) · [Languages](#languages) · [Render a Short](#render-a-short) · [Deploy guide](DEPLOY.md) · [License](#license)

</div>

---

## Why

Most video editors were built for desktops, then squeezed onto phones. **BBMW0 Technologies AI starts from the phone.** Vertical preview is the default, the editor is one swipe away, exporting to MP4 takes one tap, the whole UI works in 10 languages with proper RTL support, and the AI bar can talk to **5 different LLMs at once** and merge their answers. Powered by [Remotion](https://remotion.dev) — every frame is real React code, fully programmable.

## Features

- **9:16 vertical preview** — what you see is what you'll post.
- **Swipeable scene picker** — Hook → Title → Bullets → Quote → CTA in one gesture.
- **Touch‑friendly prop editor** — text, color swatches, sliders. No nested menus.
- **Multi‑LLM AI Bar** — pick Claude, GPT, Gemini, Perplexity, or Llama. Or **consensus mode** asks them all in parallel and merges. Falls back to a local heuristic when offline.
- **One‑tap export** to MP4 in Shorts‑native 1080×1920.
- **PWA‑installable** — add to iPhone/Android home screen, runs full‑screen, works offline.
- **10 languages** including RTL Arabic — auto‑detects from device locale.
- **5 polished presets** + a 60‑second Showcase + a 60‑second Tutorial composition.

## Try it

**Hosted (recommended):** click the giant Vercel button above — you'll have a public URL in ~90 seconds.

**Locally:**

```bash
git clone https://github.com/bbmw96/bbmw0-technologies-ai
cd bbmw0-technologies-ai
npm install
npm run dev
```

Open the **Network** URL Vite prints (e.g. `http://192.168.1.42:5173`) on your phone (same Wi‑Fi) for real touch.

## AI providers

The AI Bar can call any of these — pick one in the flag‑pill picker, or use **consensus** mode to ask all of them at once:

| Provider | Model | Free tier? | Get a key |
|---|---|---|---|
| 🧠 **Anthropic Claude** | `claude-haiku-4-5` | No (paid only) | https://console.anthropic.com/settings/keys |
| 🤖 **OpenAI GPT** | `gpt-4o-mini` | No (paid only) | https://platform.openai.com/api-keys |
| 💎 **Google Gemini** | `gemini-1.5-flash` | **Yes** | https://aistudio.google.com/apikey |
| 🔎 **Perplexity** | `sonar` | No (paid only) | https://www.perplexity.ai/settings/api |
| 🦙 **Llama via Groq** | `llama-3.3-70b-versatile` | **Yes (generous)** | https://console.groq.com/keys |

**Without any keys:** the AI Bar still works — it falls back to a smart local heuristic that runs entirely in your browser.

**Cheapest real‑AI setup:** add `GROQ_API_KEY` (free) to Vercel. That's it.

**Why "consensus" mode?** Different models have different strengths — Claude is great at copy, GPT is reliable, Llama via Groq is fast, Gemini is multimodal. Asking all of them in parallel and taking the majority vote per field gives you better results than any single model.

How to add keys to Vercel: see [DEPLOY.md → Connect AI providers](DEPLOY.md#connect-ai-providers).

## Install on iPhone / Android

Once the app is hosted at a public URL:

**iPhone (Safari):**
1. Open the URL in Safari.
2. Tap the Share button (square with up arrow).
3. Scroll down → "Add to Home Screen" → Add.

**Android (Chrome):**
1. Open the URL in Chrome.
2. Tap ⋮ → "Install app" (or "Add to Home Screen").

The PWA includes a service worker — once opened, it works **offline**.

## Languages

Auto‑detects from `navigator.language`. Tap the flag pill in the header to switch:

| Code | Language | RTL |
|------|----------|-----|
| `en` | English | |
| `es` | Español | |
| `fr` | Français | |
| `de` | Deutsch | |
| `pt` | Português | |
| `ja` | 日本語 | |
| `zh` | 中文 (简体) | |
| `ar` | العربية | ✓ |
| `hi` | हिन्दी | |
| `ru` | Русский | |

Add a new language by editing `src/i18n.ts`.

## Render a Short

```bash
npm run render:short      # → out/short.mp4 (60s marketing reel)
npm run render:tutorial   # → out/tutorial.mp4 (60s how-it-works)
```

Or any individual scene:

```bash
npx remotion render src/compositions/registry.tsx Hook out/hook.mp4
```

## Architecture

```
src/
├── App.tsx                    # Mobile-first layout
├── main.tsx                   # React entry + service worker
├── styles.css                 # Design system + RTL + PWA polish
├── i18n.ts                    # 10-language string map
├── state.ts                   # Editor state hook
├── vite-env.d.ts
├── components/
│   ├── SceneCarousel.tsx      # Swipe between scene presets
│   ├── PropEditor.tsx         # Per-scene form
│   ├── ExportModal.tsx        # Download props.json + render command
│   ├── AIBar.tsx              # Multi-provider AI prompt
│   └── LangSwitcher.tsx       # Flag pill + dropdown
└── compositions/
    ├── Hook|Title|Bullets|Quote|CTA.tsx
    ├── Showcase.tsx           # 60s marketing reel
    ├── Tutorial.tsx           # 60s how-it-works explainer
    └── registry.tsx           # registerRoot for the Remotion CLI

api/
└── ai.ts                      # Vercel serverless: 5-provider AI router
                               # (OpenAI, Anthropic, Gemini, Perplexity, Groq)

public/
├── manifest.webmanifest, sw.js, favicon.svg
├── icon-{192,512,maskable}.png, apple-touch-icon.png
```

## Roadmap

- [x] PWA install + offline.
- [x] 10 languages with RTL.
- [x] Multi-LLM AI Bar (5 providers, consensus mode).
- [ ] **In‑browser MP4 export** via WebCodecs.
- [ ] **Server‑side render** via `@remotion/lambda`.
- [ ] **Audio uploads** + ducking.
- [ ] **Caption auto‑sync** with `@remotion/captions`.
- [ ] **App Store / Play Store** wrapper via Capacitor.
- [ ] **More languages**: id, tr, vi, ko, it, nl, pl, th.

## Tech

- [Remotion 4](https://remotion.dev) — video framework
- [@remotion/player](https://www.npmjs.com/package/@remotion/player) — in‑browser preview
- React 18 + TypeScript 5
- Vite 5 + service worker
- Vercel (hosting + serverless AI router)

## License

[MIT](./LICENSE). Note Remotion has a [special license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) that may require a company license in some commercial cases.

---

<p align="center"><sub>Built mobile‑first. For everyone, in any language, anywhere — powered by 5 AIs working as one.</sub></p>
