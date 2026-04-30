import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  sceneId: string;
  propsJson: string;
};

export const ExportModal: React.FC<Props> = ({
  open,
  onClose,
  sceneId,
  propsJson,
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
      aria-label="Export"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h2>Export to MP4</h2>
        <p>
          Save your settings, then run the command in a terminal at the project
          root. The MP4 lands in <code>out/</code>.
        </p>
        <button
          className="btn btn-primary"
          onClick={downloadProps}
          type="button"
        >
          ⬇  Download props.json
        </button>
        <code className="code">{cmd}</code>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={copyCmd}
            type="button"
          >
            Copy command
          </button>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
