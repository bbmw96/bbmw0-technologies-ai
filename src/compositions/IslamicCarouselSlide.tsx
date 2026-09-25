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
// Six languages, five distinct scripts, on one pipeline (Malay added 2026-09-15
// rides the existing Latin/SANS stack, so it did not add a sixth font
// requirement) means a font stack that quietly falls back to "no glyph" boxes
// is worse than no post at all. The stacks below were chosen for what ships
// with Windows (this renders through a local headless Chromium on the
// project's own Windows machine) and were verified by actually rendering a
// still and looking at it - see the render log referenced from
// VISUAL-DIRECTION-BRIEF.md's "BlankDiscussions carousels" section. If this
// ever renders on a different OS/CI runner, re-verify - do not assume the
// same stack has the same coverage there.
import React from "react";

export type ThemeKey = "emerald-gold" | "midnight-silver" | "terracotta-cream" | "plum-rose" | "indigo-saffron" | "sapphire-pearl" | "garnet-amber" | "obsidian-jade" | "ivory-cobalt" | "charcoal-copper" | "amber-slate" | "rosewood-mint" | "azure-sand" | "crimson-pewter" | "olive-gold" | "violet-ash" | "teal-bronze" | "maroon-linen" | "cobalt-ember" | "forest-blush" | "onyx-turquoise" | "clay-frost" | "basalt-marigold" | "linen-periwinkle" | "umber-mauve" | "aubergine-citrine" | "byzantium-sage" | "chalk-vermilion";

export const THEMES: Record<ThemeKey, { bg: string; ink: string; accent: string; muted: string; label: string }> = {
  "emerald-gold": { bg: "#0B2B26", ink: "#F5F1E6", accent: "#C9A227", muted: "#8FB6AC", label: "Emerald & Gold" },
  "midnight-silver": { bg: "#0E1116", ink: "#ECEFF4", accent: "#9AA5B1", muted: "#4B5563", label: "Midnight & Silver" },
  "terracotta-cream": { bg: "#F4ECE1", ink: "#3A2A1D", accent: "#B5502F", muted: "#A98F73", label: "Terracotta & Cream" },
  "plum-rose": { bg: "#241221", ink: "#F6E9EE", accent: "#C97B9B", muted: "#8A6A80", label: "Plum & Rose Gold" },
  "indigo-saffron": { bg: "#1B1F3B", ink: "#F3EFE4", accent: "#E8A23D", muted: "#5C6491", label: "Indigo & Saffron" },
  "sapphire-pearl": { bg: "#0A2540", ink: "#EAF2FA", accent: "#7EC8E3", muted: "#3D5A73", label: "Sapphire & Pearl" },
  "garnet-amber": { bg: "#2B0F14", ink: "#F5E6DC", accent: "#D98E4A", muted: "#6B3A3F", label: "Garnet & Amber" },
  "obsidian-jade": { bg: "#0E1512", ink: "#EDF3EF", accent: "#3FA796", muted: "#4C5C56", label: "Obsidian & Jade" },
  "ivory-cobalt": { bg: "#F0EBDD", ink: "#1F2A44", accent: "#2F6FB0", muted: "#8A93A6", label: "Ivory & Cobalt" },
  "charcoal-copper": { bg: "#1A1A1A", ink: "#F2EAE0", accent: "#C1712F", muted: "#6B6560", label: "Charcoal & Copper" },
  "amber-slate": { bg: "#1E2530", ink: "#F4EFE3", accent: "#E0A458", muted: "#5B6879", label: "Amber & Slate" },
  "rosewood-mint": { bg: "#3A1620", ink: "#F3E9E4", accent: "#6FBFA0", muted: "#8A5A63", label: "Rosewood & Mint" },
  "azure-sand": { bg: "#EDE3D0", ink: "#1E3A4C", accent: "#3E7C97", muted: "#A79A7C", label: "Azure & Sand" },
  "crimson-pewter": { bg: "#241017", ink: "#F1E7E6", accent: "#B23A48", muted: "#6E5C5F", label: "Crimson & Pewter" },
  "olive-gold": { bg: "#20240F", ink: "#F2EFDE", accent: "#C7A03D", muted: "#5E6448", label: "Olive & Gold" },
  "violet-ash": { bg: "#1C1830", ink: "#EDE9F6", accent: "#8E7BC2", muted: "#544F70", label: "Violet & Ash" },
  "teal-bronze": { bg: "#0D2B2B", ink: "#EAF3F1", accent: "#B8843F", muted: "#3F6664", label: "Teal & Bronze" },
  "maroon-linen": { bg: "#F1E9DD", ink: "#3B1A1A", accent: "#8C2F2F", muted: "#A08D75", label: "Maroon & Linen" },
  "cobalt-ember": { bg: "#101B33", ink: "#EDF1FA", accent: "#D9713C", muted: "#3E4E70", label: "Cobalt & Ember" },
  "forest-blush": { bg: "#122419", ink: "#F1EDE6", accent: "#D98CA0", muted: "#42624F", label: "Forest & Blush" },
  "onyx-turquoise": { bg: "#141414", ink: "#EDEDED", accent: "#3FBFAE", muted: "#5C5C5C", label: "Onyx & Turquoise" },
  "clay-frost": { bg: "#E7E2DA", ink: "#2C2A26", accent: "#8CA3AE", muted: "#9C9184", label: "Clay & Frost" },
  "basalt-marigold": { bg: "#1B1D1F", ink: "#F5F2EA", accent: "#E8B94A", muted: "#5A5D61", label: "Basalt & Marigold" },
  "linen-periwinkle": { bg: "#F2EEE4", ink: "#2A2A3D", accent: "#7B87C9", muted: "#A39E8E", label: "Linen & Periwinkle" },
  "umber-mauve": { bg: "#2A1B12", ink: "#F5EDE3", accent: "#C98C82", muted: "#6B5A4A", label: "Umber & Mauve" },
  "aubergine-citrine": { bg: "#2A1830", ink: "#F4EEF2", accent: "#D8C24A", muted: "#6E5872", label: "Aubergine & Citrine" },
  "byzantium-sage": { bg: "#3A0D1F", ink: "#F1E9DC", accent: "#7FA66B", muted: "#6E4A57", label: "Byzantium & Sage" },
  "chalk-vermilion": { bg: "#EDE6DC", ink: "#2B1B14", accent: "#C0432E", muted: "#A08E7A", label: "Chalk & Vermilion" },
};
export const THEME_ORDER: ThemeKey[] = ["emerald-gold", "midnight-silver", "terracotta-cream", "plum-rose", "indigo-saffron", "sapphire-pearl", "garnet-amber", "obsidian-jade", "ivory-cobalt", "charcoal-copper", "amber-slate", "rosewood-mint", "azure-sand", "crimson-pewter", "olive-gold", "violet-ash", "teal-bronze", "maroon-linen", "cobalt-ember", "forest-blush", "onyx-turquoise", "clay-frost", "basalt-marigold", "linen-periwinkle", "umber-mauve", "aubergine-citrine", "byzantium-sage", "chalk-vermilion"];

