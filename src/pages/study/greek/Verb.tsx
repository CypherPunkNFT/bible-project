// Section 05: what a verb's form holds, and what it does not. One verb in three forms cut into parts, every verb counted by tense and mood,
// seven verses where the form's usual time and the verse's time part, the aorist tested, and the specialists' argument left open.
import { D, findForm, G, thousands } from "./model";
import { Cite, Gk, Head, Mixed, Quote, Said, Test, ThreeParts, VerseLink } from "./parts";

const c = G.counts;
const POINT: Record<string, number> = { past: 8, now: 50, future: 92 };
const HERE_LINES: Record<string, string> = { past: "In this verse: the past.", now: "In this verse: the present.", future: "In this verse: the future.", reaches: "In this verse: from before Abraham to the present.", any: "In this verse: whenever it happens.", stands: "In this verse: a past act whose result stands." };

/** The time line for one verse: a thin mark above where the form's name points, and a thick one, or a bar, where this verse puts it. */
function Track({ usual, here }: { usual: string; here: string }) {
  const bar = here === "any" ? [8, 92] : here === "reaches" || here === "stands" ? [8, 50] : null;
  return <svg className="ng-track" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
    <path d="M2 12H98" className="ng-track-line" vectorEffect="non-scaling-stroke" />
    {Object.values(POINT).map((x) => <path key={x} d={`M${x} 8V16`} className="ng-track-line" vectorEffect="non-scaling-stroke" />)}
    {bar && <path d={`M${bar[0]} 12H${bar[1]}`} className="ng-track-bar" vectorEffect="non-scaling-stroke" />}
    {!bar && <path d={`M${POINT[here] - 3} 12H${POINT[here] + 3}`} className="ng-track-here" vectorEffect="non-scaling-stroke" />}
    <path d={`M${POINT[usual] - 3} 3H${POINT[usual] + 3}`} className="ng-track-usual" vectorEffect="non-scaling-stroke" />
  </svg>;
}

export function Verb({ formValue, onForm, onOpen }: { formValue: string | null; onForm: (id: string) => void; onOpen: (key: string) => void }) {
  const form = findForm(formValue), formData = G.verb.forms[form.id];
  return <>
    <Head title={<>The verb.<em> Its form says less about time than you have been told.</em></>}
      lead="A verb's form holds several things at once: who is acting, how many, whether it states or commands, and how the action is viewed. Grammar books use names for these forms such as aorist, present and perfect. Those are names for shapes. They are not statements of when." />
    <h3 className="ng-sub">{`${D.verb.name}, in three forms`}</h3>
    <ul className="ng-picks" aria-label="Which form">{D.verb.forms.map((f) => <li key={f.id}><button type="button" aria-pressed={f.id === form.id} onClick={() => onForm(f.id)}>{f.name}: <Gk>{f.form}</Gk></button></li>)}</ul>
    <ol className="ng-parts">{form.parts.map(([piece, what]) => <li key={piece}><Gk big>{piece}</Gk><small>{what}</small></li>)}</ol>
    <p className="ng-lineline" aria-live="polite">{`STEP's gloss: “${formData.gloss}”. `}<VerseLink label={formData.label} />. {G.codes[formData.code]?.parse}.</p>
    <p className="ng-para"><Mixed text={D.verb.viewpoint.line} /></p>
    <p className="ng-para"><Mixed text={D.verb.viewpoint.example} /> <VerseLink label={G.verb.viewpoint} />.</p>
    <h3 className="ng-sub">Every verb, by form and mood</h3>
    <div className="ng-tablewrap" role="region" aria-label="Verbs by form and mood. Scroll sideways." tabIndex={0}>
      <table className="ng-table">
        <caption>{`All ${thousands(c.gridTotal)} verbs counted, by STEP's tags. The second aorist counts as aorist, and all voices are together. Only the indicative column is where a form could mark time on the traditional account.`}</caption>
        <thead><tr><td />{D.moodNames.map((m) => <th key={m.id} scope="col" className={m.id === "I" ? "strong" : ""}>{m.label}<small>{m.plain}</small></th>)}</tr></thead>
        <tbody>{D.tenseNames.map((t) => <tr key={t.id}><th scope="row">{t.label}</th>{D.moodNames.map((m) => { const n = c.grid[t.id + m.id]; return <td key={m.id} className={m.id === "I" ? "strong" : ""}>{n ? thousands(n) : <span className="ng-none">none</span>}</td>; })}</tr>)}</tbody>
      </table>
    </div>
    <Said quote={D.quotes.burton} />
    <h3 className="ng-sub">Where form and time part</h3>
    <p className="ng-para">The thin upper mark is where the name of the form leads people to expect it. The thick lower mark is where this verse puts it. This placing is this study's reading of each verse and is not in the tags, and readers differ most over John 8:58, John 13:31 and Romans 8:30.</p>
    <ol className="ng-rail">{D.rail.map((item) => { const data = G.rail[item.id], key = `form:${item.id}`; return <li key={item.id}>
      <button type="button" data-open={key} onClick={() => onOpen(key)}><Gk big>{item.form}</Gk><small>{item.formName}</small></button>
      <div className="ng-rail-track">
        <Track usual={item.usual} here={item.here} />
        <p className="ng-track-labels" aria-hidden="true">{D.railPoints.map((p) => <span key={p.id}>{p.label}</span>)}</p>
        <p className="ng-hide">{`The form's name points to ${item.usual}.`} {HERE_LINES[item.here]}</p>
      </div>
      <p className="ng-rail-note"><VerseLink label={data.label} />: “{item.phrase}”. {item.note}</p>
    </li>; })}</ol>
    <h3 className="ng-sub">“{D.claims.aorist.claim}”</h3>
    <ul className="ng-spans">{D.aoristVerses.map((item) => { const data = G.aorists[item.id], key = `form:${item.id}`; return <li key={item.id}>
      <button type="button" data-open={key} onClick={() => onOpen(key)}><Gk big>{item.form}</Gk></button>
      <p>“{item.phrase}”. {item.note} <VerseLink label={data.label} /></p>
    </li>; })}</ul>
    <Said quote={D.quotes.stagg} />
    <Test kicker="Your turn" question={D.claims.aorist.question} options={D.claims.aorist.options} />
    <Quote label={G.onceForAll} />
    <ThreeParts {...D.records.time} />
    <h3 className="ng-sub">Does the form carry time at all?</h3>
    <ul className="ng-views">{D.aspectViews.map((v) => <li key={v.who}><b>{v.who}</b><em>{v.side}</em> {v.view}</li>)}</ul>
    <p className="ng-note">{D.aspectNote} <span>This page reports the argument and does not choose.</span></p>
    <Cite ids={["burton", "stagg", "aubrey", "aspectBooks", "wallace", "machen"]} />
  </>;
}
