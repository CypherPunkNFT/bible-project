// 02 "Where are they now?" (the approved "place cards + SVG atlas map"; mock-up js/places.js): the cities that hold the
// manuscripts as dots on a map from Chicago to the Caucasus, zoomed by map-zoom.ts. Choosing a city slides its panel in
// from the right; choosing a manuscript there opens its record over it. Beneath, the holders as cards grouped by
// continent, in a four-row area that scrolls with the outside pill and fades out at its foot.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { OutsideScroll } from "@/components/OutsideScroll";
import type { MsMap } from "@/lib/manuscripts";
import { mountMapZoom, type MapZoom } from "./map-zoom";
import { formatNumber, kindOf, plural, sigla } from "./model";
import { useMs } from "./context";
import { SectionHead } from "./parts";
import { CONTINENTS, cityTable, continentOf, holderKind, shortCity, SIDE, TONE, type City, type HolderKindKey } from "./places-model";
import { SlidePanel } from "./Sheet";

const HOLDER_ICONS: Record<HolderKindKey, ReactNode> = {
  monastery: <><path d="M10 9h4" /><path d="M12 7v5" /><path d="M14 22v-4a2 2 0 0 0-4 0v4" /><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22" /><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9.382a1 1 0 0 1 .553-.894L6 7" /></>,
  museum: <><path d="M3 22h18" /><path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M12 2 20 7H4z" /></>,
  treasury: <><path d="M4 21h16" /><path d="M6 21v-7a6 6 0 0 1 12 0v7" /><path d="M12 8V3" /><path d="M10 21v-4h4v4" /></>,
  library: <><rect width="8" height="18" x="3" y="3" rx="1" /><path d="M7 3v18" /><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z" /></>,
  university: <><path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
};
const toneOf = (country: string) => ({ "--tone": `var(${TONE[continentOf(country)]})` }) as CSSProperties;

/** The land and the city dots, drawn once; map-zoom.ts sizes the dots and places the names. */
const MapSvg = memo(function MapSvg({ map, cities, on }: { map: MsMap; cities: City[]; on: string | null }) {
  const proj = (lat: number, lon: number) => [(lon - map.lon0) * map.cos * map.k, (map.lat1 - lat) * map.k];
  return <svg className="pl-map" role="img" aria-label="Map from Chicago to the Caucasus">
    <g className="pl-land">{map.d.map((d, i) => <path key={i} d={d} />)}</g>
    <g className="pl-pulse" aria-hidden="true" />
    <g className="pl-dots">{cities.map((c) => {
      const [x, y] = proj(c.lat, c.lon);
      return <g key={c.city} className={`pl-city${c.city === on ? " on" : ""}`} style={toneOf(c.country)} data-city={c.city} data-x={x.toFixed(1)} data-y={y.toFixed(1)} data-r={(4 + Math.sqrt(c.n) * 1.5).toFixed(1)}
        data-side={SIDE[c.city] ?? "e"} tabIndex={0} role="button" aria-label={`${c.city}: ${plural(c.n, "record")}`}><circle cx={x.toFixed(1)} cy={y.toFixed(1)} /><text>{shortCity(c.city)}</text></g>;
    })}</g>
  </svg>;
});

