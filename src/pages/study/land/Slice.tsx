// 01 · The slice: one line across the land at Jerusalem, drawn from the record's eight points with straight lines between them
// and its height stretch printed. The list of points is the interface; the drawing repeats it for a pointer, out of the tab
// order. Three thin bands beneath share the slice's width: rain, roads and water at each point. Below, the eight regions.
import { BAND_NAME, D, groundPath, LAYER_AT, LAYER_RECORD, LAYERS, openName, SLICE, sliceX, sliceY, slicePath, STRETCH, type Layer, type Point, firstSentence } from "./model";
import { Head, Opener, T, VerseRefs } from "./parts";

const LAYER_NAME: Record<Layer, string> = { rain: "Rain", roads: "Roads", water: "Water" };
const LAYER_NOTE: Record<Layer, string> = {
  rain: "Long-term averages in the record's own rounded figures; it gives none for the other points. Single years swing widely.",
  roads: "Which road passes each point, placed by this page from the record's road and point descriptions.",
  water: "What a town there drank from, placed by this page from the record's water records.",
};

function Drawing({ at, onPick }: { at: Point; onPick: (id: string) => void }) {
  const pts = D.transect.points;
  return <svg className="ls-slice-svg" viewBox={`0 0 ${SLICE.width} ${SLICE.height}`} aria-hidden="true">
    <line x1={SLICE.left} x2={SLICE.right} y1={SLICE.sea} y2={SLICE.sea} className="ls-sealevel" />
    <text x={SLICE.right} y={SLICE.sea - 6} textAnchor="end" className="ls-svg-small">sea level</text>
    <path d={groundPath(pts)} className="ls-ground" />
    <path d={slicePath(pts)} className="ls-line" />
    {pts.map((p) => {
      const x = sliceX(p.km), y = sliceY(p.elevation), on = p.id === at.id;
      return <g key={p.id} className={`ls-pt${on ? " is-on" : ""}`} onClick={() => onPick(p.id)}>
        <line x1={x} x2={x} y1={y} y2={SLICE.height - 8} className="ls-drop" />
        <circle cx={x} cy={y} r={on ? 7 : 4.5} />
        <circle cx={x} cy={y} r="16" className="ls-hit" />
        <text x={x} y={y - 14} textAnchor="middle" className="ls-svg-label">{p.elevation} m</text>
      </g>;
    })}
    <text x={SLICE.right} y={SLICE.height - 12} textAnchor="end" className="ls-svg-small">West ← · → East · {pts[pts.length - 1].km} km</text>
  </svg>;
}

function Bands({ at, layer, onLayer }: { at: Point; layer: Layer; onLayer: (l: Layer) => void }) {
  const pts = D.transect.points;
  return <div className="ls-bands">
    {LAYERS.map((l) => <div key={l} className={`ls-band${l === layer ? " is-on" : ""}`}>
      <button type="button" className="ls-band-name" aria-pressed={l === layer} onClick={() => onLayer(l)}>{LAYER_NAME[l]}</button>
      <div className="ls-band-row" aria-hidden="true">{pts.map((p) => <span key={p.id} className={p.id === at.id ? "is-on" : ""}
        style={{ left: `${((sliceX(p.km) - SLICE.left) / (SLICE.right - SLICE.left)) * 100}%` }}>{LAYER_AT[l][p.id] ?? "·"}</span>)}</div>
    </div>)}
  </div>;
}

