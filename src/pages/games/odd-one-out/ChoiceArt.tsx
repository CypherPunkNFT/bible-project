// Odd one out: one line drawing per choice for the start page's cards, like Bible Wordle's and What came first?'s
// (owner, 2026-11-13: "bring some cards the way we have it here"), in the card's own book colour. Decorative: the
// card's label names it.
import type { ReactNode } from "react";
import { P } from "../art/parts";
import { PeopleScene, PlacesScene, TileArch } from "../art/tiles";
import "../art/game-art.css";
import type { Choice } from "./game";

const Books = () => <>
  <P d="M60 40Q46 33 31 37V66Q46 62 60 69Z" c="ga-p ga-l" />
  <P d="M60 40Q74 33 89 37V66Q74 62 60 69Z" c="ga-p ga-l" />
  <P d="M60 40V69" c="ga-i" />
  <P d="M37 45Q45 42 54 46M37 51Q45 48 54 52M37 57Q45 54 54 58M66 46Q75 42 83 45M66 52Q75 48 83 51M66 58Q75 54 83 57" c="ga-f" />
  <P d="M63 67V78L65.5 75.5L68 78V66" c="ga-t ga-l" />
</>;

/** Four cards in a row, the third turned and coloured: the odd one out. */
const Mixed = () => <>
  {[33, 47, 61, 75].map((x, i) => <rect key={x} className={i === 2 ? "ga-t ga-l" : "ga-p ga-l"} x={x} y={42} width={12} height={18} rx={2}
    transform={i === 2 ? `rotate(14 ${x + 6} 51)` : undefined} />)}
  <P d="M67 34V30M71 36L74 33M63 36L60 33" c="ga-f ga-twinkle" />
</>;

const SCENES: Record<Choice, () => ReactNode> = { person: PeopleScene, place: PlacesScene, book: Books, mixed: Mixed };

export function ChoiceArt({ choice }: { choice: Choice }) {
  const Scene = SCENES[choice];
  return <svg className="ga-art oo-card-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <TileArch /><Scene />
  </svg>;
}
