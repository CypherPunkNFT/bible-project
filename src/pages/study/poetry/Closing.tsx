// 07 Claims and limits: five claims, each tested from the record with a question the reader answers; the words to keep apart;
// how far the page reaches; who noticed what, on one line of years; the reading trail with what was read of each work; the
// studies nearby; the closing question and the way back to Academic studies.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { D, owns, P, readingTag, sourceById, type Claim } from "./model";
import { Prose, Refs, SourceButton } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : claim.test.options[picked];
  return <div className="hpn-test-q">
    <p><Prose text={claim.test.question} /></p>
    <ul>{claim.test.options.map((o, i) => <li key={plainText(o.text)}>
      <button type="button" aria-pressed={picked === i} onClick={() => setPicked(i)}><Checked text={o.text} /></button>
    </li>)}</ul>
    {chosen && <p className="hpn-why" aria-live="polite"><b>{chosen.right ? "The evidence supports this." : "The evidence does not support this."}</b> <Prose text={chosen.why} /></p>}
  </div>;
}

export function Claims() {
  return <>
    <header className="hpn-head">
      <p className="hpn-kicker"><b>07</b> · Claims and limits</p>
      <h2>Five things often said. <em>One test each.</em></h2>
      <p>Each claim is set against the patterns above. Answer the question before reading what the evidence can carry.</p>
    </header>
    <div className="hpn-claims">{D.claims.map((c) => <article key={c.id} className="hpn-claim">
      <blockquote><Checked text={c.claim} /></blockquote>
      <h3><Checked text={c.head} /></h3>
      <p><Prose text={c.evidence} /></p>
      <p><Prose text={c.inference} /></p>
      <p className="hpn-caption"><Prose text={c.limit} /></p>
      <Refs labels={c.verses} />
      <p className="hpn-claim-sources">{c.sources.map((id) => <SourceButton key={id} id={id} />)}</p>
      <Test claim={c} />
    </article>)}</div>
  </>;
}

export function Closing() {
  const named = [...D.links.academic, ...D.links.theology];
  return <>
    <div className="hpn-close">
      <div>
        <h3 className="hpn-sub">Words to keep apart</h3>
        <dl className="hpn-words">{D.confusedWords.map((w) => <div key={plainText(w.word)}><dt><Checked text={w.word} /></dt><dd><Prose text={w.note} /></dd></div>)}</dl>
        <h3 className="hpn-sub">How far this page reaches</h3>
        <ul className="hpn-reach">{D.reach.map((r) => <li key={plainText(r)}><Prose text={r} /></li>)}{D.boundaries.out.map((o) => <li key={plainText(o)}><Prose text={o} /></li>)}</ul>
        <p className="hpn-caption">Since that note was written, the build has counted from the held Hebrew and Berean: the twenty-two letters of each drawn alphabet poem, Psalm 119's {P.acrostics.psalm119} verses, Lamentations 3's {P.acrostics.lamentations3}, and Genesis 1's {P.threads.verdicts} verdicts.</p>
      </div>
      <div>
        <h3 className="hpn-sub">{D.timeline.head}</h3>
        <ol className="hpn-timeline">{D.timeline.rows.map((r) => <li key={r.year + r.who}><b>{r.year}</b><span>{r.who}</span><small><Checked text={r.what} /></small></li>)}</ol>
        <p className="hpn-caption"><Prose text={D.timeline.note} /></p>
        <h3 className="hpn-sub">Reading trail</h3>
        <ul className="hpn-trail">{D.readingTrail.map((t) => {
          const s = sourceById.get(t.source);
          return s ? <li key={t.source}><SourceButton id={t.source} whole /><small><Prose text={t.why} /></small></li> : null;
        })}</ul>
        <details className="hpn-sources"><summary>Every source · {D.sources.length} works{D.sources.every((s) => s.status === "located") ? `, each ${readingTag("located")}` : ""}</summary>
          <ul>{D.sources.map((s) => <li key={s.id}><SourceButton id={s.id} whole /></li>)}</ul>
        </details>
        <p className="hpn-caption"><Prose text={D.pictures.note} /> None is shown here: no licence is settled for any of the {D.pictures.candidates.length}.</p>
      </div>
    </div>
    <nav className="hpn-near" aria-label="Studies nearby">
      <p className="hpn-kicker">Nearby</p>
      <ul>{named.map((title) => {
        const href = owns(P.links.studies, title) ? P.links.studies[title] : null;
        return <li key={title}>{href ? <Link to={href}>{title} <span aria-hidden="true">→</span></Link> : <span>{title} <small>(not yet on the site)</small></span>}</li>;
      })}</ul>
    </nav>
    <div className="hpn-closing">
      <p><Checked text={D.question} /></p>
      <Link to={P.links.pages.academic}>Back to Academic studies <span aria-hidden="true">→</span></Link>
    </div>
  </>;
}
