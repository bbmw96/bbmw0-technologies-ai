import { useCallback, useState } from "react";
import { scenes, type SceneId } from "./compositions/registry";

export type SceneState = {
  [K in SceneId]: Record<string, unknown>;
};

const initialState: SceneState = scenes.reduce((acc, s) => {
  acc[s.id] = { ...s.defaults };
  return acc;
}, {} as SceneState);

export function useEditorState() {
  const [activeId, setActiveId] = useState<SceneId>(scenes[0].id);
  const [state, setState] = useState<SceneState>(initialState);

  const updateProp = useCallback(
    (sceneId: SceneId, key: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        [sceneId]: { ...prev[sceneId], [key]: value },
      }));
    },
    [],
  );

  const reset = useCallback((sceneId: SceneId) => {
    const def = scenes.find((s) => s.id === sceneId)!.defaults;
    setState((prev) => ({ ...prev, [sceneId]: { ...def } }));
  }, []);

  return { activeId, setActiveId, state, updateProp, reset };
}

export const PRESET_COLORS = [
  "#7c5cff", // brand purple
  "#ff5cb1", // pink
  "#22d3a8", // teal
  "#ffb547", // amber
  "#ff5e7e", // rose
  "#5cc8ff", // sky
  "#ffffff", // white
  "#0a0a0f", // black
];
