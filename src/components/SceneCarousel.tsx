import { scenes, type SceneId } from "../compositions/registry";

type Props = {
  active: SceneId;
  onChange: (id: SceneId) => void;
};

export const SceneCarousel: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div
      className="scene-tabs"
      role="tablist"
      aria-label="Choose a scene"
    >
      {scenes.map((s) => (
        <button
          key={s.id}
          className="scene-tab"
          role="tab"
          aria-selected={s.id === active}
          onClick={() => onChange(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};
