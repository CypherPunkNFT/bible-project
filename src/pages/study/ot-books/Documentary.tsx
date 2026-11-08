// 02 Four sources: the documentary hypothesis in its holders' terms, its history from ibn Ezra to Baden, Wellhausen in his
// own words, the four tests for sources each with its answer and its limit, and the site's stand. Drawn as words, never as a
// tree of documents: a reconstruction is not shown as a finding.
import { R } from "./model";
import { Head, Layer, Para, Stand, ThreeParts, Txt } from "./parts";

export function Documentary() {
  const d = R.documentary;
  return <>
    <Head num="02" kicker="Four sources" headline={d.headline}><Para text={d.lead} /></Head>
    <Layer of="theory" />
    <ol className="ob-jedp" aria-label="The four sources, as their holders describe them">{d.sources.map((s) => <li key={s.letter}>
      <b aria-hidden="true">{s.letter}</b><h3>{s.name}</h3><Para text={s.theyHold} /><p className="ob-date"><span>As holders date it</span> <Txt text={s.date} /></p>
    </li>)}</ol>
    <Para className="ob-caption" text={d.datesNote} />
    <div className="ob-history-wrap">
      <div>
        <p className="ob-kicker">How the theory grew</p>
        <ol className="ob-history">{d.history.map((h) => <li key={`${h.when}-${h.who}`}><span>{h.when}</span><b>{h.who}</b><span className="ob-what"><Txt text={h.what} /></span></li>)}</ol>
      </div>
      <figure className="ob-oldtext">
        <blockquote><p><Txt text={d.wellhausen.quote} /></p></blockquote>
        <figcaption><Txt text={d.wellhausen.source} /></figcaption>
        <Para text={d.wellhausen.note} />
      </figure>
    </div>
    <p className="ob-kicker ob-gap">The four tests, each with its answer</p>
    <ol className="ob-tests">{d.criteria.map((c, i) => <li key={c.id} id={`test-${c.id}`}>
      <h3><span>0{i + 1} / 0{d.criteria.length}</span> <Txt text={c.head} /></h3>
      <ThreeParts evidence={c.theyHold} inference={c.answer} limit={c.limit} labels={["What its holders say", "The answer given", "Where it stops"]} />
    </li>)}</ol>
    <Para text={d.afterWellhausen} />
    <aside className="ob-answer">
      <p className="ob-kicker">{d.answer.head}</p>
      <ul>{d.answer.points.map((point) => <li key={point}><Txt text={point} /></li>)}</ul>
      <p className="ob-limit"><span>Where it stops</span> <Txt text={d.answer.limit} /></p>
    </aside>
    <Stand text={d.stand} />
  </>;
}
