// 08 Where it stops: the words kept apart, how far the page reaches, where it hands over to its neighbours, the reading
// trail with what was read of each work, the sources, the editor's open questions, the closing question and the way back.
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { ext, R, readingTag } from "./model";
import { Head, Para, Txt } from "./parts";

const OPEN_QUESTIONS = (R as unknown as { openQuestions?: string[] }).openQuestions ?? [];

export function Closing() {
  return <>
    <Head num="08" kicker="Where it stops" headline="A selection, stated. The book stays.">
      <Para text={R.boundaries.in} />
    </Head>
    <dl className="ob-words" aria-label="Words kept apart">{R.confusedWords.map((w) => <div key={w.word}><dt><Txt text={w.word} /></dt><dd><Txt text={w.note} /></dd></div>)}</dl>
    <div className="ob-ends">
      <div><p className="ob-kicker">How far this page reaches</p><ul className="ob-plain">{R.reach.map((r) => <li key={r}><Txt text={r} /></li>)}</ul></div>
      <div><p className="ob-kicker">Where it hands over</p><ul className="ob-plain">{R.boundaries.out.map((o) => <li key={o}><Txt text={o} /></li>)}</ul></div>
    </div>
    <p className="ob-kicker ob-gap">A reading trail</p>
    <ol className="ob-trail">{R.trail.map((t) => <li key={t.work}><b><Txt text={t.work} /></b><span><Txt text={t.answers} /></span><small><Txt text={t.read} /></small></li>)}</ol>
    <details className="ob-fold">
      <summary>Sources · {R.sources.length}</summary>
      <ul>{R.sources.map((s) => <li key={s.id}>
        {s.url ? <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a> : <b>{s.title}</b>} <small>{s.kind} · {readingTag(s.status)}</small>
        <p><Txt text={s.answers} /> <Txt text={s.read} /></p>
      </li>)}</ul>
    </details>
    {OPEN_QUESTIONS.length > 0 && <details className="ob-fold">
      <summary>The editor's open questions · {OPEN_QUESTIONS.length}</summary>
      <p className="ob-caption">Left by the research run. A dot opens the note on what was found since.</p>
      <ul>{OPEN_QUESTIONS.map((q, i) => <li key={i}><Checked text={q} /></li>)}</ul>
    </details>}
    <div className="ob-close">
      <p className="ob-kicker">The question to carry to every claim</p>
      <p className="ob-close-q"><Txt text={R.question} /></p>
      <Link className="ob-go" to="/study/academic?area=texts"><span aria-hidden="true">←</span> Back to Academic studies</Link>
    </div>
  </>;
}
