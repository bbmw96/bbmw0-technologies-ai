// Six 40-second themed Shorts. Each picks a theme + a list of beats + a
// drum loop. 40s = 1200 frames @ 30fps.
//
// Sound files live in public/sounds/. If a file is missing Remotion just
// skips the audio without crashing. Drop drums-1..4.mp3, rain.mp3,
// thunder.mp3, wind.mp3 into public/sounds/ when you have them.

import React from "react";
import { ThemedShort } from "./ThemedShort";
import type { Beat } from "./themes";

const URL = "bbmw0-technologies-ai.vercel.app";

type ShortProps = { url?: string; audioUrl?: string };

// =====================================================================
// 1. Consensus  (Sunset)  — 5 AIs, one prompt
// =====================================================================

const consensusBeats = (url: string): Beat[] => [
  { kind: "title", eyebrow: "Five brains", text: "One prompt.", sub: "Five different answers.", durationInFrames: 150 }, // 5s
  { kind: "trio", words: ["Claude.", "GPT.", "Gemini."], durationInFrames: 150 }, // 5s
  { kind: "trio", words: ["Perplexity.", "Llama.", "All five."], durationInFrames: 150 }, // 5s
  { kind: "bigword", text: "Best of each.", durationInFrames: 180 }, // 6s
  { kind: "list", heading: "Consensus mode", items: ["Asks every model in parallel", "Merges by majority vote", "One sharper answer"], durationInFrames: 270 }, // 9s
  { kind: "stat", number: "5×", label: "the perspective. One result.", durationInFrames: 150 }, // 5s
  { kind: "cta", headline: "Try it.", url, durationInFrames: 150 }, // 5s
];

export const ConsensusShort: React.FC<ShortProps> = ({ url = URL, audioUrl = "sounds/drums-1.mp3" }) => (
  <ThemedShort themeId="sunset" beats={consensusBeats(url)} audioUrl={audioUrl} />
);
export const consensusShortDefaults: ShortProps = { url: URL, audioUrl: "sounds/drums-1.mp3" };

// =====================================================================
// 2. PhoneInstall  (Midnight)  — install as a real app on your phone
// =====================================================================

const phoneInstallBeats = (url: string): Beat[] => [
  { kind: "title", eyebrow: "No app store", text: "Tap, install,", sub: "ready in three seconds.", durationInFrames: 150 },
  { kind: "bigword", text: "On your phone.", durationInFrames: 150 },
  { kind: "list", heading: "Add to home screen", items: ["iPhone: Safari → Share → Add", "Android: Chrome → ⋮ → Install", "Done"], durationInFrames: 300 },
  { kind: "trio", words: ["Full-screen.", "Offline.", "Free."], durationInFrames: 180 },
  { kind: "stat", number: "0 MB", label: "to download. PWA, not native.", durationInFrames: 150 },
  { kind: "title", text: "Looks native.", sub: "Acts native. Isn't native.", durationInFrames: 120 },
  { kind: "cta", headline: "Install yours.", url, durationInFrames: 150 },
];

export const PhoneInstallShort: React.FC<ShortProps> = ({ url = URL, audioUrl = "sounds/drums-2.mp3" }) => (
  <ThemedShort themeId="midnight" beats={phoneInstallBeats(url)} audioUrl={audioUrl} />
);
export const phoneInstallShortDefaults: ShortProps = { url: URL, audioUrl: "sounds/drums-2.mp3" };

// =====================================================================
// 3. Languages  (Ocean)  — speaks 10 languages including RTL
// =====================================================================

const languagesBeats = (url: string): Beat[] => [
  { kind: "title", eyebrow: "Built for everyone", text: "Speaks ten.", sub: "Including right-to-left Arabic.", durationInFrames: 150 },
  { kind: "stat", number: "10", label: "languages, auto-detected from your device.", durationInFrames: 180 },
  { kind: "list", heading: "On launch", items: ["English, Español, Français, Deutsch", "Português, 日本語, 中文, العربية", "हिन्दी, Русский"], durationInFrames: 300 },
  { kind: "bigword", text: "RTL works.", durationInFrames: 150 },
  { kind: "trio", words: ["Switch.", "Translate.", "Add yours."], durationInFrames: 180 },
  { kind: "title", text: "One file.", sub: "src/i18n.ts. Copy a block, translate, ship.", durationInFrames: 90 },
  { kind: "cta", headline: "Pick your language.", url, durationInFrames: 150 },
];

