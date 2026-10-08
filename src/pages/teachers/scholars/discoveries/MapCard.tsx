// The discoveries map card: the Holy Land & Sinai / Wider map switch, the two map stages (crossfading; their cameras are
// flown by MapStage through refs, never by re-rendering), the edge marker pointing to the find beyond the first map, and
// the year line from the first find to the last.
import { ArrowRight } from "lucide-react";
import type { RefObject } from "react";
import type { Find } from "@/data/teachers/pages-types";
import { cssVars, railPos, scholarById, VIEWS, type DiscoveryModel, type View } from "./model";
import type { MarkerSpec } from "./stage";

interface MapCardProps {
  model: DiscoveryModel;
  markers: Record<View, MarkerSpec[]>;
  mode: View;
  /** The chosen find, or null for all of them. */
  find: Find | null;
  stagesEl: RefObject<HTMLDivElement>;
  edgeRef: RefObject<HTMLButtonElement>;
  onSwitch: (view: View) => void;
  onFind: (find: Find) => void;
}

const MAP_NAMES: Record<View, string> = { holyland: "Holy Land & Sinai", med: "Wider map" };

export function MapCard({ model, markers, mode, find, stagesEl, edgeRef, onSwitch, onFind }: MapCardProps) {
  const edgeFind = model.edgeFind;
  return <figure className="dsc-mapcard">
    <LandDefs model={model} />
    <div className="dsc-tools">
      <div className="dsc-seg" role="group" aria-label="Map">
        {VIEWS.map((view) => <button key={view} type="button" aria-pressed={mode === view} onClick={() => onSwitch(view)}>{MAP_NAMES[view]}</button>)}
      </div>
      <p className="dsc-now" aria-live="polite">{find ? find.where[0] : `All ${model.finds.length} discoveries`}</p>
    </div>
    <div ref={stagesEl} className={`dsc-stages${find ? " dsc-has-active" : ""}`}>
      {VIEWS.map((view) => <Stage key={view} view={view} on={mode === view} markers={markers[view]} chosen={find?.id ?? null} onFind={onFind} model={model} />)}
      {edgeFind && <button ref={edgeRef} type="button" className="dsc-edge" hidden={mode !== "holyland"} onClick={() => onFind(edgeFind)}>
        <span className="dsc-edge-arrow"><ArrowRight size={15} aria-hidden="true" /></span>
        <span><b>{edgeFind.where[0]}</b><small>{scholarById(model.byId, edgeFind.by[0]).short} · {edgeFind.year}</small></span>
      </button>}
    </div>
    <Rail finds={model.finds} find={find} onFind={onFind} />
  </figure>;
}

/** The two land outlines, each one path whose holes (fill-rule evenodd) are the Dead Sea and the Sea of Galilee. */
function LandDefs({ model }: { model: DiscoveryModel }) {
  return <svg className="dsc-defs" aria-hidden="true"><defs>
    {VIEWS.map((view) => <path key={view} id={`tp-dsc-land-${view}`} d={model.data.views[view].land} fillRule="evenodd" vectorEffect="non-scaling-stroke" />)}
    <linearGradient id="tp-dsc-land-fill" x1="0" y1="0" x2=".5" y2="1"><stop className="dsc-stop-a" /><stop offset="1" className="dsc-stop-b" /></linearGradient>
  </defs></svg>;
}

interface StageProps { view: View; on: boolean; markers: MarkerSpec[]; chosen: string | null; model: DiscoveryModel; onFind: (find: Find) => void }

function Stage({ view, on, markers, chosen, model, onFind }: StageProps) {
  return <div className={`dsc-stage${on ? " dsc-on-stage" : ""}`} data-view={view}>
    <svg className="dsc-land" aria-hidden="true">
      <rect className="dsc-water" x="-4000" y="-4000" width="9000" height="9000" />
      <use href={`#tp-dsc-land-${view}`} className="dsc-landpath" />
    </svg>
    <div className="dsc-layer">
      {markers.map((m) => {
        const find = m.findId ? model.finds.find((f) => f.id === m.findId) : undefined;
        if (!find) return <div key={m.key} className="dsc-mk dsc-mk-sea dsc-center"><span className="dsc-lab">{m.name}</span></div>;
        const isOn = find.id === chosen;
        return <button key={m.key} type="button" className={`dsc-mk dsc-mk-find${isOn ? " dsc-on dsc-pulse" : ""}`} aria-label={`${find.name}, ${find.year}`} onClick={() => onFind(find)}>
          <i key={isOn ? "on" : "off"} className="dsc-mk-pulse" /><i className="dsc-mk-dot" />
          <span className="dsc-lab"><b>{find.name}</b><small>{find.year}</small></span>
        </button>;
      })}
    </div>
  </div>;
}

function Rail({ finds, find, onFind }: { finds: Find[]; find: Find | null; onFind: (find: Find) => void }) {
  const first = finds[0], last = finds[finds.length - 1], at = (year: number) => cssVars({ "--p": railPos(year).toFixed(2) });
  return <div className="dsc-rail" role="group" aria-label="The discoveries by year">
    <span className="dsc-rail-line" />
    {finds.map((f) => <button key={f.id} type="button" className={`dsc-rail-pt${f === find ? " dsc-on" : ""}`} style={at(f.year)} title={`${f.year} · ${f.name}`}
      aria-label={`${f.year}, ${f.name}`} onClick={() => onFind(f)}><i /></button>)}
    <span className="dsc-rail-end" style={at(first.year)}>{first.year}</span>
    <span className="dsc-rail-end" style={at(last.year)}>{last.year}</span>
    <span className={`dsc-rail-now${find ? " dsc-on" : ""}`} style={find ? at(find.year) : cssVars({ "--p": "0" })}>{find ? find.year : ""}</span>
  </div>;
}
