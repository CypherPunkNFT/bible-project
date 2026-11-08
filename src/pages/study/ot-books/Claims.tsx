// 07 Things often said: five popular claims, each tested in three parts, and where the record gives one, a question for
// the reader whose answer says which conclusion the evidence supports and which it does not.
import { useState } from "react";
import { plainText } from "@/pages/study/check-notes/checked";
import { R, type Claim } from "./model";
import { Head, ThreeParts, Txt, TwoBeats } from "./parts";

function SelfTest({ claim }: { claim: Claim }) {
  const [chosen, setChosen] = useState<number | null>(null);
  if (!claim.test) return null;
  const picked = chosen === null ? null : claim.test.options[chosen];
  return <div className="ob-test" role="group" aria-label={`Test yourself: ${plainText(claim.test.question)}`}>
    <p className="ob-kicker">Test yourself</p>
    <p className="ob-test-q"><Txt text={claim.test.question} /></p>
    <ul>{claim.test.options.map((option, i) => <li key={option.text}>
      <button type="button" aria-pressed={chosen === i} className={chosen === i ? (option.right ? "on right" : "on wrong") : ""} onClick={() => setChosen(i)}><Txt text={option.text} /></button>
    </li>)}</ul>
    <p className="ob-test-why" aria-live="polite">{picked && <><b>{picked.right ? "The evidence supports this." : "The evidence does not support this."}</b> <Txt text={picked.why} /></>}</p>
  </div>;
}

export function Claims() {
  return <>
    <Head num="07" kicker="Things often said" headline="Things often said. One test each." />
    <ol className="ob-claims">{R.claims.map((claim, i) => <li key={claim.id} id={`claim-${claim.id}`}>
      <p className="ob-claim-n">{String(i + 1).padStart(2, "0")} / {String(R.claims.length).padStart(2, "0")}</p>
      <p className="ob-claim"><Txt text={claim.claim} /></p>
      <h3><TwoBeats text={claim.head} /></h3>
      <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} book={claim.id === "cyrus" ? "Isaiah" : undefined} />
      <SelfTest claim={claim} />
    </li>)}</ol>
  </>;
}
