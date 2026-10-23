// The questions page's header: the title, a paragraph, where the questions come from in three words and one way on, beside the line drawing
// (QuestionsArt.tsx), which replaced the "Try one" question (owner, 2026-10-22). Under it, the bank's figures run in a
// bar across the page, its foot the line above 01 (StatsBar). The one way on is the pill "Browse questions", down to 03
// (owner, 2026-10-23: "just shows browse questions, with a down arrow… just one option"); the test is offered under the list.
import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import type { QuestionBank } from "@/lib/data";
import { QuestionsArt } from "./QuestionsArt";

/** Where the questions come from, as three words with a small drawing each; the figures are in the bar below
 *  (owner, 2026-10-22: no numbers here, three words on a theme beside a drawing). */
const THEMES: { word: string; line: string; icon: ReactNode }[] = [
  { word: "Confessed", line: "The catechisms of the churches, since 1563", icon: <>
    <path d="M6 11Q13 8 20 11Q27 8 34 11V31Q27 28 20 31Q13 28 6 31Z" /><path d="M20 11V31M10 16H16M10 20H16M24 16H30M24 20H30M24 24H28" opacity=".6" /></> },
  { word: "Taught", line: "Sunday school lessons for children, 1903", icon: <>
    <rect x="7" y="7" width="26" height="26" rx="2" /><path d="M7 27Q15 19 20 20T33 24" /><path d="M20 20V12M16.5 15H23.5" /></> },
  { word: "Tested", line: "Bible quizzes, old and new", icon: <>
    <circle cx="20" cy="20" r="13" /><path d="M16 16.5C16 13.5 18 12 20 12S24 13.5 24 16.5C24 19.5 20 20 20 23.5" /><circle cx="20" cy="27.5" r="1" fill="currentColor" /></> },
];

function Themes() {
  return <ul className="qp-themes" aria-label="Where the questions come from">
    {THEMES.map(({ word, line, icon }) => <li key={word}>
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
      <strong>{word}</strong><span>{line}</span>
    </li>)}
  </ul>;
}

export function QuestionsHero() {
  const toList = () => document.getElementById("qp-explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <header className="qp-hero">
    <div className="qp-hero-copy">
      <p className="qp-eyebrow"><span aria-hidden />Study · Questions</p>
      <h1>How well do you know <em>the Bible?</em></h1>
      <p className="qp-lead">For more than four hundred years, churches have taught the faith by asking questions. Parents put them to their children at home, Sunday school teachers to their classes, pastors to those about to join the church. Here they are gathered in one place, from the Heidelberg Catechism of 1563 to Bible quizzes written this year, each with the answer its source printed and many tied to the verse they ask about.</p>
      <Themes />
      <div className="qp-hero-go">
        <button type="button" className="qp-hero-test" onClick={toList}>Browse questions<ArrowDown size={16} strokeWidth={1.7} aria-hidden /></button>
      </div>
    </div>
    <QuestionsArt />
  </header>;
}

// Years of the collections whose titles name none; the others give their year in the title.
const YEARS: Record<string, number> = { "Heidelberg Catechism": 1563, "Westminster Larger Catechism": 1647, "Westminster Shorter Catechism": 1647 };

/** The bank's figures across the page; the oldest source is the earliest year a collection is known by. */
export function StatsBar({ bank }: { bank: QuestionBank }) {
  const { questions, collections } = bank;
  const dated = collections.flatMap((c) => {
    const year = YEARS[c.title] ?? Number(c.title.match(/\b1[5-9]\d\d\b/)?.[0]);
    return year ? [{ year, title: c.title }] : [];
  });
  const oldest = dated.reduce((a, b) => (b.year < a.year ? b : a), dated[0] ?? { year: 0, title: "" });
  const distinct = (pick: (q: (typeof questions)[number]) => string[] | undefined) => new Set(questions.flatMap((q) => pick(q) ?? [])).size;
  const traditions = [...new Set(collections.map((c) => c.tradition).filter(Boolean))];
  const cells: [ReactNode, string, string][] = [
    [questions.length.toLocaleString(), "Questions", `in ${collections.length} collections`],
    [<><small className="qp-statbar-era">AD</small>{oldest.year}</>, "The oldest source", oldest.title.replace(/\s*\(\d{4}\)$/, "")],
    [questions.filter((q) => q.link).length.toLocaleString(), "Tied to a verse", "each opens the passage it asks about"],
    [distinct((q) => q.people).toLocaleString(), "People asked about", `and ${distinct((q) => q.places).toLocaleString()} places`],
    [String(distinct((q) => q.books)), "Books of the Bible", "every one has questions"],
    [String(traditions.length), "Church traditions", traditions.join(", ")],
  ];
  return <dl className="qp-statbar">{cells.map(([n, label, line]) => <div key={label}><dt>{label}</dt><dd>{n}</dd><dd className="qp-statbar-line">{line}</dd></div>)}</dl>;
}
