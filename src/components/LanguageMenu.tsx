// The header's language button, between Contact and Search (owner, 2026-10-31). The site is being translated, Spanish
// and Brazilian Portuguese first; until a translation is published the button shows only on this computer's preview,
// so a release cannot put a menu of languages the site does not have yet on bibleguide.io.
import { Check, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "pt-BR", name: "Português (Brasil)" },
] as const;
type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "bp-language";
const PREVIEW_ONLY = typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname);

function storedLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find((language) => language.code === saved)?.code ?? "en";
  } catch {
    return "en";
  }
}

export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<LanguageCode>(storedLanguage);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); window.removeEventListener("keydown", escape); };
  }, [open]);
  if (!PREVIEW_ONLY) return null;
  const choose = (code: LanguageCode) => {
    setCurrent(code);
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* private window: the choice lasts this visit only */ }
  };
  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label="Language"
        title="Language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((now) => !now)}
        className={cn(
          "grid h-[34px] w-[34px] place-items-center rounded-full border transition-colors focus:outline-none",
          open ? "border-ink bg-ink text-page" : "border-line text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        <Languages className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label="Language" className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[12rem] rounded-xl border border-line bg-page p-1.5 shadow-lg">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              role="menuitemradio"
              aria-checked={current === language.code}
              lang={language.code}
              onClick={() => choose(language.code)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none",
                current === language.code ? "text-accent" : "text-ink hover:bg-surface-2",
              )}
            >
              {language.name}
              {current === language.code && <Check className="h-4 w-4" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
