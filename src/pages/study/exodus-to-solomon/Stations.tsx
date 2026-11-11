// 02 Six stations: Egypt to Solomon, in the Bible's own order. Six cards of one anatomy; choosing one shows its passage, its
// lead and its records, and each record opens in the sheet with its three parts kept apart.
import { plural } from "@/lib/site-format";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, recordKey, type Station } from "./model";
import { useOpen } from "./open";
import { Head, Prose, Refs } from "./parts";

/** A small line drawing for each station: reeds and brick, a road out, a burned wall, a four-room house, a wall with two
 * gates, a six-chambered gate. Symbols, not pictures of any site. */
const MINIATURES: Record<string, string> = {
  egypt: "M6 34h52M10 34V18m4 16V14m4 20V20M34 34V22h18v12M34 28h18M43 22v6",
  exodus: "M6 34c10-2 18-10 26-14s16-10 26-12M10 28l2 6m10-11 2 6m10-12 2 6m10-10 2 5",
  conquest: "M8 34V16l6-3 6 3v18M20 34V20h14v14M34 34V14l6-3 6 3v21M24 10c2 3-2 4 0 7m8-9c2 3-2 4 0 7",
  highlands: "M10 34V16h40v18M10 22h26M36 16v18M23 22v12M30 16v6",
  david: "M4 30h20v-8h4v8h8v-8h4v8h20M4 24h20M40 24h20M28 22V14h8v8",
  solomon: "M12 8v26M52 8v26M12 12h10m-10 8h10m-10 8h10M42 12h10M42 20h10M42 28h10M26 34V8m12 26V8",
};

function Miniature({ id }: { id: string }) {
  return <svg className="xs-mini" viewBox="0 0 64 42" width="64" height="42" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={MINIATURES[id] ?? "M8 34h48"} />
  </svg>;
}

function Panel({ station, openKey }: { station: Station; openKey: string | null }) {
  const open = useOpen();
  return <div className="xs-station" aria-live="polite">
    <div className="xs-station-head">
      <p className="xs-kicker">{`Station ${String(station.num).padStart(2, "0")}`} · <Checked text={station.name} /></p>
      <h3><Checked text={station.headline} /></h3>
      <p className="xs-para"><Prose text={station.lead} /></p>
      <Refs labels={station.verses} lead="The passages" />
    </div>
    <ul className="xs-records">{station.records.map((r, i) => { const key = recordKey(station.id, r.id);
      return <li key={r.id}><button type="button" className="xs-record" data-opener={key} aria-haspopup="dialog" aria-expanded={openKey === key} onClick={() => open(key)}>
        <small>{String(i + 1).padStart(2, "0")} / {String(station.records.length).padStart(2, "0")}</small>
        <span><Checked text={r.title} /></span><i>Record, inference, limit <span aria-hidden="true">→</span></i>
      </button></li>; })}</ul>
  </div>;
}

export function Stations({ station, openKey, onChange }: { station: Station; openKey: string | null; onChange: (values: Record<string, string | null>) => void }) {
  return <>
    <Head num="02" kicker="Six stations" title="One passage." turn="One patch of ground." lead={<Prose text={D.stationsLead} />} />
    <ul className="xs-cards">{D.stations.map((s) => <li key={s.id}>
      <button type="button" className="xs-card" aria-pressed={s.id === station.id} onClick={() => onChange({ station: s.id })}>
        <span className="xs-card-top"><small>{String(s.num).padStart(2, "0")} / {String(D.stations.length).padStart(2, "0")}</small><Miniature id={s.id} /></span>
        <strong><Checked text={s.name} /></strong>
        <em><Checked text={s.headline} /></em>
        <span className="xs-card-parts">{`${plural(s.records.length, "{n} record", "{n} records")} · ${plural(s.verses.length, "{n} passage", "{n} passages")}`}</span>
        <span className="xs-card-go">Read the station <span aria-hidden="true">→</span></span>
      </button>
    </li>)}</ul>
    <Panel station={station} openKey={openKey} />
  </>;
}
