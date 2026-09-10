// Carousel slides for ig-blankdiscussions. Quran/Hadith content, one script
// per slide (not five scripts crammed onto one image - see the channel's
// _niche_note in channels.json and VISUAL-DIRECTION-BRIEF.md for why).
//
// STILL-RENDERED, NOT VIDEO. Each slide is rendered once with `remotion
// still` (same technique already proven in this repo for preview frames) at
// a single frame, so there is no animation logic here at all - just layout.
//
// THEME ROTATION
// The channel owner asked for every post's colours/style to be "very unique
// and different" from post to post, not just different from the other three
// channels. THEMES below is the curated set that gets rotated through, one
// per POST (all slides within one post share a theme, so the carousel reads
// as one coherent post while consecutive posts still look distinct). Keep
// this list growing over time rather than picking randomly per slide within
// a post - the whole point is coherence within a post, variety across posts.
//
// SCRIPT COVERAGE IS A REAL RISK, NOT A STYLING CHOICE
// Five different writing systems on one pipeline means five different font
// requirements, and a font stack that quietly falls back to "no glyph" boxes
// is worse than no post at all. The stacks below were chosen for what ships
// with Windows (this renders through a local headless Chromium on the
// project's own Windows machine) and were verified by actually rendering a
// still and looking at it - see the render log referenced from
// VISUAL-DIRECTION-BRIEF.md's "BlankDiscussions carousels" section. If this
// ever renders on a different OS/CI runner, re-verify - do not assume the
// same stack has the same coverage there.
import React from "react";

export type ThemeKey = "emerald-gold" | "midnight-silver" | "terracotta-cream" | "plum-rose";

export const THEMES: Record<ThemeKey, { bg: string; ink: string; accent: string; muted: string; label: string }> = {
  "emerald-gold": { bg: "#0B2B26", ink: "#F5F1E6", accent: "#C9A227", muted: "#8FB6AC", label: "Emerald & Gold" },
  "midnight-silver": { bg: "#0E1116", ink: "#ECEFF4", accent: "#9AA5B1", muted: "#4B5563", label: "Midnight & Silver" },
  "terracotta-cream": { bg: "#F4ECE1", ink: "#3A2A1D", accent: "#B5502F", muted: "#A98F73", label: "Terracotta & Cream" },
  "plum-rose": { bg: "#241221", ink: "#F6E9EE", accent: "#C97B9B", muted: "#8A6A80", label: "Plum & Rose Gold" },
};
export const THEME_ORDER: ThemeKey[] = ["emerald-gold", "midnight-silver", "terracotta-cream", "plum-rose"];

const SANS = '"Helvetica Neue", Inter, Arial, system-ui, sans-serif';
// Font stacks, most-specific/best-shaped first, safe generic last.
const ARABIC = '"Traditional Arabic", "Arabic Typesetting", "Segoe UI", Tahoma, sans-serif';
const CHINESE = '"Microsoft YaHei", "Microsoft JhengHei", "SimSun", sans-serif';
const KOREAN = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const JAPANESE = '"Yu Gothic", "MS Gothic", "Meiryo", sans-serif';

export type LangCode = "ar" | "en" | "zh" | "ko" | "ja";
export const LANG_META: Record<LangCode, { name: string; font: string; dir: "rtl" | "ltr"; sizePx: number; lineHeight: number }> = {
  ar: { name: "العربية", font: ARABIC, dir: "rtl", sizePx: 62, lineHeight: 1.65 },
  en: { name: "English", font: SANS, dir: "ltr", sizePx: 48, lineHeight: 1.4 },
  zh: { name: "中文", font: CHINESE, dir: "ltr", sizePx: 54, lineHeight: 1.75 },
  ko: { name: "한국어", font: KOREAN, dir: "ltr", sizePx: 44, lineHeight: 1.6 },
  ja: { name: "日本語", font: JAPANESE, dir: "ltr", sizePx: 46, lineHeight: 1.7 },
};

export type CarouselSlideProps =
  | {
      kind: "cover";
      theme: ThemeKey;
      kicker: string; // e.g. "QURAN" or "HADITH"
      title: string; // e.g. surah name, or hadith collection name
      subtitle?: string; // e.g. "Surah Ash-Sharh, 94:5" or "Sahih al-Bukhari 1"
      slideNumber: number;
      slideTotal: number;
    }
  | {
      kind: "text";
      theme: ThemeKey;
      lang: LangCode;
      text: string;
      note?: string; // e.g. "Saheeh International" translator credit
      slideNumber: number;
      slideTotal: number;
    }
  | {
      kind: "citation";
      theme: ThemeKey;
      lines: string[]; // reference + attribution lines
      handle: string; // "@blankdiscussions"
      slideNumber: number;
      slideTotal: number;
    };

