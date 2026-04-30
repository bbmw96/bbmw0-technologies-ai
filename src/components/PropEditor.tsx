import { PRESET_COLORS } from "../state";
import type { SceneId } from "../compositions/registry";
import type { StringKey } from "../i18n";

type Field =
  | { kind: "text"; key: string; labelKey: StringKey; multiline?: boolean }
  | { kind: "color"; key: string; labelKey: StringKey }
  | { kind: "list"; key: string; labelKey: StringKey; max?: number };

const SCHEMA: Record<SceneId, Field[]> = {
  Hook: [
    { kind: "text", key: "text", labelKey: "headline", multiline: true },
    { kind: "text", key: "emoji", labelKey: "emoji" },
    { kind: "color", key: "accent", labelKey: "accent" },
    { kind: "color", key: "bg", labelKey: "background" },
  ],
  Title: [
    { kind: "text", key: "title", labelKey: "title" },
    { kind: "text", key: "subtitle", labelKey: "subtitle" },
    { kind: "color", key: "accent", labelKey: "accent" },
    { kind: "color", key: "bg", labelKey: "background" },
  ],
  Bullets: [
    { kind: "text", key: "heading", labelKey: "heading" },
    { kind: "list", key: "items", labelKey: "bullets", max: 4 },
    { kind: "color", key: "accent", labelKey: "accent" },
    { kind: "color", key: "bg", labelKey: "background" },
  ],
  Quote: [
    { kind: "text", key: "quote", labelKey: "quote", multiline: true },
    { kind: "text", key: "author", labelKey: "author" },
    { kind: "color", key: "accent", labelKey: "accent" },
    { kind: "color", key: "bg", labelKey: "background" },
  ],
  CTA: [
    { kind: "text", key: "title", labelKey: "headline" },
    { kind: "text", key: "url", labelKey: "url" },
    { kind: "color", key: "accent", labelKey: "accent" },
    { kind: "color", key: "bg", labelKey: "background" },
  ],
};

type Props = {
  sceneId: SceneId;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  t: (key: StringKey) => string;
};

export const PropEditor: React.FC<Props> = ({
  sceneId,
  values,
  onChange,
  t,
}) => {
  const fields = SCHEMA[sceneId];

  return (
    <>
      <div className="editor-section-label">{t("editScene")} · {sceneId}</div>

      {fields.map((f) => {
        if (f.kind === "text") {
          return (
            <div key={f.key} className="field">
              <label className="field-label" htmlFor={`f-${f.key}`}>
                {t(f.labelKey)}
              </label>
              {f.multiline ? (
                <textarea
                  id={`f-${f.key}`}
                  className="textarea"
                  rows={2}
                  value={(values[f.key] as string) ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              ) : (
                <input
                  id={`f-${f.key}`}
                  className="input"
                  value={(values[f.key] as string) ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              )}
            </div>
          );
        }
        if (f.kind === "color") {
          const current = (values[f.key] as string) ?? PRESET_COLORS[0];
          return (
            <div key={f.key} className="field">
              <label className="field-label">{t(f.labelKey)}</label>
              <div className="color-row">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="color-swatch"
                    aria-selected={c.toLowerCase() === current.toLowerCase()}
                    style={{ background: c }}
                    onClick={() => onChange(f.key, c)}
                    aria-label={c}
                  />
                ))}
                <label
                  className="color-swatch"
                  style={{ background: current }}
                  aria-label="Custom color"
                >
                  <input
                    type="color"
                    value={current}
                    onChange={(e) => onChange(f.key, e.target.value)}
                  />
                </label>
              </div>
            </div>
          );
        }
        if (f.kind === "list") {
          const items = (values[f.key] as string[]) ?? [];
          const updateItem = (idx: number, value: string) => {
            const next = [...items];
            next[idx] = value;
            onChange(f.key, next);
          };
          const addItem = () => {
            if (f.max && items.length >= f.max) return;
            onChange(f.key, [...items, ""]);
          };
          const removeItem = (idx: number) => {
            onChange(
              f.key,
              items.filter((_, i) => i !== idx),
            );
          };
          return (
            <div key={f.key} className="field">
              <label className="field-label">{t(f.labelKey)}</label>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                  }}
                >
                  <input
                    className="input"
                    value={item}
                    onChange={(e) => updateItem(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeItem(idx)}
                    aria-label={t("removeBullet")}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(!f.max || items.length < f.max) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addItem}
                  style={{ marginTop: 4 }}
                >
                  {t("addBullet")}
                </button>
              )}
            </div>
          );
        }
        return null;
      })}
    </>
  );
};
