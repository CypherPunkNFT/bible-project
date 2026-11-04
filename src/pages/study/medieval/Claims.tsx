// Section 06: four popular claims, each tested from the sources, and each ending in the reader's own test (study rule A6). The answer says what
// the evidence in front of the reader can carry, and leaves open what the evidence leaves open.
import { useState } from "react";
import { D, type Claim } from "./model";
import { Cite, Head, ThreeParts } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { test } = claim, answer = picked === null ? null : test.options[picked];
  return <div className="mv-test">
    <p className="mv-kicker">What can the evidence actually say?</p>
    <p className="mv-test-q">{test.question}</p>
    <div className="mv-options">{test.options.map((option, i) => <button key={option.text} type="button" aria-pressed={picked === i} className={picked === i ? (option.right ? "right" : "wrong") : ""} onClick={() => setPicked(i)}>{option.text}</button>)}</div>
    <p className="mv-answer" aria-live="polite">{answer && <><b>{answer.right ? "Supported." : "Not supported."}</b> {answer.why}</>}</p>
  </div>;
}

export function Claims() {
  return <>
    <Head num="06" kicker="Four claims tested" title={<>Four things often said.<em> One test each.</em></>}
      lead="Each of these is repeated in good faith, and each holds some truth. The question is how much the sources can carry." />
    <ol>{D.claims.map((claim) => <li key={claim.id} className="mv-claim-row">
      <p className="mv-claim">{claim.claim}</p>
      <h3>{claim.head}</h3>
      <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} />
      <Test claim={claim} />
      <Cite ids={claim.sources} />
    </li>)}</ol>
  </>;
}
