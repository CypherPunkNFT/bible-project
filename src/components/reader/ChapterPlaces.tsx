import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { loadPlaces } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";

/** Places named in this chapter (OpenBible.info geocoding), each a link to the atlas. */
export function ChapterPlaces({ bookNum, chapter }: { bookNum: number; chapter: number }) {
  const places = useAsync(loadPlaces, "places");
  if (places.status !== "ready" || bookNum > 66 || !Number.isFinite(chapter)) return null;
  const low = bookNum * 1_000_000 + chapter * 1000;
  const found = places.value
    .map((place) => ({ place, count: place.verses.filter((id) => id > low && id < low + 1000).length }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.place.name.localeCompare(b.place.name));
  if (!found.length) return null;
  return (
    <section aria-label="Places in this chapter" className="mt-10 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <MapPin className="h-3.5 w-3.5" aria-hidden /> Places in this chapter · {found.length}
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {found.map(({ place, count }) => (
          <li key={place.id}>
            <Link
              to={`/atlas?place=${place.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-sm hover:bg-surface-2"
            >
              {place.name}
              {count > 1 && <span className="text-xs text-muted">×{count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
