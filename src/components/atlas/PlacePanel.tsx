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

/** One place: where it is named, as a small chart by book, then the verses themselves. */
export function PlacePanel({ place, onClose, overlay }: { place: MapPlace; onClose: () => void; overlay: boolean }) {
  const catalog = useCatalog();
  const [shown, setShown] = useState(15);
  const byBook = new Map<number, number>();
  for (const id of place.verses) byBook.set(splitId(id).num, (byBook.get(splitId(id).num) ?? 0) + 1);
  const books = [...byBook.entries()].sort((a, b) => a[0] - b[0]);
  const max = Math.max(...books.map(([, n]) => n));

  return (
    // Over the map: exactly the map's height; on phones: a fixed scroll area. Either way it scrolls itself —
    // a place named in hundreds of verses never stretches the page. The name and close button stay put.
    <aside
      aria-labelledby="place-title"
      className={cn(
        "overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface px-4 pb-4",
        overlay ? "h-full shadow-2xl" : "max-h-[70vh]",
      )}
    >
      <div className="sticky top-0 z-10 -mx-4 flex items-start justify-between gap-2 border-b border-line/60 bg-surface px-4 pb-3 pt-4">
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

      <h3 className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Where it is named</h3>
      <div className="flex h-16 items-end gap-[2px]" role="img" aria-label={`Mentions by book: ${books.map(([n, c]) => `${bookByNum(catalog, n)?.name} ${c}`).join(", ")}`}>
        {books.map(([num, count]) => {
          const book = bookByNum(catalog, num);
          return (
            <span
              key={num}
              title={`${book?.name}: ${count}`}
              className="min-w-[4px] flex-1 rounded-t-sm"
              style={{ height: `${Math.max(6, (count / max) * 100)}%`, background: sectionColor(book?.section ?? "apocrypha") }}
            />
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {books.length} {books.length === 1 ? "book" : "books"}, from {bookByNum(catalog, books[0][0])?.name} to {bookByNum(catalog, books[books.length - 1][0])?.name}
      </p>

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
