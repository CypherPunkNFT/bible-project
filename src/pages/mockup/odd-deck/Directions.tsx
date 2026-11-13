// The four ways the deck can be the start screen's moving picture (mock-ups, owner 2026-11-12), each after a real
// interface: 1 the wallet (Apple Wallet's stack), 2 the carousel (Cover Flow), 3 where and when (the cards placed on
// the line of history, the map and the shelf of books), 4 the collection (Apple Fitness awards: every slot, filled as
// you go). Each moves on its own every few seconds and stops while the pointer or focus is on it.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { CardEdge, DeckCard } from "./DeckCard";
import { MAP_H, MAP_W, mapFrame } from "./map";
import { CARDS, ERAS, TOTAL, useDeck, type CardData, type Kept } from "./deck";

interface Entry { card: CardData; kept: Kept }
const useEntries = (): Entry[] => {
  const deck = useDeck();
  return useMemo(() => deck.flatMap((kept) => { const card = CARDS.get(kept.id); return card ? [{ card, kept }] : []; }), [deck]);
};

/** Moves on every `ms` unless held (pointer or focus inside). */
function useAuto(count: number, ms: number) {
  const [index, setIndex] = useState(0);
  const held = useRef(false);
  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => { if (!held.current) setIndex((n) => (n + 1) % count); }, ms);
    return () => window.clearInterval(timer);
  }, [count, ms]);
  const hold = { onPointerEnter: () => { held.current = true; }, onPointerLeave: () => { held.current = false; },
    onFocus: () => { held.current = true; }, onBlur: () => { held.current = false; } };
  return { index: count ? index % count : 0, setIndex, hold };
}

const all = TOTAL.person + TOTAL.place + TOTAL.book;
function DeckHead({ entries }: { entries: Entry[] }) {
  const of = (kind: CardData["kind"]) => entries.filter((entry) => entry.card.kind === kind).length;
  return <div className="od-head">
    <p className="od-head-title"><b>Your deck</b> <span>{`${formatNumber(entries.length)} of ${formatNumber(all)} odd ones kept`}</span></p>
    <p className="od-head-kinds">
      <span>{`${formatNumber(of("person"))} people`}</span><span>{`${formatNumber(of("place"))} places`}</span><span>{`${formatNumber(of("book"))} books`}</span>
    </p>
  </div>;
}

// ---- 1. The wallet ------------------------------------------------------------------------------------------------
export function Wallet() {
  const entries = useEntries();
  const { index, setIndex, hold } = useAuto(entries.length, 4500);
  if (!entries.length) return null;
  const order = entries.map((_, n) => entries[(index + n) % entries.length]);
  const behind = order.slice(1, 6).reverse();
  return <section className="od-wallet" aria-label="Your deck" {...hold}>
    <DeckHead entries={entries} />
    <div className="od-wallet-stack">
      {behind.map((entry, n) => <button key={entry.card.id} type="button" className="od-wallet-edge"
        style={{ "--i": behind.length - n } as React.CSSProperties}
        onClick={() => setIndex(entries.indexOf(entry))} aria-label={`Show ${entry.card.name}`}>
        <CardEdge card={entry.card} />
      </button>)}
      <DeckCard key={order[0].card.id} card={order[0].card} kept={order[0].kept} className="od-wallet-front" />
    </div>
  </section>;
}

