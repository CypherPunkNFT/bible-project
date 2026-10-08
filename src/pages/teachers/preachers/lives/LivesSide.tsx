// 04 · Who was alive at the same time: the side panel. The big year, how many were alive and in how many places,
// a small map that follows the year (Europe, or the Atlantic once someone lives across it), and a chip for each life.
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { PeopleData, Person, Point } from "@/data/teachers/pages-types";
import { familyOf } from "../../shared/people";
import { plural, prefersReducedMotion } from "./common";
import { aliveIn, chooseView, placePins, type MapName, type ViewChoice } from "./model";

interface Props {
  people: Person[];
  views: PeopleData["views"];
  year: number;
  hover: number;
  onHover: (index: number) => void;
  onOpen: (index: number, origin: Element) => void;
}
const VIEW_BUTTONS: [ViewChoice, string][] = [["auto", "Follow"], ["europe", "Europe"], ["atlantic", "Atlantic"]];

/** The map shown, swapped with a short fade when the wanted map changes. */
function useShownMap(wanted: MapName, inset: RefObject<HTMLDivElement>) {
  const [shown, setShown] = useState(wanted);
  const [fading, setFading] = useState(false);
  const [instant, setInstant] = useState(false);
  useEffect(() => {
    if (wanted === shown) { setFading(false); return; }
    if (prefersReducedMotion()) { setInstant(true); setShown(wanted); return; }
    setFading(true);
    const timer = window.setTimeout(() => { setInstant(true); setShown(wanted); }, 220);
    return () => window.clearTimeout(timer);
  }, [wanted, shown]);
  // Pins jump to the new map without sliding: the change lands while transitions are off, then they come back on.
  useLayoutEffect(() => {
    if (!instant) return;
    void inset.current?.offsetWidth;
    const frame = requestAnimationFrame(() => { setInstant(false); setFading(false); });
    return () => cancelAnimationFrame(frame);
  }, [instant, inset]);
  return { shown, fading, instant };
}

export function LivesSide({ people, views, year, hover, onHover, onOpen }: Props) {
  const [choice, setChoice] = useState<ViewChoice>("auto");
  const inset = useRef<HTMLDivElement>(null);
  const list = useMemo(() => aliveIn(people, year), [people, year]);
  const cities = useMemo(() => new Set(list.filter((x) => !x.at.unknown).map((x) => x.at.name)).size, [list]);
  const listKey = list.map((x) => `${x.index}@${x.at.index}`).join(",");
  const { shown, fading, instant } = useShownMap(chooseView(list, views, choice), inset);
  const view = views[shown];
  const map = useMemo(() => placePins(list, view), [list, view]);
  // A pin that leaves the map keeps its last place, so when it comes back it slides from there (as in the mock-up).
  const lastPlace = useRef(new Map<number, Point>());
  for (const [i, xy] of map.pins) lastPlace.current.set(i, xy);

  const chipOver = (e: ReactPointerEvent<HTMLDivElement>) => {
    const chip = (e.target as Element).closest<HTMLElement>("[data-i]");
    onHover(chip ? Number(chip.dataset.i) : -1);
  };

  return <div className="life-side">
    <div className="life-now">
      <div><p className="kicker">The year</p><b className="life-year">{year}</b></div>
      <p className="life-meta"><b>{plural(list.length, "teacher")} alive</b>{plural(cities, "place")}</p>
    </div>
    <div ref={inset} className={`life-inset${instant ? " instant" : ""}`}>
      <svg className={fading ? "fading" : undefined} role="img" aria-label="Where they were living that year" viewBox={`0 0 ${view.width} ${view.height}`}>
        <path className="life-land" d={view.land} />
        <g>{people.map((p, i) => {
          const xy = map.pins.get(i) ?? lastPlace.current.get(i);
          return <circle key={p.id} className={`life-pin${i === hover ? " lit" : ""}`} r={12} fill={`var(${familyOf(p).tone})`}
            style={{ opacity: map.pins.has(i) ? 1 : 0, transform: xy ? `translate(${xy[0]}px, ${xy[1]}px)` : undefined }} />;
        })}</g>
        <g className="life-labels">{map.labels.map((c) => <text key={c.name} className="life-city" x={c.x} y={c.y}>{c.name}</text>)}</g>
      </svg>
      <div className="life-inset-foot">
        <div className="life-seg" role="group" aria-label="Map">
          {VIEW_BUTTONS.map(([key, label]) => <button key={key} type="button" aria-pressed={choice === key} onClick={() => setChoice(key)}>{label}</button>)}
        </div>
        <small className="life-off">{map.off ? `${map.off} beyond this map` : ""}</small>
      </div>
    </div>
    <div className="life-alive slim-scroll" aria-live="polite" onPointerOver={chipOver} onPointerLeave={() => onHover(-1)}>
      <Fragment key={listKey}>{list.length ? list.map(({ person, index, at }) => (
        <button key={person.id} type="button" className="life-chip" data-i={index} style={{ "--tone": `var(${familyOf(person).tone})` } as CSSProperties}
          onClick={(e) => onOpen(index, e.currentTarget)}>
          <i className="life-dot" />{person.short}<small>{at.unknown ? "place not recorded" : at.name}</small>
        </button>
      )) : <p className="life-plain">No teacher in the library was alive yet. Drag right.</p>}</Fragment>
    </div>
  </div>;
}
