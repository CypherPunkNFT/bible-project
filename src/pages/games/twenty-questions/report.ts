// Bible twenty questions: the anonymous report after a guess-mode game (design §10.3). Ids and letters only, no free
// text. It is sent and forgotten: a failure is logged once and never touches play. Reverse mode sends nothing.
import type { Engine, Turn } from "./engine";

export const REPORT_URL = "/api/twenty-questions/report";

export interface Report {
  v: string;
  who: string;
  inPool: boolean;
  answers: [string, "y" | "n" | "d"][];
  guesses: string[];
  disputed: string[];
  result: "won" | "lost";
}

export function buildReport(engine: Engine, turns: readonly Turn[], who: string, inPool: boolean, disputed: readonly string[], result: Report["result"]): Report {
  const { data } = engine;
  return {
    v: data.version, who, inPool,
    answers: turns.flatMap((t) => (t.kind === "q" ? [[data.tags[t.tag].id, t.answer] as [string, "y" | "n" | "d"]] : [])),
    guesses: turns.flatMap((t) => (t.kind === "g" ? [data.people[t.person].id] : [])),
    disputed: [...new Set(disputed)], result,
  };
}

let warned = false;

/** Posts the report with keepalive, so it survives the page closing; never throws and never waits. */
export function sendReport(report: Report, send: typeof fetch = fetch): void {
  try {
    send(REPORT_URL, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(report) })
      .catch((error: unknown) => warnOnce(error));
  } catch (error) {
    warnOnce(error);
  }
}

function warnOnce(error: unknown): void {
  if (warned) return;
  warned = true;
  console.warn("Twenty questions: the game report was not sent (play is unaffected):", error);
}
