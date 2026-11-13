// Bible Wordle: one small line drawing per kind of word for the start page's cards, in the hand of the games hub and of
// What came first?'s tiles (../art/game-art.css): strokes in the card's book colour, ink for details, the faint arched
// window behind. Decorative: the card's label names it.
import type { ReactNode } from "react";
import { P, T } from "../art/parts";
import { PeopleScene, PlacesScene, TileArch } from "../art/tiles";
import "../art/game-art.css";
import type { Kind } from "./kinds";

const Creatures = () => <>
  <ellipse className="ga-p ga-l" cx={56} cy={52} rx={16} ry={10} />
  <P d="M44 47Q47 43 51 45Q54 41 58 44Q62 41 65 45Q69 43 71 47" c="ga-f" />
  <ellipse className="ga-t ga-l" cx={76} cy={45} rx={7} ry={5.5} />
  <P d="M73 41L70 37" c="ga-l" />
  <circle className="ga-s" cx={78} cy={44} r={1} />
  <P d="M46 61V70M52 62V71M61 62V71M67 61V70" c="ga-i" />
</>;

const Things = () => <>
  <P d="M34 58Q38 67 57 67Q74 67 84 57L95 52Q87 49 80 52Q73 50 59 50Q40 50 34 58Z" c="ga-p ga-l" />
  <P d="M34 58Q26 56 28 50Q31 46 37 50" />
  <P d="M50 50Q60 46 70 50" c="ga-f" />
  <P d="M94 49Q89 41 93 33Q99 41 94 49Z" c="ga-t ga-l ga-pulse" />
</>;

const Ideas = () => <>
  <P d="M60 68C41 55 38 41 47 37C53 34 58 38 60 43C62 38 67 34 73 37C82 41 79 55 60 68Z" c="ga-t ga-l" />
  <P d="M60 30V23M46 33L42 28M74 33L78 28" c="ga-f ga-twinkle" />
</>;

const STEPS = [[42, 68, -30], [54, 62, -30], [56, 51, -30], [68, 45, -30], [70, 34, -30]];

const Actions = () => <>
  <P d="M30 72Q50 60 58 50T88 26" c="ga-h ga-dash" />
  {STEPS.map(([x, y, turn], i) => <ellipse key={i} className={i % 2 ? "ga-p ga-l" : "ga-t ga-l"} cx={x} cy={y} rx={3.4} ry={5.4}
    transform={`rotate(${turn} ${x} ${y})`} />)}
</>;

const LETTERS = ["B", "R", "E"];

const Mixed = () => <>
  {LETTERS.map((letter, i) => <g key={letter}>
    <rect className={i === 1 ? "ga-t ga-l" : "ga-p ga-l"} x={36 + i * 17} y={40} width={14} height={14} rx={2} />
    <T x={43 + i * 17} y={47.5} size={9}>{letter}</T>
  </g>)}
  <P d="M38 62H82" c="ga-f" />
  <P d="M94 22V30M90 26H98" c="ga-f ga-twinkle" />
</>;

const SCENES: Record<Kind, () => ReactNode> = {
  person: PeopleScene, place: PlacesScene, creature: Creatures, object: Things, idea: Ideas, action: Actions, mixed: Mixed,
};

export function KindArt({ kind }: { kind: Kind }) {
  const Scene = SCENES[kind];
  return <svg className="ga-art bw-kind-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <TileArch /><Scene />
  </svg>;
}
