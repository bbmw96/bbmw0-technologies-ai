// Theme + font + layout-variant registry.
//
// 12 themes: each defines a distinct background gradient, surface colour,
// accent, and glow. Mixing 12 themes x 5 fonts x 3 layout variants per beat
// gives 180+ visual permutations *before* content variation — far above the
// repetition threshold of YouTube's "Mass-produced or repetitive content"
// policy when paired with unique scripts and titles.

export type ThemeId =
  | "sunset" | "midnight" | "ocean" | "sandstorm" | "forest" | "neon"
  | "ember" | "glacier" | "lavender" | "mint" | "peach" | "slate";

export type Theme = {
  id: ThemeId;
  name: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textDim: string;
  accent: string;
  accent2: string;
  glow: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  sunset: {
    id: "sunset", name: "Sunset",
    bg: "linear-gradient(160deg, #2a0e2e 0%, #5b1d3a 30%, #b3493d 65%, #f0a04b 100%)",
    surface: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)",
    text: "#fff8f0", textDim: "#ffd9b8", accent: "#ff8e3b", accent2: "#ff5cb1",
    glow: "rgba(255,142,59,0.4)",
  },
  midnight: {
    id: "midnight", name: "Midnight",
    bg: "linear-gradient(160deg, #050614 0%, #101437 40%, #1c1c4d 100%)",
    surface: "rgba(255,255,255,0.05)", border: "rgba(160,180,255,0.18)",
    text: "#f0f3ff", textDim: "#9aa6cf", accent: "#7c5cff", accent2: "#5cc8ff",
    glow: "rgba(124,92,255,0.5)",
  },
  ocean: {
    id: "ocean", name: "Ocean",
    bg: "linear-gradient(160deg, #02283a 0%, #054861 40%, #0f7a89 100%)",
    surface: "rgba(255,255,255,0.06)", border: "rgba(120,200,220,0.2)",
    text: "#eaf7fb", textDim: "#9bd2dd", accent: "#5cc8ff", accent2: "#22d3a8",
    glow: "rgba(92,200,255,0.4)",
  },
  sandstorm: {
    id: "sandstorm", name: "Sandstorm",
    bg: "linear-gradient(160deg, #2c1d0a 0%, #5a4118 40%, #a0742a 100%)",
    surface: "rgba(255,235,200,0.06)", border: "rgba(255,200,140,0.2)",
    text: "#fbf4e3", textDim: "#d8c298", accent: "#ffb547", accent2: "#ff8e3b",
    glow: "rgba(255,181,71,0.4)",
  },
  forest: {
    id: "forest", name: "Forest",
    bg: "linear-gradient(160deg, #0a1f12 0%, #143828 40%, #1f5d3c 100%)",
    surface: "rgba(220,255,235,0.05)", border: "rgba(140,220,180,0.18)",
    text: "#eafff2", textDim: "#a1d8b8", accent: "#22d3a8", accent2: "#9bd97b",
    glow: "rgba(34,211,168,0.4)",
  },
  neon: {
    id: "neon", name: "Neon",
    bg: "linear-gradient(160deg, #0a0014 0%, #1a0033 40%, #2a004d 100%)",
    surface: "rgba(255,255,255,0.06)", border: "rgba(255,92,200,0.25)",
    text: "#fff0fc", textDim: "#c799d4", accent: "#ff3ba8", accent2: "#5cf8ff",
    glow: "rgba(255,59,168,0.5)",
  },
  ember: {
    id: "ember", name: "Ember",
    bg: "radial-gradient(circle at 30% 80%, #4a0808 0%, #1a0202 60%, #000 100%)",
    surface: "rgba(255,200,160,0.06)", border: "rgba(255,120,80,0.22)",
    text: "#ffe9d9", textDim: "#d49a83", accent: "#ff6b3d", accent2: "#ffae3b",
    glow: "rgba(255,107,61,0.45)",
  },
  glacier: {
    id: "glacier", name: "Glacier",
    bg: "linear-gradient(180deg, #0c1f29 0%, #1f3a4d 40%, #4d7791 100%)",
    surface: "rgba(220,240,255,0.08)", border: "rgba(180,220,240,0.22)",
    text: "#eef7ff", textDim: "#b9d2e0", accent: "#9ee8ff", accent2: "#ffffff",
    glow: "rgba(158,232,255,0.45)",
  },
  lavender: {
    id: "lavender", name: "Lavender",
    bg: "linear-gradient(160deg, #1a0d2e 0%, #3a2356 40%, #6b4099 100%)",
    surface: "rgba(255,235,255,0.07)", border: "rgba(220,180,255,0.22)",
    text: "#f5ecff", textDim: "#c9b3df", accent: "#c98aff", accent2: "#a4ffd1",
    glow: "rgba(201,138,255,0.45)",
  },
  mint: {
    id: "mint", name: "Mint",
    bg: "linear-gradient(160deg, #0f2419 0%, #194d34 40%, #2f8e63 100%)",
    surface: "rgba(220,255,235,0.08)", border: "rgba(140,230,180,0.22)",
    text: "#ebfff4", textDim: "#a0d2b8", accent: "#5fffaa", accent2: "#ffe27a",
    glow: "rgba(95,255,170,0.4)",
  },
  peach: {
    id: "peach", name: "Peach",
    bg: "linear-gradient(160deg, #2b0e1a 0%, #6b2a3a 40%, #d97265 100%)",
    surface: "rgba(255,230,220,0.08)", border: "rgba(255,180,160,0.22)",
    text: "#fff1e8", textDim: "#e9bcae", accent: "#ff9b7a", accent2: "#ffd56b",
    glow: "rgba(255,155,122,0.4)",
  },
  slate: {
    id: "slate", name: "Slate",
    bg: "linear-gradient(180deg, #14171c 0%, #1e242c 40%, #2a3038 100%)",
    surface: "rgba(255,255,255,0.05)", border: "rgba(180,200,220,0.18)",
    text: "#f4f6fa", textDim: "#a4adba", accent: "#7ad7ff", accent2: "#ffb24a",
    glow: "rgba(122,215,255,0.4)",
  },
};

