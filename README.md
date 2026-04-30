<div align="center">

# BBMW0 Technologies AI

**Mobile‑first, Shorts‑native video editor.**
Touch UI · 9:16 by default · AI‑assisted · Built on Remotion.

[Demo](#demo) · [Quick start](#quick-start) · [Render a Short](#render-a-short) · [License](#license)

</div>

---

## Why

Most video editors were built for desktops, then squeezed onto phones. **BBMW0 Technologies AI starts from the phone.** Vertical preview is the default, the editor is one swipe away, and exporting to MP4 takes one tap. Powered by [Remotion](https://remotion.dev) — so every frame is real React code, fully programmable.

## Features

- **9:16 vertical preview** front and center — what you see is what you'll post.
- **Swipeable scene picker** for instant Hook → Title → Bullets → Quote → CTA flows.
- **Touch‑friendly prop editor** — text, color swatches, sliders. No nested menus.
- **AI prompt → scene fill** in one button (heuristic; pluggable for an LLM).
- **One‑tap export** to MP4 in Shorts‑native 1080×1920.
- **Five polished presets** with spring animations, gradients, and timing baked in.
- **Plus a 60‑second Showcase composition** ready to render straight to YouTube Shorts.

## Demo

The included `Showcase` composition is a 60‑second YouTube Short:

| Time | Scene | What happens |
|------|-------|--------------|
| 0–5s | Hook | "POV: you stop scrolling" with bouncing emoji |
| 5–10s | Title | Brand reveal with animated underline |
| 10–17s | Bullets | Three reasons it's different |
| 17–22s | Quote | "If you can scroll it, you can edit it." |
| 22–26s | Hook | "Now look how it works ↓" |
| 26–50s | Tool demo | Animated phone mockup, scenes auto‑rotate |
| 50–60s | CTA | GitHub URL with pulsing arrow |

Render command (after install):

```bash
npm run render:short
```

Outputs `out/short.mp4` at 1080×1920 — drop directly into the YouTube app.

## Quick start

Requires Node 18+ on macOS / Windows / Linux.

```bash
git clone https://github.com/<your-handle>/bbmw0-technologies-ai
cd bbmw0-technologies-ai
npm install
npm run dev
```

Open <http://localhost:5173> on a desktop or phone (same Wi‑Fi, use the LAN URL Vite prints).

## Render a Short

The editor exports your current scene's props as `props.json`, plus a one‑line CLI command:

```bash
npx remotion render src/compositions/registry.tsx Hook out/hook.mp4 --props=./props.json
```

To render the **whole 60‑second Showcase** with the defaults:

```bash
npm run render:short
```

To render any other scene:

```bash
npx remotion render src/compositions/registry.tsx Bullets out/bullets.mp4
```

(Run `npx remotion compositions src/compositions/registry.tsx` to list all scene IDs.)

## Architecture

```
src/
├── App.tsx                    # Top-level mobile-first layout
├── main.tsx                   # React entry
├── styles.css                 # Design system (CSS vars, tokens)
├── state.ts                   # Editor state hook + color palette
├── components/
│   ├── SceneCarousel.tsx      # Swipe between scene presets
│   ├── PropEditor.tsx         # Per-scene form (text/color/list)
│   ├── ExportModal.tsx        # Download props.json + render command
│   └── AIBar.tsx              # Heuristic prompt → scene fill
└── compositions/
    ├── Hook.tsx
    ├── Title.tsx
    ├── Bullets.tsx
    ├── Quote.tsx
    ├── CTA.tsx
    ├── Showcase.tsx           # 60s YouTube Short
    └── registry.tsx           # registerRoot for the Remotion CLI
```

Compositions are pure Remotion components — animate via `useCurrentFrame()` + `interpolate()` / `spring()`. Add a new preset by dropping a `.tsx` in `src/compositions/`, exporting a default props object, and adding it to the array in `registry.tsx`.

## Roadmap

- [ ] Real LLM integration for the AI bar (currently a heuristic for offline demos).
- [ ] In‑browser MP4 export via WebCodecs (no CLI step on supported browsers).
- [ ] Audio track upload + ducking helpers.
- [ ] Caption auto‑sync with `@remotion/captions`.
- [ ] PWA install + share‑target so you can `Share to BBMW0` from any app.

## Tech

- [Remotion](https://remotion.dev) for video framework
- [@remotion/player](https://www.npmjs.com/package/@remotion/player) for in‑browser preview
- React 18 + TypeScript 5
- Vite 5

## License

[MIT](./LICENSE). Note that Remotion itself has a [special license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) that may require a company license in some commercial cases.

---

<p align="center"><sub>Built with ❤️ on a phone, in a hurry.</sub></p>
