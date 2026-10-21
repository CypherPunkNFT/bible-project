// The thick banner that divides the homepage's big sections, edge to edge: the part's number, its name, and a verse that
// says what the part is for. The whole band opens the part's own page; the verse reference still opens the reader.
// Its motion is kept faint: the emblem's rings turn in place, the engraved hatch drifts a few pixels to and fro, the edge
// rules carry a soft glow, and chosen words in the line catch the light in turn.
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Emblem, type EmblemKind } from "./HomeEmblems";
import "./home-banner.css";

type BannerProps = {
  number: string; name: string; line: string; tone: string; verse: string; reference: string; to: string; page: string; emblem: EmblemKind;
  /** Words of the line that catch the light one after another. */
  glint?: string[];
  /** Which of the part's emblem designs to show (HomeEmblems.tsx); the homepage uses the first. */
  variant?: number;
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

export function SectionBanner({ number, name, line, tone, verse, reference, to, page, emblem, glint, variant }: BannerProps) {
  return <aside className="home-banner" aria-label={`${name}: ${line}`} style={{ "--home-color": `var(--${tone})` } as CSSProperties}>
    <Link className="home-banner-link" to={page} aria-label={`Open ${name}`} />
    <div className="home-banner-inner home-wrap">
      <span className="home-banner-number" aria-hidden="true">{number}</span>
      <p className="home-banner-name"><small>Part {number}</small><strong>{name}</strong><Line line={line} glint={glint} /></p>
      <blockquote><p>{verse}</p><Link to={to}>{reference}<ArrowUpRight size={12} aria-hidden /></Link></blockquote>
      <Emblem kind={emblem} variant={variant} className="home-banner-emblem" />
    </div>
  </aside>;
}
