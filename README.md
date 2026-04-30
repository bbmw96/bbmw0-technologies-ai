<div align="center">

# BBMW0 Technologies AI

**Mobile‑first, Shorts‑native video editor.**
Touch UI · 9:16 by default · AI‑assisted · 10 languages · PWA‑installable · Built on Remotion.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbbmw96%2Fbbmw0-technologies-ai)

[Try it](#try-it) · [Install on phone](#install-on-iphone--android) · [Languages](#languages) · [Render a Short](#render-a-short) · [License](#license)

</div>

---

## Why

Most video editors were built for desktops, then squeezed onto phones. **BBMW0 Technologies AI starts from the phone.** Vertical preview is the default, the editor is one swipe away, exporting to MP4 takes one tap, and the whole UI works in 10 languages with proper RTL support. Powered by [Remotion](https://remotion.dev) — every frame is real React code, fully programmable.

## Features

- **9:16 vertical preview** — what you see is what you'll post.
- **Swipeable scene picker** — Hook → Title → Bullets → Quote → CTA in one gesture.
- **Touch‑friendly prop editor** — text, color swatches, sliders. No nested menus.
- **AI prompt → scene fill** — describe your video, get sensible content in 8 fields. Heuristic by default, pluggable for an LLM.
- **One‑tap export** to MP4 in Shorts‑native 1080×1920.
- **PWA‑installable** — add to iPhone/Android home screen, runs full‑screen, works offline.
- **10 languages** including RTL Arabic — auto‑detects from device locale, override anytime.
- **5 polished presets** + a 60‑second Showcase + a 60‑second Tutorial composition ready to render straight to YouTube Shorts.

## Try it

**Hosted demo (deploy your own with the button above):** clone, push to GitHub, click "Deploy to Vercel" — you'll have a public URL in ~90 seconds, free.

**Locally:**

```bash
git clone https://github.com/bbmw96/bbmw0-technologies-ai
cd bbmw0-technologies-ai
npm install
npm run dev
```

Then open the **Network** URL Vite prints (e.g. `http://192.168.1.42:5173`) on a phone on the same Wi‑Fi to use real touch.

## Install on iPhone / Android

Once the app is hosted at a public URL (your own deploy or a friend's):

**iPhone (Safari):**
1. Open the URL in Safari.
2. Tap the Share button (square with up arrow).
3. Scroll down → "Add to Home Screen" → Add.
4. The icon now lives on your home screen like a native app, opens full‑screen.

**Android (Chrome):**
1. Open the URL in Chrome.
2. Tap the ⋮ menu → "Install app" (or "Add to Home Screen").
3. Tap Install. Done.

The PWA includes a service worker, so once it's been opened once, it works **offline** — useful on planes, in subways, anywhere.

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

Add a new language by editing `src/i18n.ts` — every string is in one place, copy a block and translate.

## Render a Short

The 60‑second showcase + 60‑second tutorial videos:

```bash
npm run render:short      # → out/short.mp4 (60s marketing reel)
npm run render:tutorial   # → out/tutorial.mp4 (60s how-it-works)
```

Or render any individual scene:

```bash
npx remotion render src/compositions/registry.tsx Hook out/hook.mp4
```

(Run `npx remotion compositions src/compositions/registry.tsx` to list all scene IDs.)

## Deploy your own (free)

The "Deploy with Vercel" button at the top forks this repo into your GitHub and hosts it at a `*.vercel.app` URL within 90 seconds — free tier, generous bandwidth. Everything in the editor works on the hosted version; only the **render‑to‑MP4** step requires running `npm run render:*` locally (because rendering needs Node + Chrome).

For server‑side rendering on the hosted version, see the roadmap below.

## Architecture

```
src/
├── App.tsx                    # Mobile-first layout, lang switcher, player, footer
├── main.tsx                   # React entry + service worker registration
├── styles.css                 # Design system (CSS vars, RTL adjustments, PWA polish)
├── i18n.ts                    # 10-language string map + useLang() hook
├── state.ts                   # Editor state hook + color palette
├── vite-env.d.ts              # Vite type augmentation
├── components/
│   ├── SceneCarousel.tsx      # Swipe between scene presets
│   ├── PropEditor.tsx         # Per-scene form (text/color/list)
│   ├── ExportModal.tsx        # Download props.json + render command
│   ├── AIBar.tsx              # Heuristic prompt → scene fill
│   └── LangSwitcher.tsx       # Flag pill + dropdown menu
└── compositions/
    ├── Hook.tsx Title.tsx Bullets.tsx Quote.tsx CTA.tsx
    ├── Showcase.tsx           # 60s marketing reel
    ├── Tutorial.tsx           # 60s how-it-works explainer
    └── registry.tsx           # registerRoot for the Remotion CLI

public/
├── manifest.webmanifest       # PWA app metadata
├── sw.js                      # Service worker (offline + cache)
├── icon-{192,512,maskable}.png, apple-touch-icon.png, favicon.svg
```

## Roadmap

- [ ] **In‑browser MP4 export** via WebCodecs (no CLI step on supported browsers).
- [ ] **Server‑side render** via Vercel API route + `@remotion/lambda` (so hosted users can export without Node locally).
- [ ] **Real LLM** plumbing for the AI bar (wire to OpenAI / Anthropic / local).
- [ ] **Audio uploads** + ducking helpers.
- [ ] **Caption auto‑sync** with `@remotion/captions`.
- [ ] **App Store / Play Store** wrapper via Capacitor.
- [ ] **More languages**: id, tr, vi, ko, it, nl, pl, th.

## Tech

- [Remotion 4](https://remotion.dev) for the video framework
- [@remotion/player](https://www.npmjs.com/package/@remotion/player) for in‑browser preview
- React 18 + TypeScript 5
- Vite 5 (build) + service worker (offline)
- Vercel (hosting)

## License

[MIT](./LICENSE). Note that Remotion has a [special license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) that may require a company license in some commercial cases.

---

<p align="center"><sub>Built mobile‑first. For everyone, in any language, anywhere.</sub></p>
