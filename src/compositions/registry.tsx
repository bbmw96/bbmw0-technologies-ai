import { Composition, registerRoot } from "remotion";
import { Hook, hookDefaults } from "./Hook";
import { Title, titleDefaults } from "./Title";
import { Bullets, bulletsDefaults } from "./Bullets";
import { Quote, quoteDefaults } from "./Quote";
import { CTA, ctaDefaults } from "./CTA";
import { Showcase, showcaseDefaults } from "./Showcase";

// Single source of truth: all compositions live here.
// The editor reads from this for the scene picker.
// The Remotion CLI uses this for `remotion render`.

export const SCENE_FPS = 30;
export const SCENE_W = 1080;
export const SCENE_H = 1920;
export const SCENE_DURATION = 5 * SCENE_FPS; // 5 seconds per preset

export const scenes = [
  {
    id: "Hook",
    label: "Hook",
    component: Hook,
    defaults: hookDefaults,
    durationInFrames: SCENE_DURATION,
  },
  {
    id: "Title",
    label: "Title",
    component: Title,
    defaults: titleDefaults,
    durationInFrames: SCENE_DURATION,
  },
  {
    id: "Bullets",
    label: "Bullets",
    component: Bullets,
    defaults: bulletsDefaults,
    durationInFrames: 7 * SCENE_FPS,
  },
  {
    id: "Quote",
    label: "Quote",
    component: Quote,
    defaults: quoteDefaults,
    durationInFrames: 6 * SCENE_FPS,
  },
  {
    id: "CTA",
    label: "CTA",
    component: CTA,
    defaults: ctaDefaults,
    durationInFrames: SCENE_DURATION,
  },
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
      <Composition
        id="Showcase"
        component={Showcase}
        durationInFrames={60 * SCENE_FPS}
        fps={SCENE_FPS}
        width={SCENE_W}
        height={SCENE_H}
        defaultProps={showcaseDefaults}
      />
    </>
  );
};

// `remotion render` calls registerRoot. Vite ignores it (no ReactDOM.render).
registerRoot(Root);

export default Root;
