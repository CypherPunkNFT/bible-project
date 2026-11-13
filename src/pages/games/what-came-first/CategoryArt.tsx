// What came first?: one small line drawing per category for the start screen's tiles (owner, 2026-11-12: "line art for
// each one"). Same hand as the games hub (../art/parts.tsx, game-art.css): main strokes in the tile's book colour
// (currentColor), ink for key details, a faint arched window behind, and one living detail that loops slowly. With
// reduced motion nothing moves and every drawing is complete. Paths with ga-draw / ga-write carry pathLength={1}.
import type { CSSProperties, ReactNode } from "react";
import { P, T } from "../art/parts";
import "../art/game-art.css";
import type { Choice } from "./categories";

const Arch = () => <g>
  <path className="ga-arch" d="M30 74V40A30 30 0 0 1 90 40V74Z" />
  <path className="ga-arch-line" d="M34 74V41A26 26 0 0 1 86 41V74" />
  <P d="M12 74H108" c="ga-f" />
</g>;

const Drawn = ({ d, c = "ga-l ga-draw", i = 0 }: { d: string; c?: string; i?: number }) =>
  <path className={c} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />;

const People = () => <>
  <P d="M37 72V30Q37 24 42 25" />
  <circle className="ga-p ga-l" cx={49} cy={36} r={6} />
  <P d="M39 64Q39 47 49 47Q59 47 59 64" c="ga-t ga-l" />
  <P d="M45 40Q49 47 53 40" c="ga-i" />
  <circle className="ga-p ga-l" cx={72} cy={43} r={5} />
  <P d="M64 66Q64 52 72 52Q80 52 80 66" c="ga-t ga-l" />
  <P d="M60 17V23M57 20H63" c="ga-f ga-twinkle" />
</>;

const Events = () => <>
  <P d="M31 34H89V60H31Z" c="ga-p ga-l" />
  <ellipse className="ga-t ga-l" cx={31} cy={47} rx={3.5} ry={14} />
  <ellipse className="ga-t ga-l" cx={89} cy={47} rx={3.5} ry={14} />
  <P d="M40 47H80" c="ga-f" />
  <circle className="ga-l ga-ring" cx={43} cy={47} r={4} />
  <circle className="ga-s" cx={43} cy={47} r={2.6} />
  <circle className="ga-p ga-l" cx={60} cy={47} r={2.2} />
  <circle className="ga-p ga-l" cx={77} cy={47} r={2.2} />
  <P d="M40 54H52M58 54H66M72 54H80" c="ga-h" />
</>;

const Rulers = () => <>
  <P d="M38 60L35 37L48 48L60 30L72 48L85 37L82 60Z" c="ga-t ga-l" />
  <P d="M38 60H82V67H38Z" c="ga-p ga-l" />
  <circle className="ga-s" cx={35} cy={37} r={2.2} />
  <circle className="ga-s" cx={60} cy={30} r={2.4} />
  <circle className="ga-s" cx={85} cy={37} r={2.2} />
  <circle className="ga-p ga-i" cx={60} cy={63.5} r={1.8} />
  <P d="M47 63.5H52M68 63.5H73" c="ga-f" />
  <P d="M93 20V28M89 24H97" c="ga-f ga-twinkle" />
</>;

const Buildings = () => <>
  <circle className="ga-t2 ga-pulse" cx={60} cy={25} r={15} />
  <P d="M34 35L60 21L86 35Z" c="ga-t ga-l" />
  <P d="M34 35H86V39H34Z" c="ga-p ga-l" />
  <P d="M40 39V63M50 39V63M60 39V63M70 39V63M80 39V63" />
  <P d="M45 41V61M55 41V61M65 41V61M75 41V61" c="ga-h" />
  <P d="M36 63H84M33 67H87M30 71H90" c="ga-i" />
</>;

const Journeys = () => {
  const route = "M27 70C40 66 33 54 47 52S64 46 62 38S77 27 90 23";
  return <>
    <P d={route} c="ga-f ga-dash" />
    <Drawn d={route} />
    <circle className="ga-s" cx={27} cy={70} r={2.6} />
    <circle className="ga-p ga-l" cx={47} cy={52} r={2.2} />
    <circle className="ga-p ga-l" cx={62} cy={38} r={2.2} />
    <P d="M90 23V10" c="ga-i" />
    <P d="M90 10L99 13.5L90 17Z" c="ga-t ga-l" />
  </>;
};

const Deaths = () => <>
  <P d="M22 74Q28 42 55 36Q84 31 98 74" c="ga-t2 ga-l" />
  <P d="M47 74V59A8 8 0 0 1 63 59V74" c="ga-p ga-i" />
  <circle className="ga-p ga-l" cx={74} cy={64} r={9.5} />
  <circle className="ga-f" cx={74} cy={64} r={5} />
  <P d="M30 62L36 56M33 66L40 59M84 50L90 56M86 45L91 50" c="ga-h" />
  <circle className="ga-t ga-pulse" cx={93} cy={20} r={5} />
</>;

const Books = () => <>
  <P d="M60 40Q46 33 31 37V66Q46 62 60 69Z" c="ga-p ga-l" />
  <P d="M60 40Q74 33 89 37V66Q74 62 60 69Z" c="ga-p ga-l" />
  <P d="M60 40V69" c="ga-i" />
  <P d="M37 45Q45 42 54 46M37 51Q45 48 54 52M37 57Q45 54 54 58" c="ga-f" />
  <Drawn d="M66 46Q75 42 83 45" c="ga-f ga-write" />
  <Drawn d="M66 52Q75 48 83 51" c="ga-f ga-write" />
  <Drawn d="M66 58Q75 54 83 57" c="ga-f ga-write" />
  <P d="M63 67V78L65.5 75.5L68 78V66" c="ga-t ga-l" />
</>;

const RAYS = [[41, 55, 34, 51], [49, 47, 45, 40], [60, 44, 60, 36], [71, 47, 75, 40], [79, 55, 86, 51]];

const Firsts = () => <>
  <P d="M42 70A18 18 0 0 1 78 70" c="ga-t ga-l" />
  {RAYS.map(([x1, y1, x2, y2], i) => <Drawn key={i} d={`M${x1} ${y1}L${x2} ${y2}`} i={i} />)}
  <T x={60} y={62} size={13}>1</T>
  <P d="M24 70H96" c="ga-l" />
</>;

const Mixed = () => <g className="ga-sway">
  <rect className="ga-p ga-l" x={47} y={33} width={26} height={36} rx={3} transform="rotate(-17 60 72)" />
  <rect className="ga-p ga-l" x={47} y={33} width={26} height={36} rx={3} transform="rotate(17 60 72)" />
  <rect className="ga-p ga-l" x={47} y={31} width={26} height={37} rx={3} />
  <P d="M54 39H66M54 61H66M55 39Q55 49 60 50Q65 49 65 39M55 61Q55 51 60 50Q65 51 65 61" c="ga-i" />
  <P d="M57 58Q60 55 63 58" c="ga-t" />
</g>;

const SCENES: Record<Choice, () => ReactNode> = {
  lived: People, happened: Events, ruled: Rulers, built: Buildings, went: Journeys, died: Deaths, books: Books,
  firsts: Firsts, mixed: Mixed,
};

/** The tile's drawing; decorative, since the tile's own label names it. */
export function CategoryArt({ choice }: { choice: Choice }) {
  const Scene = SCENES[choice];
  return <svg className="ga-art wcf-kind-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <Arch /><Scene />
  </svg>;
}
