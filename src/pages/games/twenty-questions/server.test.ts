// Bible twenty questions: the report endpoint (server/twenty-questions.ts, design §10.3, §15 "Server handler"), run
// against a stand-in for the D1 database that records every statement, so the test needs no Cloudflare runtime.
import { MAX_REPORT_BYTES, REPORTS_PER_HOUR, handleTwentyQuestionsReport, type ReportEnv, type ReportStatement } from "../../../../server/twenty-questions";
import { TQ_VERSION } from "../../../../server/twenty-questions-ids";

interface Call { query: string; values: unknown[] }

function fakeDb(options: { fail?: boolean } = {}) {
  const calls: Call[] = [];
  const counts = new Map<unknown, number>();
  const env: ReportEnv = {
    DB: {
      prepare(query: string) {
        const call: Call = { query, values: [] };
        const statement: ReportStatement = {
          bind: (...values: unknown[]) => { call.values = values; return statement; },
          run: async () => { if (options.fail) throw new Error("no such table"); calls.push(call); return {}; },
          first: async <T,>() => {
            if (options.fail) throw new Error("no such table");
            calls.push(call);
            const count = (counts.get(call.values[0]) ?? 0) + 1;
            counts.set(call.values[0], count);
            return { count } as T;
          },
        };
        return statement;
      },
    },
  };
  return { env, calls, inserts: () => calls.filter((c) => c.query.startsWith("INSERT INTO twenty_questions_reports")) };
}

const valid = { v: TQ_VERSION, who: "moses-exo-2-10", inPool: true, answers: [["woman", "n"], ["prophet", "n"]], guesses: ["aaron-exo-4-14"], disputed: ["prophet"], result: "lost" };
const post = (body: unknown, headers: Record<string, string> = {}) => new Request("https://bible.example/api/twenty-questions/report", {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
  headers: { "Content-Type": "application/json", Origin: "https://bible.example", "CF-Connecting-IP": "203.0.113.9", ...headers },
});

describe("the twenty-questions report endpoint", () => {
  it("writes one row for a valid report, with no address anywhere in it", async () => {
    const db = fakeDb();
    const response = await handleTwentyQuestionsReport(post(valid), db.env);
    expect(response.status).toBe(201);
    const [insert] = db.inserts();
    expect(db.inserts()).toHaveLength(1);
    expect(insert.values).toEqual([TQ_VERSION, "moses-exo-2-10", 1, '[["woman","n"],["prophet","n"]]', '["aaron-exo-4-14"]', '["prophet"]', "lost"]);
    expect(JSON.stringify(db.calls)).not.toContain("203.0.113.9");
  });

  it("accepts a nomination of someone outside the game, but never as a win", async () => {
    const nomination = { ...valid, who: "rizpah-2sa-3-7", inPool: false, disputed: [] };
    expect((await handleTwentyQuestionsReport(post(nomination), fakeDb().env)).status).toBe(201);
    expect((await handleTwentyQuestionsReport(post({ ...nomination, result: "won" }), fakeDb().env)).status).toBe(400);
    expect((await handleTwentyQuestionsReport(post({ ...nomination, who: "moses-exo-2-10" }), fakeDb().env)).status).toBe(400);
  });

  it.each([
    ["an unknown person", { who: "gandalf-the-grey" }],
    ["an unknown tag", { answers: [["wizard", "y"]] }],
    ["a bad answer letter", { answers: [["woman", "maybe"]] }],
    ["an unknown guess", { guesses: ["frodo"] }],
    ["a dispute about an unasked question", { disputed: ["king"] }],
    ["too many turns", { answers: Array.from({ length: 26 }, () => ["woman", "n"]) }],
    ["a bad version", { v: "anything" }],
    ["a bad result", { result: "gave-up" }],
    ["free text", { who: "I was thinking of my aunt" }],
  ])("refuses %s", async (_, change) => {
    const db = fakeDb();
    expect((await handleTwentyQuestionsReport(post({ ...valid, ...change }), db.env)).status).toBe(400);
    expect(db.inserts()).toHaveLength(0);
  });

  it("refuses malformed, oversized, non-JSON and foreign requests", async () => {
    const db = fakeDb();
    expect((await handleTwentyQuestionsReport(post("{oops"), db.env)).status).toBe(400);
    expect((await handleTwentyQuestionsReport(post("[1,2]"), db.env)).status).toBe(400);
    expect((await handleTwentyQuestionsReport(post({ ...valid, pad: "x".repeat(MAX_REPORT_BYTES) }), db.env)).status).toBe(413);
    expect((await handleTwentyQuestionsReport(post(valid, { "Content-Type": "text/plain" }), db.env)).status).toBe(415);
    expect((await handleTwentyQuestionsReport(post(valid, { Origin: "https://evil.example" }), db.env)).status).toBe(403);
    expect((await handleTwentyQuestionsReport(post(valid, { "Sec-Fetch-Site": "cross-site" }), db.env)).status).toBe(403);
    const noOrigin = new Request("https://bible.example/api/twenty-questions/report", { method: "POST", body: JSON.stringify(valid), headers: { "Content-Type": "application/json" } });
    expect((await handleTwentyQuestionsReport(noOrigin, db.env)).status).toBe(403);
    expect((await handleTwentyQuestionsReport(new Request("https://bible.example/api/twenty-questions/report"), db.env)).status).toBe(405);
    expect(db.inserts()).toHaveLength(0);
  });

  it("refuses the report over the hourly cap, counting under a hashed key", async () => {
    const db = fakeDb();
    for (let i = 0; i < REPORTS_PER_HOUR; i++) expect((await handleTwentyQuestionsReport(post(valid), db.env)).status).toBe(201);
    expect((await handleTwentyQuestionsReport(post(valid), db.env)).status).toBe(429);
    expect(db.inserts()).toHaveLength(REPORTS_PER_HOUR);
    const key = db.calls.find((c) => c.query.startsWith("INSERT INTO twenty_questions_limits"))!.values[0];
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(db.calls.some((c) => c.query.startsWith("DELETE FROM twenty_questions_limits"))).toBe(true);
  });

  it("answers 503 when the database is not ready, as before the migration is applied", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handleTwentyQuestionsReport(post(valid), fakeDb({ fail: true }).env)).status).toBe(503);
    error.mockRestore();
  });
});
