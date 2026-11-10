// Section 05: four popular claims, each tested from the sources, and each ending in the reader's own test (study rule A6). The answer says
// what the evidence in front of the reader can carry, and leaves open what the evidence leaves open.
import { useState } from "react";
import { D, EG, type Claim } from "./model";
import { Cite, Head, ReadVerses, ThreeParts } from "./parts";
import { formatNumber } from "@/lib/site-format";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { test } = claim, answer = picked === null ? null : test.options[picked];
  return <div className="eg-test">
    <p className="eg-kicker">What can the evidence actually say?</p>
    <p className="eg-test-q">{test.question}</p>
    <div className="eg-options">{test.options.map((option, i) => <button key={option.text} type="button" aria-pressed={picked === i} className={picked === i ? (option.right ? "right" : "wrong") : ""} onClick={() => setPicked(i)}>{option.text}</button>)}</div>
    <p className="eg-answer" aria-live="polite">{answer && <><b>{answer.right ? "Supported." : "Not supported."}</b> {answer.why}</>}</p>
  </div>;
}

export function Claims() {
  const { habiru } = EG.letters;
  return <>
    <Head num="05" kicker="Four claims tested" title={<>Four things often said.<em> One test each.</em></>}
      lead="Each of these turns up in good faith, in books and on tours. The question is how much these texts can carry." />
    <ol>{D.claims.map((claim) => <li key={claim.id} className="eg-claim-row">
      <p className="eg-claim">{claim.claim}</p>
      <h3>{claim.head}</h3>
      <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} />
      {claim.id === "habiru" && <p className="eg-caption">{`Counted by this study's script from the edition's dictionary field: ${formatNumber(habiru.letters)} letters, ${formatNumber(habiru.spelled.length)} spelled out (${habiru.spelled.join(", ")}), ${formatNumber(habiru.signsOnly)} in signs only, ${formatNumber(habiru.fromByblos)} from Byblos.`}</p>}
      <ReadVerses labels={claim.verses} />
      <Test claim={claim} />
      <Cite ids={claim.sources} />
    </li>)}</ol>
  </>;
}
