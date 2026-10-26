// The Support page's common questions as tiles that open their answer beneath (the owner's choice, 2026-10-25). The
// mock-up's Search and Menu layouts reuse Answer.
import { useState } from "react";
import { META, QUESTIONS } from "./support-content";

export function Answer({ index }: { index: number }) {
  const Icon = META[index].icon;
  return <div className="sp-answer" aria-live="polite"><Icon aria-hidden /><div><h3>{QUESTIONS[index].question}</h3><p>{QUESTIONS[index].answer}</p></div></div>;
}

export function Tiles() {
  const [open, setOpen] = useState(0);
  return <>
    <div className="sp-tiles">{META.map((m, i) => <button key={m.label} type="button" aria-pressed={i === open} onClick={() => setOpen(i)}>
      <m.icon aria-hidden /><span>{m.label}</span>
    </button>)}</div>
    <Answer index={open} />
  </>;
}
