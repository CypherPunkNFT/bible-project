import { ChevronDown, ChevronLeft, ChevronRight, Columns2, Type } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCatalog } from "@/lib/catalog";
import { sectionColor } from "@/lib/sections";
import type { BookInfo, Translation } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { ReaderSettings } from "./settings";
import { VersionMenu } from "./VersionMenu";

export interface ChapterLink {
  label: string;
  go: () => void;
}

interface Props {
  translation: Translation;
  book: BookInfo;
  chapter: string;
  parallel: Translation[];
  settings: ReaderSettings;
  prev: ChapterLink | null;
  next: ChapterLink | null;
  onTranslation: (slug: string) => void;
  onOpenBooks: () => void;
  onParallel: (slugs: string[]) => void;
  onSettings: (settings: ReaderSettings) => void;
}

type Open = "version" | "side" | "options" | null;

/**
 * The reader's one bar: previous chapter · [version ▾] [book & chapter — opens the reading chart] [side by side ▾] · next.
 * Each control's panel opens right under that control, never as a native dropdown.
 */
export function ReaderToolbar(props: Props) {
  const { translation, book, chapter, parallel, prev, next } = props;
  const [open, setOpen] = useState<Open>(null);
  const bar = useRef<HTMLDivElement>(null);
  const toggle = (which: Exclude<Open, null>) => setOpen((current) => (current === which ? null : which));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => !bar.current?.contains(event.target as Node) && setOpen(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setOpen(null);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const catalog = useCatalog();
  // One click = the KJV beside what you are reading (or, when reading the KJV, the next version that has this book).
  const companion =
    (translation.slug !== "kjv" && catalog.translations.find((t) => t.slug === "kjv" && t.books[book.code])) ||
    catalog.translations.find((t) => t.slug !== translation.slug && t.books[book.code]);
  const sideBySide = parallel.length > 0;
  const toggleSideBySide = () => {
    setOpen(null);
    if (sideBySide) props.onParallel([]);
    else if (companion) props.onParallel([companion.slug]);
  };
  const versionMenu = (
    <VersionMenu
      bookCode={book.code}
      current={translation}
      parallel={parallel}
      onRead={(slug) => {
        setOpen(null);
        props.onTranslation(slug);
      }}
      onParallel={props.onParallel}
    />
  );

  return (
    <div ref={bar} className="sticky top-[3.6rem] z-30 -mx-4 border-b border-line bg-page/90 px-2 backdrop-blur-md sm:-mx-6 sm:px-4">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 md:grid-cols-[1fr_auto_1fr] md:gap-2">
        <div className="flex justify-start">
          <StepButton link={prev} direction="prev" />
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2">
          <div className="shrink-0 sm:relative">
            <button
              type="button"
              onClick={() => toggle("version")}
              aria-expanded={open === "version"}
              aria-haspopup="true"
              aria-label={`Version: ${translation.name} — change`}
              title={translation.name}
              className={cn(
                "flex max-w-[6rem] items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-sm font-semibold hover:bg-surface-2 sm:max-w-[10rem]",
                open === "version" && "bg-surface-2",
              )}
            >
              <span className="truncate">{translation.abbr}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
            </button>
            {open === "version" && (
              <Panel label="Versions" align="left">
                {versionMenu}
              </Panel>
            )}
          </div>

          <button
            type="button"
            onClick={props.onOpenBooks}
            aria-haspopup="dialog"
            aria-label={`${book.name} ${chapter} — choose a book and chapter`}
            className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-2 sm:px-3"
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: sectionColor(book.section) }} aria-hidden />
            <span className="truncate font-serif text-lg font-semibold tracking-tight sm:text-2xl">
              {book.name} <span className="text-muted">{chapter}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted transition group-hover:text-ink sm:block" aria-hidden />
          </button>

          <div className="shrink-0 sm:relative">
            <div className={cn("flex items-center rounded-full border border-line", sideBySide && "border-accent/60 bg-accent/10")}>
              <button
                type="button"
                onClick={toggleSideBySide}
                aria-pressed={sideBySide}
                aria-label={sideBySide ? "Turn side by side off" : `Read side by side with the ${companion?.abbr ?? "KJV"}`}
                title={sideBySide ? "Side by side: on (click to turn off)" : `Side by side with the ${companion?.abbr ?? "KJV"}`}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-s-full px-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink",
                  sideBySide && "text-accent",
                )}
              >
                <Columns2 className="h-[18px] w-[18px] shrink-0" />
                {sideBySide && <span className="hidden max-w-[7rem] truncate sm:inline">{parallel.map((p) => p.abbr).join(" + ")}</span>}
              </button>
              <button
                type="button"
                onClick={() => toggle("side")}
                aria-expanded={open === "side"}
                aria-label="Choose which versions to read side by side"
                title="Choose versions to read side by side"
                className="grid h-9 w-6 place-items-center rounded-e-full border-s border-line text-muted hover:bg-surface-2 hover:text-ink"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {open === "side" && (
              <Panel label="Versions" align="right">
                {versionMenu}
              </Panel>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1">
          <StepButton link={next} direction="next" />
          <div className="sm:relative">
            <button
              type="button"
              onClick={() => toggle("options")}
              aria-expanded={open === "options"}
              aria-label="Reading options"
              title="Reading options"
              className={cn("grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink", open === "options" && "bg-surface-2 text-ink")}
            >
              <Type className="h-5 w-5" />
            </button>
            {open === "options" && (
              <Panel label="Reading options" align="right">
                <Options settings={props.settings} onSettings={props.onSettings} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepButton({ link, direction }: { link: ChapterLink | null; direction: "prev" | "next" }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  if (!link) return <span className="h-10 w-10" aria-hidden />;
  return (
    <button
      type="button"
      onClick={link.go}
      aria-label={`${direction === "prev" ? "Previous" : "Next"} chapter: ${link.label}`}
      className={cn("flex h-10 items-center gap-1 rounded-full px-2 text-sm text-muted hover:bg-surface-2 hover:text-ink", direction === "next" && "flex-row-reverse")}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span className="hidden max-w-[10rem] truncate md:inline">{link.label}</span>
    </button>
  );
}

/**
 * A panel under the control that opened it: aligned to that control's left or right edge on wider screens,
 * full width under the bar on phones (the control's wrapper is only `relative` from `sm` up).
 */
function Panel({ label, align, children }: { label: string; align: "left" | "right"; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "absolute inset-x-2 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:inset-x-auto sm:w-[30rem]",
        align === "left" ? "sm:left-0" : "sm:right-0",
      )}
    >
      {children}
    </div>
  );
}

const TOGGLES = [
  ["redLetters", "Words of Jesus in red"],
  ["footnotes", "Footnotes"],
  ["versePerLine", "One verse per line"],
] as const;

function Options({ settings, onSettings }: { settings: ReaderSettings; onSettings: (value: ReaderSettings) => void }) {
  const step = (delta: number) => onSettings({ ...settings, scale: Math.min(1.5, Math.max(0.85, Math.round((settings.scale + delta) * 100) / 100)) });
  return (
    <div className="space-y-1 p-3 text-sm">
      <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2">
        <span>Text size</span>
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => step(-0.1)} aria-label="Smaller text" className="grid h-10 w-10 place-items-center rounded-lg border border-line font-serif text-sm hover:bg-surface-2">
            A
          </button>
          <span className="w-12 text-center tabular-nums text-muted">{Math.round(settings.scale * 100)}%</span>
          <button type="button" onClick={() => step(0.1)} aria-label="Larger text" className="grid h-10 w-10 place-items-center rounded-lg border border-line font-serif text-xl hover:bg-surface-2">
            A
          </button>
        </span>
      </div>
      {TOGGLES.map(([key, text]) => (
        <label key={key} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl px-2 hover:bg-surface-2">
          {text}
          <input type="checkbox" role="switch" checked={settings[key]} onChange={(e) => onSettings({ ...settings, [key]: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
        </label>
      ))}
    </div>
  );
}
