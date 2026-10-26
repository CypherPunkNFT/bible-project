// The thick banner that divides the homepage's big sections, edge to edge: the part's number, its name, and a verse that
// says what the part is for. The whole band opens the part's own page; the verse reference still opens the reader.
// The emblem opens the verse written around its ring; hovering it puts that verse in the quote's place, Hebrew turning into English. Its motion is kept faint: the emblem's rings turn in place, the engraved hatch drifts a few pixels to and fro, the edge
// rules carry a soft glow, and chosen words in the line catch the light in turn.
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CHOSEN_DESIGN, DESIGNS, type Design } from "./emblem-designs";
import { Emblem, type EmblemKind } from "./HomeEmblems";
import "./home-banner.css";

type BannerProps = {
  number: string; name: string; line: string; tone: string; verse: string; reference: string; to: string; page: string; emblem: EmblemKind;
  /** Words of the line that catch the light one after another. */
  glint?: string[];
  /** Which of the part's emblem designs to show (emblem-designs.tsx); the homepage uses the chosen one. */
  variant?: number;
  /** Mock-ups only: what to show in the emblem's place. */
  emblemSlot?: ReactNode;
  /** Mock-ups only: the band opens and closes the section under it instead of linking to the part's page. */
  open?: boolean; onToggle?: () => void;
  /** Mirror the band (emblem on the left, number on the right), so stacked bands alternate. */
  flip?: boolean;
  /** Mock-ups only: columns of terms stacked in the space beside the emblem, each with an optional heading. */
  terms?: Array<{ head?: string; items: string[] }>;
  /** Mock-ups only: hovering the emblem plays the ring verse once through, not only while the pointer stays. */
  ringOnce?: boolean;
};

/** The line under the name, with any glint words wrapped so they can light up in turn. */
function Line({ line, glint }: { line: string; glint?: string[] }) {
  if (!glint?.length) return <span>{line}</span>;
  return <span>{line.split(/(\s+)/).map((part, i) => {
    const order = glint.indexOf(part.replace(/[^\p{L}]/gu, ""));
    if (order < 0) return part;
    const word = part.replace(/[^\p{L}]+$/u, "");
    return <span key={i}><em className="home-banner-glint" style={{ "--n": order } as CSSProperties}>{word}</em>{part.slice(word.length)}</span>;
  })}</span>;
}

/** How long a click lets the emblem's lines strengthen before the reader opens. */
const OPEN_DELAY_MS = 500;
/** The length of the ring verse played once through (home-banner.css, home-ring-*). */
const RING_ONCE_MS = 6000;

/** `ringOnce`: start the ring verse on the first hover or focus and let it finish; a new one starts only after that. */
function useRingOnce(enabled?: boolean) {
  const [playing, setPlaying] = useState(false), timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const start = () => {
    if (!enabled || playing || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPlaying(true);
    timer.current = window.setTimeout(() => setPlaying(false), RING_ONCE_MS);
  };
  return { playing, start };
}

/** The verse around the emblem's ring, shown in the quote's place while the emblem is hovered: the Hebrew first, then the
 *  English (BSB) wiping in over it from the left (home-banner.css). */
function RingVerse({ design }: { design: Design }) {
  return <div className="home-banner-ring-verse" aria-hidden="true">
    <p className="home-banner-ring-hebrew" lang="he" dir="rtl">{design.hebrew}</p>
    <p className="home-banner-ring-english">“{design.english[0].toUpperCase() + design.english.slice(1)}”</p>
    <span>{design.source.split(",")[0]} · BSB</span>
  </div>;
}

/** The emblem's link: a plain click strengthens the emblem's lines for a moment, then opens the verse. */
function EmblemLink({ to, label, onEnter, children }: { to: string; label: string; onEnter?: () => void; children: ReactNode }) {
  const navigate = useNavigate(), [reading, setReading] = useState(false), timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (reading) return;
    setReading(true);
    timer.current = window.setTimeout(() => navigate(to), OPEN_DELAY_MS);
  };
  return <Link className={`home-banner-emblem-link${reading ? " is-reading" : ""}`} to={to} aria-label={label} onClick={open} onMouseEnter={onEnter} onFocus={onEnter}>{children}</Link>;
}

export function SectionBanner({ number, name, line, tone, verse, reference, to, page, emblem, glint, variant = CHOSEN_DESIGN, emblemSlot, open, onToggle, flip, terms, ringOnce }: BannerProps) {
  const ring = useRingOnce(ringOnce);
  return <aside className="home-banner" aria-label={`${name}: ${line}`} data-flip={flip || undefined} data-collapsible={onToggle ? "" : undefined} data-open={open || undefined} data-terms={terms ? "" : undefined}
    style={{ "--home-color": `var(--${tone})` } as CSSProperties}>
    {onToggle
      ? <button type="button" className="home-banner-link home-banner-toggle" aria-expanded={!!open} aria-label={`${open ? "Close" : "Open"} ${name}`} onClick={onToggle} />
      : <Link className="home-banner-link" to={page} aria-label={`Open ${name}`} />}
    <div className="home-banner-inner home-wrap" data-ring-once={ringOnce || undefined} data-ring-play={ring.playing || undefined}>
      <div className="home-banner-title">
        <span className="home-banner-number" aria-hidden="true">{number}{onToggle && <ChevronDown className="home-banner-chevron" size={60} strokeWidth={0.9} />}</span>
        <p className="home-banner-name"><small>Part {number}</small><strong>{name}</strong><Line line={line} glint={glint} /></p>
      </div>
      <blockquote>
        <div className="home-banner-quote"><p>{verse}</p><Link to={to}>{reference}<ArrowUpRight size={12} aria-hidden /></Link></div>
        {!emblemSlot && <RingVerse design={DESIGNS[emblem][variant]} />}
      </blockquote>
      {terms && <div className="home-banner-terms" aria-hidden="true">{terms.map((group) => <ul key={group.head ?? group.items[0]}>
        {group.head && <li className="home-banner-terms-head">{group.head}</li>}{group.items.map((item) => <li key={item}>{item}</li>)}</ul>)}</div>}
      {emblemSlot ?? <EmblemLink to={DESIGNS[emblem][variant].to} label={`Read ${DESIGNS[emblem][variant].source}`} onEnter={ring.start}>
        <Emblem kind={emblem} variant={variant} className="home-banner-emblem" /></EmblemLink>}
    </div>
  </aside>;
}
