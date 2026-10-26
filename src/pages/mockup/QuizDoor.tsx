// MOCK-UP: the study hub's third section, "03 / Test what you know", leading to the questions page (/study/questions).
// It takes the place of the hub's closing "Begin with a question" section in StudyHubMockup.tsx. Built like sections
// 01 and 02 (owner, 2026-10-24: "a section just like 01 and 02, white and yellow … the same format as all the rest"):
// the same heading, then one card made like the Writers of Scripture card (hub.css's people-feature), laid out wide
// with the words on the left and the drawing on the right. Filled out on the owner's word (2026-10-24: "looking super
// bare … we've got kids, we've got adults, we've got tons of stuff"): who the questions are for, how they are split by
// difficulty, and the bank's figures along the foot instead of three subject words. The figures come from
// src/data/question-summary.json (scripts/question-summary.mjs), so the page never loads the 16 MB bank.
import { Backpack, Users, type LucideIcon } from "lucide-react";
import { useState, type ComponentType } from "react";
import { Icon, StudyLink } from "@/pages/study/hub/shared";
import SUMMARY from "@/data/question-summary.json";
import { BibleBoardArt } from "./QuizDoorArt";
import "./quiz-door.css";

const n = (value: number) => value.toLocaleString("en-US");
const S = SUMMARY;

/** Who the questions are for: children, and everyone else. One line each: an icon, the title running into its words,
 *  the count first, in gold, as part of the title (owner, 2026-10-24: "all one line, it's all one margin"; the count
 *  "before the for children in gold, same font, same size", and bigger icons). */
const READERS: [LucideIcon, string, string, string][] = [
  [Backpack, "For children", n(S.children), "Questions from the old Sunday-school question books, catechisms for little children and quizzes for kids; " + n(S.reworded) + " of them reworded in plain words for young readers."],
  [Users, "For adults and families", n(S.questions - S.children), `From the Heidelberg and Westminster catechisms to quizzes on all ${S.books} books, for a family at the table or a class on a Sunday.`],
];

/** Under the drawing, the whole bank split by how hard a question is. The split by kind of source ("Where they come
 *  from") was taken out to give the drawing more room (owner, 2026-10-24: "not really that helpful"). */
const SPLITS: { title: string; parts: [number, string, string][] }[] = [
  { title: "How hard they are", parts: [[S.levels.easy, "Easy", "easy"], [S.levels.medium, "Medium", "medium"], [S.levels.hard, "Hard", "hard"]] },
];

/** One split: a bar in three shades of gold, each part as wide as its share, with its figure and name beneath. Each
 *  part and its name light up together when pointed at and open the questions page's "Every question" list at that
 *  difficulty (owner, 2026-10-24). */
function Split({ title, parts }: (typeof SPLITS)[number]) {
  const [lit, setLit] = useState<string | null>(null);
  const hover = (id: string) => ({ onMouseEnter: () => setLit(id), onMouseLeave: () => setLit(null), onFocus: () => setLit(id), onBlur: () => setLit(null) });
  const to = (id: string) => `/study/questions?d=${id}#qp-explore`;
  return <div className="quiz-kinds" data-lit={lit ?? undefined}>
    <p>{title}</p>
    <div className="quiz-kinds-bar" aria-hidden="true">{parts.map(([count, , id], i) =>
      <StudyLink key={id} to={to(id)} tabIndex={-1} className={`k-${i}${lit === id ? " is-lit" : ""}`} style={{ flexGrow: count }} {...hover(id)} />)}</div>
    <ul>{parts.map(([count, label, id], i) => <li key={label} className={`k-${i}${lit === id ? " is-lit" : ""}`}>
      <StudyLink to={to(id)} aria-label={`${n(count)} ${label.toLowerCase()} questions`} {...hover(id)}><b>{n(count)}</b>{label}</StudyLink>
    </li>)}</ul>
  </div>;
}

/** The bank's figures along the foot of the card. */
const FIGURES: [string, string][] = [
  [n(S.questions), "Questions"], [n(S.linked), "Tied to a verse"], [String(S.books), "Books of the Bible"],
  [n(S.people), "People"], [n(S.places), "Places"], [`AD ${S.oldest.year}`, "Oldest source"],
];

/** The section, with the open Bible and board drawing by default (owner, 2026-10-24); /quiz_door_mockup shows it once per drawing, each with its own id. */
export function QuizDoor({ Art = BibleBoardArt, id = "questions" }: { Art?: ComponentType; id?: string }) {
  return <section className="hub-section quiz-section" id={id} aria-labelledby={`${id}-title`}>
    <div className="section-heading"><div><p className="eyebrow">03 / Test what you know</p><h2 id={`${id}-title`}>How well do you <em>know the Bible?</em></h2></div><p>Ask a question, find its answer, then remember the passage behind it.</p></div>
    <article className="people-feature quiz-feature">
      <div className="feature-kicker"><span>Questions &amp; answers</span><span>Ask → Answer → Remember</span></div>
      <div className="quiz-feature-body">
        <div className="quiz-feature-words">
          <h3>Questions &amp; Answers</h3>
          <p>For more than four hundred years churches have taught the faith by asking questions: parents at home, teachers in Sunday school, pastors to those about to join the church. Here are {n(S.questions)} of them from {S.collections} collections and five traditions ({S.traditions.join(", ")}), each with the answer its source printed, four choices to pick from, and nearly every one tied to the verse it asks about.</p>
          <ul className="quiz-readers">{READERS.map(([ReaderIcon, label, figure, line]) => <li key={label}>
            <ReaderIcon size={28} strokeWidth={1.3} aria-hidden="true" /><p><strong><b>{figure}</b> {label.toLowerCase()}.</strong> {line}</p>
          </li>)}</ul>
        </div>
        <div className="quiz-feature-side">
          <StudyLink className="quiz-art" to="/study/questions" tabIndex={-1} aria-hidden="true"><Art /></StudyLink>
          {SPLITS.map((split) => <Split key={split.title} {...split} />)}
        </div>
      </div>
      <div className="people-footer quiz-footer">
        <dl className="quiz-figures">{FIGURES.map(([figure, label]) => <div key={label}><dd>{figure}</dd><dt>{label}</dt></div>)}</dl>
        <StudyLink className="feature-link" to="/study/questions"><span>Explore the questions</span><span className="door-arrow"><Icon name="arrow"/></span></StudyLink>
      </div>
    </article>
  </section>;
}
