// Who's older?: the timeline strip in the reveal (design §7.1). Each birth window is a soft bar on one axis, and the
// empty space between them is the proof. With an early-Genesis person the strip has no years at all: the two bars are
// drawn in order with words only, because one axis cannot carry real years on one side and invented ones on the other.
import type { Character, PoolPair } from "./game";
import { formatYear, windowText } from "./explain";

interface Bar { person: Character; left: number; width: number; open: boolean; note: string }

const OPEN_SHARE = 0.25; // an open edge fades out over this share of the axis

function bars(pair: PoolPair): { bars: [Bar, Bar]; start?: number; end?: number } {
  const { first, second } = pair;
  if (!first.shown || !second.shown) {
    return { bars: [
      { person: first, left: 4, width: 38, open: first.lo === null, note: "earlier" },
      { person: second, left: 58, width: 38, open: false, note: "later" },
    ] };
  }
  const known = [first.lo, first.hi, second.lo, second.hi].filter((y): y is number => y !== null);
  let start = Math.min(...known);
  const end = Math.max(...known);
  if (first.lo === null) start -= Math.max(50, (end - start) * OPEN_SHARE);
  const span = Math.max(1, end - start);
  const at = (year: number) => ((year - start) / span) * 100;
  const bar = (person: Character): Bar => {
    const lo = person.lo ?? start;
    return { person, left: at(lo), width: Math.max(2, at(person.hi ?? end) - at(lo)), open: person.lo === null, note: windowText(person) };
  };
  return { bars: [bar(first), bar(second)], start, end };
}

export function Timeline({ pair }: { pair: PoolPair }) {
  const { bars: [a, b], start, end } = bars(pair);
  const years = start !== undefined && end !== undefined;
  return <figure className="wo-timeline" aria-label={`Timeline: ${a.person.label} ${a.note}; ${b.person.label} ${b.note}.`}>
    {[a, b].map((bar, n) => <div key={bar.person.id} className={`wo-lane wo-lane-${n}`}>
      <span className={`wo-bar${bar.open ? " is-open" : ""}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
      <span className="wo-bar-label" style={{ left: `${Math.min(bar.left, 60)}%` }}>
        <strong>{bar.person.label}</strong> <span>{bar.open ? "earlier — unknown" : bar.note}</span>
      </span>
    </div>)}
    {years && <div className="wo-axis" aria-hidden="true">
      <span>{a.open ? "earlier" : formatYear(start)}</span><span>{formatYear(end)}</span>
    </div>}
  </figure>;
}
