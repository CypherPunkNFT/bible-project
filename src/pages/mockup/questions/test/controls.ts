// The test page's plain helpers: the type size for a question, and the keyboard.
import { useEffect } from "react";
import { LETTERS } from "../model";
import type { Run } from "./engine";

/** The type steps down for longer questions, so a fixed frame never changes size. */
export const promptSize = (text: string) => (text.length <= 60 ? "is-xl" : text.length <= 110 ? "is-lg" : text.length <= 170 ? "is-md" : "is-sm");

const typing = (target: EventTarget | null) => target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName);

/** Keys: A–D (or 1–4) to answer, T or F for true or false, Space to show an answer, Y or N to mark it, Enter for the next. */
export function useTestKeys(run: Run) {
  useEffect(() => {
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
  }, [run]);
}
