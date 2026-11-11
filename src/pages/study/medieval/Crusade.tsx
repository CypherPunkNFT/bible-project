// Section 05: crusade and inquisition, read by who wrote each one down. A table of nine events against five sides, Latin, Greek, Jewish,
// Muslim and the accused: a filled disc where a witness from that side survives and is used here, a short dash where this page found none.
// The row header is the control; the chosen event opens below with each witness, then the evidence in three parts, the historians'
// disagreement, and the site's own word. Persecution is reported on every side it was done by.
import { Fragment } from "react";
import { plainText } from "@/pages/study/check-notes/checked";
import { D, findEvent, witnessSides, type CrusadeEvent } from "./model";
import { Cite, Head, Quote, StandPanel, T, ThreeParts } from "./parts";

const GROUPS = [["crusade", "Crusades"], ["inquisition", "Trials for heresy"]] as const;
const sideName = new Map(D.crusade.sides.map((s) => [s.id, s.name]));

function Cell({ event, side }: { event: CrusadeEvent; side: { id: string; name: string } }) {
  const has = witnessSides(event).has(side.id);
  return <td role="cell" className={has ? "has" : ""}>
    <svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true">{has ? <circle r="6" /> : <path d="M-4 0H4" />}</svg>
    <span className="mv-sr">{has ? `${side.name} have a surviving witness here` : `${side.name} have no witness used here`}</span>
  </td>;
}

function Grid({ chosen, onChoose }: { chosen: CrusadeEvent; onChoose: (id: string) => void }) {
  return <table className="mv-crugrid" role="table">
    <caption className="mv-sr">Nine events, and which sides left a written witness that this page uses</caption>
    <thead><tr role="row"><th role="columnheader" scope="col">Event</th>{D.crusade.sides.map((s) => <th key={s.id} role="columnheader" scope="col" title={s.name}>{s.short}</th>)}</tr></thead>
    {GROUPS.map(([group, label]) => <Fragment key={group}><tbody>
      <tr role="row" className="mv-crugroup"><th role="rowheader" scope="colgroup" colSpan={D.crusade.sides.length + 1}>{label}</th></tr>
      {D.crusade.events.filter((e) => e.group === group).map((e) => <tr key={e.id} role="row" className={e.id === chosen.id ? "on" : ""}>
        <th role="rowheader" scope="row"><button type="button" aria-pressed={e.id === chosen.id} onClick={() => onChoose(e.id)}><small>{e.when}</small><strong>{plainText(e.head)}</strong></button></th>
        {D.crusade.sides.map((s) => <Cell key={s.id} event={e} side={s} />)}
      </tr>)}
    </tbody></Fragment>)}
  </table>;
}

function Record({ event }: { event: CrusadeEvent }) {
  return <div className="mv-crurecord" aria-live="polite">
    <p className="mv-kicker">{event.when} · {event.group === "crusade" ? "A crusade" : "A trial for heresy"}</p>
    <h3>{event.head}</h3>
    <ul className="mv-witnesses">{event.witnesses.map((w) => <li key={`${w.side}-${w.who}`}>
      <p className="mv-kicker">{sideName.get(w.side)}</p>
      <p><strong>{w.who}</strong> <small>{w.written <= event.to ? "written at the time" : `written about ${w.written}`}</small></p>
      <p>{w.says}</p>
    </li>)}</ul>
    <ThreeParts evidence={event.text} inference={event.inference} limit={event.limit} />
    {event.verse && <Quote label={event.verse} />}
    <Cite ids={event.sources} />
  </div>;
}

export function Crusade({ eventId, onChange }: { eventId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const event = findEvent(eventId);
  return <>
    <Head num="05" kicker="Crusade and inquisition" title={<>Written down by more than one side.<em> Read each witness.</em></>} lead={<T text={D.crusade.lead} />} />
    <div className="mv-crusade">
      <div><Grid chosen={event} onChoose={(id) => onChange({ event: id })} /><p className="mv-caption">{D.crusade.sidesNote} <span>A filled disc: a witness used here. A dash: none found for this page, which is not the same as none written.</span></p></div>
      <Record event={event} />
    </div>
    <aside className="mv-debate"><p className="mv-kicker">{D.crusade.debate.head}</p><p className="mv-para"><T text={D.crusade.debate.text} /></p><Cite ids={D.crusade.debate.sources} /></aside>
    <StandPanel stand={D.crusade.stand} labels={D.crusade.stand.verses ?? []} />
  </>;
}
