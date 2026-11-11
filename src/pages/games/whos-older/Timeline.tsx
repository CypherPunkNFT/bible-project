// Who's older?: the timeline strip in the reveal (design §7.1), the proof the sentence under it describes. Each birth
// window is a solid bar on one axis, the first person's in the game's colour, with its years written under its ends,
// and the empty space between the bars carries a bracket saying how far apart they are at the very least. The bars
// draw in from the left; the state is there at once and the drawing only decorates it. With an early-Genesis person the
// strip has no years at all: the two bars are drawn in order with words only, because one axis cannot carry real years
// on one side and invented ones on the other.
import type { PoolPair } from "./game";
import { strip } from "./view";

export function Timeline({ pair }: { pair: PoolPair }) {
  const { bars: [a, b], gap } = strip(pair);
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
