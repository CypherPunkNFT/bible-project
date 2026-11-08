// 02 Which Herod? and the record lists of 03 Rome arrives and 08 The revolt. Six cards of one anatomy for the Herods; for the eras,
// every step a line of record that opens in the sheet with its three parts kept apart.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, type Era } from "./model";
import { Head, Prose, Refs } from "./parts";
import { useOpen } from "./open";

/** A small crown for a king, a half-circlet for an ethnarch, a ring for a tetrarch: the rank's standing as a shape, not a colour. */
function RankMark({ title }: { title: string }) {
  const d = title === "King" ? "M3 17V8l4.5 4L11 5l3.5 7L19 8v9Z" : title === "Ethnarch" ? "M3 17V11l4 3 4-6 4 6 4-3v6Z" : "M4 15a7 4 0 1 0 14 0a7 4 0 1 0-14 0";
  return <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

export function Herods() {
  const open = useOpen();
  const rows = D.herods.rows;
  return <>
    <Head num="02" kicker="Which Herod?" title="One name." turn="Six rulers." lead={<Prose text={D.herods.lead} />} />
    <ul className="nh-herods">{rows.map((h, i) => <li key={h.id} className="nh-herod">
      <div className="nh-herod-top"><p className="nh-kicker">{String(i + 1).padStart(2, "0")} / {String(rows.length).padStart(2, "0")} · <span className="nh-rank">{h.title}</span></p><RankMark title={h.title} /></div>
      <h3>{h.name}</h3>
      <p className="nh-note-line"><Prose text={h.note} /></p>
      <dl><div><dt>Ruled </dt><dd><Prose text={h.ruled} /></dd></div><div><dt>Territory </dt><dd><Prose text={h.territory} /></dd></div></dl>
      <Refs labels={h.nt} lead="Named in" />
      <button type="button" className="nh-open" data-opener={`herod:${h.id}`} aria-haspopup="dialog" onClick={() => open(`herod:${h.id}`)}>Open the record <span aria-hidden="true">→</span></button>
    </li>)}</ul>
    <p className="nh-caption"><Prose text={D.herods.titles} /></p>
  </>;
}

export function EraList({ era, openKey }: { era: Era; openKey: string | null }) {
  const open = useOpen();
  return <div className="nh-era">
    <h3><Checked text={era.title} /><small>{era.when}</small></h3>
    <p><Prose text={era.lead} /></p>
    <ul className="nh-steps">{era.steps.map((s) => <li key={s.id}>
      <button type="button" className="nh-step" data-opener={`step:${s.id}`} aria-haspopup="dialog" aria-expanded={openKey === `step:${s.id}`} onClick={() => open(`step:${s.id}`)}>
        <small>{s.when}</small><span><Checked text={s.title} /></span><i>Record, inference, limit →</i>
      </button>
    </li>)}</ul>
  </div>;
}

export function Rome({ openKey }: { openKey: string | null }) {
  return <>
    <Head num="03" kicker="Rome arrives" title="A judge between brothers." turn="A master of the land."
      lead="From Pompey in the temple to Agrippa's death, told as records: each opens with what the record says, what this study infers, and where it stops." />
    {D.eras.slice(0, 3).map((era) => <EraList key={era.id} era={era} openKey={openKey} />)}
  </>;
}

export function Revolt({ openKey }: { openKey: string | null }) {
  const era = D.eras[3];
  const fall = era.steps.find((s) => s.id === "fall70");
  return <>
    <Head num="08" kicker="The revolt" title="A witness." turn="On the other side." lead={<Prose text={era.lead} />} />
    <div className="nh-revolt">
      <EraList era={era} openKey={openKey} />
      {fall && <div className="nh-mourning">
        <p className="nh-kicker">The temple's end, as Jews mourn it and as Christians read it</p>
        <p><Prose text={fall.inference} /></p>
        <Refs labels={fall.verses ?? []} />
      </div>}
    </div>
  </>;
}
