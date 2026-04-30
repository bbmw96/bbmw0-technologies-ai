import { useEffect } from "react";
import type { StringKey } from "../i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  sceneId: string;
  propsJson: string;
  t: (key: StringKey) => string;
};

export const ExportModal: React.FC<Props> = ({
  open,
  onClose,
  sceneId,
  propsJson,
  t,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cmd = `npx remotion render src/compositions/registry.tsx ${sceneId} out/${sceneId.toLowerCase()}.mp4 --props=./props.json`;

  const downloadProps = () => {
    const blob = new Blob([propsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "props.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // ignored
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t("exportTitle")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h2>{t("exportTitle")}</h2>
        <p>{t("exportBlurb")}</p>
        <button
          className="btn btn-primary"
          onClick={downloadProps}
          type="button"
        >
          {t("downloadProps")}
        </button>
        <code className="code">{cmd}</code>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={copyCmd}
            type="button"
          >
            {t("copyCommand")}
          </button>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            type="button"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};