export const LanguagesShort: React.FC<ShortProps> = ({ url = URL, audioUrl = "sounds/drums-3.mp3" }) => (
  <ThemedShort themeId="ocean" beats={languagesBeats(url)} audioUrl={audioUrl} />
);
export const languagesShortDefaults: ShortProps = { url: URL, audioUrl: "sounds/drums-3.mp3" };

// =====================================================================
// 4. Presets  (Sandstorm)  — 5 polished scene presets
// =====================================================================

const presetsBeats = (url: string): Beat[] => [
  { kind: "title", eyebrow: "Five presets", text: "Ready to ship.", sub: "Animated, customisable, fast.", durationInFrames: 150 },
  { kind: "trio", words: ["Hook.", "Title.", "Bullets."], durationInFrames: 180 },
  { kind: "trio", words: ["Quote.", "CTA.", "Done."], durationInFrames: 150 },
  { kind: "list", heading: "Each preset is", items: ["A pure React component", "Spring-animated by default", "Edit text, colours, timing"], durationInFrames: 300 },
  { kind: "stat", number: "5", label: "presets. Add your own in 30 lines.", durationInFrames: 150 },
  { kind: "bigword", text: "Open source.", durationInFrames: 120 },
  { kind: "cta", headline: "Pick a preset.", url, durationInFrames: 150 },
];

export const PresetsShort: React.FC<ShortProps> = ({ url = URL, audioUrl = "sounds/drums-4.mp3" }) => (
  <ThemedShort themeId="sandstorm" beats={presetsBeats(url)} audioUrl={audioUrl} />
);
export const presetsShortDefaults: ShortProps = { url: URL, audioUrl: "sounds/drums-4.mp3" };

// =====================================================================
// 5. OpenSource  (Forest)  — free, MIT, fork it
// =====================================================================

const openSourceBeats = (url: string): Beat[] => [
  { kind: "title", eyebrow: "No catch", text: "Free forever.", sub: "MIT licence. Open source.", durationInFrames: 150 },
  { kind: "stat", number: "£0", label: "to use, fork, ship, sell.", durationInFrames: 180 },
  { kind: "list", heading: "What you get", items: ["The whole source on GitHub", "MIT licence (use it however)", "No telemetry, no lock-in"], durationInFrames: 300 },
  { kind: "trio", words: ["Read it.", "Fork it.", "Make it yours."], durationInFrames: 180 },
  { kind: "bigword", text: "Forever free.", durationInFrames: 150 },
  { kind: "title", text: "Built by one person.", sub: "Want to help? PRs welcome.", durationInFrames: 90 },
  { kind: "cta", headline: "Star the repo.", url, durationInFrames: 150 },
];

export const OpenSourceShort: React.FC<ShortProps> = ({ url = URL, audioUrl = "sounds/rain.mp3" }) => (
  <ThemedShort themeId="forest" beats={openSourceBeats(url)} audioUrl={audioUrl} audioVolume={0.35} />
);
export const openSourceShortDefaults: ShortProps = { url: URL, audioUrl: "sounds/rain.mp3" };

// =====================================================================
// 6. MobileFirst  (Neon)  — design philosophy
// =====================================================================

const mobileFirstBeats = (url: string): Beat[] => [
  { kind: "title", eyebrow: "The whole point", text: "Built for the phone.", sub: "Desktop is just a wider screen.", durationInFrames: 150 },
  { kind: "trio", words: ["Touch.", "Swipe.", "Tap."], durationInFrames: 180 },
  { kind: "stat", number: "9:16", label: "preview by default. What you see is what gets posted.", durationInFrames: 180 },
  { kind: "list", heading: "Design rules", items: ["Tap targets ≥ 44pt", "One thumb operation", "No hover, no menus"], durationInFrames: 270 },
  { kind: "bigword", text: "Phone-first.", durationInFrames: 150 },
  { kind: "title", text: "Every other tool", sub: "is a desktop app, squeezed.", durationInFrames: 120 },
  { kind: "cta", headline: "Try the difference.", url, durationInFrames: 150 },
];

export const MobileFirstShort: React.FC<ShortProps> = ({ url = URL, audioUrl = "sounds/thunder.mp3" }) => (
  <ThemedShort themeId="neon" beats={mobileFirstBeats(url)} audioUrl={audioUrl} audioVolume={0.4} />
);
export const mobileFirstShortDefaults: ShortProps = { url: URL, audioUrl: "sounds/thunder.mp3" };
