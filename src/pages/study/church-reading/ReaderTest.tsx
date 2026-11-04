// The reader's own test (study rule A6): the answer says which conclusion the source supports and why the others do not.
import { useState } from "react";
import type { TestItem } from "./model";

export function ReaderTest({ test, kicker = "What can the evidence actually say?", yes = "Supported.", no = "Not supported." }: { test: TestItem; kicker?: string; yes?: string; no?: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answer = picked === null ? null : test.options[picked];
  return <div className="hc-test">
    <p className="hc-kicker">{kicker}</p>
    <p className="hc-test-q">{test.question}</p>
    <div className="hc-options">{test.options.map((option, i) => <button key={option.text} type="button" aria-pressed={picked === i} className={picked === i ? (option.right ? "right" : "wrong") : ""} onClick={() => setPicked(i)}>{option.text}</button>)}</div>
    <p className="hc-answer" aria-live="polite">{answer && <><b>{answer.right ? yes : no}</b> {answer.why}</>}</p>
  </div>;
}
