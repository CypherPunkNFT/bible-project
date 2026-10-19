// Every printed edition the study discusses, in five lanes on one line of time (data: print-timeline.ts). Pointing at one
// says what it is in the line under the chart; clicking it scrolls to the chapter that discusses it and selects it there
// (a tab, a family tree's node, a translation or the edition shown in the architecture chapter).
import { useMemo, useState, type CSSProperties } from 'react';
import { AXIS, AXIS_STOPS, CHAPTERS, ITEMS, LANES, NARROWED, TICKS, type TimelineItem } from './print-timeline';
import { setPrintState } from './usePrintState';

/** Labels are placed against a 1000-unit track; the chart never draws narrower than that, so they never collide. */
const DESIGN_WIDTH = 1000;
const ROW_HEIGHT = 34;

function share(year: number): number {
  const y = Math.min(Math.max(year, AXIS.from), AXIS.to);
  for (let i = 1; i < AXIS_STOPS.length; i++) {
    const [y0, x0] = AXIS_STOPS[i - 1], [y1, x1] = AXIS_STOPS[i];
    if (y <= y1) return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
  }
  return 1;
}
const percent = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;

interface Placed { item: TimelineItem; left: number; span: number; width: number; row: number; before: boolean }

/** Each lane's items, left to right, each on the first row where its label clears the one before. */
function placeLane(items: TimelineItem[]): { placed: Placed[]; rows: number } {
  const ends: number[] = [];
  const placed = [...items].sort((a, b) => a.from - b.from).map(item => {
    const before = item.from < AXIS.from;
    const left = before ? 0 : share(item.from);
    const span = before || !item.to ? 0 : share(item.to) - left;
    const label = ((before ? 2 : 0) + item.label.length) * 6.6 + 14;
    const width = Math.max(span, label / DESIGN_WIDTH);
    let row = ends.findIndex(end => end < left - 0.004);
    if (row === -1) { row = ends.length; ends.push(0); }
    ends[row] = left + width;
    return { item, left, span, width, row, before };
  });
  return { placed, rows: Math.max(ends.length, 1) };
}

function whereItGoes(item: TimelineItem): string {
  const chapter = CHAPTERS.find(c => c.anchor === item.go.anchor);
  return chapter ? `Opens chapter ${chapter.n}, ${chapter.title.toLowerCase()}` : '';
}

export function PrintTimeline({ onEdition }: { onEdition: (id: string) => void }) {
  const lanes = useMemo(() => LANES.map(lane => ({ lane, ...placeLane(ITEMS.filter(i => i.lane === lane.id)) })), []);
  const [pointed, setPointed] = useState<TimelineItem | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const shown = pointed ?? ITEMS.find(i => i.id === chosen) ?? null;

  const go = (item: TimelineItem) => {
    item.go.state?.forEach(([key, value]) => setPrintState(key, value));
    if (item.go.edition) onEdition(item.go.edition);
    setChosen(item.id);
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Two frames: the chosen tab renders before the page scrolls to it.
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.getElementById(item.go.anchor)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })));
  };

  return <section className="pr-timeline" aria-labelledby="pr-timeline-title">
    <div className="pr-tl-head">
      <p className="pr-kicker">Every edition in this study</p>
      <h2 id="pr-timeline-title">Five lanes, <em>one line of time</em></h2>
      <p>Point at an edition to read about it. Click it to go to the chapter that takes it apart.</p>
    </div>
    <div className="pr-tl-scroll"><div className="pr-tl-chart">
      <div className="pr-tl-grid" aria-hidden="true">
        {TICKS.map(year => <i key={year} style={{ left: percent(share(year)) }} />)}
        <b className="pr-tl-narrowed" style={{ left: percent(share(NARROWED.from)), width: percent(share(NARROWED.to) - share(NARROWED.from)) }}><span>narrowed</span></b>
      </div>
      <div className="pr-tl-axis" aria-hidden="true">{TICKS.map(year => <span key={year} style={{ left: percent(share(year)) }}>{year}</span>)}</div>
      {lanes.map(({ lane, placed, rows }) =>
        <div key={lane.id} className="pr-tl-lane" style={{ '--tone': lane.tone } as CSSProperties} role="group" aria-label={lane.label}>
          <span className="pr-tl-lane-label">{lane.label}</span>
          <div className="pr-tl-track" style={{ height: rows * ROW_HEIGHT }}>
            {placed.map(({ item, left, span, width, row, before }) =>
              <button key={item.id} type="button" className="pr-tl-item" data-active={shown?.id === item.id || undefined}
                data-loose={item.loose || undefined} data-open={item.open || undefined} data-before={before || undefined}
                style={{ left: percent(left), top: row * ROW_HEIGHT, width: percent(width) }}
                aria-label={`${item.label}, ${item.date}. ${whereItGoes(item)}.`}
                onMouseEnter={() => setPointed(item)} onMouseLeave={() => setPointed(null)}
                onFocus={() => setPointed(item)} onBlur={() => setPointed(null)} onClick={() => go(item)}>
                <i className="pr-tl-mark" style={{ width: span ? percent(span / width) : undefined }} />
                <span>{before && '← '}{item.label}</span>
              </button>)}
          </div>
        </div>)}
    </div></div>
    <p className="pr-tl-say" aria-live="polite">{shown
      ? <><strong>{shown.label}</strong><span>{shown.date}</span>{shown.note} <em>{whereItGoes(shown)} →</em></>
      : <span>From the Gutenberg Bible to NA28: {ITEMS.length - 1} printed editions and translations, and the one manuscript three of them are built on.</span>}</p>
  </section>;
}
