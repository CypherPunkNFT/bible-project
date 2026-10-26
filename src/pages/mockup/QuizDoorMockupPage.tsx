// MOCK-UP (/quiz_door_mockup, local preview only): the Study page's 03 section, the Questions & Answers card
// (QuizDoor.tsx), shown once for each of five drawings (QuizDoorArt.tsx), each in the real section it belongs in (owner,
// 2026-10-24: "mock each up with the real section it's supposed to be in"); 5 is the open Bible and the board merged
// ("merge OpenBible and the board. Maybe a 2x2 next to it"). Tell the number of the one to keep; it goes on the card at /study_mockup.
import type { ComponentType } from "react";
import "@/pages/study/hub/hub.css";
import { BibleBoardArt, BoardArt, CardsArt, CatechismArt, OpenBibleArt } from "./QuizDoorArt";
import { QuizDoor } from "./QuizDoor";
import "./quiz-door.css";

const DRAWINGS: { name: string; note: string; Art: ComponentType }[] = [
  { name: "The cards", note: "On the card now. A question card resting on two others, three choices with the right one ticked: ask, answer, remember.", Art: CardsArt },
  { name: "The catechism page", note: "An old printed page: its question marked Q., its answer A., and the answer proved from Scripture beneath, as catechisms print them.", Art: CatechismArt },
  { name: "The open Bible", note: "The question on the left page, threaded across to the verse it asks about, lit on the right.", Art: OpenBibleArt },
  { name: "The board", note: "Twelve question tiles, as on the homepage quiz: three answered, one lifted as it is opened. Start anywhere.", Art: BoardArt },
  { name: "The open Bible and the board", note: "3 and 4 merged: the open Bible with a 2 × 2 board of tiles beside it. The tile being opened is threaded across to the verse it asks about, lit on the right-hand page; two tiles are answered.", Art: BibleBoardArt },
];

export default function QuizDoorMockupPage() {
  return <div className="study-experience study-hub-page"><div className="hub quiz-door-page">
    <header className="quiz-door-head">
      <p className="eyebrow">Mock-up · Questions &amp; Answers card</p>
      <h1>Five drawings, <em>each in its section</em></h1>
      <p>The Study page's 03 section as it stands, once for each drawing; 5 is 3 and 4 merged. Tell me the number of the one you want.</p>
      <nav aria-label="The five drawings">{DRAWINGS.map(({ name }, i) => <a key={name} href={`#questions-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {DRAWINGS.map(({ name, note, Art }, i) => <div key={name} className="quiz-door-version">
      <p className="quiz-door-label"><span>Drawing {i + 1}</span><strong>{name}</strong>{note}</p>
      <QuizDoor Art={Art} id={`questions-${i + 1}`} />
    </div>)}
  </div></div>;
}
