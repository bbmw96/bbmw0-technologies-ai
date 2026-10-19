import React from "react";
import { Composition, registerRoot, staticFile, AbsoluteFill } from "remotion";
type P = { img: string; kick: string; ar: string; en: string; sub: string; acc: string };
const Cover: React.FC<P> = ({ img, kick, ar, en, sub, acc }) => (
  <AbsoluteFill style={{ background: "#05080b", fontFamily: '"Noto Sans CJK JP","Noto Sans Thai","DejaVu Sans",sans-serif', color: "#f2efe6" }}>
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile(img)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,6,9,.55) 0%,rgba(3,6,9,.25) 25%,rgba(3,6,9,.55) 48%,rgba(3,6,9,.85) 68%,rgba(3,6,9,.92) 100%)" }} />
    <AbsoluteFill style={{ boxShadow: "inset 0 0 260px 40px rgba(0,0,0,.65)" }} />
    <div style={{ position: "absolute", left: 90, right: 90, top: 610, textAlign: "center" }}>
      <div style={{ fontSize: 34, letterSpacing: 9, color: acc, fontWeight: 700, textTransform: "uppercase" }}>{kick}</div>
      <div style={{ width: 120, height: 3, background: acc, margin: "34px auto 60px", opacity: 0.9 }} />
      <div style={{ fontFamily: "Amiri", fontSize: 150, lineHeight: 1.25, color: "#fff", textShadow: "0 4px 30px rgba(0,0,0,.7)" }}>{ar}</div>
      <div style={{ fontSize: 70, fontWeight: 700, marginTop: 10, letterSpacing: 1, textShadow: "0 3px 24px rgba(0,0,0,.8)" }}>{en}</div>
      <div style={{ fontSize: 44, marginTop: 34, color: "#e6e1d2", lineHeight: 1.35, textShadow: "0 2px 18px rgba(0,0,0,.9)", whiteSpace: "pre-line" }}>{sub}</div>
    </div>
    <div style={{ position: "absolute", left: 60, right: 60, top: 1330, textAlign: "center", fontSize: 29, color: "#d8d3c4", letterSpacing: 0, textShadow: "0 2px 14px rgba(0,0,0,.9)" }}>
      <div style={{ color: acc, fontWeight: 700, fontSize: 30, letterSpacing: 7, marginBottom: 14 }}>8 LANGUAGES</div>
      {"العربية · English · 中文 · 한국어 · 日本語 · Melayu · ไทย · Español"}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", fontSize: 32, letterSpacing: 4, color: "#b9b4a5" }}>@blankdiscussions</div>
  </AbsoluteFill>
);
const Root: React.FC = () => (
  <Composition id="CoverCard" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1}
    defaultProps={{ img: "cov/fa.jpg", kick: "", ar: "", en: "", sub: "", acc: "#e0b95c" }} />
);
registerRoot(Root);
