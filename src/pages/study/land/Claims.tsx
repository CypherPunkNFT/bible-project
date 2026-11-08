// 07 · Claims: four things often said about the land, each a record in three parts with its sources, and a question the reader
// answers before the page says which answer the evidence supports.
import { useState } from "react";
import { D, type Claim } from "./model";
import { Cite, Head, T, ThreeParts, VerseRefs } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const chosen = picked === null ? null : claim.test.options[picked];
  return <div className="ls-test">
    <p className="ls-kicker">What can the evidence actually say?</p>
    <p className="ls-para"><T text={claim.test.question} /></p>
    <div className="ls-options" role="group" aria-label="Choose an answer">{claim.test.options.map((o, i) =>
      <button key={i} type="button" aria-pressed={picked === i} className={picked === i ? "is-on" : ""} onClick={() => setPicked(i)}><T text={o.text} /></button>)}</div>
    {chosen && <p className="ls-answer" aria-live="polite"><b>{chosen.right ? "Supported." : "Not supported."}</b> <T text={chosen.why} /></p>}
  </div>;
}

export function Claims() {
  return <>
    <Head num="07" kicker="Claims" title="Four things often said." turn="One test each." lead={<p>Each claim is set against the text and the ground, then handed to you as a question.</p>} />
    <div className="ls-claims">{D.claims.map((c, i) => <article key={c.id} className="ls-claim">
      <p className="ls-card-k">Claim · {String(i + 1).padStart(2, "0")} / {String(D.claims.length).padStart(2, "0")}</p>
      <h3><T text={c.claim} /></h3>
      <p className="ls-claim-head"><T text={c.head} /></p>
      <ThreeParts evidence={c.evidence} inference={c.inference} limit={c.limit} />
      <VerseRefs labels={c.verses} />
      <Cite ids={c.sources} />
      <Test claim={c} />
    </article>)}</div>
  </>;
}
