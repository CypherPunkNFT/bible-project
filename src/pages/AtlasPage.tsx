import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AtlasCollection } from "./places/AtlasCollection";
import { PlacesArtwork } from "./places/PlacesArtwork";
import { StreetAtlasMap } from "@/components/atlas/StreetAtlasMap";
import { projectPlace, type MapPlace } from "@/components/atlas/projection";
import { PlacePanel } from "@/components/atlas/PlacePanel";
import { Loading } from "@/components/charts/ChartCard";
import { useCatalog } from "@/lib/catalog";
import { loadPlaces } from "@/lib/data";
import { sectionOfNum, splitId } from "@/lib/refs";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { Catalog, Place, SectionId } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn, formatNumber } from "@/lib/utils";

/** Share of the map the slide-in place panel covers on wide screens (24rem of a ~1230px map, plus margin). */
const PANEL_FRACTION = 0.36;

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
  return <AtlasCollection atlas={<AtlasExplorer />} />;
}

function AtlasExplorer() {
  const { hash } = useLocation();
  const catalog = useCatalog();
  const raw = useAsync(loadPlaces, "places");
  useEffect(() => {
    if (raw.status !== "ready" || !["#places-map", "#top-places"].includes(hash)) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [hash, raw.status]);
  const [search, setSearch] = useSearchParams();
  const [sections, setSections] = useState<Set<SectionId>>(new Set());
  const [book, setBook] = useState("");
  const query = search.get("find") ?? "";
  const setQuery = (value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set("find", value);
    else next.delete("find");
    setSearch(next, { replace: true });
  };
  const wide = useMediaQuery("(min-width: 1024px)");

  const all = useMemo<MapPlace[]>(() => {
    if (raw.status !== "ready") return [];
    return raw.value.map((p) => {
      const [x, y] = projectPlace(p);
      return { ...p, x, y, section: dominantSection(catalog, p) };
    });
  }, [raw, catalog]);

  const bookNum = catalog.books.find((b) => b.code === book)?.num;
  const shown = useMemo(() => all.filter((p) => {
    if (sections.size && !p.verses.some((id) => sections.has(sectionOfNum(catalog, splitId(id).num)))) return false;
    if (bookNum && !p.verses.some((id) => splitId(id).num === bookNum)) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [all, sections, bookNum, query, catalog]);
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
    <div>
      <header className="places-destination-intro history-intro">
        <div>
          <p className="places-kicker">Explore by place</p>
          <h1>The places of the Bible.</h1>
          <p>Explore {formatNumber(all.length || 1252)} places. Find a name, open a group, or move closer. Every place leads back to Scripture.</p>
        </div>
        <PlacesArtwork kind="atlas" />
      </header>
      <div id="places-map" className="study-section-anchor mb-4 flex flex-wrap items-center gap-2">
        {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sections.has(s.id)}
            onClick={() => toggleSection(s.id)}
            className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition", sections.has(s.id) ? "font-semibold" : "border-line hover:bg-surface-2")}
            style={sections.has(s.id) ? { background: `color-mix(in srgb, ${sectionColor(s.id)} 15%, var(--surface))`, borderColor: sectionColor(s.id) } : undefined}
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
        {(query || book || sections.size > 0) && <button type="button" className="text-xs text-accent underline underline-offset-4" onClick={() => { setQuery(""); setBook(""); setSections(new Set()); }}>Clear filters</button>}
      </div>

      {/* Wide screens: the place panel slides in over the right of the map while the map flies to the place,
          so the map never changes size. Phones: the panel sits below the map. */}
      <div className="grid gap-5">
        <div>
          {raw.status === "ready" ? (
            <StreetAtlasMap
              places={shown}
              selected={selected}
              onSelect={choose}
              coveredFraction={wide && selected ? PANEL_FRACTION : 0}
              overlay={
                wide && (
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        key="place-panel"
                        initial={{ x: 48, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 48, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute bottom-3 right-4 top-3 w-[min(24rem,40%)]"
                      >
                        <PlacePanel key={selected.id} place={selected} onClose={() => choose(null)} overlay />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )
              }
            />
          ) : (
            <Loading height={560} />
          )}
        </div>
        {!wide && selected && <PlacePanel key={selected.id} place={selected} onClose={() => choose(null)} overlay={false} />}
      </div>

      {shown.length > 0 && <TopPlaces places={shown} onSelect={choose} />}
    </div>
  );
}

function TopPlaces({ places, onSelect }: { places: MapPlace[]; onSelect: (place: MapPlace) => void }) {
  const top = [...places].sort((a, b) => b.verses.length - a.verses.length).slice(0, 24);
  const max = top[0]?.verses.length ?? 1;
  return (
    <section aria-labelledby="top-places" className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h2 id="top-places" className="study-section-anchor font-serif text-2xl font-semibold">
        Most-named places
      </h2>
      <p className="mb-4 text-sm text-muted">The places named in the most verses (of those shown on the map above).</p>
      <ol className="gap-x-8 sm:columns-2">
        {top.map((p) => (
          <li key={p.id} className="mb-1 break-inside-avoid">
            <button type="button" onClick={() => { onSelect(p); document.getElementById("places-map")?.scrollIntoView({ block: "start", behavior: "smooth" }); }} className="grid w-full grid-cols-[7rem_1fr_3rem] items-center gap-2 text-left text-sm hover:text-accent">
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
