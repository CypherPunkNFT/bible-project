// 05 The day and the year: a straight strip of the day's service (Numbers 28-29's timetable, with the Mishnah's additions tagged),
// the private offerings and the day the offering ceased; then a straight strip of the year with the seven feasts placed only where
// their records state a month and day (the Omer and Shavuot hatched, because the day was argued), the chosen feast in full; and
// the Day of Atonement's seven steps, inward and out, a place drawn only where Leviticus 16's step names one.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, feastPlaceById, findFeast, linkFor, tagsOf, TD } from "./model";
import { Link } from "react-router-dom";
import { Head, Prose, RefButton, Refs, Tags, ThreeParts } from "./parts";

const MONTHS = ["1st · Nisan", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th · Kislev", "10th", "11th", "12th"];
const ZONE_WORD = { inner: "Inner room", wilderness: "The wilderness", people: "All Israel", unstated: "Place not stated" } as const;
const ZONE_Y = { people: 14, wilderness: 14, unstated: 44, inner: 76 } as const;

function DayStrip() {
  const o = D.offerings;
  return <ol className="tw-day">
    {o.day.map((step) => <li key={step.id}>
      <h3><Checked text={step.head} /></h3>
      <Tags kinds={tagsOf(`day:${step.id}`)} />
      <p><Prose text={step.text} /></p>
    </li>)}
  </ol>;
}

/** Where a feast sits on a strip of twelve equal months: drawn by month and day, not by a count of days. */
const position = (month: number, day: number): number => ((month - 1 + (day - 1) / 30) / 12) * 100;

function YearStrip({ chosen, onChoose }: { chosen: string; onChoose: (id: string) => void }) {
  return <div className="tw-year">
    <div className="tw-year-strip" aria-hidden="true">
      {MONTHS.map((m) => <span key={m} className="tw-month">{m}</span>)}
      {TD.feasts.map((f) => <span key={f.id} className={`tw-feast-mark${f.argued ? " tw-argued" : ""}${f.id === chosen ? " on" : ""}`}
        style={{ left: `${position(f.month, f.day)}%`, width: `${Math.max((f.days / 360) * 100, 0.7)}%` }} onClick={() => onChoose(f.id)} />)}
    </div>
    <p className="tw-caption">Twelve months drawn equal, the first month in spring; a leap month is not drawn. The Omer and Shavuot are hatched: their day was argued, so they are drawn as a range. The ninth month is Chislev in the Berean (<RefButton label="Zechariah 7:1" />).</p>
    <ul className="tw-feasts" aria-label="The feasts">
      {D.feasts.list.map((f) => <li key={f.id}><button type="button" className="tw-feast" aria-pressed={f.id === chosen} onClick={() => onChoose(f.id)}>
        <span><Checked text={f.jewish} /></span>{feastPlaceById.get(f.id)?.argued && <small>day argued</small>}</button></li>)}
    </ul>
  </div>;
}

function FeastDetail({ id }: { id: string }) {
  const f = findFeast(id);
  const rows: [string, string][] = [["When", f.when], ["What Scripture commands", f.scripture], ["How the temple kept it", f.practice], ["How it is kept today", f.today]];
  return <div className="tw-feast-detail">
    <h3><Checked text={f.jewish} /> <Tags kinds={tagsOf(`feast:${f.id}`)} /></h3>
    <dl>{rows.map(([name, text]) => <div key={name}><dt>{name}</dt><dd><Prose text={text} /></dd></div>)}
      <div><dt>In the New Testament</dt><dd><Prose text={f.ntNote} />{f.nt.length > 0 && <Refs labels={f.nt} lead="The scenes" />}</dd></div>
    </dl>
  </div>;
}

function Atonement() {
  const a = D.atonement;
  const steps = a.steps;
  const x = (i: number) => 100 + i * 200;
  const y = (id: string) => ZONE_Y[TD.zones[id] ?? "unstated"];
  return <div className="tw-kippur">
    <h3>Yom Kippur, step by step <span className="tw-muted">· Leviticus 16's order</span></h3>
    <svg className="tw-kippur-line" viewBox="0 0 1400 90" aria-hidden="true">
      <text className="tw-axis-t" x="2" y="12">out</text><text className="tw-axis-t" x="2" y="80">in</text>
      {steps.slice(1).map((s, i) => <path key={s.id} className={TD.zones[s.id] === "unstated" || TD.zones[steps[i].id] === "unstated" ? "tw-k-inferred" : "tw-k-line"}
        d={`M${x(i)} ${y(steps[i].id)}L${x(i + 1)} ${y(s.id)}`} />)}
      {steps.map((s, i) => <circle key={s.id} className={`tw-k-dot tw-z-${TD.zones[s.id]}`} cx={x(i)} cy={y(s.id)} r="6" />)}
    </svg>
    <ol className="tw-kippur-steps">{steps.map((s, i) => <li key={s.id}>
      <b>{i + 1}</b><h4><Checked text={s.head} /></h4>
      <small className={`tw-zone tw-z-${TD.zones[s.id]}`}>{ZONE_WORD[TD.zones[s.id] ?? "unstated"]}</small>
      <p><Prose text={`${s.text} (${s.scripture})`} /></p>
    </li>)}</ol>
    <p className="tw-caption">The order is Leviticus 16's. A step's place is drawn only where the step itself names one; the line between is this page's drawing.</p>
    <ThreeParts evidence={a.evidence} inference={a.inference} limit={a.limit} />
  </div>;
}

export function DayYear({ feast, onChange }: { feast: string; onChange: (values: Record<string, string | null>) => void }) {
  const farming = linkFor("The farming year");
  return <>
    <Head num="05" kicker="The day and the year" title="Morning and evening." turn="Seven feasts." lead={<Prose text={D.offerings.lead} />} />
    <DayStrip />
    <div className="tw-two">
      <p className="tw-para"><Prose text={D.offerings.kinds} /></p>
      <p className="tw-para"><Prose text={D.offerings.ceased} /></p>
    </div>
    <p className="tw-para tw-feasts-lead"><Prose text={D.feasts.lead} />{farming && <> The farm work behind the feasts is told in <Link className="tw-link" to={farming}>The farming year</Link>.</>}</p>
    <YearStrip chosen={findFeast(feast).id} onChoose={(id) => onChange({ feast: id })} />
    <FeastDetail id={feast} />
    <Atonement />
  </>;
}
