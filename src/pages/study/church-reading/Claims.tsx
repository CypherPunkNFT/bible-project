// Section 06: four popular claims, each tested from the sources, and each ending in the reader's own test (study rule A6).
import { D } from "./model";
import { Cite, Head, Picture, ThreeParts } from "./parts";
import { ReaderTest } from "./ReaderTest";

export function Claims() {
  return <>
    <Head num="06" kicker="Four claims tested" title={<>Four things often said.<em> One test each.</em></>}
      lead="Each of these turns up in good faith, in sermons and in study notes. The question is how much the sources can carry." />
    <ol>{D.claims.map((claim) => <li key={claim.id} className={`hc-claim-row${claim.picture ? " has-picture" : ""}`}>
      <div>
        <p className="hc-claim">{claim.claim}</p>
        <h3>{claim.head}</h3>
        <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} />
        <ReaderTest test={claim.test} />
        <Cite ids={claim.sources} />
      </div>
      {claim.picture && <Picture id={claim.picture} />}
    </li>)}</ol>
  </>;
}
