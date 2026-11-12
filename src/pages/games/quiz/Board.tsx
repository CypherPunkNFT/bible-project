// /games/quiz: the board of twelve tiles (the audit's items 5 and 6). One big "Play all twelve" button above it deals
// the questions in order; any tile can still be picked. A tile answered right keeps its gold and gains a small gold
// seal; a missed one is dimmed, its drawing turned grey, with a red "Missed" corner, so after a round the board is the
// scorecard. On opening, the tile hands over its place on the screen so the card can grow from it (Card.tsx).
import { QuizScene } from "@/pages/QuizScenes";
import { QUESTIONS } from "@/pages/quiz-data";
import { plural } from "@/lib/site-format";
import type { CSSProperties } from "react";
import { Check, Play } from "lucide-react";
import { pad } from "@/pages/home/quiz-state";
import type { QuizRound } from "./state";

export interface Origin { x: number; y: number; width: number; height: number }

export interface BoardProps {
  quiz: QuizRound;
  onOpen: (i: number, origin: Origin | null) => void;
  onPlayAll: () => void;
}

function originOf(element: HTMLElement | null): Origin | null {
  if (!element || typeof element.getBoundingClientRect !== "function") return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null;
}

function Start({ quiz, onPlayAll }: Pick<BoardProps, "quiz" | "onPlayAll">) {
  const label = quiz.finished ? "See how you did" : quiz.answered > 0 ? "Carry on" : "Play all twelve";
  return <div className="qz-start">
    <button type="button" className="qz-play" onClick={onPlayAll}><Play size={18} strokeWidth={2} aria-hidden="true" />{label}</button>
    <span className="qz-start-or">{quiz.answered > 0 ? plural(quiz.answered, "{n} of 12 answered", "{n} of 12 answered") : "or pick any tile"}</span>
  </div>;
}

export function Board({ quiz, onOpen, onPlayAll }: BoardProps) {
  return <div className="qz-board">
    <Start quiz={quiz} onPlayAll={onPlayAll} />
    <ol className="qz-tiles" aria-label="The twelve questions">{QUESTIONS.map((item, i) => {
      const outcome = quiz.outcomeOf(i);
      return <li key={item.ask} style={{ "--qz-i": i } as CSSProperties}>
        <button type="button" className="qz-tile" data-state={outcome} onClick={(event) => onOpen(i, originOf(event.currentTarget))}>
          <span className="qz-tile-top"><span>{pad(i + 1)}</span><span>{outcome ? (outcome === "right" ? "Right" : "Missed") : item.part}</span></span>
          <span className="qz-tile-art"><QuizScene scene={item.scene} /></span>
          <span className="qz-tile-ask">{item.ask}</span>
          {outcome === "right" && <span className="qz-seal" aria-hidden="true"><Check size={13} strokeWidth={2.4} /></span>}
          {outcome === "wrong" && <span className="qz-ribbon" aria-hidden="true">Missed</span>}
        </button>
      </li>;
    })}</ol>
  </div>;
}
