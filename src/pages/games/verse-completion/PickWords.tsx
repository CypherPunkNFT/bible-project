// Pick at Hard: rebuild the ending word by word, three word buttons each time, one try per word (design §5.1). Keys 1,
// 2 and 3 choose the buttons left to right; keys held with Ctrl, Alt or Meta are left to the browser.
import { useEffect, useRef, useState } from "react";
import type { WordChoice } from "./choices";
import type { Mark } from "./match";
import type { Word } from "./words";

export function PickWords({ hidden, choices, onDone }: { hidden: readonly Word[]; choices: readonly WordChoice[]; onDone: (marks: Mark[]) => void }) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [shaking, setShaking] = useState<number | null>(null);
  const [said, setSaid] = useState("");
  const position = marks.length;
  const finished = useRef(false);

  const choose = (option: number) => {
    if (finished.current || position >= hidden.length) return;
    const choice = choices[position];
    const right = option === choice.right;
    const next = [...marks, right ? { verdict: "exact" as const, credit: 1 } : { verdict: "wrong" as const, credit: 0, typed: choice.options[option] }];
    setShaking(right ? null : option);
    setSaid(`${choice.options[choice.right]}, ${right ? "right" : "missed"}`);
    setMarks(next);
    if (next.length === hidden.length) { finished.current = true; onDone(next); }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const index = ["1", "2", "3"].indexOf(event.key);
      if (index >= 0) { event.preventDefault(); choose(index); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const choice = choices[position];
  return <div className="vc-words">
    <p className="vc-built" aria-label="The ending so far">
      {marks.map((mark, i) => <span key={i} className={mark.verdict === "exact" ? "vc-placed" : "vc-placed is-missed"}>
        {hidden[i].text}{mark.verdict !== "exact" && <span className="sr-only"> (missed)</span>}
      </span>)}
      {position < hidden.length && <span className="vc-cursor" aria-hidden="true">▁</span>}
    </p>
    {choice && <div className="vc-word-options" role="group" aria-label={`Word ${position + 1} of ${hidden.length}: choose with 1, 2 or 3`}>
      {choice.options.map((option, i) => <button key={`${position}-${i}`} type="button" className={shaking === i ? "vc-word is-shake" : "vc-word"} onClick={() => choose(i)}>
        <span className="vc-key" aria-hidden="true">{i + 1}</span>{option}
      </button>)}
    </div>}
    <p className="sr-only" aria-live="polite">{said}</p>
  </div>;
}
