import { useState } from "react";

// Lightweight "AI" helper: does pure client-side prompt parsing to populate the
// scene with sensible content. No network calls — keeps the demo working
// offline. We can swap this for a real LLM later by changing one function.

type Props = {
  onApply: (suggestion: AISuggestion) => void;
  disabled?: boolean;
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
  [/\bfit|gym|workout|run/i, "💪"],
  [/\bmoney|finance|stock|invest/i, "💸"],
  [/\bcode|developer|programmer|tech/i, "💻"],
  [/\bcoffee|drink|food|recipe/i, "☕"],
  [/\btravel|trip|vacation/i, "✈️"],
  [/\blove|date|relationship/i, "❤️"],
  [/\bbook|read|study/i, "📚"],
  [/\bmusic|song|artist/i, "🎵"],
  [/\bart|design|paint/i, "🎨"],
  [/\bgame|play/i, "🎮"],
  [/\bAI|GPT|model/i, "🤖"],
  [/\bsleep|rest|relax/i, "😴"],
];

function pickEmoji(prompt: string): string {
  for (const [re, e] of EMOJI_HINTS) if (re.test(prompt)) return e;
  return "✨";
}

function deriveSuggestion(prompt: string): AISuggestion {
  const trimmed = prompt.trim();
  if (!trimmed) return {};

  // Heuristics: split into a hooky line + 3 bullets.
  const sentences = trimmed
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const hook = sentences[0] ?? trimmed;
  const items = sentences.slice(1, 4);
  while (items.length < 3) items.push("...");

  return {
    text: `POV: ${hook.toLowerCase()}`,
    emoji: pickEmoji(trimmed),
    title: hook.slice(0, 60),
    subtitle: items[0] || "Keep watching.",
    heading: hook.slice(0, 30) || "Why it works",
    items: items.slice(0, 3),
    quote: hook,
    author: "— You, soon",
  };
}

export const AIBar: React.FC<Props> = ({ onApply, disabled }) => {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!prompt.trim()) return;
    setBusy(true);
    // tiny delay to feel like work — doubles as visual feedback
    setTimeout(() => {
      onApply(deriveSuggestion(prompt));
      setBusy(false);
    }, 320);
  };

  return (
    <div className="ai-bar">
      <span aria-hidden style={{ fontSize: 16 }}>
        ✨
      </span>
      <input
        type="text"
        placeholder="Tell me what your video is about…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        aria-label="AI prompt"
        disabled={disabled}
      />
      <button onClick={submit} disabled={disabled || busy || !prompt.trim()}>
        {busy ? "…" : "Fill"}
      </button>
    </div>
  );
};
