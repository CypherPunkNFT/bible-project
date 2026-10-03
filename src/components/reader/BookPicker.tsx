import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCatalog } from "@/lib/catalog";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { Translation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  translation: Translation;
  current: string;
  onPick: (code: string) => void;
  onClose: () => void;
}

/** Every book of the current version as coloured tiles grouped by section. */
export function BookPicker({ translation, current, onPick, onClose }: Props) {
  const catalog = useCatalog();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>("[data-current='true'], button")?.focus();
    // Escape closes only this dialog (not the verse panel underneath); Tab stays inside it.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
      if (event.key === "Tab" && dialog.current) {
        const items = [...dialog.current.querySelectorAll<HTMLElement>("button")];
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
        aria-label={`Choose a book in the ${translation.name}`}
        className="w-full max-w-4xl rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Books in the {translation.abbr}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-2" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const books = catalog.books.filter((b) => b.section === section.id && translation.books[b.code]);
            if (!books.length) return null;
            return (
              <div key={section.id}>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{section.name}</h3>
                <div className="grid grid-cols-3 gap-1.5 xs:grid-cols-4 sm:grid-cols-6">
                  {books.map((book) => (
                    <button
                      type="button"
                      key={book.code}
                      data-current={book.code === current}
                      onClick={() => onPick(book.code)}
                      className={cn(
                        "min-h-[44px] truncate rounded-md px-2 py-2 text-left text-[13px] font-semibold text-white transition hover:brightness-110",
                        book.code === current && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
                      )}
                      style={{ background: sectionColor(section.id) }}
                    >
                      {book.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
