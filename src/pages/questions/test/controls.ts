// The test page's plain helpers: the type size for a question, the keyboard, and the test-then-results stage.
import { useEffect, useState } from "react";
import { LETTERS } from "../model";
import type { Item, Result, Run } from "./engine";

/** The type steps down for longer questions, so a fixed frame never changes size. */
export const promptSize = (text: string) => (text.length <= 60 ? "is-xl" : text.length <= 110 ? "is-lg" : text.length <= 170 ? "is-md" : "is-sm");

/** How an option shows once the question is answered: the right one, the one you wrongly chose, or set aside. */
export const choiceState = (option: string, answer: string, result: Result | undefined) =>
  !result ? "" : option === answer ? "is-right" : option === result.given ? "is-wrong" : "is-dim";

const NUMERALS: [number, string][] = [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
/** 1 to 89 as a Roman numeral, for the question numbers set large behind a question. */
export function roman(n: number) {
  let out = "";
  for (const [value, letters] of NUMERALS) while (n >= value) { out += letters; n -= value; }
  return out;
}

const typing = (target: EventTarget | null) => target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName);

/** Only one test on a page listens (`enabled`). Keys: A–D (or 1–4) to answer, T or F for true or false, Space to show an answer, Y or N to mark it, Enter for the next. */
export function useTestKeys(run: Run, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const { item, answered, revealed } = run;
      if ((key === "enter" || key === " ") && typing(event.target)) return;
      if (answered && key === "enter") { event.preventDefault(); run.next(); return; }
      if (item.format === "open" && !answered) {
        if (!revealed && (key === " " || key === "enter")) { event.preventDefault(); run.reveal(); }
        else if (revealed && (key === "y" || key === "n")) run.mark(key === "y");
        return;
      }
      if (answered || !item.choices) return;
      const at = item.format === "truefalse" ? ["t", "f"].indexOf(key) : Math.max(LETTERS.toLowerCase().indexOf(key), "123456".indexOf(key));
      if (at >= 0 && at < item.choices.length) run.choose(item.choices[at]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, enabled]);
}

export type Stage = { step: "test"; items: Item[] } | { step: "results"; items: Item[]; results: Result[] };

/** A test, then its results; `start` begins again (the same questions, or only the missed ones). */
export function useTestStage(items: Item[]) {
  const [stage, setStage] = useState<Stage>({ step: "test", items });
  const [round, setRound] = useState(0);
  const start = (list: Item[]) => { setRound((r) => r + 1); setStage({ step: "test", items: list }); };
  const finish = (results: Result[]) => setStage((s) => ({ step: "results", items: s.items, results }));
  return { stage, round, start, finish };
}
