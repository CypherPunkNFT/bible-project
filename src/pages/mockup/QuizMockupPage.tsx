// MOCK-UP (/quiz_mockup, local preview only): four versions of the homepage's question section, one above another, so the
// owner can try each and choose. The versions: QuizVersions.tsx.
import type { ComponentType } from "react";
import "@/components/home/home-hub.css";
import "./home-quiz.css";
import "./quiz-versions.css";
import { QuizBoard, QuizCard, QuizSpotlight, QuizStage } from "./QuizVersions";

const VERSIONS: { name: string; note: string; Version: ComponentType }[] = [
  { name: "Spotlight", note: "One question in the middle of the page, its drawing above it and the four answers in a row. Calm and centred.", Version: QuizSpotlight },
  { name: "The card", note: "A card on a deck that thins as you go. Answer, and the picture turns over to show the verse.", Version: QuizCard },
  { name: "The dark stage", note: "A dark band across the page, the drawing glowing in gold, and twelve steps along the top.", Version: QuizStage },
  { name: "The twelve", note: "All twelve questions on one board. Open any of them; each tile turns gold once you get it right.", Version: QuizBoard },
];

export default function QuizMockupPage() {
  return <main className="qv-page">
    <header className="qv-page-head home-wrap">
      <p className="home-eyebrow">Mock-up · the question section</p>
      <h1>Four versions of <em>the quiz</em></h1>
      <p>Each one works: try a few questions in each. Tell me the number of the one you want on the homepage.</p>
      <nav aria-label="The four versions">{VERSIONS.map(({ name }, i) => <a key={name} href={`#version-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {VERSIONS.map(({ name, note, Version }, i) => <div key={name} id={`version-${i + 1}`} className="qv-version">
      <div className="qv-version-label home-wrap"><span>Version {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
      <Version />
    </div>)}
  </main>;
}
