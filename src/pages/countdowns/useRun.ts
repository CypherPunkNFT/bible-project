// The run a page shows and its read marks (design 6.3, 6.4). Seasonal occasions follow their date rule; an occasion with a
// chosen date takes it from ?date= in the address, or else from the visitor's own saved countdown. Marks for a personal
// countdown live with it (so a moved date keeps them); seasonal marks live under the run's id.
import { useSearchParams } from "react-router-dom";
import { OCCASIONS, type Occasion } from "@/data/countdowns";
import { dateKey, parseDateKey } from "./calendar";
import { buildRun, checkChosenDate, currentRun, stateOf, type Run, type RunState } from "./season";
import { newMineId, putMine, toggleMineRead, toggleRunRead, useCountdownProgress, type MyCountdown } from "./storage";
import { useToday } from "./useToday";

export interface RunView {
  todayN: number;
  run: Run | null;
  state: RunState | null;
  /** Why a chosen date could not be used, for the date form. */
  dateError: string | null;
  /** The personal countdown this run belongs to, when the visitor has saved one. */
  mine: MyCountdown | null;
  /** "2027-06-12" for links of a personal countdown; undefined for seasonal ones. */
  date: string | undefined;
  isRead: (key: string) => boolean;
  toggleRead: (key: string) => void;
  saving: boolean;
  progress: ReturnType<typeof useCountdownProgress>;
}

export function useRun(occasion: Occasion): RunView {
  const todayN = useToday();
  const progress = useCountdownProgress(todayN);
  const [params] = useSearchParams();
  const { record, update, saving } = progress;
  let run: Run | null = null;
  let dateError: string | null = null;
  let mine: MyCountdown | null = null;
  let date: string | undefined;

  if (occasion.target.kind !== "chosen") {
    run = currentRun(occasion, todayN, OCCASIONS);
  } else {
    const fromLink = params.get("date");
    const saved = record.mine.filter((item) => item.occasion === occasion.slug);
    const raw = fromLink ?? saved[0]?.date ?? null;
    if (raw !== null) {
      const check = checkChosenDate(parseDateKey(raw), todayN);
      if (check.ok) {
        date = dateKey(check.target);
        run = buildRun(occasion, check.target, OCCASIONS);
        mine = saved.find((item) => item.date === date) ?? null;
      } else {
        dateError = check.reason;
      }
    }
  }

  const read = new Set(mine ? mine.read : run ? record.runs[run.id]?.read ?? [] : []);
  const toggleRead = (key: string) => {
    if (!run) return;
    const runId = run.id;
    if (occasion.target.kind !== "chosen") return update((current) => toggleRunRead(current, runId, key));
    const target = date!;
    update((current) => {
      const existing = current.mine.find((item) => item.occasion === occasion.slug && item.date === target);
      if (existing) return toggleMineRead(current, existing.id, key);
      return putMine(current, { id: newMineId(), occasion: occasion.slug, date: target, name: "", read: [key] });
    });
  };

  return { todayN, run, state: run ? stateOf(run, todayN) : null, dateError, mine, date, isRead: (key) => read.has(key), toggleRead, saving, progress };
}
