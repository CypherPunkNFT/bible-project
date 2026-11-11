// The councils at a different scale: four markers, one per council; the chosen one's question, its decided words and who did not
// receive it; a small map of where the councils met and which regions stayed outside; and the reception band, a row for each
// family of churches showing how many of the four it receives, in words as well as by length.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { councilById, councilPart, EC, recordPath, type EcRecord, type ReceptionRow } from "./model";
import { useOpen } from "./open";
import { Head, Links, Prose, QuoteLine } from "./parts";

const COUNT_WORD = ["none", "one", "two", "three", "four"];
const councilName = (id: string) => plainText(councilById.get(id)?.name ?? id);
/** Which regions on the map stand outside each council, by the reception rows: a family stays outside every council it does not receive. */
const outsideOf = (councilId: string): Set<string> => new Set(EC.reception.filter((row) => !row.receives.includes(councilId)).map((row) => row.id));

/** The place labels sit beside their points; Constantinople and Chalcedon face each other across the Bosporus. */
const LABEL: Record<string, [number, number, "start" | "end"]> = {
  constantinople: [-9, -6, "end"], chalcedon: [9, -8, "start"], nicaea: [9, 9, "start"], ephesus: [9, 4, "start"],
  persia: [-10, 4, "end"], egypt: [10, 4, "start"], syria: [10, 4, "start"], armenia: [-10, 4, "end"],
};

function CouncilMap({ chosen }: { chosen: EcRecord }) {
  const { width, height, paths, places } = EC.map;
  const outside = outsideOf(chosen.id);
  const name = chosen.name ? plainText(chosen.name) : "";
  const regions = places.filter((p) => outside.has(p.kind)).map((p) => p.label).join(", ");
  const label = outside.size
    ? `A map from the Aegean to Persia. ${name} is marked among the four council cities. The regions whose churches did not receive it are marked: ${regions}.`
    : `A map from the Aegean to Persia. ${name} is marked among the four council cities. Every family of churches named here receives it.`;
  return <figure className="ek-map">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {paths.map((d, i) => <path key={i} className="ek-land" d={d} />)}
      {places.map((p) => {
        const [dx, dy, anchor] = LABEL[p.id] ?? [8, 4, "start"];
        const on = p.kind === "council" ? p.id === chosen.id : outside.has(p.kind);
        return <g key={p.id} className={`ek-place ek-place-${p.kind}${on ? " ek-place-on" : ""}`} transform={`translate(${p.x} ${p.y})`}>
          {p.kind === "council" ? <circle r={on ? 5.5 : 3.5} /> : p.kind === "east" ? <rect x="-4.5" y="-4.5" width="9" height="9" /> : <path d="M0-5.5 5 4h-10Z" />}
          <text x={dx} y={dy} textAnchor={anchor}>{p.label}</text>
        </g>;
      })}
    </svg>
    <figcaption className="ek-caption">Where the four councils met, three of them (Nicaea, Constantinople and Chalcedon) within about 100 km of one another, and a city standing for each region whose churches did not receive the chosen council (a square for the Church of the East, a triangle for the Oriental Orthodox): a label at a city, never a border. Ethiopia, which also did not receive Chalcedon, lies far to the south of this frame. Coast simplified from Natural Earth (public domain).</figcaption>
  </figure>;
}

function Band({ chosen }: { chosen: EcRecord }) {
  return <div className="ek-band" role="table" aria-label="How many of the four councils each family of churches receives">
    <div role="row" className="ek-band-head"><span role="columnheader">Family of churches</span>{councilPart.records.map((c) => <span key={c.id} role="columnheader" className={c.id === chosen.id ? "ek-on" : undefined}>{plainText(c.name)} <small>{c.when}</small></span>)}</div>
    {EC.reception.map((row) => <BandRow key={row.id} row={row} chosen={chosen} />)}
  </div>;
}

function BandRow({ row, chosen }: { row: ReceptionRow; chosen: EcRecord }) {
  const who = row.id === "east" ? councilById.get("ephesus")?.today : row.id === "oriental" ? plainText(councilById.get("chalcedon")?.today ?? "").split(";")[0] : "";
  const words = `Receives ${COUNT_WORD[row.receives.length]} of the four: ${row.receives.map(councilName).join(", ")}.`;
  return <div role="row" className={`ek-band-row ek-band-${row.id}`}>
    <span role="rowheader"><b>{row.name}</b><small>{words}</small>{who && <small className="ek-who"><Checked text={who} /></small>}</span>
    {councilPart.records.map((c) => {
      const yes = row.receives.includes(c.id);
      return <span key={c.id} role="cell" className={`ek-cell${yes ? " ek-yes" : " ek-no"}${c.id === chosen.id ? " ek-on" : ""}`}>{yes ? "Received" : "Not received"}</span>;
    })}
  </div>;
}

export function Councils({ chosen, onChoose }: { chosen: EcRecord; onChoose: (id: string) => void }) {
  const open = useOpen();
  const path = recordPath.get(chosen.id) ?? "";
  return <>
    <Head kicker="Four councils, at another scale" title="Who received them. Who stayed outside." lead="Each council answered one disputed question in a few words, and each left some churches outside. Here they are events, not arguments; why the churches have held those words to be true is taught from Scripture in the theology studies." />
    <div className="ek-markers" role="group" aria-label="The four councils">{councilPart.records.map((c) => <button key={c.id} type="button" aria-pressed={c.id === chosen.id} onClick={() => onChoose(c.id)}>
      <b>{c.when}</b><span>{plainText(c.name)}</span></button>)}</div>
    <div className="ek-council">
      <div className="ek-council-text">
        <p className="ek-kicker">{plainText(chosen.where)} · <Checked text={chosen.kind} /></p>
        {chosen.question && <p className="ek-question"><Prose text={chosen.question} /></p>}
        {chosen.quote && <QuoteLine words={chosen.quote.words} source={chosen.quote.source} reference={chosen.quote.ref} path={path} held={EC.held[`${path}.quote.words`]?.[0]?.title} />}
        <p className="ek-hook"><Prose text={chosen.hook} /></p>
        {chosen.today && <p className="ek-para"><b>Who did not receive it, today: </b><Prose text={chosen.today} /></p>}
        <Links links={chosen.links} path={path} />
        <button type="button" className="ek-open" data-opener={`rec:${chosen.id}`} aria-haspopup="dialog" onClick={() => open(`rec:${chosen.id}`)}>
          {`The full record of ${plainText(chosen.name)}`} <span aria-hidden="true">→</span></button>
      </div>
      <CouncilMap chosen={chosen} />
    </div>
    <Band chosen={chosen} />
    <p className="ek-caption">The rows follow the councils' own records: the church in the Persian empire did not receive Ephesus or the councils after it; the Coptic, Syriac, Armenian, Ethiopian, Eritrean and Malankara Orthodox churches did not receive Chalcedon.</p>
  </>;
}
