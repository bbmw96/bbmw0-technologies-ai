import { useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { scenes, SCENE_FPS, SCENE_W, SCENE_H } from "./compositions/registry";
import { useEditorState } from "./state";
import { SceneCarousel } from "./components/SceneCarousel";
import { PropEditor } from "./components/PropEditor";
import { ExportModal } from "./components/ExportModal";
import { AIBar, type AISuggestion } from "./components/AIBar";
import { LangSwitcher } from "./components/LangSwitcher";
import { useLang } from "./i18n";

export const App: React.FC = () => {
  const { activeId, setActiveId, state, updateProp } = useEditorState();
  const [exportOpen, setExportOpen] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const { lang, setLang, t } = useLang();

  const activeScene = useMemo(
    () => scenes.find((s) => s.id === activeId)!,
    [activeId],
  );

  const propsJson = useMemo(
    () => JSON.stringify(state[activeId], null, 2),
    [state, activeId],
  );

  const onAIApply = (s: AISuggestion) => {
    const target = state[activeId];
    Object.entries(s).forEach(([k, v]) => {
      if (v === undefined) return;
      if (k in target) updateProp(activeId, k, v);
    });
  };

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else p.play();
  };

  return (
    <div className="app">
      <header className="header app-chrome">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div className="brand-name">
            <b>BBMW0</b> {t("brandTagline")}
          </div>
        </div>
        <div className="header-actions">
          <LangSwitcher lang={lang} setLang={setLang} />
          <button
            className="icon-btn"
            type="button"
            aria-label={t("play")}
            onClick={togglePlay}
          >
            ▶
          </button>
        </div>
      </header>

      <main className="canvas">
        <div className="preview-frame">
          <div className="preview-shell">
            <Player
              ref={playerRef}
              component={activeScene.component as React.FC<any>}
              durationInFrames={activeScene.durationInFrames}
              compositionWidth={SCENE_W}
              compositionHeight={SCENE_H}
              fps={SCENE_FPS}
              inputProps={state[activeId]}
              loop
              autoPlay
              clickToPlay
              style={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
            />
          </div>
        </div>

        <SceneCarousel active={activeId} onChange={setActiveId} />

        <section className="editor app-chrome">
          <div className="editor-handle" aria-hidden />
          <AIBar onApply={onAIApply} placeholder={t("aiPlaceholder")} buttonLabel={t("aiButton")} />
          <PropEditor
            sceneId={activeId}
            values={state[activeId]}
            onChange={(k, v) => updateProp(activeId, k, v)}
            t={t}
          />
        </section>
      </main>

      <footer className="footer app-chrome">
        <button
          className="btn btn-secondary"
          onClick={() => navigator.clipboard?.writeText(propsJson)}
          type="button"
          aria-label="Copy props as JSON"
        >
          {t("copyJson")}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setExportOpen(true)}
          type="button"
        >
          {t("exportToMP4")}
        </button>
      </footer>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        sceneId={activeId}
        propsJson={propsJson}
        t={t}
      />
    </div>
  );
};
