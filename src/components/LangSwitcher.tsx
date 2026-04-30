import { useState, useRef, useEffect } from "react";
import { LANGS, type Lang } from "../i18n";

type Props = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

export const LangSwitcher: React.FC<Props> = ({ lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="lang-switcher">
      <button
        type="button"
        className="lang-trigger"
        aria-label="Change language"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{current.flag}</span>
        <span className="lang-code">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div role="menu" className="lang-menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === lang}
              className="lang-item"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <span aria-hidden>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && (
                <span className="lang-check" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
