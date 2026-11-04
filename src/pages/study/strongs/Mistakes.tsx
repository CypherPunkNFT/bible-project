// Section 03: three popular claims, each tested from the sources, and each ending in the reader's own test (study rule A6). The
// answer says which conclusion the source supports and why the others do not.
import { useState } from "react";
import { Link } from "react-router-dom";
import { D, readerHref } from "./model";
import { Cite, Head, ThreeParts } from "./parts";

type Mistake = (typeof D.mistakes)[number];

/** The verses each mistake names, by book code, chapter and verse. */
const VERSES: Record<string, [string, string, number, number][]> = {
  "2": [["Genesis 1:2", "GEN", 1, 2], ["Exodus 10:13", "EXO", 10, 13], ["John 3:8", "JHN", 3, 8]],
  "3": [["Romans 1:16", "ROM", 1, 16]],
};

function Test({ mistake }: { mistake: Mistake }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { test } = mistake, answer = picked === null ? null : test.options[picked];
  return <div className="sn-test">
    <p className="sn-kicker">What can the evidence actually say?</p>
    <p className="sn-test-q">{test.question}</p>
    <div className="sn-options">{test.options.map((option, i) => <button key={option.text} type="button" aria-pressed={picked === i} className={picked === i ? (option.right ? "right" : "wrong") : ""} onClick={() => setPicked(i)}>{option.text}</button>)}</div>
    <p className="sn-answer" aria-live="polite">{answer && <><b>{answer.right ? "Supported." : "Not supported."}</b> {answer.why}</>}</p>
  </div>;
}

export function Mistakes() {
  return <>
    <Head num="03" kicker="Three mistakes" title={<>Three things it cannot do.<em> One test each.</em></>}
      lead="Each of these is said in good faith, from pulpits and in study groups. Each asks the number to do what it was never made to do." />
    <ol className="sn-mistakes">{D.mistakes.map((m) => <li key={m.id} className="sn-mistake">
      <p className="sn-mistake-n" aria-hidden="true">{m.id}</p>
      <div>
        <p className="sn-claim">{m.claim}</p>
        <h3>{m.head}</h3>
        <ThreeParts evidence={m.evidence} inference={m.inference} limit={m.limit} />
        {VERSES[m.id] && <p className="sn-readverse">Read in the Berean: {VERSES[m.id].map(([label, code, chapter, verse]) => <Link key={label} to={readerHref(code, chapter, verse)}>{label}</Link>)}</p>}
        <Test mistake={m} />
        <Cite ids={m.sources} />
      </div>
    </li>)}</ol>
  </>;
}
