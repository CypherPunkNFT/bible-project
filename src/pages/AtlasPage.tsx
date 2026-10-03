import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AtlasMap } from "@/components/atlas/AtlasMap";
import { projectPlace, type MapPlace } from "@/components/atlas/projection";
import map from "@/data/atlas-map.json";
import { PlacePanel } from "@/components/atlas/PlacePanel";
import { Loading } from "@/components/charts/ChartCard";
import { useCatalog } from "@/lib/catalog";
import { loadPlaces } from "@/lib/data";
import { sectionOfNum, splitId } from "@/lib/refs";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { Catalog, Place, SectionId } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { cn, formatNumber } from "@/lib/utils";

/** The section that names a place most often decides its colour. */
function dominantSection(catalog: Catalog, place: Place): SectionId {
  const counts = new Map<SectionId, number>();
  for (const id of place.verses) {
    const section = sectionOfNum(catalog, splitId(id).num);
    counts.set(section, (counts.get(section) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "history";
}

export default function AtlasPage() {
  const catalog = useCatalog();
  const raw = useAsync(loadPlaces, "places");
  const [search, setSearch] = useSearchParams();
  const [sections, setSections] = useState<Set<SectionId>>(new Set());
  const [book, setBook] = useState("");
  const [query, setQuery] = useState("");
  // The map is as tall as it would be at the row's full width, whether or not the place panel takes a
  // column beside it, so opening a place never makes the map jump shorter.
  const row = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(0);
  useEffect(() => {
    const element = row.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setMapHeight(Math.round((entry.contentRect.width * map.height) / map.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const all = useMemo<MapPlace[]>(() => {
    if (raw.status !== "ready") return [];
    return raw.value.map((p) => {
      const [x, y] = projectPlace(p);
      return { ...p, x, y, section: dominantSection(catalog, p) };
    });
  }, [raw, catalog]);

  const bookNum = catalog.books.find((b) => b.code === book)?.num;
  const shown = all.filter((p) => {
    if (sections.size && !p.verses.some((id) => sections.has(sectionOfNum(catalog, splitId(id).num)))) return false;
    if (bookNum && !p.verses.some((id) => splitId(id).num === bookNum)) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const selected = all.find((p) => p.id === search.get("place")) ?? null;
  const choose = (place: MapPlace | null) => {
    const next = new URLSearchParams(search);
    if (place) next.set("place", place.id);
    else next.delete("place");
    setSearch(next, { replace: true });
  };
  const toggleSection = (id: SectionId) =>
    setSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <header className="pb-5 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Atlas</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">The places of the Bible.</h1>
        <p className="mt-3 max-w-2xl text-muted">
          {formatNumber(all.length || 1252)} places with a known or likely location. Each dot is coloured by the section that names it most, and sized by how many verses name
          it. Click one to read where it appears.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sections.has(s.id)}
            onClick={() => toggleSection(s.id)}
            className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition", sections.has(s.id) ? "border-transparent text-white" : "border-line hover:bg-surface-2")}
            style={sections.has(s.id) ? { background: sectionColor(s.id) } : undefined}
          >
            {!sections.has(s.id) && <span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(s.id) }} />}
            {s.name}
          </button>
        ))}
        <select value={book} onChange={(e) => setBook(e.target.value)} className="h-9 rounded-lg border border-line bg-surface px-2 text-sm" aria-label="Only places named in this book">
          <option value="">Any book</option>
          {catalog.books
            .filter((b) => b.num <= 66)
            .map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
        </select>
        <label className="relative">
          <span className="sr-only">Find a place</span>
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a place…" className="h-9 w-44 rounded-lg border border-line bg-surface pl-8 pr-2 text-sm" />
        </label>
        <span className="text-sm text-muted" aria-live="polite">
          {formatNumber(shown.length)} shown
        </span>
      </div>

      <div ref={row} className={cn("grid gap-5", selected && "lg:grid-cols-[minmax(0,1fr)_24rem]")}>
        <div>{raw.status === "ready" ? <AtlasMap places={shown} selected={selected} onSelect={choose} height={mapHeight} /> : <Loading height={mapHeight || 560} />}</div>
        {selected && <PlacePanel key={selected.id} place={selected} onClose={() => choose(null)} height={mapHeight} />}
      </div>

      {all.length > 0 && <TopPlaces places={shown.length ? shown : all} onSelect={choose} />}
    </div>
  );
}

function TopPlaces({ places, onSelect }: { places: MapPlace[]; onSelect: (place: MapPlace) => void }) {
  const top = [...places].sort((a, b) => b.verses.length - a.verses.length).slice(0, 24);
  const max = top[0]?.verses.length ?? 1;
  return (
    <section aria-labelledby="top-places" className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h2 id="top-places" className="font-serif text-2xl font-semibold">
        Most-named places
      </h2>
      <p className="mb-4 text-sm text-muted">The places named in the most verses (of those shown on the map above).</p>
      <ol className="gap-x-8 sm:columns-2">
        {top.map((p) => (
          <li key={p.id} className="mb-1 break-inside-avoid">
            <button type="button" onClick={() => { onSelect(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="grid w-full grid-cols-[7rem_1fr_3rem] items-center gap-2 text-left text-sm hover:text-accent">
              <span className="truncate">{p.name}</span>
              <span className="h-3 rounded-sm" style={{ width: `${(p.verses.length / max) * 100}%`, background: sectionColor(p.section) }} />
              <span className="text-right tabular-nums text-muted">{formatNumber(p.verses.length)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