// ---- 2. The carousel ----------------------------------------------------------------------------------------------
export function Carousel() {
  const entries = useEntries();
  const { index, setIndex, hold } = useAuto(entries.length, 4000);
  const start = useRef<number | null>(null);
  if (!entries.length) return null;
  const go = (step: number) => setIndex((index + step + entries.length) % entries.length);
  const offset = (n: number) => { let d = n - index; const half = entries.length / 2; if (d > half) d -= entries.length; if (d < -half) d += entries.length; return d; };
  return <section className="od-carousel" aria-label="Your deck" {...hold}
    onKeyDown={(event) => { if (event.key === "ArrowLeft") go(-1); if (event.key === "ArrowRight") go(1); }}>
    <DeckHead entries={entries} />
    <div className="od-carousel-stage"
      onPointerDown={(event) => { start.current = event.clientX; }}
      onPointerUp={(event) => { if (start.current !== null && Math.abs(event.clientX - start.current) > 40) go(event.clientX < start.current ? 1 : -1); start.current = null; }}>
      {entries.map((entry, n) => {
        const d = offset(n);
        if (Math.abs(d) > 3) return null;
        return <div key={entry.card.id} className={`od-carousel-slot${d === 0 ? " is-front" : ""}`}
          style={{ "--d": d, "--a": Math.abs(d) } as React.CSSProperties} onClick={() => d !== 0 && setIndex(n)}>
          <DeckCard card={entry.card} kept={entry.kept} linked={d === 0} />
        </div>;
      })}
    </div>
    <div className="od-carousel-nav">
      <button type="button" onClick={() => go(-1)} aria-label="Previous card"><ChevronLeft size={18} /></button>
      <span>{`${formatNumber(index + 1)} / ${formatNumber(entries.length)}`}</span>
      <button type="button" onClick={() => go(1)} aria-label="Next card"><ChevronRight size={18} /></button>
    </div>
  </section>;
}

// ---- 3. Where and when --------------------------------------------------------------------------------------------
type Pane = "person" | "place" | "book";
const PANES: [Pane, string][] = [["person", "When they lived"], ["place", "Where it is"], ["book", "Where it sits"]];

/** The kept places on one map, zoomed to fit them; a pin opens its card. Labels sit right of the pin, or left near the edge. */
function BigMap({ shown, current, pick }: { shown: Entry[]; current?: Entry; pick: (id: string) => void }) {
  const points = shown.flatMap((entry) => (entry.card.at ? [entry.card.at] : []));
  if (!points.length) return null;
  const { x, y, dots, scale } = mapFrame(points, 4);
  const r = Math.min(1.4, Math.max(.7, scale * 1.4));
  return <svg className="od-bigmap" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="group" aria-label="Your places on the map">
    {dots.map(([lon, lat]) => <circle key={`${lon},${lat}`} cx={x(lon)} cy={y(lat)} r={r} className="od-map-dot" />)}
    {shown.map((entry) => {
      const [lon, lat] = entry.card.at ?? [0, 0];
      const cx = Math.min(MAP_W - 4, Math.max(4, x(lon))), cy = Math.min(MAP_H - 4, Math.max(4, y(lat)));
      const left = cx > MAP_W * .75;
      return <g key={entry.card.id} className={`od-bigmap-pin${entry === current ? " is-on" : ""}`} onClick={() => pick(entry.card.id)}
        style={{ "--sec": `var(--${entry.card.top.sec})` } as React.CSSProperties}>
        <circle cx={cx} cy={cy} r={6} className="od-map-ring" /><circle cx={cx} cy={cy} r={2.6} className="od-map-pin" />
        <text x={cx + (left ? -4.5 : 4.5)} y={cy + 1.5} textAnchor={left ? "end" : "start"}>{entry.card.name}</text>
      </g>;
    })}
  </svg>;
}

