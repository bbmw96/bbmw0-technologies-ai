import React from "react";
import { Composition, registerRoot } from "remotion";
import { Hook, hookDefaults } from "./Hook";
import { Title, titleDefaults } from "./Title";
import { Bullets, bulletsDefaults } from "./Bullets";
import { Quote, quoteDefaults } from "./Quote";
import { CTA, ctaDefaults } from "./CTA";
import { Showcase, showcaseDefaults } from "./Showcase";
import { Tutorial, tutorialDefaults } from "./Tutorial";
import { Battle, battleDefaults } from "./Battle";
import { SpeedRun, speedRunDefaults } from "./SpeedRun";
import { FeatureDrop, featureDropDefaults } from "./FeatureDrop";
import { LongForm, longFormDefaults } from "./LongForm";
import {
  ConsensusShort, consensusShortDefaults,
  PhoneInstallShort, phoneInstallShortDefaults,
  LanguagesShort, languagesShortDefaults,
  PresetsShort, presetsShortDefaults,
  OpenSourceShort, openSourceShortDefaults,
  MobileFirstShort, mobileFirstShortDefaults,
  WhyVerticalShort, whyVerticalShortDefaults,
  YourPocketShort, yourPocketShortDefaults,
  FromIdeaShort, fromIdeaShortDefaults,
} from "./themedShorts";
import { ThemedShort } from "./ThemedShort";
import type { Beat } from "./themes";

export const SCENE_FPS = 30;
export const SCENE_W = 1080;
export const SCENE_H = 1920;
export const SCENE_DURATION = 5 * SCENE_FPS;
const SHORT_60S = 60 * SCENE_FPS;
const SHORT_40S = 40 * SCENE_FPS;

export const scenes = [
  { id: "Hook", label: "Hook", component: Hook, defaults: hookDefaults, durationInFrames: SCENE_DURATION },
  { id: "Title", label: "Title", component: Title, defaults: titleDefaults, durationInFrames: SCENE_DURATION },
  { id: "Bullets", label: "Bullets", component: Bullets, defaults: bulletsDefaults, durationInFrames: 7 * SCENE_FPS },
  { id: "Quote", label: "Quote", component: Quote, defaults: quoteDefaults, durationInFrames: 6 * SCENE_FPS },
  { id: "CTA", label: "CTA", component: CTA, defaults: ctaDefaults, durationInFrames: SCENE_DURATION },
] as const;

export type SceneId = (typeof scenes)[number]["id"];

const dailyDefaultBeats: Beat[] = [
  { kind: "title", text: "Daily Short.", sub: "Generated.", durationInFrames: 150 },
  { kind: "bigword", text: "Unique.", durationInFrames: 240 },
  { kind: "list", heading: "What changes", items: ["Theme", "Font", "Layout", "Words"], durationInFrames: 510 },
  { kind: "cta", headline: "Every render.", url: "bbmw0-technologies-ai.vercel.app", durationInFrames: 300 },
];
const dailyDefaults = {
  themeId: "midnight" as const,
  fontFamilyId: "sans" as const,
  beats: dailyDefaultBeats,
  audioUrl: "sounds/Drums.mp3",
  audioVolume: 0.4,
};

const Root: React.FC = () => {
  return (
    <>
      {scenes.map((s) => (
        <Composition
          key={s.id}
          id={s.id}
          component={s.component as React.FC<any>}
          durationInFrames={s.durationInFrames}
          fps={SCENE_FPS}
          width={SCENE_W}
          height={SCENE_H}
          defaultProps={s.defaults as any}
        />
      ))}

      {/* 60s vertical Shorts (1080x1920) */}
      <Composition id="Showcase" component={Showcase} durationInFrames={SHORT_60S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={showcaseDefaults} />
      <Composition id="Tutorial" component={Tutorial} durationInFrames={SHORT_60S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={tutorialDefaults} />
      <Composition id="Battle" component={Battle} durationInFrames={SHORT_60S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={battleDefaults} />
      <Composition id="SpeedRun" component={SpeedRun} durationInFrames={SHORT_60S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={speedRunDefaults} />
      <Composition id="FeatureDrop" component={FeatureDrop} durationInFrames={SHORT_60S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={featureDropDefaults} />

      {/* 40s themed Shorts (1080x1920) */}
      <Composition id="Consensus" component={ConsensusShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={consensusShortDefaults} />
      <Composition id="PhoneInstall" component={PhoneInstallShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={phoneInstallShortDefaults} />
      <Composition id="Languages" component={LanguagesShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={languagesShortDefaults} />
      <Composition id="Presets" component={PresetsShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={presetsShortDefaults} />
      <Composition id="OpenSource" component={OpenSourceShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={openSourceShortDefaults} />
      <Composition id="MobileFirst" component={MobileFirstShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={mobileFirstShortDefaults} />
      <Composition id="WhyVertical" component={WhyVerticalShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={whyVerticalShortDefaults} />
      <Composition id="YourPocket" component={YourPocketShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={yourPocketShortDefaults} />
      <Composition id="FromIdea" component={FromIdeaShort} durationInFrames={SHORT_40S} fps={SCENE_FPS} width={SCENE_W} height={SCENE_H} defaultProps={fromIdeaShortDefaults} />

      {/* Generic Daily Short — render with --props=daily/<file>.json */}
      <Composition
        id="Daily"
        component={ThemedShort as React.FC<any>}
        durationInFrames={SHORT_40S}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={dailyDefaults as any}
        calculateMetadata={({ props }) => {
          const beats = (props as any).beats as Beat[] | undefined;
          const total = Array.isArray(beats)
            ? beats.reduce((s, b) => s + (b.durationInFrames || 0), 0)
            : SHORT_40S;
          return { durationInFrames: Math.max(150, total) };
        }}
      />

      {/* 30-minute long-form (1920x1080) */}
      <Composition id="LongForm" component={LongForm} durationInFrames={30 * 60 * SCENE_FPS} fps={SCENE_FPS} width={1920} height={1080} defaultProps={longFormDefaults} />
    </>
  );
};

registerRoot(Root);
export default Root;
