// Section 02: four answers to the Synoptic question as four small maps of one size. Equal size is the argument: no view is
// drawn as the main one, and none is chosen until the reader chooses. The chosen map gives its history, who holds it, the
// case for and against, and what would show it. Then the stance: this page does not choose, and Luke says he used sources.
import { plainText } from "@/pages/study/check-notes/checked";
import { D, MAPS, arrowPath, findView, type View } from "./model";
import { Head, Quote, Text } from "./parts";

type Change = (values: Record<string, string | null>) => void;

function MapArt({ view }: { view: View }) {
  const map = MAPS[view.id];
  if (!map) { console.error(`How the New Testament books were written: no map is drawn for the view "${view.id}"`); return null; }
  const at = new Map(map.nodes.map((n) => [n.id, n]));
  const id = `nb-head-${view.id}`;
  return <svg className="nb-map" viewBox="0 0 160 128" aria-hidden="true">
    <defs><marker id={id} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 8 4 0 8Z" /></marker></defs>
    {map.band && <path className="nb-map-band" d="M12 30c10-8 20 8 30 0s20 8 30 0 20 8 30 0 20 8 30 0 20 8 24 2" />}
    {map.arrows.map((a) => {
      const to = at.get(a.to);
      const from = a.from === "band" && to ? { x: to.x, y: 40 } : at.get(a.from);
      if (!from || !to) return null;
      return <path key={`${a.from}-${a.to}`} className={a.spoken ? "nb-map-spoken" : "nb-map-arrow"} d={arrowPath(from, to, a.from === "band" ? 0 : 14)} markerEnd={`url(#${id})`} />;
    })}
    {map.nodes.map((n) => <g key={n.id} className={n.lost ? "nb-map-lost" : "nb-map-node"} transform={`translate(${n.x} ${n.y})`}>
      <circle r="14" /><text y="4" textAnchor="middle">{n.label}</text>
    </g>)}
  </svg>;
}

function ViewRecord({ view }: { view: View }) {
  const rows: [string, string][] = [["Its history", view.history], ["Who holds it", view.held], ["The case for it", view.forIt], ["The case against it", view.against], ["What would show it", view.wouldShow]];
  return <div className="nb-view">
    <p className="nb-kicker">{view.name}</p>
    <p className="nb-view-tag"><Text text={view.tag} /></p>
    <p className="nb-caption">{MAPS[view.id]?.caption}</p>
    <dl>{rows.map(([label, text]) => <div key={label}><dt>{label}</dt><dd><Text text={text} /></dd></div>)}</dl>
  </div>;
}

export function Maps({ mapId, onChange }: { mapId: string | null; onChange: Change }) {
  const chosen = findView(mapId);
  return <>
    <Head num="02" kicker="Four maps" title={<>Same evidence.<em> Four routes.</em></>} />
    <p className="nb-para">Four answers to which Gospel came first and who used whom. Each is drawn at the same size, and the page does not choose between them. An arrow here means “was used by”, as each view claims; a ring drawn hollow is a source no one has found.</p>
    <div className="nb-maps" role="group" aria-label="The four views">
      {D.synoptic.views.map((view) => <button key={view.id} type="button" aria-pressed={view.id === chosen?.id} onClick={() => onChange({ map: view.id === chosen?.id ? null : view.id })}>
        <MapArt view={view} />
        <span className="nb-map-name">{view.name}</span>
        <small>{plainText(view.tag)}</small>
      </button>)}
    </div>
    <div aria-live="polite">
      {chosen ? <ViewRecord view={chosen} /> : <p className="nb-choose">Choose a map to read its history, who holds it, the case for and against, and what would show it.</p>}
    </div>
    <aside className="nb-stance">
      <div><p className="nb-kicker">Not chosen</p><p className="nb-para"><Text text={D.synoptic.stance} /></p></div>
      <Quote refKey="Luke 1:1–4" />
    </aside>
  </>;
}
