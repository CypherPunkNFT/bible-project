// One deck card's face (mock-ups, owner 2026-11-12): the kind and era or type on top, the name large, one sentence,
// the facts in a quiet row, a small picture that places it (its era on the line of history, its point on the map, or
// its place among the 66 books), and why it was the odd one. The card wears the colour of the book that names it most.
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNumber } from "@/lib/site-format";
import { ERAS, eraLabel, kindLabel, type CardData, type Kept } from "./deck";
import { DOTS_LON, MAP_H, MAP_W, mapFrame } from "./map";

const SECTIONS = ["history", "poetry", "prophets", "gospels", "acts", "epistles", "revelation"] as const;
const sectionOf = (book: number) => (book <= 17 ? 0 : book <= 22 ? 1 : book <= 39 ? 2 : book <= 43 ? 3 : book === 44 ? 4 : book <= 65 ? 5 : 6);

function EraLine({ era }: { era?: string }) {
  const at = ERAS.findIndex((entry) => entry.id === era);
  return <div className="od-era" aria-hidden="true">
    <div className="od-era-ticks">{ERAS.map((entry, n) => <span key={entry.id} className={n === at ? "is-here" : n < at ? "is-before" : ""} />)}</div>
    <div className="od-era-ends"><span>Creation</span><span>Early church</span></div>
  </div>;
}

function PlaceMap({ at }: { at: [number, number] }) {
  const { x, y, dots } = mapFrame([at], 6);
  const inside = at[0] >= DOTS_LON[0] && at[0] <= DOTS_LON[1];
  const px = Math.min(MAP_W - 4, Math.max(4, x(at[0]))), py = Math.min(MAP_H - 4, Math.max(4, y(at[1])));
  return <svg className="od-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true" focusable="false">
    {dots.map(([lon, lat]) => <circle key={`${lon},${lat}`} cx={x(lon)} cy={y(lat)} r={1.4} className="od-map-dot" />)}
    <circle cx={px} cy={py} r={7} className="od-map-ring" />
    <circle cx={px} cy={py} r={3.4} className="od-map-pin" />
    {!inside && <text x={px + (at[0] < DOTS_LON[0] ? 8 : -8)} y={py + 3} textAnchor={at[0] < DOTS_LON[0] ? "start" : "end"} className="od-map-off">
      {at[0] < DOTS_LON[0] ? "further west" : "further east"}</text>}
  </svg>;
}

function CanonShelf({ canon }: { canon: number }) {
  return <div className="od-shelf" aria-hidden="true">
    {Array.from({ length: 66 }, (_, n) => <span key={n} className={n + 1 === canon ? "is-here" : ""}
      style={{ background: `var(--${SECTIONS[sectionOf(n + 1)]})` }} />)}
  </div>;
}

function Facts({ card }: { card: CardData }) {
  if (card.kind === "book") {
    return <dl className="od-facts">
      <div><dt>Chapters</dt><dd>{formatNumber(card.chapters ?? 0)}</dd></div>
      <div><dt>Book</dt><dd>{`${formatNumber(card.canon ?? 0)} of 66`}</dd></div>
    </dl>;
  }
  return <dl className="od-facts">
    <div><dt>Most in</dt><dd>{card.top.book}</dd></div>
    <div><dt>Named in</dt><dd>{`${formatNumber(card.verses)} ${card.verses === 1 ? "verse" : "verses"}`}</dd></div>
  </dl>;
}

interface Props { card: CardData; kept?: Kept; className?: string; style?: React.CSSProperties; linked?: boolean }

export function DeckCard({ card, kept, className = "", style, linked = true }: Props) {
  const tag = card.kind === "person" ? eraLabel(card.era) : card.kind === "place" ? card.type : card.genre;
  return <article className={`od-card od-${card.kind} ${className}`} style={{ "--sec": `var(--${card.top.sec})`, ...style } as React.CSSProperties}>
    <header className="od-card-top">
      <span className="od-kind">{kindLabel(card.kind)}</span>
      <span className="od-tag">{tag}</span>
    </header>
    <h3 className="od-name">{linked ? <Link to={card.href} tabIndex={-1}>{card.name}</Link> : card.name}</h3>
    <p className="od-line">{card.line}</p>
    <Facts card={card} />
    <div className="od-picture">
      {card.kind === "person" && <EraLine era={card.era} />}
      {card.kind === "place" && card.at && <PlaceMap at={card.at} />}
      {card.kind === "book" && <CanonShelf canon={card.canon ?? 1} />}
    </div>
    {kept && <footer className="od-why">
      {kept.spotted && <span className="od-spotted" title="You spotted it"><Check size={12} aria-hidden="true" /></span>}
      <span><b>{card.name}</b> {kept.why}</span>
    </footer>}
  </article>;
}

/** The thin edge of a card in a stack: its colour, kind and name only. */
export function CardEdge({ card, className = "", style }: { card: CardData; className?: string; style?: React.CSSProperties }) {
  return <div className={`od-edge ${className}`} style={{ "--sec": `var(--${card.top.sec})`, ...style } as React.CSSProperties}>
    <span className="od-kind">{kindLabel(card.kind)}</span><span className="od-edge-name">{card.name}</span>
  </div>;
}
