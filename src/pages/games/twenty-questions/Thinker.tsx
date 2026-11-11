// Bible twenty questions: the guesser's presence (the audit's item 1). A small version of the hub drawing's thinking
// head and question cloud, drawn in the same lamp-lit line style and the game's own colour, that reacts to every
// answer: a tick for Yes, a cross for No, a wobbling question mark for Don't know, pulsing dots while thinking hard, a
// gold flash when it is ready to guess, and a startled face when the player has won. The cloud bobs slowly on every
// screen, so the drawing is never still. Decorative only: hidden from readers, who hear the question itself.
import type { ReactNode } from "react";

export type Mood = "idle" | "yes" | "no" | "dunno" | "hard" | "guess" | "beaten";

/** What sits in the cloud for each mood; the cloud's motion is twenty-questions.css. */
const INSIDE: Record<Mood, ReactNode> = {
  idle: <>
    {[[154, 14], [171, 19], [188, 14]].map(([x, size], i) => <text key={x} className="tk-txt tk-pop" style={{ "--i": i } as never} x={x} y={48} fontSize={size} textAnchor="middle" dominantBaseline="central">?</text>)}
  </>,
  yes: <path className="tk-mark tk-draw" d="M158 47l9 9l17 -20" />,
  no: <path className="tk-mark tk-draw" d="M161 36l20 20M181 36l-20 20" />,
  dunno: <text className="tk-txt tk-wobble" x={171} y={47} fontSize={30} textAnchor="middle" dominantBaseline="central">?</text>,
  hard: <>
    {[160, 171, 182].map((x, i) => <circle key={x} className="tk-dot" style={{ "--i": i } as never} cx={x} cy={46} r={3} />)}
  </>,
  guess: <text className="tk-txt tk-gold tk-pop-once" x={171} y={47} fontSize={32} textAnchor="middle" dominantBaseline="central">!</text>,
  beaten: <text className="tk-txt tk-wobble" x={171} y={47} fontSize={24} textAnchor="middle" dominantBaseline="central">!?</text>,
};

interface Props {
  mood: Mood;
  /** Changes with every answer, so the cloud's reaction plays again even when the mood is the same. */
  beat: number;
  className?: string;
}

export function Thinker({ mood, beat, className = "" }: Props) {
  return <svg className={`tq-thinker ${className}`.trim()} viewBox="36 14 184 140" aria-hidden="true" focusable="false" data-mood={mood}>
    {/* the head, in profile, as the hub draws it */}
    <path className="tk-p tk-l" d="M58 148C60 132 56 124 50 116C40 102 42 76 60 64C78 52 104 60 108 80C109 86 115 92 112 96C110 98 107 98 108 102C110 106 105 108 106 112C107 116 101 118 96 118C92 118 90 126 92 148" />
    <path className="tk-i" d="M66 92c-4 -6 4 -12 7 -6c2 4 -2 8 -5 8M98 82q3 -1 5 1" />
    <path className="tk-h" d="M50 84l8 -8M49 92l12 -12M50 100l14 -14M53 106l13 -13M57 110l11 -11" />
    <g className={`tk-cloud is-${mood}`} key={`${mood}-${beat}`}>
      <circle className="tk-p tk-l" cx={118} cy={72} r={3} /><circle className="tk-p tk-l" cx={128} cy={60} r={5} />
      <path className="tk-p tk-l tk-cloud-shape" d="M138 50C132 38 144 26 156 30C160 18 182 18 186 30C198 26 210 38 202 50C208 60 196 70 186 64C180 74 160 74 156 66C144 72 132 62 138 50Z" />
      {INSIDE[mood]}
    </g>
  </svg>;
}