// ============== Font registry ==============
// 5 distinct font stacks. Picked at render time; fonts are system-stack so
// every renderer (local, Lambda, GH Actions) gets a sensible match.

export type FontFamilyId = "sans" | "display" | "mono" | "serif" | "rounded";
export const FONT_FAMILIES: Record<FontFamilyId, { heading: string; body: string }> = {
  sans:     { heading: "Inter, system-ui, -apple-system, sans-serif",
              body: "Inter, system-ui, -apple-system, sans-serif" },
  display:  { heading: "'Helvetica Neue', Helvetica, Arial Black, sans-serif",
              body: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  mono:     { heading: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
              body: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" },
  serif:    { heading: "Georgia, 'Times New Roman', serif",
              body: "Georgia, 'Times New Roman', serif" },
  rounded:  { heading: "'Avenir Next', 'Trebuchet MS', system-ui, sans-serif",
              body: "'Avenir Next', 'Trebuchet MS', system-ui, sans-serif" },
};

// Default fall-throughs (kept for backward compat with the 9 existing shorts).
export const FONT = FONT_FAMILIES.sans.heading;
export const MONO = FONT_FAMILIES.mono.heading;

// ============== Beat types ==============
// Each beat takes an optional `variant` (1|2|3) so the same beat kind can
// render with three layouts. 6 beat kinds * 3 variants = 18 visual templates.

export type Beat =
  | { kind: "title"; eyebrow?: string; text: string; sub?: string; durationInFrames: number; variant?: 1 | 2 | 3 }
  | { kind: "bigword"; text: string; durationInFrames: number; variant?: 1 | 2 | 3 }
  | { kind: "trio"; words: [string, string, string]; durationInFrames: number; variant?: 1 | 2 | 3 }
  | { kind: "stat"; number: string; label: string; durationInFrames: number; variant?: 1 | 2 | 3 }
  | { kind: "list"; heading: string; items: string[]; durationInFrames: number; variant?: 1 | 2 | 3 }
  | { kind: "cta"; headline: string; url: string; durationInFrames: number; variant?: 1 | 2 | 3 };
