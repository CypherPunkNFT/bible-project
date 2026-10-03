import { MapPin, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadPlain } from "@/lib/data";
import { bookByNum, formatRange, plainLookup, splitId } from "@/lib/refs";
import { sectionColor } from "@/lib/sections";
import { useAsync } from "@/lib/useAsync";
import type { MapPlace } from "./projection";

/** One place: where it is named, as a reference list by book, then the verses themselves. */
export function PlacePanel({ place, onClose, overlay }: { place: MapPlace; onClose: () => void; overlay: boolean }) {
  const catalog = useCatalog();
  const [shown, setShown] = useState(15);
  // Verse ids grouped by book, in canon order.
  const byBook = new Map<number, number[]>();
  for (const id of [...place.verses].sort((a, b) => a - b)) {
    const num = splitId(id).num;
    byBook.set(num, [...(byBook.get(num) ?? []), id]);
  }
  const books = [...byBook.entries()].sort((a, b) => a[0] - b[0]);

  return (
    // Over the map: exactly the map's height; on phones: at most 70% of the screen. The name and close button
    // are fixed at the top; only the part from "Where it is named" down scrolls, with a slim pill scrollbar.
    <aside
      aria-labelledby="place-title"
      className={cn("flex flex-col overflow-hidden rounded-2xl border border-line bg-surface", overlay ? "h-full shadow-2xl" : "max-h-[70vh]")}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-line/60 px-4 pb-3 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{place.type}</p>
          <h2 id="place-title" className="flex items-center gap-2 font-serif text-2xl font-semibold">
            <MapPin className="h-5 w-5" style={{ color: sectionColor(place.section) }} aria-hidden /> {place.name}
          </h2>
          <p className="text-sm text-muted">
            Named in {place.verses.length} {place.verses.length === 1 ? "verse" : "verses"} · location confidence {Math.round(place.confidence * 100)}%
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
      <h3 className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Where it is named</h3>
      <ul className="space-y-1.5 text-sm leading-relaxed">
        {books.map(([num, ids]) => {
          const book = bookByNum(catalog, num);
          const slug = book && catalog.translations.find((t) => t.slug === "kjv")?.books[book.code] ? "kjv" : null;
          return (
            <li key={num}>
              <span className="font-semibold">{book?.name ?? `Book ${num}`}</span>{" "}
              {ids.map((id, i) => {
                const { chapter, verse } = splitId(id);
                return (
                  <span key={id}>
                    {i > 0 && ", "}
                    {slug && book ? (
                      <Link className="text-muted underline-offset-2 hover:text-ink hover:underline" to={`/read/${slug}/${book.code}/${chapter}?v=${verse}`}>
                        {chapter}:{verse}
                      </Link>
                    ) : (
                      <span className="text-muted">
                        {chapter}:{verse}
                      </span>
                    )}
                  </span>
                );
              })}
            </li>
          );
        })}
      </ul>

      <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">The verses (KJV)</h3>
      <ol className="space-y-2">
        {place.verses.slice(0, shown).map((id) => (
          <PlaceVerse key={id} id={id} />
        ))}
      </ol>
      {place.verses.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + 30)} className="mt-3 w-full rounded-lg bg-surface-2 py-2 text-sm">
          Show more ({place.verses.length - shown} left)
        </button>
      )}
      <p className="mt-4 text-[11px] text-muted">Place data from OpenBible.info's Bible geocoding (CC-BY 4.0).</p>
      </div>
    </aside>
  );
}

function PlaceVerse({ id }: { id: number }) {
  const catalog = useCatalog();
  const { num, chapter, verse } = splitId(id);
  const book = bookByNum(catalog, num);
  const code = book?.code ?? "GEN";
  const plain = useAsync(() => loadPlain("kjv", code), `plain:kjv:${code}`);
  return (
    <li>
      <Link to={`/read/kjv/${code}/${chapter}?v=${verse}`} className="block rounded-lg p-2 hover:bg-surface-2">
        <span className="text-sm font-semibold">{formatRange(catalog, id, id)}</span>
        <span className="mt-0.5 line-clamp-2 block font-serif text-sm text-ink/85">
          {plain.status === "ready" ? plainLookup(plain.value, chapter, verse) ?? "" : "…"}
        </span>
      </Link>
    </li>
  );
}
