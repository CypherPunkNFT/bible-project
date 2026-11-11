// 05 Invented? and 06 Claims: the two discernment sections. The invention view is told in its holders' terms first, then the
// evangelical answer, then the archaeologists outside that circle who also opposed it, the site's own voice once, and what the
// ground can and cannot do. Four claims follow, each with a question the reader answers before reading what the sources carry.
import { useState } from "react";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, type Claim } from "./model";
import { Head, Prose } from "./parts";

export function Invented() {
  const v = D.inventionView;
  return <>
    <Head num="05" kicker={<>Invented?</>} title="Others' view." turn="And the answer." lead={<Checked text={v.head} />} />
    <div className="xs-invented">
      <article><p className="xs-kicker">Their view, in their terms</p><p><Prose text={v.theirs} /></p></article>
      <span className="xs-turn" aria-hidden="true" />
      <article><p className="xs-kicker">The evangelical answer</p><p><Prose text={v.answer} /></p></article>
    </div>
    <div className="xs-invented-foot">
      <p><b>Outside that circle.</b> <Prose text={v.beyond} /></p>
      <p className="xs-voice"><b>What this site holds.</b> <Prose text={v.siteVoice} /></p>
      <p className="xs-limit"><b>What the ground can do.</b> <Prose text={v.limit} /></p>
    </div>
  </>;
}

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : claim.test.options[picked];
  return <div className="xs-test">
    <p><Prose text={claim.test.question} /></p>
    <ul>{claim.test.options.map((o, i) => <li key={o.text}><button type="button" aria-pressed={picked === i} onClick={() => setPicked(i)}><Checked text={o.text} /></button></li>)}</ul>
    {chosen && <p className="xs-why" aria-live="polite"><b>{chosen.right ? "The sources support this." : "The sources do not support this."}</b> <Prose text={chosen.why} /></p>}
  </div>;
}

export function Claims() {
  return <>
    <Head num="06" kicker={<>Claims</>} title="Four things often said." turn="One test each." lead="Each claim is set against the records above. Answer the question before reading what the sources can carry." />
    <div className="xs-claims">{D.claims.map((c) => <article key={c.id} className="xs-claim">
      <blockquote><Checked text={c.claim} /></blockquote>
      <h3><Checked text={c.head} /></h3>
      <p><Prose text={c.evidence} /></p>
      <p><Prose text={c.inference} /></p>
      <p className="xs-caption"><Prose text={c.limit} /></p>
      <Test claim={c} />
    </article>)}</div>
  </>;
}
