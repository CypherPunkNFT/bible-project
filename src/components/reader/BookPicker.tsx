import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ReadingChart, type ChartBook } from "@/components/ReadingChart";
import { useCatalog } from "@/lib/catalog";
import { useProgress } from "@/lib/progress";
import type { Translation } from "@/lib/types";

interface Props {
  translation: Translation;
  current: { code: string; chapter: string };
  onPick: (code: string, chapter: string) => void;
  onClose: () => void;
}

/** The reading chart as a chapter picker: every book of this version, every chapter one click away. */
export function BookPicker({ translation, current, onPick, onClose }: Props) {
  const catalog = useCatalog();
  const progress = useProgress();
  const dialog = useRef<HTMLDivElement>(null);
  // This version's own chapter labels (some are "12a"-style); read marks only where it numbers like the KJV.
  const books: ChartBook[] = catalog.books
    .filter((b) => translation.books[b.code])
    .map((b) => ({ code: b.code, name: b.name, section: b.section, chapters: translation.books[b.code], href: `/read/${translation.slug}/${b.code}/${translation.books[b.code][0]}` }));
  const isRead = translation.numbering === "english" ? progress.isRead : undefined;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const here = dialog.current?.querySelector<HTMLElement>("[aria-current='page']");
    here?.focus();
    here?.scrollIntoView({ block: "center" });
    // Escape closes only this dialog (not the verse panel underneath); Tab stays inside it.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
      if (event.key === "Tab" && dialog.current) {
        const items = [...dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])")];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Choose a chapter in the ${translation.name}`}
        className="w-full max-w-4xl rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Choose a chapter · {translation.abbr}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-2" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="[--box:2rem] sm:[--box:1.5rem]">
          <ReadingChart books={books} isRead={isRead} onChapter={onPick} mode="open" current={current} compact />
        </div>
      </div>
    </div>
  );
}
