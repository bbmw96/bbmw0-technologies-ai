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

export const SCENE_FPS = 30;
export const SCENE_W = 1080;
export const SCENE_H = 1920;
export const SCENE_DURATION = 5 * SCENE_FPS;

export const scenes = [
  { id: "Hook", label: "Hook", component: Hook, defaults: hookDefaults, durationInFrames: SCENE_DURATION },
  { id: "Title", label: "Title", component: Title, defaults: titleDefaults, durationInFrames: SCENE_DURATION },
  { id: "Bullets", label: "Bullets", component: Bullets, defaults: bulletsDefaults, durationInFrames: 7 * SCENE_FPS },
  { id: "Quote", label: "Quote", component: Quote, defaults: quoteDefaults, durationInFrames: 6 * SCENE_FPS },
  { id: "CTA", label: "CTA", component: CTA, defaults: ctaDefaults, durationInFrames: SCENE_DURATION },
] as const;

export type SceneId = (typeof scenes)[number]["id"];

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
      {/* 60-second vertical Shorts (1080×1920) */}
      <Composition
        id="Showcase"
        component={Showcase}
        durationInFrames={60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={showcaseDefaults}
      />
      <Composition
        id="Tutorial"
        component={Tutorial}
        durationInFrames={60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={tutorialDefaults}
      />
      <Composition
        id="Battle"
        component={Battle}
        durationInFrames={60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={battleDefaults}
      />
      <Composition
        id="SpeedRun"
        component={SpeedRun}
        durationInFrames={60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={speedRunDefaults}
      />
      <Composition
        id="FeatureDrop"
        component={FeatureDrop}
        durationInFrames={60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={featureDropDefaults}
      />
      {/* 30-minute landscape long-form (1920×1080) */}
      <Composition
        id="LongForm"
        component={LongForm}
        durationInFrames={30 * 60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={1920}
        height={1080}
        defaultProps={longFormDefaults}
      />
    </>
  );
};

registerRoot(Root);
export default Root;
