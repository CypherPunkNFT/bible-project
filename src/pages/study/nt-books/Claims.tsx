// Section 06: five claims often heard, as floating quotations joined by a rule; choosing one gives its record in three
// parts, the verses it turns on, its sources with what was read of each, and a test the reader answers (study rule A6).
import { useState } from "react";
import { plainText } from "@/pages/study/check-notes/checked";
import { D, findClaim, type Claim } from "./model";
import { Cite, Head, Quote, Text, ThreeParts } from "./parts";

type Change = (values: Record<string, string | null>) => void;

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { test } = claim, answer = picked === null ? null : test.options[picked];
  return <div className="nb-test">
    <p className="nb-kicker">What can the evidence actually say?</p>
    <p className="nb-para"><Text text={test.question} /></p>
    <div className="nb-options">{test.options.map((option, i) => <button key={option.text} type="button" aria-pressed={picked === i}
      className={picked === i ? (option.right ? "right" : "wrong") : undefined} onClick={() => setPicked(i)}>{plainText(option.text)}</button>)}</div>
    <p className="nb-answer" aria-live="polite">{answer && <><b>{answer.right ? "Supported." : "Not supported."}</b> <Text text={answer.why} /></>}</p>
  </div>;
}

export function Claims({ claimId, onChange }: { claimId: string | null; onChange: Change }) {
  const chosen = findClaim(claimId);
  return <>
    <Head num="06" kicker="Five claims" title={<>Five things often said.<em> One test each.</em></>} />
    <div className="nb-claims">
      <ol className="nb-claimlist" aria-label="Five claims">
        {D.claims.map((claim) => <li key={claim.id}><button type="button" aria-pressed={claim.id === chosen.id} onClick={() => onChange({ claim: claim.id })}>
          {plainText(claim.claim)}
        </button></li>)}
      </ol>
      <article className="nb-claim" aria-live="polite">
        <h3><Text text={chosen.head} /></h3>
        <ThreeParts evidence={chosen.evidence} inference={chosen.inference} limit={chosen.limit} />
        {chosen.verses.length > 0 && <div className="nb-claimverses">{chosen.verses.map((label) => <Quote key={label} refKey={label} />)}</div>}
        <Test key={chosen.id} claim={chosen} />
        <Cite ids={chosen.sources} />
      </article>
    </div>
  </>;
}
