// POST /api/twenty-questions/report: one anonymous report after a guess-mode game of Bible twenty questions
// (docs/features/twenty-questions/design.md §10.3). Ids and letters only, checked against the game file's own ids
// (twenty-questions-ids.ts, generated). The visitor's address is used only inside an hourly hashed counting key that is
// deleted when its hour ends; the report row has no address column. Tables: migrations/0006_twenty_questions_reports.sql.
import { TQ_PEOPLE, TQ_TAGS } from "./twenty-questions-ids";

/** The few D1 calls this handler makes, so it can be tested with a stand-in database. */
export interface ReportStatement {
  bind(...values: unknown[]): ReportStatement;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
}
export interface ReportEnv { DB: { prepare(query: string): ReportStatement } }

export const MAX_REPORT_BYTES = 4_000;
export const REPORTS_PER_HOUR = 120; // far above real play; a family behind one address can still play all evening
const MAX_TURNS = 25;
const VERSION = /^tq-[0-9a-f]{10}$/;
const PERSON_ID = /^[a-z0-9-]{3,80}$/; // a nominated person outside the game: an id of the site's people list

class Refused extends Error { constructor(public status: number, message: string) { super(message); } }

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

/** The same Origin and Sec-Fetch-Site rule as the testimonies endpoint (a copy: that one is private to its file). */
function fromThisSite(request: Request): boolean {
  const origin = request.headers.get("Origin"), url = new URL(request.url);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname) && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin ?? "");
  return (origin === url.origin || local) && request.headers.get("Sec-Fetch-Site") !== "cross-site";
}

export interface ValidReport {
  version: string; who: string; inPool: boolean; answers: string; guesses: string; disputed: string; result: "won" | "lost";
}

const list = (value: unknown, name: string, max: number): unknown[] => {
  if (!Array.isArray(value) || value.length > max) throw new Refused(400, `${name} must be a list of at most ${max} items.`);
  return value;
};
const known = (value: unknown, ids: ReadonlySet<string>, name: string): string => {
  if (typeof value !== "string" || !ids.has(value)) throw new Refused(400, `${name} holds an id the game does not know.`);
  return value;
};

/** Checks every field; anything malformed or unknown is refused, and nothing outside these fields is kept. */
export function validateReport(input: Record<string, unknown>): ValidReport {
  const { v, who, inPool, result } = input;
  if (typeof v !== "string" || !VERSION.test(v)) throw new Refused(400, "v must be the game file's version.");
  if (typeof inPool !== "boolean") throw new Refused(400, "inPool must be true or false.");
  if (result !== "won" && result !== "lost") throw new Refused(400, "result must be won or lost.");
  if (inPool) known(who, TQ_PEOPLE, "who");
  else if (typeof who !== "string" || !PERSON_ID.test(who) || TQ_PEOPLE.has(who) || result === "won") throw new Refused(400, "who must be a person id outside the game.");
  const answers = list(input.answers, "answers", MAX_TURNS).map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2 || !["y", "n", "d"].includes(pair[1] as string)) throw new Refused(400, "answers must be [tag, y|n|d] pairs.");
    return [known(pair[0], TQ_TAGS, "answers"), pair[1] as string];
  });
  const guesses = list(input.guesses, "guesses", MAX_TURNS).map((id) => known(id, TQ_PEOPLE, "guesses"));
  const disputed = list(input.disputed, "disputed", MAX_TURNS).map((id) => known(id, TQ_TAGS, "disputed"));
  if (answers.length + guesses.length > MAX_TURNS) throw new Refused(400, `a game has at most ${MAX_TURNS} turns.`);
  if (disputed.some((tag) => !answers.some(([asked]) => asked === tag))) throw new Refused(400, "disputed may only name questions that were answered.");
  return { version: v, who: who as string, inPool, answers: JSON.stringify(answers), guesses: JSON.stringify(guesses), disputed: JSON.stringify([...new Set(disputed)]), result };
}

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Counts reports per visitor per hour under a hashed key, deleting expired keys first (as testimonies.ts does). */
async function underLimit(env: ReportEnv, request: Request): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000), window = Math.floor(now / 3600);
  const key = await digest(`twenty-questions:${request.headers.get("CF-Connecting-IP") ?? "local"}:${window}`);
  await env.DB.prepare("DELETE FROM twenty_questions_limits WHERE expires_at<?").bind(now).run();
  const row = await env.DB.prepare("INSERT INTO twenty_questions_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count")
    .bind(key, (window + 1) * 3600).first<{ count: number }>();
  return Boolean(row && row.count <= REPORTS_PER_HOUR);
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) throw new Refused(415, "Send the report as JSON.");
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_REPORT_BYTES) throw new Refused(413, "The report is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_REPORT_BYTES) throw new Refused(413, "The report is too large.");
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch { /* answered below */ }
  throw new Refused(400, "The report could not be read.");
}

export async function handleTwentyQuestionsReport(request: Request, env: ReportEnv): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Reports are sent by the game." }, 405);
  if (!fromThisSite(request)) return json({ error: "Please play on this website." }, 403);
  let report: ValidReport;
  try {
    report = validateReport(await readBody(request));
  } catch (error) {
    if (error instanceof Refused) return json({ error: error.message }, error.status);
    throw error;
  }
  try {
    if (!(await underLimit(env, request))) return json({ error: "Too many reports this hour." }, 429);
    await env.DB.prepare("INSERT INTO twenty_questions_reports(version,who,in_pool,answers,guesses,disputed,result) VALUES (?,?,?,?,?,?,?)")
      .bind(report.version, report.who, report.inPool ? 1 : 0, report.answers, report.guesses, report.disputed, report.result).run();
  } catch (error) {
    // Until the release applies the migration the tables do not exist; the game drops the report silently.
    console.error("twenty-questions report: the database refused the write:", error);
    return json({ error: "Reports are not being recorded right now." }, 503);
  }
  return json({ ok: true }, 201);
}