const SANS = '"Helvetica Neue", Inter, Arial, system-ui, sans-serif';
// Font stacks, most-specific/best-shaped first, safe generic last.
const ARABIC = '"Traditional Arabic", "Arabic Typesetting", "Segoe UI", Tahoma, sans-serif';
const CHINESE = '"Microsoft YaHei", "Microsoft JhengHei", "SimSun", sans-serif';
const KOREAN = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const JAPANESE = '"Yu Gothic", "MS Gothic", "Meiryo", sans-serif';
// Thai added 2026-09-21. "Noto Sans Thai" listed first because that's what
// was actually installed and render-verified in the Linux sandbox this repo
// currently renders from (no Thai glyphs ship with the sandbox's base fonts,
// unlike Arabic/CJK which had working coverage out of the box - see the
// render notes for hadith-qudsi-34). "Leelawadee UI" and Tahoma are the
// Windows-native fallbacks for the project's own machine, per this file's
// usual convention, but were NOT the ones actually used to verify this glyph
// set - only Noto Sans Thai was. Re-verify with a real render if this ever
// runs somewhere Noto Sans Thai isn't installed.
const THAI = '"Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif';

export type LangCode = "ar" | "en" | "zh" | "ko" | "ja" | "ms" | "th";
export const LANG_META: Record<LangCode, { name: string; font: string; dir: "rtl" | "ltr"; sizePx: number; lineHeight: number }> = {
  ar: { name: "العربية", font: ARABIC, dir: "rtl", sizePx: 62, lineHeight: 1.65 },
  en: { name: "English", font: SANS, dir: "ltr", sizePx: 48, lineHeight: 1.4 },
  zh: { name: "中文", font: CHINESE, dir: "ltr", sizePx: 54, lineHeight: 1.75 },
  ko: { name: "한국어", font: KOREAN, dir: "ltr", sizePx: 44, lineHeight: 1.6 },
  ja: { name: "日本語", font: JAPANESE, dir: "ltr", sizePx: 46, lineHeight: 1.7 },
  // Malay is written in the Latin script (Rumi), so the standard sans stack
  // covers it fully - no separate font family or glyph-coverage risk like
  // the CJK/Arabic stacks above needed.
  ms: { name: "Bahasa Melayu", font: SANS, dir: "ltr", sizePx: 44, lineHeight: 1.5 },
  // Thai stacks tone marks and vowel signs above/below the base consonant
  // (similar risk profile to Arabic diacritics), and has no spaces between
  // words, so line-height needs the same kind of headroom CJK gets rather
  // than the tighter Latin value.
  th: { name: "ภาษาไทย", font: THAI, dir: "ltr", sizePx: 48, lineHeight: 1.75 },
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
      // Optional per-slide shrink for unusually long ayat (e.g. Ayat al-Kursi,
      // the last three ayat of Al-Baqarah) so the text fits the fixed 1080x1350
      // canvas instead of being cropped by the Frame's overflow:hidden. 1 =
      // the language's normal LANG_META size (default when omitted). Applies
      // to both fontSize and lineHeight so long text doesn't just get smaller
      // letters crammed at the same spacing.
      fontScale?: number;
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
    const scale = props.fontScale ?? 1;
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
              fontSize: m.sizePx * scale,
              // Shrink line-height a bit more than font size at smaller scales -
              // otherwise a long ayah's extra line count still overflows even
              // once the glyphs themselves fit.
              lineHeight: scale < 1 ? m.lineHeight * (0.85 + 0.15 * scale) : m.lineHeight,
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
