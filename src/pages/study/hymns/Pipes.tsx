// Beside the Hymns page's title: one organ pipe per book of the Bible, as tall as the hymns written on it and coloured by
// section, in two centred rows, the Old Testament over the New (approved mock-up: design/hymns-landing-two-rows/, owner
// 2026-10-18). Every pipe has the same width and scale; the tallest book (the Psalms) is cut down to PEAK with a break
// mark across it and labelled to its left. The pipes are played like an organ (owner, 2026-10-18): a melody walks the top
// row left to right in common-metre phrases, a slower left hand holds notes on the bottom row, with rests between phrases.
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { bookIndexOf, type HymnBook, type HymnCollection } from "@/lib/hymns";
import { formatNumber } from "./model";

const SECTIONS = [["history", "Law & history"], ["poetry", "Poetry"], ["prophets", "Prophets"], ["gospels", "Gospels & Acts"], ["epistles", "Letters"], ["revelation", "Rev."]] as const;
const ROWS = [
  { first: 0, last: 38, named: ["Genesis", "Judges", "Isaiah", "Zechariah"] },
  { first: 39, last: 65, named: ["Luke", "Romans", "Hebrews", "Revelation"] },
];
const STEP = 14.8, W = 10, PEAK = 112;

function Row({ books, perBook, peakAt, second, first, last, named }: {
  books: HymnBook[]; perBook: number[]; peakAt: number; second: number; first: number; last: number; named: string[];
}) {
  const idx = Array.from({ length: last - first + 1 }, (_, k) => first + k);
  const heightOf = (i: number) => (i === peakAt ? PEAK : perBook[i] ? 14 + Math.sqrt(perBook[i] / second) * 66 : 6);
  const base = Math.max(...idx.map(heightOf)) + 26, left = (600 - ((idx.length - 1) * STEP + W)) / 2;
  return <svg viewBox={`0 0 600 ${base + 34}`} role="presentation">
    {idx.map((i, k) => {
      const b = books[i], n = perBook[i], x = left + k * STEP, h = heightOf(i), top = base - h;
      const lx = k === 0 ? x : x + W / 2, anchor = k === 0 ? "start" : "middle";
      return <g key={b.code}>
        <g className={`pipe${n ? "" : " silent"}`} style={{ color: `var(--${b.section})`, animationDelay: `${(k * 0.07).toFixed(2)}s` } as CSSProperties}>
          <rect x={x} y={top} width={W} height={h} rx="1.4" fill="currentColor" />
          <path d={`M${x} ${base} L${x + W / 2} ${base + 12} L${x + W} ${base}`} fill="currentColor" fillOpacity=".45" />
          {n > 0 && <path d={`M${x + 1.5} ${base - 9} q${W / 2 - 1.5} -4 ${W - 3} 0`} stroke="var(--page)" strokeWidth="1.3" fill="none" />}
          {i === peakAt && <path d={`M${x - 1} ${top + 46} L${x + W + 1} ${top + 40} M${x - 1} ${top + 51} L${x + W + 1} ${top + 45}`} stroke="var(--page)" strokeWidth="1.8" />}
        </g>
        {i === peakAt && <>
          <text className="hc-pipe-name" x={x - 6} y={top + 10} textAnchor="end">{b.name}</text>
          <text className="hc-pipe-n" x={x - 6} y={top + 22} textAnchor="end">{formatNumber(n)} hymns</text>
        </>}
        {i !== peakAt && named.includes(b.name) && <>
          <text className="hc-pipe-name" x={lx} y={top - 15} textAnchor={anchor}>{b.name}</text>
          <text className="hc-pipe-n" x={lx} y={top - 4} textAnchor={anchor}>{n}</text>
        </>}
      </g>;
    })}
    {SECTIONS.map(([id, label]) => {
      const inRow = idx.filter((i) => books[i].section === id);
      if (!inRow.length) return null;
      const x1 = left + (inRow[0] - first) * STEP, x2 = left + (inRow[inRow.length - 1] - first) * STEP + W;
      return <g key={id}>
        <path d={`M${x1} ${base + 18} V${base + 21} H${x2} V${base + 18}`} fill="none" stroke={`var(--${id})`} strokeOpacity=".6" />
        <text className="hc-pipe-section" x={(x1 + x2) / 2} y={base + 32} textAnchor="middle">{label}</text>
      </g>;
    })}
  </svg>;
}

export function Pipes({ collection }: { collection: HymnCollection }) {
  const { books, hymns } = collection;
  const perBook = useMemo(() => {
    const counts = books.map(() => 0);
    for (const h of hymns) if (h.v) counts[bookIndexOf(h.v)] += 1;
    return counts;
  }, [books, hymns]);
  const order = [...perBook].sort((a, b) => b - a), peakAt = perBook.indexOf(order[0]), second = order[1];
  const figure = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = figure.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return playOrgan(root);
  }, [perBook]);
  return <figure ref={figure} className="hc-rows hc-played" role="img" aria-label="Hymns written on each book of the Bible, Genesis to Revelation">
    {ROWS.map((r) => <div key={r.first}><Row books={books} perBook={perBook} peakAt={peakAt} second={second} {...r} /></div>)}
  </figure>;
}

// The player. Each row is a keyboard, left to right; a pipe with no hymns is a silent key and is never played. The right
// hand plays the top row: phrases of 8, 6, 8 and 6 notes (common metre, like Amazing Grace), each note a step or two up or
// down from the last but drifting rightward, a longer note to end each phrase and a breath after it. The left hand plays
// the bottom row, one held note at the start and middle of each phrase, moving right at the same rate. After the last
// phrase reaches the right end, a rest, and the hymn begins again at the left.
function playOrgan(root: HTMLElement): () => void {
  const rows = [...root.querySelectorAll("svg")].map((svg) => [...svg.querySelectorAll<SVGGElement>(".pipe")].filter((g) => !g.classList.contains("silent")));
  const [melody, bass] = rows;
  if (!melody?.length || !bass?.length) return () => {};
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (ms: number, fn: () => void) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
  const sound = (pipe: SVGGElement, ms: number) => { pipe.classList.add("on"); later(ms, () => pipe.classList.remove("on")); };
  const BEAT = 340, METRE = [8, 6, 8, 6];
  const verse = () => {
    let at = 0, here = 0, time = 0;
    const span = melody.length - 1, notes = METRE.reduce((a, b) => a + b, 0);
    METRE.forEach((length, phrase) => {
      for (let n = 0; n < length; n += 1) {
        at += 1;
        const target = Math.round((at / notes) * span);            // where the hand should be by now
        const wander = [-2, -1, 0, 1, 1, 2][Math.floor(Math.random() * 6)];
        here = Math.max(0, Math.min(span, Math.round((here + target) / 2) + wander));
        const last = n === length - 1, beats = last ? 2.5 : n % 2 === 0 ? 1 : 0.6 + Math.random() * 0.6;
        const key = melody[here], start = time;
        later(start, () => sound(key, beats * BEAT * 0.92));
        if (n === 0 || n === Math.floor(length / 2)) {
          const low = bass[Math.round(((at / notes) * (bass.length - 1)))];
          later(start, () => sound(low, length / 2 * BEAT * 0.95));
        }
        time += beats * BEAT;
      }
      time += phrase === METRE.length - 1 ? 0 : BEAT * 0.8;           // a breath between phrases
    });
    later(time + BEAT * 4, verse);                                     // a rest, then from the left again
  };
  verse();
  return () => { timers.forEach(clearTimeout); timers.clear(); root.querySelectorAll(".pipe.on").forEach((p) => p.classList.remove("on")); };
}