export function WhereWhen() {
  const entries = useEntries();
  const [pane, setPane] = useState<Pane>("person");
  const shown = entries.filter((entry) => entry.card.kind === pane);
  const { index, setIndex, hold } = useAuto(shown.length, 4000);
  const current = shown[index];
  if (!entries.length) return null;
  const pick = (id: string) => setIndex(Math.max(0, shown.findIndex((entry) => entry.card.id === id)));
  return <section className="od-where" aria-label="Your deck" {...hold}>
    <DeckHead entries={entries} />
    <div className="od-pills" role="group" aria-label="Show">
      {PANES.map(([key, label]) => <button key={key} type="button" aria-pressed={pane === key} onClick={() => { setPane(key); setIndex(0); }}>{label}</button>)}
    </div>
    <div className="od-where-body">
      <div className="od-where-picture">
        {pane === "person" && <div className="od-ribbon">
          {ERAS.map((era) => {
            const here = shown.filter((entry) => entry.card.era === era.id);
            return <div key={era.id} className={`od-ribbon-col${here.length ? " has-cards" : ""}`}>
              <span className="od-ribbon-era">{era.label}</span>
              <div className="od-ribbon-stack">{here.map((entry) => <button key={entry.card.id} type="button"
                className={`od-ribbon-chip${entry === current ? " is-on" : ""}`} style={{ "--sec": `var(--${entry.card.top.sec})` } as React.CSSProperties}
                onClick={() => pick(entry.card.id)}>{entry.card.name}</button>)}</div>
            </div>;
          })}
        </div>}
        {pane === "place" && <BigMap shown={shown} current={current} pick={pick} />}
        {pane === "book" && <div className="od-bigshelf">
          {Array.from({ length: 66 }, (_, n) => {
            const entry = shown.find((item) => item.card.canon === n + 1);
            return <button key={n} type="button" disabled={!entry} className={`${entry ? "is-kept" : ""}${entry && entry === current ? " is-on" : ""}`}
              style={{ "--sec": `var(--${n < 17 ? "history" : n < 22 ? "poetry" : n < 39 ? "prophets" : n < 43 ? "gospels" : n === 43 ? "acts" : n < 65 ? "epistles" : "revelation"})` } as React.CSSProperties}
              onClick={() => entry && pick(entry.card.id)} aria-label={entry ? entry.card.name : undefined} />;
          })}
          <span className="od-bigshelf-ends"><span>Genesis</span><span>Revelation</span></span>
        </div>}
      </div>
      {current ? <DeckCard key={current.card.id} card={current.card} kept={current.kept} className="od-where-card" />
        : <p className="od-empty">None kept yet. Play a round of this kind and its odd ones land here.</p>}
    </div>
  </section>;
}

// ---- 4. The collection --------------------------------------------------------------------------------------------
const initials = (name: string) => name.split(/\s+/).filter((part) => /^[A-Z0-9]/.test(part)).slice(0, 2).map((part) => part[0]).join("") || name[0];

export function Collection() {
  const entries = useEntries();
  const { index, setIndex, hold } = useAuto(entries.length, 4500);
  const byKind = useMemo(() => {
    const groups: Record<Pane, CardData[]> = { person: [], place: [], book: [] };
    for (const card of CARDS.values()) groups[card.kind].push(card);
    for (const list of Object.values(groups)) list.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }, []);
  if (!entries.length) return null;
  const current = entries[index];
  const keptIds = new Map(entries.map((entry, n) => [entry.card.id, n]));
  return <section className="od-collection" aria-label="Your deck" {...hold}>
    <DeckHead entries={entries} />
    <div className="od-collection-body">
      <DeckCard key={current.card.id} card={current.card} kept={current.kept} className="od-collection-card" />
      <div className="od-slots">
        {(Object.keys(byKind) as Pane[]).map((kind) => {
          const list = byKind[kind];
          const have = list.filter((card) => keptIds.has(card.id)).length;
          return <div key={kind} className="od-slot-group">
            <p className="od-slot-head"><b>{kind === "person" ? "People" : kind === "place" ? "Places" : "Books"}</b>
              <span>{`${formatNumber(have)} / ${formatNumber(list.length)}`}</span>
              <i style={{ "--p": have / list.length } as React.CSSProperties} /></p>
            <div className="od-slot-grid">{list.map((card) => {
              const at = keptIds.get(card.id);
              return at === undefined ? <span key={card.id} className="od-slot" />
                : <button key={card.id} type="button" className={`od-slot is-kept${at === index ? " is-on" : ""}`}
                  style={{ "--sec": `var(--${card.top.sec})` } as React.CSSProperties} onClick={() => setIndex(at)} aria-label={card.name}>{initials(card.name)}</button>;
            })}</div>
          </div>;
        })}
      </div>
    </div>
  </section>;
}
