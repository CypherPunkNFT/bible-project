// Section 05: three popular claims, each tested from the sources, and each ending in the reader's own test (study rule A6). The
// answer says which conclusion the source supports and why the others do not.
import { useState } from "react";
import { D, type Claim } from "./model";
import { Cite, Head, ReadVerses, ThreeParts } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { test } = claim, answer = picked === null ? null : test.options[picked];
  return <div className="hh-test">
    <p className="hh-kicker">What can the evidence actually say?</p>
    <p className="hh-test-q">{test.question}</p>
    <div className="hh-options">{test.options.map((option, i) => <button key={option.text} type="button" aria-pressed={picked === i} className={picked === i ? (option.right ? "right" : "wrong") : ""} onClick={() => setPicked(i)}>{option.text}</button>)}</div>
    <p className="hh-answer" aria-live="polite">{answer && <><b>{answer.right ? "Supported." : "Not supported."}</b> {answer.why}</>}</p>
  </div>;
}

export function Claims() {
  return <>
    <Head num="05" kicker="Three claims tested" title={<>Three good pictures.<em> One test each.</em></>}
      lead="Each of these is said in good faith, in commentaries and on study tours. Each is partly right. The question is how much the evidence can carry." />
    <ol>{D.claims.map((claim) => <li key={claim.id} className="hh-claim-row">
      <p className="hh-claim-n" aria-hidden="true">{claim.id}</p>
      <div>
        <p className="hh-claim">{claim.claim}</p>
        <h3>{claim.head}</h3>
        <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} />
        <ReadVerses labels={claim.verses} />
        <Test claim={claim} />
        <Cite ids={claim.sources} />
      </div>
    </li>)}</ol>
  </>;
}
