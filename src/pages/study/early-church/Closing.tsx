// Claims, each with a test the reader answers, and Where it stops: the words to keep apart, the page's reach, the reading trail, the
// sources with what was read of each, what the research still has open, the closing question and the way back to Academic studies.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { ACADEMIC, D, EC, linkFor, readingTag, sourceById, type Claim } from "./model";
import { Cite, Head, Prose } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : claim.test.options[picked];
  return <div className="ek-test">
    <p><Prose text={claim.test.question} /></p>
    <ul>{claim.test.options.map((o, i) => <li key={plainText(o.text)}><button type="button" aria-pressed={picked === i} onClick={() => setPicked(i)}><Checked text={o.text} /></button></li>)}</ul>
    <p className="ek-why" aria-live="polite">{chosen && <><b>{chosen.right ? "The source supports this." : "The source does not support this."}</b> <Prose text={chosen.why} /></>}</p>
  </div>;
}

export function Claims() {
  return <>
    <Head kicker="Claims" title="Four things often said. One test each." lead="Each claim is set against the records above. Answer the question before reading what the sources can carry." />
    <div className="ek-claims">{D.claims.map((c) => <article key={c.id} className="ek-claim">
      <blockquote><Checked text={c.claim} /></blockquote>
      <h3><Checked text={c.head} /></h3>
      <dl className="ek-three ek-three-tight">
        <div><dt>What the record says</dt><dd><Prose text={c.evidence} /></dd></div>
        <div><dt>What this study infers</dt><dd><Prose text={c.inference} /></dd></div>
        <div><dt>Where it stops</dt><dd><Prose text={c.limit} /></dd></div>
      </dl>
      <Cite ids={c.sources} />
      <Test claim={c} />
    </article>)}</div>
  </>;
}

function SourceLine({ id }: { id: string }) {
  const s = sourceById.get(id);
  if (!s) return null;
  const to = linkFor(s.url);
  return <li>
    {to ? <Link to={to}><Checked text={s.title} /></Link> : <Checked text={s.title} />} <span className="ek-tag">· {readingTag(s.status)}</span>
    <small><Checked text={s.kind} />. <Checked text={s.read} /></small>
  </li>;
}

export function Closing() {
  const external = D.sources.filter((s) => s.url && !s.url.startsWith("/"));
  return <>
    <Head kicker="Where it stops" title="A selection, stated. The witnesses stay." />
    <div className="ek-close">
      <div>
        <h3>Words to keep apart</h3>
        <dl className="ek-words">{D.confusedWords.map((w) => <div key={plainText(w.word)}><dt><Checked text={w.word} /></dt><dd><Prose text={w.note} /></dd></div>)}</dl>
        <h3>How far this page reaches</h3>
        <ul className="ek-reach">{D.reach.map((r) => <li key={plainText(r)}><Prose text={r} /></li>)}{D.boundaries.out.map((o) => <li key={plainText(o)}><Prose text={o} /></li>)}</ul>
      </div>
      <div>
        <h3>Reading trail</h3>
        <ul className="ek-trail">{D.readingTrail.map((t) => {
          const s = sourceById.get(t.source);
          return s ? <li key={t.source}><Checked text={s.title} /> <span className="ek-tag">· {readingTag(s.status)}</span><small><Checked text={t.answers} /></small></li> : null;
        })}</ul>
        <details className="ek-more">
          <summary>Sources · {D.sources.length}, of which {EC.unchecked.length} are quoted and still to be checked</summary>
          <ul className="ek-trail">{D.sources.map((s) => <SourceLine key={s.id} id={s.id} />)}</ul>
          {external.length > 0 && <p className="ek-caption">{external.map((s) => plainText(s.title)).join("; ")}: read on its publisher's own site, which this page names but does not link.</p>}
        </details>
        <details className="ek-more">
          <summary>Still open in the research · {D.openQuestions.length}</summary>
          <ul className="ek-reach">{D.openQuestions.map((q) => <li key={plainText(q)}><Prose text={q} /></li>)}</ul>
        </details>
        <p className="ek-caption">The research record names no pictures, so none are shown.</p>
      </div>
    </div>
    <div className="ek-closing">
      <p>Who wrote this, when, and for whom, and what has the retelling added?</p>
      <Link to={linkFor(ACADEMIC) ?? ACADEMIC}>Back to Academic studies <span aria-hidden="true">→</span></Link>
    </div>
  </>;
}
