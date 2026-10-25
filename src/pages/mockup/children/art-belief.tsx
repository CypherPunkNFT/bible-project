// The drawings for the twelve "What we believe" sets from A Catechism for Young Children, by their first question
// (owner, 2026-10-25: "real line drawings, not icons"). Pieces and classes: art-kit.tsx.
import type { ReactNode } from "react";
import { Crown, Ground, P, Rays, Sheep, Star, Waves } from "./art-kit";

export const BELIEF: Record<number, ReactNode> = {
  // Who made you? A child held in two hands
  1: <>
    {Star(64, 60, 9)}{Star(138, 52, 7)}{Star(100, 40, 5)}
    {P(100, 134, 0.62)}
    <path className="p" d="M44 118Q48 150 100 152Q152 150 156 118Q140 126 128 124Q100 138 72 124Q60 126 44 118Z" />
    <path className="p" d="M46 122Q36 104 44 96Q52 96 56 112ZM154 122Q164 104 156 96Q148 96 144 112Z" />
    <path className="f" d="M60 132Q72 138 84 136M116 136Q128 138 140 132" />
  </>,
  // Where is God? In the sky, on the hills and in the sea
  2: <>
    <path className="ao" d="M62 50a10 10 0 1 0 0.1 0" />{Rays(62, 60, 15, 21)}
    <path className="f" d="M112 64Q112 52 124 54Q130 44 142 50Q154 48 154 60Q150 66 140 64Q128 70 112 64Z" />
    <path className="p" d="M32 132L72 90L94 112L114 96L150 132Z" />
    <Waves y={146} />
  </>,
  // A soul as well as a body: the light inside
  3: <>
    <path className="f" d="M100 62V54M76 72L70 66M124 72L130 66M64 100H56M136 100H144" />
    {P(100, 156, 1.6)}<path className="a" d="M100 112L103 121L112 124L103 127L100 136L97 127L88 124L97 121Z" />
    <Ground y={158} />
  </>,
  // Adam and the tree: the fruit, and the serpent
  4: <>
    <path d="M100 156V104M100 124L84 110M100 116L118 104" />
    <path className="p" d="M100 108C70 112 54 92 66 74C62 54 88 44 102 54C116 42 142 54 136 74C150 88 132 112 100 108Z" />
    <circle className="a" cx="120" cy="88" r="5" /><circle className="f" cx="82" cy="80" r="4" /><circle className="f" cx="104" cy="70" r="4" />
    <path className="a" d="M90 152Q112 144 96 136Q80 128 104 120Q118 114 108 106" /><circle cx="108" cy="104" r="2" />
    <Ground y={158} />
  </>,
  // Who can change a sinner's heart? A heart with new life growing
  5: <>
    <path d="M100 88Q98 66 104 48" />
    <path className="a" d="M102 64Q86 60 84 48Q98 50 102 64ZM104 54Q118 46 124 34Q108 36 104 54Z" />
    <path className="p" d="M100 150Q60 124 56 96Q54 74 76 72Q92 72 100 88Q108 72 124 72Q146 74 144 96Q140 124 100 150Z" />
    <path className="f" d="M72 92Q74 84 82 82" />
  </>,
  // Atonement: the lamb, and the cross
  6: <>
    <path className="f" d="M100 92V40M84 56H116" />{Sheep(96, 124, 0.9)}<Ground y={156} />
  </>,
  // To believe in Jesus: hands folded to pray
  7: <>
    <path className="a" d="M100 46V36M80 54L74 46M120 54L126 46" />
    <path className="p" d="M86 146Q82 116 88 84Q92 62 100 56Q108 62 112 84Q118 116 114 146Z" /><path d="M100 60V146" />
    <path className="f" d="M88 96H96M88 108H96M104 96H112M104 108H112" />
    <path className="p" d="M78 158L84 142H116L122 158Z" />
  </>,
  // Jesus as king: the crown with the cross
  8: <>
    <path className="a" d="M100 62V38M90 48H110" />
    {Crown(56, 144, 140, 40)}<path className="f" d="M56 130H144" /><circle className="a" cx="100" cy="118" r="4" />
  </>,
  // Trusting his love: the sheep resting by still water
  9: <>
    <path className="ao" d="M140 52a9 9 0 1 0 0.1 0" />
    <path className="f" d="M34 90Q70 80 100 88T166 84" />
    {Sheep(92, 124, 0.85)}
    <path className="f" d="M50 154Q100 146 150 154Q100 162 50 154Z" />
  </>,
  // The ninth commandment: the two tablets of the law
  10: <>
    <path className="p" d="M50 152V70Q50 52 72 52Q96 52 96 70V152Z" /><path className="p" d="M104 152V70Q104 52 128 52Q150 52 150 70V152Z" />
    <path className="f" d="M60 76H86M60 92H86M60 108H86M60 124H86M60 140H86M114 76H140M114 92H140M114 108H140M114 140H140" />
    <path className="a" d="M114 124H140" />
  </>,
  // The Lord's Supper: the wheat and the grapes
  11: <>
    <path d="M70 156V80M70 110L58 90M70 110L82 90M70 124L56 108M70 124L84 108" />
    <path className="a" d="M70 80Q66 70 70 62Q74 70 70 80ZM58 90Q52 82 54 74Q60 80 58 90ZM82 90Q88 82 86 74Q80 80 82 90Z" />
    <path d="M130 70Q132 80 128 86M134 76Q144 70 152 74" />
    <circle className="p" cx="120" cy="96" r="8" /><circle className="p" cx="136" cy="96" r="8" /><circle className="p" cx="128" cy="110" r="8" />
    <circle className="p" cx="144" cy="110" r="8" /><circle className="p" cx="112" cy="110" r="8" /><circle className="p" cx="120" cy="124" r="8" />
    <circle className="p" cx="136" cy="124" r="8" /><circle className="p" cx="128" cy="138" r="8" />
    <Ground y={158} />
  </>,
  // Did he stay in the tomb? The grave clothes left behind
  12: <>
    <path className="a" d="M100 92V70M78 98L64 84M122 98L136 84M66 112H52M134 112H148" />
    <path className="p" d="M58 140Q62 122 84 122H116Q132 122 136 140Z" /><path className="f" d="M74 130H124M80 136H120" />
    <path className="p" d="M140 126L156 120L160 134L144 138Z" />
    <path className="p" d="M44 140H156V156H44Z" />
  </>,
};
