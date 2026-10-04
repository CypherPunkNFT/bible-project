import { Link2, X } from "lucide-react";
import { useEffect } from "react";
import { useCatalog } from "@/lib/catalog";
import type { Translation } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { useChapterCrossRefs } from "./useChapterCrossRefs";
import { ReferencePanel } from "./ReferencePanel";

interface Props {
  translation: Translation;
  bookCode: string;
  chapter: string;
  onPick: (verse: string) => void;
  onClose: () => void;
}

/**
 * The cross-reference panel before a verse is chosen: every verse of the chapter that has cross-references,
 * with how many, as bars. Click one to open its cross-references.
 */
export function ChapterCrossRefs({ translation, bookCode, chapter, onPick, onClose }: Props) {
  const catalog = useCatalog();
  const { usable, verses, total } = useChapterCrossRefs(translation, bookCode, chapter);
  const bookName = catalog.books.find((b) => b.code === bookCode)?.name ?? bookCode;
  const max = Math.max(1, ...verses.map(([, n]) => n));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <ReferencePanel labelledBy="chapter-xref-title">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 id="chapter-xref-title" className="font-serif text-xl font-semibold">
          {bookName} {chapter}
        </h2>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close the cross-reference panel">
          <X className="h-5 w-5" />
        </button>
      </div>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <Link2 className="h-3.5 w-3.5" aria-hidden /> Cross-references {total > 0 && `· ${formatNumber(total)}`}
      </h3>
      {!usable && <p className="text-sm text-muted">Cross-references follow the KJV's numbering and the 66 books; open this chapter in the KJV to see them.</p>}
      {usable && verses.length === 0 && <p className="text-sm text-muted">No cross-references recorded for this chapter.</p>}
      {usable && verses.length > 0 && (
        <>
          <p className="mb-3 text-sm text-muted">Click a verse to see where else Scripture speaks to it.</p>
          <ol className="space-y-1">
            {verses.map(([verse, count]) => (
              <li key={verse}>
                <button type="button" onClick={() => onPick(String(verse))} className="group grid w-full grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-surface-2">
                  <span className="text-right font-semibold tabular-nums text-muted group-hover:text-ink">{verse}</span>
                  <span className="h-2.5 rounded-sm bg-accent/70" style={{ width: `${Math.max(4, (count / max) * 100)}%` }} />
                  <span className="text-right tabular-nums text-muted">{count}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="mt-4 text-[11px] text-muted">Cross references from OpenBible.info, CC-BY.</p>
    </ReferencePanel>
  );
}