export function Places({ num }: { num: string }) {
  const { index, openRecord } = useMs();
  const { data } = index;
  const cities = useMemo(() => cityTable(data), [data]);
  const groups = useMemo(() => {
    const holders = [...data.holders].sort((a, b) => b.n - a.n);
    return CONTINENTS.map(([key, title]) => ({ key, title, list: holders.filter((h) => continentOf(h.country) === key) })).filter((g) => g.list.length)
      .sort((x, y) => x.list.length - y.list.length); // smallest first (owner 2026-10-18): Near East, North America, Europe
  }, [data]);
  const [city, setCity] = useState<City | null>(null), [holderId, setHolderId] = useState<string | null>(null), [open, setOpen] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const view = useRef<HTMLDivElement>(null), zoom = useRef<MapZoom | null>(null), body = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLDivElement>(null), lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    const svg = view.current?.querySelector<SVGSVGElement>(".pl-map");
    if (!view.current || !svg) return;
    zoom.current = mountMapZoom(view.current, svg, data.map);
    return () => zoom.current?.destroy();
  }, [data]);

  // The holder cards fade out at the foot of their area while there is more below, and end crisply at the bottom.
  useEffect(() => {
    const vp = cards.current?.querySelector<HTMLElement>(".outside-scroll-viewport");
    if (!vp) { console.error("Where are they now: the card area has no scrolling viewport to fade"); return; }
    const update = () => setAtEnd(vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2);
    vp.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(vp);
    update();
    return () => { vp.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);

  const openCity = useCallback((name: string, holder: string | null, from: Element) => {
    const found = cities.find((c) => c.city === name);
    if (!found) { console.error(`Where are they now: no city named "${name}" in the holder table`); return; }
    lastFocus.current = from;
    setCity(found); setHolderId(holder); setOpen(true);
    zoom.current?.focusCity(name);
    // Coming from a card below, bring the map into view so the move can be seen.
    const v = view.current;
    if (v && !v.contains(from)) {
      const b = v.getBoundingClientRect(), shown = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 64));
      if (shown < b.height * 0.65) v.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [cities]);
  const close = useCallback(() => {
    setOpen(false);
    zoom.current?.stopPulse();
    const from = lastFocus.current as HTMLElement | null;
    if (from?.isConnected) from.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!open) return;
    const recordOpen = () => document.querySelector(".ms-sheet.open:not(.pl-drawer)");
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && !recordOpen()) close(); };
    const click = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target.closest(".pl-drawer, .ms-sheet, [data-city], [data-open]")) return;
      close();
    };
    addEventListener("keydown", key);
    document.addEventListener("click", click);
    return () => { removeEventListener("keydown", key); document.removeEventListener("click", click); };
  }, [open, close]);

  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [city, holderId]);

  const onMapClick = (e: ReactMouseEvent) => {
    const el = (e.target as Element).closest<SVGGElement>("[data-city]");
    if (!el || zoom.current?.dragged()) return;
    openCity(el.dataset.city ?? "", null, el);
  };
  const onMapKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = (e.target as Element).closest<SVGGElement>("[data-city]");
    if (el) { e.preventDefault(); openCity(el.dataset.city ?? "", null, el); }
  };
  const jump = (key: string) => {
    const vp = cards.current?.querySelector<HTMLElement>(".outside-scroll-viewport"), group = cards.current?.querySelector<HTMLElement>(`[data-group="${key}"]`);
    if (vp && group) vp.scrollTo({ top: vp.scrollTop + group.getBoundingClientRect().top - vp.getBoundingClientRect().top, behavior: "smooth" });
  };

  const list = city ? (holderId ? city.records.filter((r) => r.h?.includes(holderId)) : city.records) : [];
  const kinds = new Map<string, number>();
  for (const r of list) kinds.set(r.k, (kinds.get(r.k) ?? 0) + 1);
  const unplaced = data.counts.withHolder - data.counts.placed;
  const card = (h: (typeof data.holders)[number]) => {
    const c = cities.find((x) => x.city === h.city), first = c?.records.find((r) => r.h?.includes(h.id)), [kind, kindLabel] = holderKind(h.name);
    return <button key={h.id} type="button" role="listitem" className="pl-card" style={toneOf(h.country)} data-city={h.city} data-holder={h.id} data-kind={kind}
      aria-pressed={open && city?.city === h.city && holderId === h.id} onClick={(e) => openCity(h.city, h.id, e.currentTarget)}>
      <span className="pl-icon" title={kindLabel}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{HOLDER_ICONS[kind]}</svg></span>
      <span className="pl-card-text"><b>{h.name}</b><small>{kindLabel} · {h.city}, {h.country}</small><small>Oldest here: {first ? `${first.n}${first.d ? `, ${first.d}` : ""}` : "–"}</small></span><em>{formatNumber(h.n)}</em></button>;
  };

  return <>
    <SectionHead num={num} kicker="Where are they now?" title={<>From Chicago to Sinai, <em>who keeps them</em></>}
      lead={`${formatNumber(data.counts.placed)} records name a holder this page can place, in ${cities.length} cities. Scroll on the map to zoom in and out, and drag to move it; choose a city or a card to see what is kept there, oldest first. ${formatNumber(unplaced)} more name a holder not yet placed; their records still show it.`} />
    <div className="pl-mapwrap">
      <div ref={view} className="pl-mapview" tabIndex={0} aria-label="Map of the cities that hold the manuscripts. Scroll or pinch to zoom, drag to move; plus and minus keys zoom, arrow keys move."
        onClick={onMapClick} onKeyDown={onMapKey}><MapSvg map={data.map} cities={cities} on={open ? city?.city ?? null : null} /></div>
    </div>
    <div className="pl-holderwrap">
      <div className="pl-continents">{groups.map((g) => <button key={g.key} type="button" data-continent={g.key} style={{ "--tone": `var(${TONE[g.key]})` } as CSSProperties} onClick={() => jump(g.key)}><i />{g.key} <em>{g.list.length}</em></button>)}</div>
      <div ref={cards}><OutsideScroll className={`pl-cardarea${atEnd ? " at-end" : ""}`} label="The libraries and collections that hold them">
        {groups.map((g) => <div key={g.key} className="pl-group" data-group={g.key}><p className="pl-group-head">{g.title}<span>{plural(g.list.length, "place")} · {plural(g.list.reduce((s, h) => s + h.n, 0), "record")}</span></p>
          <div className="pl-cards" role="list">{g.list.map(card)}</div></div>)}
      </OutsideScroll></div>
    </div>
    <SlidePanel open={open} onClose={close} label="City" closeLabel="Close" className="pl-drawer" bodyRef={body}>
      {city && <>
        <p className="kicker">{city.country} · {continentOf(city.country)}</p><h2>{city.city}</h2>
        <p className="pl-holders">{city.holders.map((h) => <button key={h.id} type="button" aria-pressed={h.id === holderId} onClick={() => setHolderId(h.id === holderId ? null : h.id)}>{h.name} <em>{formatNumber(h.n)}</em></button>)}</p>
        <p className="pl-kinds">{[...kinds].sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k} style={{ "--tone": `var(${kindOf(k).tone})` } as CSSProperties}><i />{kindOf(k).label} {formatNumber(n)}</span>)}</p>
        <p className="pl-sub">Oldest first · {plural(list.length, "record")}</p>
        <ol className="pl-list">{list.map((r) => <li key={r.i}><button type="button" data-open={r.i} onClick={(e) => openRecord(r.i, e.currentTarget)}><span>{r.d ?? "undated"}</span><b>{r.n}</b>{sigla(r) && <small>{sigla(r)}</small>}</button></li>)}</ol>
      </>}
    </SlidePanel>
  </>;
}
