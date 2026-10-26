// MOCK-UP (/tests_mockup, local preview only): every test the bank can give, in one table (owner, 2026-10-23: "before
// we go into preset tests, let's just do random… so that we can actually take tests. For everything. Depending on book
// or theme."). One row for the whole Bible, each of the 66 books and each theme (questions/test/themes.ts); columns
// for every level, each level alone (Claude Opus's rating, scripts/question_difficulty.py) and children. Each count
// opens the test page with that choice, which draws that many questions at random (questions/test/selection.ts).
// Styles: tests-table.css.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { loadQuestionBank, type BankQuestion, type QuestionBank } from "@/lib/data";
import { DEFAULT_LENGTH } from "../questions/test/engine";
import { LEVELS } from "../questions/test/settings";
import { inTheme, SHELVES } from "../questions/test/themes";
import "../questions-page.css";
import "./tests-table.css";

const LENGTHS = [10, 25, 50];
const SECTIONS: Record<string, string> = {
  history: "Law and history", poetry: "Poetry and wisdom", prophets: "Prophets",
  gospels: "Gospels and Acts", epistles: "Letters", revelation: "Revelation",
};
// A column: its heading, which questions it counts, and what it adds to the test's address.
interface Column { id: string; title: string; fits: (q: BankQuestion) => boolean; params: Record<string, string> }
const COLUMNS: Column[] = [
  { id: "all", title: "Every level", fits: () => true, params: {} },
  ...LEVELS.map((l) => ({ id: l.rating, title: l.rating[0].toUpperCase() + l.rating.slice(1), fits: (q: BankQuestion) => q.level === l.rating,
    params: { level: String(l.id) } })),
  { id: "children", title: "Children", fits: (q: BankQuestion) => q.children === true, params: { age: "children" } },
];

interface Row { id: string; title: string; line?: string; where: Record<string, string>; counts: number[] }
interface Block { title: string; tone?: string; rows: Row[] }

export default function TestsTableMockup() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    loadQuestionBank().then(setBank, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);
  return <div className="qp tt">
    {failed && <p className="qp-status" role="alert">The questions could not be loaded: {failed}</p>}
    {!bank && !failed && <p className="qp-status">Loading the questions…</p>}
    {bank && <Tables bank={bank} />}
  </div>;
}

function Tables({ bank }: { bank: QuestionBank }) {
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const { books, themes, whole } = useMemo(() => blocksOf(bank), [bank]);
  return <>
    <header className="tt-head">
      <p className="qp-eyebrow"><span></span>Mock-up · tests</p>
      <h1>Every <em>test</em></h1>
      <p>Every book and every theme, at every level. Choose a number and the test draws that many of those questions at
        random, a new draw each time. A grey number has fewer questions than the test asks for, so its test is shorter.</p>
      <div className="tt-length" role="group" aria-label="Questions in a test">
        <span>Questions in a test</span>
        {LENGTHS.map((n) => <button key={n} type="button" aria-pressed={length === n} onClick={() => setLength(n)}>{n}</button>)}
      </div>
    </header>
    <Table n="01" title={<>The whole <em>Bible</em></>} blocks={[{ title: "", rows: [whole] }]} length={length} />
    <Table n="02" title={<>By <em>book</em></>} blocks={books} length={length} />
    <Table n="03" title={<>By <em>theme</em></>} blocks={themes} length={length} />
  </>;
}

function Table({ n, title, blocks, length }: { n: string; title: ReactNode; blocks: Block[]; length: number }) {
  return <section className="tt-section">
    <h2><span>{n}</span>{title}</h2>
    <div className="tt-scroll">
      <table className="tt-table">
        <thead><tr><th scope="col">Test</th>{COLUMNS.map((c) => <th key={c.id} scope="col" data-col={c.id}>{c.title}</th>)}</tr></thead>
        {blocks.map((block) => <tbody key={block.title || "only"}>
          {block.title && <tr className="tt-block"><th colSpan={COLUMNS.length + 1} scope="colgroup">
            <i style={block.tone ? { background: `var(--${block.tone})` } : undefined} />{block.title}</th></tr>}
          {block.rows.map((row) => <tr key={row.id}>
            <th scope="row"><strong>{row.title}</strong>{row.line && <small>{row.line}</small>}</th>
            {COLUMNS.map((c, i) => <td key={c.id} data-col={c.id}><Cell count={row.counts[i]} length={length} to={addressOf(row.where, c.params, length)} /></td>)}
          </tr>)}
        </tbody>)}
      </table>
    </div>
  </section>;
}

function Cell({ count, length, to }: { count: number; length: number; to: string }) {
  if (!count) return <span className="tt-none" aria-label="No questions">—</span>;
  return <Link className="tt-count" data-short={count < length ? "" : undefined} to={to}
    title={count < length ? `Only ${count} questions: a shorter test` : `${length} of ${count} questions, drawn at random`}>
    {count.toLocaleString()}
  </Link>;
}

function addressOf(where: Record<string, string>, settings: Record<string, string>, length: number) {
  const out = new URLSearchParams({ ...where, ...settings });
  if (length !== DEFAULT_LENGTH) out.set("n", String(length));
  const query = out.toString();
  return `/study/questions/test${query ? `?${query}` : ""}`;
}

/** The rows, counted over the questions a test can draw on: those that read well on their own (selection.ts). */
function blocksOf(bank: QuestionBank) {
  const pool = bank.questions.filter((q) => q.standalone || q.lead_in);
  const counts = (members: BankQuestion[]) => COLUMNS.map((c) => members.filter(c.fits).length);
  const whole: Row = { id: "bible", title: "The whole Bible", line: "Any book, any theme", where: {}, counts: counts(pool) };
  const books: Block[] = [];
  for (const book of bank.books) {
    const title = `${book.testament === "OT" ? "Old" : "New"} Testament · ${SECTIONS[book.section] ?? book.section}`;
    if (books.at(-1)?.title !== title) books.push({ title, tone: book.section, rows: [] });
    books.at(-1)!.rows.push({ id: book.code, title: book.name, where: { book: book.code },
      counts: counts(pool.filter((q) => q.books.includes(book.code))) });
  }
  const themes: Block[] = SHELVES.flatMap((shelf) => shelf.groups.map((group) => ({
    title: `${shelf.title} · ${group.title}`, tone: shelf.tone,
    rows: group.themes.map((theme) => ({ id: theme.id, title: theme.title, line: theme.line, where: { theme: theme.id },
      counts: counts(pool.filter((q) => inTheme(theme, q))) })),
  })));
  return { whole, books, themes };
}
