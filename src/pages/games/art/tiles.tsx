// The pieces the start-page cards share (What came first?, the crossword, Bible Wordle, Odd one out; owner,
// 2026-11-12 and 13: every game's choices as cards like these): the faint arched window on its ground line, drawn on a
// 120×80 card, and the drawings more than one game uses. Same hand as the hub (game-art.css).
import { P } from "./parts";

/** The arched window and ground line every card's drawing stands in. */
export const TileArch = () => <g>
  <path className="ga-arch" d="M30 74V40A30 30 0 0 1 90 40V74Z" />
  <path className="ga-arch-line" d="M34 74V41A26 26 0 0 1 86 41V74" />
  <P d="M12 74H108" c="ga-f" />
</g>;

/** People: a staff and two figures. */
export const PeopleScene = () => <>
  <P d="M37 72V30Q37 24 42 25" />
  <circle className="ga-p ga-l" cx={49} cy={36} r={6} />
  <P d="M39 64Q39 47 49 47Q59 47 59 64" c="ga-t ga-l" />
  <circle className="ga-p ga-l" cx={72} cy={43} r={5} />
  <P d="M64 66Q64 52 72 52Q80 52 80 66" c="ga-t ga-l" />
</>;

/** Places: a walled town with its gate and flag on a hill. */
export const PlacesScene = () => <>
  <P d="M18 74Q40 56 60 56T102 74" c="ga-t2 ga-l" />
  <P d="M42 59V43H48V47H55V38H65V47H72V43H78V59" c="ga-p ga-l" />
  <P d="M57 59V53A3 3 0 0 1 63 53V59" c="ga-i" />
  <P d="M45 43V40M75 43V40M60 38V32" c="ga-f" />
  <P d="M60 32L67 34.5L60 37" c="ga-t ga-l" />
</>;
