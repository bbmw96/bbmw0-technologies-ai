// Six theme presets used by the themed shorts.
// Each theme defines the background, accent, secondary accent, and text colours.
// Backgrounds are full-screen radial or linear gradients chosen to feel calm
// (no glittery flashes, no glitches). Accents drive the highlights.

export type ThemeId =
  | "sunset"
  | "midnight"
  | "ocean"
  | "sandstorm"
  | "forest"
  | "neon";

export type Theme = {
  id: ThemeId;
  name: string;
  bg: string;           // CSS background (gradient)
  surface: string;      // card background
  border: string;
  text: string;
  textDim: string;
  accent: string;
  accent2: string;
  glow: string;         // accent with alpha for shadows
};

export const THEMES: Record<ThemeId, Theme> = {
  sunset: {
    id: "sunset",
    name: "Sunset",
    bg: "linear-gradient(160deg, #2a0e2e 0%, #5b1d3a 30%, #b3493d 65%, #f0a04b 100%)",
    surface: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.15)",
    text: "#fff8f0",
    textDim: "#ffd9b8",
    accent: "#ff8e3b",
    accent2: "#ff5cb1",
    glow: "rgba(255,142,59,0.4)",
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    bg: "linear-gradient(160deg, #050614 0%, #101437 40%, #1c1c4d 100%)",
    surface: "rgba(255,255,255,0.05)",
    border: "rgba(160,180,255,0.18)",
    text: "#f0f3ff",
    textDim: "#9aa6cf",
    accent: "#7c5cff",
    accent2: "#5cc8ff",
    glow: "rgba(124,92,255,0.5)",
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    bg: "linear-gradient(160deg, #02283a 0%, #054861 40%, #0f7a89 100%)",
    surface: "rgba(255,255,255,0.06)",
    border: "rgba(120,200,220,0.2)",
    text: "#eaf7fb",
    textDim: "#9bd2dd",
    accent: "#5cc8ff",
    accent2: "#22d3a8",
    glow: "rgba(92,200,255,0.4)",
  },
  sandstorm: {
    id: "sandstorm",
    name: "Sandstorm",
    bg: "linear-gradient(160deg, #2c1d0a 0%, #5a4118 40%, #a0742a 100%)",
    surface: "rgba(255,235,200,0.06)",
    border: "rgba(255,200,140,0.2)",
    text: "#fbf4e3",
    textDim: "#d8c298",
    accent: "#ffb547",
    accent2: "#ff8e3b",
    glow: "rgba(255,181,71,0.4)",
  },
  forest: {
    id: "forest",
    name: "Forest",
    bg: "linear-gradient(160deg, #0a1f12 0%, #143828 40%, #1f5d3c 100%)",
    surface: "rgba(220,255,235,0.05)",
    border: "rgba(140,220,180,0.18)",
    text: "#eafff2",
    textDim: "#a1d8b8",
    accent: "#22d3a8",
    accent2: "#9bd97b",
    glow: "rgba(34,211,168,0.4)",
  },
  neon: {
    id: "neon",
    name: "Neon",
    bg: "linear-gradient(160deg, #0a0014 0%, #1a0033 40%, #2a004d 100%)",
    surface: "rgba(255,255,255,0.06)",
    border: "rgba(255,92,200,0.25)",
    text: "#fff0fc",
    textDim: "#c799d4",
    accent: "#ff3ba8",
    accent2: "#5cf8ff",
    glow: "rgba(255,59,168,0.5)",
  },
};

export const FONT = "Inter, system-ui, -apple-system, sans-serif";
export const MONO =
  "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// Beat types — small, composable building blocks.
// Each themed short is just a sequence of beats.
export type Beat =
  | { kind: "title"; eyebrow?: string; text: string; sub?: string; durationInFrames: number }
  | { kind: "bigword"; text: string; durationInFrames: number }
  | { kind: "trio"; words: [string, string, string]; durationInFrames: number }
  | { kind: "stat"; number: string; label: string; durationInFrames: number }
  | { kind: "list"; heading: string; items: string[]; durationInFrames: number }
  | { kind: "cta"; headline: string; url: string; durationInFrames: number };
