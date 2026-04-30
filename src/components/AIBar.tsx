import { useEffect, useState } from "react";

type Props = {
  onApply: (suggestion: AISuggestion) => void;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  sceneId: string;
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

type ProviderId =
  | "auto"
  | "consensus"
  | "openai"
  | "anthropic"
  | "gemini"
  | "perplexity"
  | "groq"
  | "local";

type ProviderInfo = { id: ProviderId; label: string; emoji: string };

const PROVIDERS: ProviderInfo[] = [
  { id: "auto", label: "Auto", emoji: "✨" },
  { id: "consensus", label: "All (consensus)", emoji: "🌐" },
  { id: "anthropic", label: "Claude", emoji: "🧠" },
  { id: "openai", label: "GPT", emoji: "🤖" },
  { id: "gemini", label: "Gemini", emoji: "💎" },
  { id: "perplexity", label: "Perplexity", emoji: "🔎" },
  { id: "groq", label: "Llama (Groq)", emoji: "🦙" },
  { id: "local", label: "Local heuristic", emoji: "📴" },
];

// ============== Local heuristic fallback ==============

const EMOJI_HINTS: [RegExp, string][] = [
  [/\bfit|gym|workout|run|salud|gimnasio/i, "💪"],
  [/\bmoney|finance|stock|invest|dinero|finanzas/i, "💸"],
  [/\bcode|developer|programmer|tech/i, "💻"],
  [/\bcoffee|drink|food|recipe|café|comida/i, "☕"],
  [/\btravel|trip|vacation|viaje/i, "✈️"],
  [/\blove|date|relationship|amor/i, "❤️"],
  [/\bbook|read|study|libro/i, "📚"],
  [/\bmusic|song|artist|música/i, "🎵"],
  [/\bart|design|paint|arte/i, "🎨"],
  [/\bgame|play|juego/i, "🎮"],
  [/\bAI|GPT|model/i, "🤖"],
  [/\bsleep|rest|relax|sueño/i, "😴"],
];

function pickEmoji(prompt: string): string {
  for (const [re, e] of EMOJI_HINTS) if (re.test(prompt)) return e;
  return "✨";
}

function deriveLocal(prompt: string): AISuggestion {
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

// ============== Component ==============

export const AIBar: React.FC<Props> = ({
  onApply,
  disabled,
  placeholder = "Tell me what your video is about…",
  buttonLabel = "Fill",
  sceneId,
}) => {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<ProviderId>(() => {
    try {
      const saved = localStorage.getItem("bbmw0.provider");
      if (saved && PROVIDERS.some((p) => p.id === saved)) {
        return saved as ProviderId;
      }
    } catch {
      // ignore
    }
    return "auto";
  });
  const [serverProviders, setServerProviders] = useState<string[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, ping /api/ai (GET) to learn which providers are configured.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j && Array.isArray(j.available)) {
          setServerProviders(j.available);
        } else {
          setServerProviders([]);
        }
      })
      .catch(() => {
        if (!cancelled) setServerProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("bbmw0.provider", provider);
    } catch {
      // ignore
    }
  }, [provider]);

  const isLocalForced = provider === "local";
  const noServerProviders =
    serverProviders !== null && serverProviders.length === 0;
  const useLocal = isLocalForced || noServerProviders;

  const submit = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setBusy(true);

    if (useLocal) {
      // Pure client-side fallback
      setTimeout(() => {
        onApply(deriveLocal(prompt));
        setBusy(false);
      }, 250);
      return;
    }

    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sceneId, mode: provider }),
      });
      const j = await r.json();
      if (!r.ok) {
        const msg = j?.error ?? `HTTP ${r.status}`;
        setError(msg);
        // Soft fallback: still apply local result so the user gets something
        onApply(deriveLocal(prompt));
      } else if (j?.suggestion) {
        onApply(j.suggestion);
      } else {
        onApply(deriveLocal(prompt));
      }
    } catch (e) {
      setError((e as Error).message);
      onApply(deriveLocal(prompt));
    } finally {
      setBusy(false);
    }
  };

  const currentLabel =
    PROVIDERS.find((p) => p.id === provider)?.label ?? "Auto";
  const currentEmoji =
    PROVIDERS.find((p) => p.id === provider)?.emoji ?? "✨";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="ai-bar">
        <button
          type="button"
          className="ai-provider-pill"
          aria-label="Choose AI provider"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((v) => !v)}
        >
          <span aria-hidden style={{ fontSize: 14 }}>
            {currentEmoji}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>
            {currentLabel}
          </span>
          <span aria-hidden style={{ fontSize: 9, opacity: 0.6 }}>
            ▾
          </span>
        </button>
        <input
          type="text"
          placeholder={placeholder}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="AI prompt"
          disabled={disabled || busy}
        />
        <button
          onClick={submit}
          disabled={disabled || busy || !prompt.trim()}
        >
          {busy ? "…" : buttonLabel}
        </button>
      </div>

      {pickerOpen && (
        <div className="ai-provider-menu" role="menu">
          {PROVIDERS.map((p) => {
            const isAvailable =
              p.id === "auto" ||
              p.id === "consensus" ||
              p.id === "local" ||
              serverProviders === null ||
              serverProviders.includes(p.id);
            const disabled =
              !isAvailable && p.id !== "local" && p.id !== "auto" && p.id !== "consensus";
            return (
              <button
                key={p.id}
                type="button"
                role="menuitemradio"
                aria-checked={p.id === provider}
                disabled={disabled}
                className="ai-provider-item"
                onClick={() => {
                  setProvider(p.id);
                  setPickerOpen(false);
                }}
              >
                <span aria-hidden>{p.emoji}</span>
                <span>{p.label}</span>
                {p.id === provider && (
                  <span className="ai-provider-check" aria-hidden>
                    ✓
                  </span>
                )}
                {disabled && (
                  <span className="ai-provider-mute" aria-hidden>
                    no key
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="ai-error" role="alert">
          {error}
        </div>
      )}

      {noServerProviders && !isLocalForced && (
        <div className="ai-hint">
          ✨ Add an API key in Vercel env vars to unlock real LLMs (Claude, GPT, Gemini, Perplexity, Llama). Falling back to local fill.
        </div>
      )}
    </div>
  );
};
