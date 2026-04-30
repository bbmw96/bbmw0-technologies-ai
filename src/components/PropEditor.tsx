import { PRESET_COLORS } from "../state";
import type { SceneId } from "../compositions/registry";

type Field =
  | { kind: "text"; key: string; label: string; multiline?: boolean }
  | { kind: "color"; key: string; label: string }
  | { kind: "list"; key: string; label: string; max?: number };

const SCHEMA: Record<SceneId, Field[]> = {
  Hook: [
    { kind: "text", key: "text", label: "Headline", multiline: true },
    { kind: "text", key: "emoji", label: "Emoji" },
    { kind: "color", key: "accent", label: "Accent" },
    { kind: "color", key: "bg", label: "Background" },
  ],
  Title: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "subtitle", label: "Subtitle" },
    { kind: "color", key: "accent", label: "Accent" },
    { kind: "color", key: "bg", label: "Background" },
  ],
  Bullets: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "list", key: "items", label: "Bullets", max: 4 },
    { kind: "color", key: "accent", label: "Accent" },
    { kind: "color", key: "bg", label: "Background" },
  ],
  Quote: [
    { kind: "text", key: "quote", label: "Quote", multiline: true },
    { kind: "text", key: "author", label: "Author" },
    { kind: "color", key: "accent", label: "Accent" },
    { kind: "color", key: "bg", label: "Background" },
  ],
  CTA: [
    { kind: "text", key: "title", label: "Headline" },
    { kind: "text", key: "url", label: "URL" },
    { kind: "color", key: "accent", label: "Accent" },
    { kind: "color", key: "bg", label: "Background" },
  ],
};

type Props = {
  sceneId: SceneId;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export const PropEditor: React.FC<Props> = ({ sceneId, values, onChange }) => {
  const fields = SCHEMA[sceneId];

  return (
    <>
      <div className="editor-section-label">Edit {sceneId}</div>

      {fields.map((f) => {
        if (f.kind === "text") {
          return (
            <div key={f.key} className="field">
              <label className="field-label" htmlFor={`f-${f.key}`}>
                {f.label}
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
              <label className="field-label">{f.label}</label>
              <div className="color-row">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="color-swatch"
                    aria-selected={c.toLowerCase() === current.toLowerCase()}
                    style={{ background: c }}
                    onClick={() => onChange(f.key, c)}
                    aria-label={`Set ${f.label} to ${c}`}
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
            onChange(f.key, [...items, "New point"]);
          };
          const removeItem = (idx: number) => {
            onChange(
              f.key,
              items.filter((_, i) => i !== idx),
            );
          };
          return (
            <div key={f.key} className="field">
              <label className="field-label">{f.label}</label>
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
                    aria-label="Remove bullet"
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
                  + Add bullet
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