const W = 1080;
const H = 1350; // 4:5, the aspect Instagram's own carousel guidance favours for feed reach.

const Frame: React.FC<{ theme: ThemeKey; children: React.ReactNode }> = ({ theme, children }) => {
  const p = THEMES[theme];
  return (
    <div
      style={{
        width: W,
        height: H,
        background: p.bg,
        color: p.ink,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        fontFamily: SANS,
        overflow: "hidden",
      }}
    >
      {/* A single geometric motif, not figurative imagery - deliberate given
          the content. A rotated square outline, offset per theme by reusing
          the theme's own accent colour, echoes the girih/geometric-pattern
          tradition without attempting an actual, easy-to-get-wrong tessellation. */}
      <div
        style={{
          position: "absolute", top: -120, right: -120, width: 360, height: 360,
          border: `2px solid ${p.accent}`, opacity: 0.35, transform: "rotate(20deg)",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: -160, left: -160, width: 420, height: 420,
          border: `2px solid ${p.muted}`, opacity: 0.25, transform: "rotate(12deg)",
        }}
      />
      {children}
    </div>
  );
};

const Progress: React.FC<{ theme: ThemeKey; n: number; total: number }> = ({ theme, n, total }) => {
  const p = THEMES[theme];
  return (
    <div style={{ position: "absolute", bottom: 48, left: 64, right: 64, display: "flex", gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < n ? p.accent : p.muted, opacity: i < n ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
};

export const IslamicCarouselSlide: React.FC<CarouselSlideProps> = (props) => {
  const p = THEMES[props.theme];

  if (props.kind === "cover") {
    return (
      <Frame theme={props.theme}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
          <div style={{ fontSize: 28, letterSpacing: 6, fontWeight: 700, color: p.accent, marginBottom: 28 }}>
            {props.kicker}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.15, marginBottom: props.subtitle ? 20 : 0 }}>
            {props.title}
          </div>
          {props.subtitle ? (
            <div style={{ fontSize: 34, color: p.muted, fontWeight: 500 }}>{props.subtitle}</div>
          ) : null}
        </div>
        <Progress theme={props.theme} n={props.slideNumber} total={props.slideTotal} />
      </Frame>
    );
  }

  if (props.kind === "text") {
    const m = LANG_META[props.lang];
    return (
      <Frame theme={props.theme}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 76px" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 700, color: p.accent, marginBottom: 32, fontFamily: SANS }}>
            {m.name.toUpperCase()}
          </div>
          <div
            dir={m.dir}
            style={{
              fontFamily: m.font,
              fontSize: m.sizePx,
              lineHeight: m.lineHeight,
              fontWeight: props.lang === "en" ? 600 : 500,
              textAlign: m.dir === "rtl" ? "right" : "left",
            }}
          >
            {props.text}
          </div>
          {props.note ? (
            <div style={{ marginTop: 36, fontSize: 26, color: p.muted, fontFamily: SANS }}>{props.note}</div>
          ) : null}
        </div>
        <Progress theme={props.theme} n={props.slideNumber} total={props.slideTotal} />
      </Frame>
    );
  }

  // citation
  return (
    <Frame theme={props.theme}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
        <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 700, color: p.accent, marginBottom: 28 }}>
          SOURCE
        </div>
        {props.lines.map((line, i) => (
          <div key={i} style={{ fontSize: 32, lineHeight: 1.6, color: i === 0 ? p.ink : p.muted, fontWeight: i === 0 ? 600 : 400 }}>
            {line}
          </div>
        ))}
        <div style={{ marginTop: 48, fontSize: 30, fontWeight: 700, color: p.accent }}>{props.handle}</div>
      </div>
      <Progress theme={props.theme} n={props.slideNumber} total={props.slideTotal} />
    </Frame>
  );
};

export const carouselSlideDefaults: CarouselSlideProps = {
  kind: "cover",
  theme: "emerald-gold",
  kicker: "QURAN",
  title: "Ash-Sharh",
  subtitle: "94:5",
  slideNumber: 1,
  slideTotal: 7,
};

export const CAROUSEL_W = W;
export const CAROUSEL_H = H;
