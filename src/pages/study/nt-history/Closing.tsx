// 09 Claims, each with a test the reader answers, and 10 Where it stops: the words to keep apart, the page's reach, the reading
// trail with what was read of each work, the closing question and the way back to Academic studies.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, NH, readingTag, type Claim } from "./model";
import { Head, Prose } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : claim.test.options[picked];
  return <div className="nh-test">
    <p><Prose text={claim.test.question} /></p>
    <ul>{claim.test.options.map((o, i) => <li key={o.text}><button type="button" aria-pressed={picked === i} onClick={() => setPicked(i)}><Checked text={o.text} /></button></li>)}</ul>
    {chosen && <p className="nh-why" aria-live="polite"><b>{chosen.right ? "The source supports this." : "The source does not support this."}</b> <Prose text={chosen.why} /></p>}
  </div>;
}

export function Claims() {
  return <>
    <Head num="09" kicker="Claims" title="Four things often said." turn="One test each." lead="Each claim is set against the records above. Answer the question before reading what the sources can carry." />
    <div className="nh-claims">{D.claims.map((c) => <article key={c.id} className="nh-claim">
      <blockquote><Checked text={c.claim} /></blockquote>
      <h3><Checked text={c.head} /></h3>
      <p><Prose text={c.evidence} /></p>
      <p><Prose text={c.inference} /></p>
      <p className="nh-caption"><Prose text={c.limit} /></p>
      <Test claim={c} />
    </article>)}</div>
  </>;
}

export function Closing() {
  return <>
    <Head num="10" kicker="Where it stops" title="A selection, stated." turn="The text stays." />
    <div className="nh-close">
      <div>
        <h3>Words to keep apart</h3>
        <dl className="nh-words">{D.confusedWords.map((w) => <div key={w.word}><dt><Checked text={w.word} /></dt><dd><Prose text={w.note} /></dd></div>)}</dl>
        <h3>How far this page reaches</h3>
        <ul className="nh-reach">{D.reach.map((r) => <li key={r}><Prose text={r} /></li>)}{D.boundaries.out.map((o) => <li key={o}><Prose text={o} /></li>)}</ul>
        <p className="nh-caption">Nearby, and told another way: <Link to={NH.links.empires}>Israel among the empires</Link> draws its own empire timeline; <Link to={NH.links.manuscripts}>Manuscripts</Link> sets copies on one line of time.</p>
      </div>
      <div>
        <h3>Reading trail</h3>
        <ul className="nh-trail">{D.sources.map((s) => <li key={s.id}>
          <Checked text={s.title} /> <span className="nh-tagline">· {readingTag(s.status)}</span>
          <small><Checked text={s.answers} /></small>
          <small><Checked text={s.read} /></small>
        </li>)}</ul>
        <p className="nh-caption">The research record gives no web address for these works, so none is linked. Pictures named in the record (the Pilate stone, the Arch of Titus, a JUDAEA CAPTA coin, Masada) are not shown: their licences are not yet settled.</p>
      </div>
    </div>
    <div className="nh-closing">
      <p>What fixes this date: a ruler, a record, or a reckoning?</p>
      <Link to={NH.links.academic}>Back to Academic studies <span aria-hidden="true">→</span></Link>
    </div>
  </>;
}
