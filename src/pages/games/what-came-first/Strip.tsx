// What came first?: the year strip in the reveal (Who's older?'s timeline strip), the proof the sentence under it
// describes, for every category whose items have years (people, events, rulers, buildings, deaths). Each window is a
// solid bar on one axis, the first item's in the game's colour, with its years written under its ends, and the empty
// space between the bars carries a bracket saying how far apart they are at the very least. The bars draw in from the
// left; the state is there at once and the drawing only decorates it. With an early-Genesis item the strip has no years
// at all: the two bars are drawn in order with words only, because one axis cannot carry real years and invented ones.
import type { PairCategory } from "./order";
import type { PoolPair } from "./pool";
import { strip } from "./view";

export function Strip({ pair, category }: { pair: PoolPair; category: PairCategory }) {
  const { bars: [a, b], gap } = strip(pair, category);
  return <figure className="wo-timeline" aria-label={`Timeline: ${a.person.label} ${a.note}; ${b.person.label} ${b.note}.`}>
    {[a, b].map((bar, n) => <div key={bar.person.id} className={`wo-lane wo-lane-${n}`}>
      <span className="wo-lane-name">{bar.person.label}</span>
      <span className="wo-track">
        <span className={`wo-bar${bar.open ? " is-open" : ""}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
        {bar.left > 60 && !bar.end
          ? <span className="wo-year wo-year-end" style={{ left: `${Math.min(bar.left + bar.width, 100)}%` }}>{bar.start}</span>
          : <span className="wo-year wo-year-start" style={{ left: `${bar.left}%` }}>{bar.start}</span>}
        {bar.end && <span className="wo-year wo-year-end" style={{ left: `${Math.min(bar.left + bar.width, 100)}%` }}>{bar.end}</span>}
      </span>
    </div>)}
    {gap && <div className="wo-gap" aria-hidden="true">
      <span className="wo-gap-line" style={{ left: `${gap.left}%`, width: `${gap.width}%` }}><span className="wo-gap-label">{gap.label}</span></span>
    </div>}
  </figure>;
}
