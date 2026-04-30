import { useState } from "react";

type Props = {
  onApply: (suggestion: AISuggestion) => void;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
};

export type AISuggestion = {
  text?: string;
  emoji?: string;
  title?: string;
  subtitle?: string;
  heading?: string;
  items?: string[];
  quote?: string;
  author?: string;
  url?: string;
  accent?: string;
};

const EMOJI_HINTS: [RegExp, string][] = [
  [/\bfit|gym|workout|run|salud|gimnasio/i, "💪"],
  [/\bmoney|finance|stock|invest|dinero|finanzas/i, "💸"],
  [/\bcode|developer|programmer|tech|程序|развит/i, "💻"],
  [/\bcoffee|drink|food|recipe|café|comida/i, "☕"],
  [/\btravel|trip|vacation|viaje|путешествие/i, "✈️"],
  [/\blove|date|relationship|amor|любовь/i, "❤️"],
  [/\bbook|read|study|libro|чтение/i, "📚"],
  [/\bmusic|song|artist|música/i, "🎵"],
  [/\bart|design|paint|arte|искусство/i, "🎨"],
  [/\bgame|play|juego|игра/i, "🎮"],
  [/\bAI|GPT|model|искусственный/i, "🤖"],
  [/\bsleep|rest|relax|sueño|сон/i, "😴"],
];

function pickEmoji(prompt: string): string {
  for (const [re, e] of EMOJI_HINTS) if (re.test(prompt)) return e;
  return "✨";
}

function deriveSuggestion(prompt: string): AISuggestion {
  const trimmed = prompt.trim();
  if (!trimmed) return {};
  const sentences = trimmed
    .split(/[.!?\n。!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const hook = sentences[0] ?? trimmed;
  const items = sentences.slice(1, 4);
  while (items.length < 3) items.push("...");
  return {
    text: hook,
    emoji: pickEmoji(trimmed),
    title: hook.slice(0, 60),
    subtitle: items[0] || "",
    heading: hook.slice(0, 30),
    items: items.slice(0, 3),
    quote: hook,
    author: "—",
  };
}

export const AIBar: React.FC<Props> = ({
  onApply,
  disabled,
  placeholder = "Tell me what your video is about…",
  buttonLabel = "Fill",
}) => {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setTimeout(() => {
      onApply(deriveSuggestion(prompt));
      setBusy(false);
    }, 320);
  };

  return (
    <div className="ai-bar">
      <span aria-hidden style={{ fontSize: 16 }}>✨</span>
      <input
        type="text"
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        aria-label="AI prompt"
        disabled={disabled}
      />
      <button onClick={submit} disabled={disabled || busy || !prompt.trim()}>
        {busy ? "…" : buttonLabel}
      </button>
    </div>
  );
};
