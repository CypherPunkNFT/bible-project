// One deck card's face (mock-ups, owner 2026-11-12): the kind and era or type on top, the name large, one sentence
// and the facts in a quiet row. The card wears the colour of the book that names it most. Owner, 2026-11-12: a simple,
// shorter card, so the map (and the era line and book shelf in the same slot) and the "why it was the odd one" line,
// which read as "Salt Sea is not a mountain or hill", are gone.
import { Link } from "react-router-dom";
import { formatNumber, plural } from "@/lib/site-format";
import { eraLabel, kindLabel, type CardData } from "./deck";

function Facts({ card }: { card: CardData }) {
  if (card.kind === "book") {
    return <dl className="od-facts">
      <div><dt>Chapters</dt><dd>{formatNumber(card.chapters ?? 0)}</dd></div>
      <div><dt>Book</dt><dd>{`${formatNumber(card.canon ?? 0)} of 66`}</dd></div>
    </dl>;
  }
  return <dl className="od-facts">
    <div><dt>Most in</dt><dd>{card.top.book}</dd></div>
    <div><dt>Named in</dt><dd>{plural(card.verses, "{n} verse", "{n} verses")}</dd></div>
  </dl>;
}

interface Props { card: CardData; className?: string; style?: React.CSSProperties; linked?: boolean }

export function DeckCard({ card, className = "", style, linked = true }: Props) {
  const tag = card.kind === "person" ? eraLabel(card.era) : card.kind === "place" ? card.type : card.genre;
  return <article className={`od-card od-${card.kind} ${className}`} style={{ "--sec": `var(--${card.top.sec})`, ...style } as React.CSSProperties}>
    <header className="od-card-top">
      <span className="od-kind">{kindLabel(card.kind)}</span>
      <span className="od-tag">{tag}</span>
    </header>
    <h3 className="od-name">{linked ? <Link to={card.href} tabIndex={-1}>{card.name}</Link> : card.name}</h3>
    <p className="od-line">{card.line}</p>
    <Facts card={card} />
  </article>;
}

/** The thin edge of a card in a stack: its colour, kind and name only. */
export function CardEdge({ card, className = "", style }: { card: CardData; className?: string; style?: React.CSSProperties }) {
  return <div className={`od-edge ${className}`} style={{ "--sec": `var(--${card.top.sec})`, ...style } as React.CSSProperties}>
    <span className="od-kind">{kindLabel(card.kind)}</span><span className="od-edge-name">{card.name}</span>
  </div>;
}
