// The ring of 66 spokes for "Teachers through the Bible". Spoke lengths animate through SpokeAnimator (straight to the
// SVG); React draws only the guides, labels, the chosen spoke and the number in the middle.
import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Book } from "@/data/teachers/pages-types";
import { formatNumber } from "../../shared/people";
import { plural } from "../bible/words";
import { countAt, type Timeline, type Track } from "./model";
import { BOOKS, R0, SpokeAnimator, labelAt, niceStep, radiusOf, wedge } from "./geometry";

const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
interface RingProps { books: Book[]; track: Track; timeline: Timeline | null; year: number; selected: number; onSelect: (b: number) => void }

export const Ring = memo(function Ring({ books, track, timeline, year, selected, onSelect }: RingProps) {
  const [hover, setHover] = useState(-1);
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const animator = useRef<SpokeAnimator | null>(null);

  // The ring grows from nothing the first time it scrolls into view.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const spokes = new SpokeAnimator(paths.current);
    animator.current = spokes;
    const firstGrow = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      firstGrow.disconnect(); spokes.grow();
    }, { threshold: 0.2 });
    firstGrow.observe(svg);
    return () => { firstGrow.disconnect(); spokes.stop(); animator.current = null; };
  }, []);

  useEffect(() => {
    const goals = new Float32Array(BOOKS);
    for (let b = 0; b < BOOKS; b++) goals[b] = Math.sqrt(countAt(track, timeline, year, b) / track.max);
    animator.current?.setGoals(goals);
  }, [track, timeline, year]);

  const guides = useMemo(() => [niceStep(track.max), track.max].filter(Boolean).map((v) => ({ v, r: radiusOf(Math.sqrt(v / track.max)) })), [track]);
  const labelled = useMemo(() => track.totals.map((t, b) => [t, b]).filter(([t]) => t).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, b]) => b), [track]);
  const centre = hover >= 0 ? hover : selected;

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const move = MOVES[event.key];
    if (!move) return;
    event.preventDefault(); onSelect(selected + move);
  }

  return <svg ref={svgRef} className="thr-ring" viewBox="-330 -330 660 660" role="img" tabIndex={0} onKeyDown={onKeyDown}
    aria-label="Works by book of the Bible. Use the left and right arrow keys to move between books.">
    <g className="thr-guides" key={`g-${track.id}`}>{guides.map(({ v, r }) => <g key={v}>
      <circle r={r.toFixed(1)} className="thr-guide" />
      <text className="thr-guide-label" x="0" textAnchor="middle" y={(r + 11).toFixed(1)}>{formatNumber(v)}</text></g>)}</g>
    <g className="thr-spokes" onPointerLeave={() => setHover(-1)}>{books.map((book, b) =>
      <path key={book.code} ref={(el) => { paths.current[b] = el; }} fill={`var(--${book.section})`} d={wedge(b, R0)}
        className={[track.totals[b] ? "" : "thr-zero", b === selected ? "thr-on" : ""].join(" ").trim() || undefined}
        onPointerEnter={() => setHover(b)} onClick={() => onSelect(b)}>
        <title>{`${book.name}: ${plural(track.totals[b], "work")}`}</title></path>)}</g>
    <g className="thr-labels" key={`l-${track.id}`}>{labelled.map((b) => {
      const at = labelAt(b);
      return <text key={b} className="thr-label" transform={at.transform} textAnchor={at.anchor} dominantBaseline="middle">{books[b].name}</text>;
    })}</g>
    <circle r={R0 - 6} className="thr-hole" />
    <text className="thr-big" y="-2" textAnchor="middle">{formatNumber(countAt(track, timeline, year, centre))}</text>
    <text className="thr-small" y="22" textAnchor="middle">{books[centre].name}</text>
  </svg>;
});
