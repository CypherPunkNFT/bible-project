// Section 04: the four ways a likeness can arise, each with who held it and what would count for it; a time chart of ranges that refuses to
// place the texts with no date; and, kept apart and named as such, what this site holds.
import { D, findExplanation, timeShare, type Row } from "./model";
import { Cite, Head, Quote, ReadVerses } from "./parts";

function bars(row: Row): [number, number][] {
  return row.ranges ?? [[row.start, row.end]];
}

function TimeRow({ row }: { row: Row }) {
  return <li className={`eg-timerow ${row.kind}`}>
    <p><strong>{row.name}</strong><small>{row.note}</small></p>
    <div className="eg-timetrack" aria-hidden="true">{bars(row).map(([from, to]) => <span key={from} className={row.open ? "open" : ""} style={{ left: `${timeShare(from) * 100}%`, width: `${Math.max(timeShare(to) - timeShare(from), 0.012) * 100}%` }} />)}</div>
  </li>;
}

export function Likeness({ viewId, onView }: { viewId: string | null; onView: (id: string) => void }) {
  const view = findExplanation(viewId), { timeline, stance } = D;
  const marks = [1400, 1200, 1000, 800, 600, 400];
  return <>
    <Head num="04" kicker="A likeness is not a lineage" title={<>Four ways to look alike.<em> One of them is a lost book.</em></>}
      lead="Two texts that run close have not yet told you how. Here are the four explanations that have been argued, with who argued them and what each would need. The page reports them without choosing." />
    <div className="eg-judges" role="group" aria-label="Which explanation to show">
      {D.explanations.map((e) => <button key={e.id} type="button" aria-pressed={e.id === view.id} onClick={() => onView(e.id)}><strong>{e.name}</strong><small>{e.tag}</small></button>)}
    </div>
    <dl className="eg-three eg-explain" aria-live="polite">
      <div><dt>Who held it</dt><dd>{view.held}</dd></div>
      <div><dt>What counts for it</dt><dd>{view.forIt}</dd></div>
      <div><dt>What counts against it</dt><dd>{view.against}</dd></div>
      <div><dt>What would show it</dt><dd>{view.wouldShow}</dd></div>
    </dl>
    <Cite ids={["ruffle", "kitchen", "buys"]} />

    <h3 className="eg-subhead">What dates can and cannot do</h3>
    <div className="eg-timescale" aria-hidden="true"><i />{<div>{marks.map((year) => <span key={year} style={{ left: `${timeShare(year) * 100}%` }}>{year}</span>)}</div>}</div>
    <ul className="eg-time">{timeline.rows.map((row) => <TimeRow key={row.id} row={row} />)}</ul>
    <p className="eg-caption">Years BC, ranges only. A hollow bar has no firm left end. The usual reign dates are rounded and not pressed here. Each bar's words are beside it, so nothing rests on the drawing.</p>
    <p className="eg-doubt"><b>No bar.</b> {timeline.undated}</p>
    <ReadVerses labels={["Proverbs 1:1", "Proverbs 22:17", "Proverbs 25:1"]} />

    <div className="eg-stance">
      <div>
        <p className="eg-kicker">{stance.head}</p>
        <Quote label={stance.scripture} />
        <p className="eg-confession">{stance.confession}<small>{stance.confessionSource}</small></p>
      </div>
      <div>
        <p className="eg-para">{stance.body}</p>
        <p className="eg-para">{stance.names}</p>
        <ReadVerses labels={stance.verses} />
      </div>
    </div>
  </>;
}