export function Slice({ at, layer, onChange }: { at: Point; layer: Layer; onChange: (values: Record<string, string | null>) => void }) {
  const pts = D.transect.points;
  const ridge = pts.find((p) => p.id === "ridge")!, deadsea = pts.find((p) => p.id === "deadsea")!;
  const here = LAYER_AT[layer][at.id];
  return <>
    <Head num="01" kicker="The slice" title="A hundred kilometres." turn="Five lands." lead={<p><T text={D.transect.lead} /></p>} />
    <div className="ls-slice">
      <figure className="ls-slice-fig">
        <p className="ls-sr">A west-to-east cross-section of the land at Jerusalem, from the shore near Jaffa at 0 m up to Jerusalem at {ridge.elevation} m,
          down to the Dead Sea at {deadsea.elevation} m, and up onto the plateau. The list of points beside it says the same.</p>
        <Drawing at={at} onPick={(id) => onChange({ at: id })} />
        <figcaption className="ls-caption">Height stretched about {STRETCH} times against distance, so the climb can be seen. Straight lines join the
          record's eight rounded points; the ground between them is not drawn. Today's ground: the coast and the Dead Sea's shore have moved since biblical times.</figcaption>
        <Bands at={at} layer={layer} onLayer={(l) => onChange({ layer: l })} />
      </figure>
      <ol className="ls-points" aria-label="Points along the slice, west to east">
        {pts.map((p) => <li key={p.id}><button type="button" aria-pressed={p.id === at.id} className={p.id === at.id ? "is-on" : ""} onClick={() => onChange({ at: p.id })}>
          <span className="ls-pt-km">{p.km} km</span><span className="ls-pt-name">{p.name}</span><span className="ls-pt-band">{BAND_NAME[p.band]} · {p.elevation} m</span>
        </button></li>)}
      </ol>
    </div>
    <div className="ls-at" aria-live="polite">
      <p className="ls-kicker">{BAND_NAME[at.band]} · {at.km} km from the sea · about {at.elevation} m{at.elevationCheck && <> <T text={at.elevationCheck} /></>}{at.distanceCheck && <T text={at.distanceCheck} />}</p>
      <h3>{at.name}</h3>
      <p className="ls-para"><T text={at.note} /></p>
      <p className="ls-para"><b>{LAYER_NAME[layer]} here:</b> {here ?? "nothing the record gives for this point"}. <span className="ls-muted">{LAYER_NOTE[layer]}</span></p>
      {LAYER_RECORD[layer].length > 0 && <p className="ls-chips">{LAYER_RECORD[layer].map((key) => <Opener key={key} openKey={key}>{openName(key)} →</Opener>)}</p>}
      <VerseRefs labels={at.verses ?? []} />
    </div>
    <div className="ls-other">
      <p className="ls-kicker">North and south of this line</p>
      <p className="ls-para"><T text={D.transect.otherLines} /></p>
      <p className="ls-note">Not drawn yet: the research record holds no heights for the Galilee and Beersheba lines, so this page does not draw them until they are measured.</p>
      <p className="ls-caption"><T text={D.transect.limit} /></p>
    </div>
    <h3 className="ls-subhead">Eight regions <em>five on this line, three off it</em></h3>
    <ul className="ls-regions">{D.regions.map((r, i) => <li key={r.id}>
      <Opener openKey={`region:${r.id}`}>
        <span className="ls-card-k">{String(i + 1).padStart(2, "0")} / {String(D.regions.length).padStart(2, "0")} · {pts.some((p) => p.band === r.band) ? "on the slice" : "off the slice"}</span>
        <RegionMark band={r.band ?? ""} />
        <span className="ls-card-t">{r.name}</span>
        <span className="ls-card-d">{firstSentence(r.where ?? "")}</span>
        <span className="ls-card-v">Open the record →</span>
      </Opener>
    </li>)}</ul>
  </>;
}

const MARKS: Record<string, string> = {
  coast: "M4 26h40M4 31h28", shephelah: "M4 28c8-8 12-8 18 0s12-8 22 0", hills: "M4 30l14-18 8 8 6-8 12 18", rift: "M4 12l12 6 6 12h4l6-12 12-6",
  east: "M4 30l8-16h28l4 16", south: "M4 28c10-2 14-6 20-6s14 4 20 6M14 18l2-4M30 16l2-4", north: "M4 30c6-12 12-16 20-16s14 4 20 16M18 26c4 2 8 2 12 0",
};
function RegionMark({ band }: { band: string }) {
  return <svg className="ls-mini" viewBox="0 0 48 36" aria-hidden="true"><path d={MARKS[band] ?? MARKS.hills} /></svg>;
}
