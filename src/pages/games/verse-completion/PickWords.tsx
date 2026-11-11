// Pick at Hard: rebuild the ending word by word, three word tiles each time, one try per word (design §5.1). The words
// land in the verse's own gaps (the card draws them from onProgress); the tiles sit in a strip under it and are dealt
// afresh for each word. A wrong tile shakes and the right word lands marked as missed. Keys 1, 2 and 3 choose the tiles
// left to right; keys held with Ctrl, Alt or Meta, keys typed into a form and keys while a dialog is open are left alone.
import { useEffect, useRef, useState } from "react";
import type { WordChoice } from "./choices";
import type { Mark } from "./match";
import { keyIsTaken } from "./view";
import type { Word } from "./words";

interface PickWordsProps {
  hidden: readonly Word[];
  choices: readonly WordChoice[];
  /** The marks so far, so the card can land each word in its gap. */
  onProgress: (marks: Mark[]) => void;
  onDone: (marks: Mark[]) => void;
}

export function PickWords({ hidden, choices, onProgress, onDone }: PickWordsProps) {
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
    onProgress(next);
    if (next.length === hidden.length) { finished.current = true; onDone(next); }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || keyIsTaken(event.target)) return;
      const index = ["1", "2", "3"].indexOf(event.key);
      if (index >= 0) { event.preventDefault(); choose(index); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const choice = choices[position];
  return <div className="vc-words">
    <p className="vc-count" aria-hidden="true">{`${Math.min(position + 1, hidden.length)} / ${hidden.length}`}</p>
    {choice && <div className="vc-tiles" role="group" aria-label={`Word ${position + 1} of ${hidden.length}: choose with 1, 2 or 3`}>
      {choice.options.map((option, i) => <button key={`${position}-${i}`} type="button" className={shaking === i ? "vc-tile is-shake" : "vc-tile"} style={{ animationDelay: shaking === i ? undefined : `${i * 60}ms` }} onClick={() => choose(i)}>
        <span className="vc-key" aria-hidden="true">{i + 1}</span>{option}
      </button>)}
    </div>}
    <p className="sr-only" aria-live="polite">{said}</p>
  </div>;
}
