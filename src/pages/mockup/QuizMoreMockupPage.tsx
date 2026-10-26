// MOCK-UP (/quiz_more_mockup, local preview only): four versions of the "Ready for more?" line under the homepage quiz,
// the way on to the test page and the full list of questions. Each sits under the quiz's last row of tiles, as on the
// homepage. The owner found the plain line too quiet (2026-10-22) and asked for gold rounded boxes, a banner, a button
// or something else; the owner chose 4, Two doors (2026-10-22), which now lives in HomeQuiz.tsx and is shown from there.
// Styles: quiz-more.css (the doors' own in quiz-versions.css).
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import "@/components/home/home-hub.css";
import "../home-quiz.css";
import "../home/quiz-versions.css";
import "./quiz-more.css";
import { QuizDoors } from "../home/HomeQuiz";
import { Tiles } from "../home/QuizVersions";
import { useQuiz } from "../home/quiz-state";

const LEAD = "Thousands more questions from Sunday schools, catechisms and Bible quizzes.";
const TEST = "/study/questions/test";
const LIST = "/study/questions";

/** 1: a short line, centred, over one large gold button; the list as a text link beside it. */
function GoldButton() {
  return <aside className="qm qm-button" aria-label="More questions">
    <p><span className="home-eyebrow">Ready for more?</span>{LEAD}</p>
    <div><Link className="qm-solid qm-large" to={TEST}>Take the full test<ArrowRight size={17} aria-hidden /></Link><Link className="qm-text" to={LIST}>See all the questions<ArrowUpRight size={14} aria-hidden /></Link></div>
  </aside>;
}

/** 2: a slim gold-tinted rounded box, heading and line on the left, a filled and an outlined button on the right. */
function GoldBox() {
  return <aside className="qm qm-box" aria-label="More questions">
    <div><p className="home-eyebrow">Ready for more?</p><h3>Take the full test.</h3><p>{LEAD}</p></div>
    <div className="qm-actions"><Link className="qm-solid" to={TEST}>Take the test<ArrowRight size={15} aria-hidden /></Link><Link className="qm-outline" to={LIST}>See all the questions<ArrowUpRight size={15} aria-hidden /></Link></div>
  </aside>;
}

/** 3: a solid gold band across the board's width; the whole band leads to the test, the list sits at its end. */
function GoldBanner() {
  return <aside className="qm qm-banner" aria-label="More questions">
    <Link className="qm-banner-main" to={TEST}><span className="qm-banner-eyebrow">Ready for more?</span><strong>Take the full test</strong><span className="qm-banner-lead">{LEAD}</span><ArrowRight className="qm-banner-arrow" size={22} aria-hidden /></Link>
    <Link className="qm-banner-list" to={LIST}>See all the questions<ArrowUpRight size={14} aria-hidden /></Link>
  </aside>;
}

const VERSIONS: { name: string; note: string; Version: ComponentType }[] = [
  { name: "The gold button", note: "One line of text, centred, over a single large gold button. The list is a quiet link beside it.", Version: GoldButton },
  { name: "The gold box", note: "A slim rounded box tinted gold, with a filled button for the test and an outlined one for the list.", Version: GoldBox },
  { name: "The gold banner", note: "A solid gold band the width of the board. The whole band opens the test; the list sits at its end.", Version: GoldBanner },
  { name: "Two doors", note: "Chosen, and now on the homepage. Two rounded boxes the shape of the tiles above: the test in solid gold, the list in gold outline.", Version: QuizDoors },
];

/** The quiz's last row of tiles, so each version is seen where it will sit. */
function BoardFoot() {
  const quiz = useQuiz();
  return <div className="qm-board-foot"><Tiles quiz={quiz} onOpen={() => {}} /></div>;
}

export default function QuizMoreMockupPage() {
  return <main className="qv-page">
    <header className="qv-page-head home-wrap">
      <p className="home-eyebrow">Mock-up · under the quiz</p>
      <h1>Four ways to <em>the full test</em></h1>
      <p>The link under the homepage's twelve questions, four ways. Tell me the number of the one you want.</p>
      <nav aria-label="The four versions">{VERSIONS.map(({ name }, i) => <a key={name} href={`#version-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {VERSIONS.map(({ name, note, Version }, i) => <div key={name} id={`version-${i + 1}`} className="qv-version">
      <div className="qv-version-label home-wrap"><span>Version {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
      <section className="qv qv-home hq home-wrap"><BoardFoot /><Version /></section>
    </div>)}
  </main>;
}
