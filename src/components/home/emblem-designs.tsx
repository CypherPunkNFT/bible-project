// The emblem designs for the homepage banners, three per part (the owner's pick, then two with larger Hebrew), and the
// small drawn pieces they are made of (HomeEmblems.tsx draws the frame, the Hebrew band and the turning). Each piece is
// drawn only within the radii it is given, so every ring keeps to its own band: marks r 50-58 (52-60 in the larger
// frames), Hebrew r 40-50 (38-52, or 33-52 open), figure r 22-40 (22-38, or 22-33 open), inner r 16-22, and a centre mark within r 11 on the disc of r 16.
// The first design of each part is the one the homepage uses.
import type { ReactElement } from "react";

export type EmblemKind = "word" | "lens" | "scales" | "lamp";

const TAU = Math.PI * 2;
const polar = (r: number, turn: number) => [r * Math.sin(turn * TAU), -r * Math.cos(turn * TAU)] as const;
const fixed = (n: number) => Math.round(n * 100) / 100;
const around = (count: number) => Array.from({ length: count }, (_, i) => i / count);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/* ---------- Pieces, each drawn within the radii it is given ---------- */

function ring({ r, look = "solid" }: { r: number; look?: "solid" | "faint" | "dash" | "dot" }) {
  return <circle className={`he-ring he-${look}`} r={r} />;
}

/** Radial marks from `inner` to `outer`; with `major`, only every major-th one runs the full width. */
function ticks({ inner, outer, count, major = 0 }: { inner: number; outer: number; count: number; major?: number }) {
  return <path className="he-ticks" d={around(count).map((t, i) => {
    const start = major && i % major !== 0 ? inner + (outer - inner) * 0.45 : inner;
    const [x1, y1] = polar(start, t), [x2, y2] = polar(outer, t);
    return `M${fixed(x1)} ${fixed(y1)}L${fixed(x2)} ${fixed(y2)}`;
  }).join("")} />;
}

function dots({ r, count, size = 0.9 }: { r: number; count: number; size?: number }) {
  return <>{around(count).map((t) => { const [x, y] = polar(r, t); return <circle key={t} className="he-dot" cx={fixed(x)} cy={fixed(y)} r={size} />; })}</>;
}

/** Small open circles along a ring. */
function beads({ r, count, size }: { r: number; count: number; size: number }) {
  return <>{around(count).map((t) => { const [x, y] = polar(r, t); return <circle key={t} className="he-figure" cx={fixed(x)} cy={fixed(y)} r={size} />; })}</>;
}

/** A regular polygon (step 1) or star polygon on radius r; 8 points with step 2 is two squares. */
function figure({ r, points, step = 1, turn = 0 }: { r: number; points: number; step?: number; turn?: number }) {
  const loops = gcd(points, step);
  const chain = (offset: number) => Array.from({ length: points / loops + 1 }, (_, i) => {
    const [x, y] = polar(r, (offset + i * step) / points + turn); return `${i ? "L" : "M"}${fixed(x)} ${fixed(y)}`;
  }).join("") + "Z";
  return <path className="he-figure" d={Array.from({ length: loops }, (_, k) => chain(k)).join("")} />;
}

/** A star drawn as one outline, points on r and notches on `notch`, so none of its lines cross. */
function starOutline({ r, notch, points }: { r: number; notch: number; points: number }) {
  const d = Array.from({ length: points * 2 }, (_, i) => { const [x, y] = polar(i % 2 ? notch : r, i / (points * 2)); return `${i ? "L" : "M"}${fixed(x)} ${fixed(y)}`; }).join("");
  return <path className="he-figure" d={`${d}Z`} />;
}

/* ---------- Centre marks, all within r 11 ---------- */

const MARKS = {
  book: <path className="he-mark" d="M-10 -5Q-5 -8 0 -5Q5 -8 10 -5V6Q5 3 0 6Q-5 3 -10 6ZM0 -5V6" />,
  scroll: <path className="he-mark" d="M-6 -6.5h12M-6 6.5h12M-7.5 -8v16M7.5 -8v16M-3.5 -2.5h7M-3.5 0h5.5M-3.5 2.5h4.5" />,
  shield: <path className="he-mark" d="M0 -10L8.5 -6.5V-0.5Q8.5 6.5 0 10.5Q-8.5 6.5 -8.5 -0.5V-6.5ZM0 -5.5V5M-4 -1.5H4" />,
  heart: <path className="he-mark" d="M0 8.5C-4 5 -10 1 -10 -3.5a5 5 0 0 1 10 -1.5a5 5 0 0 1 10 1.5C10 1 4 5 0 8.5Z" />,
};

/* ---------- The designs: the owner's four picks, then the same four with larger Hebrew ---------- */

/** The frame each design sits in: where the rim and the Hebrew band's circles are, and how big the letters are. "large"
 *  grows the emblem a little and widens the Hebrew band inward; "open" also simplifies the figure so the Hebrew band can
 *  reach further in, with bigger letters still. The band of marks keeps its full width in every frame. */
export type FrameKind = "normal" | "large" | "open";
export const FRAMES: Record<FrameKind, { rim: number; hebrewOuter: number; hebrewInner: number; baseline: number; size: number }> = {
  normal: { rim: 58.5, hebrewOuter: 50, hebrewInner: 40, baseline: 42.4, size: 6.8 },
  large: { rim: 60.5, hebrewOuter: 52, hebrewInner: 38, baseline: 40.9, size: 9.4 },
  open: { rim: 60.5, hebrewOuter: 52, hebrewInner: 33, baseline: 37.8, size: 10.5 },
};

export type Design = { hebrew: string; english: string; source: string; to: string; frame: FrameKind; outer: ReactElement; figure: ReactElement; inner: ReactElement; centre: ReactElement };

const ISAIAH_40_8 = "דבר אלהינו יקום לעולם";
const ISAIAH_40_8_FULL = "יבש חציר נבל ציץ ודבר אלהינו יקום לעולם";
const PSALM_119_18 = "גל עיני ואביטה נפלאות";
const PSALM_119_18_FULL = "גל עיני ואביטה נפלאות מתורתך";
const PSALM_18_3 = "סלעי ומצודתי ומפלטי";
const PSALM_18_3_FULL = "סלעי ומצודתי ומפלטי אלי צורי אחסה בו";
const LEVITICUS_19_18 = "ואהבת לרעך כמוך";

/** The marks between the rim and the Hebrew band; `o` shifts them out by 2 for the larger frames. */
const outerTicks = (o: number, count: number, major = 0) => ticks({ inner: 52 + o, outer: 56.5 + o, count, major });

const BIBLE = { hebrew: ISAIAH_40_8, english: "the word of our God stands forever", source: "Isaiah 40:8, “the word of our God shall stand for ever”", to: "/read/kjv/ISA/40?hl=8&with=wlc", inner: ticks({ inner: 17.5, outer: 20.5, count: 16, major: 2 }), centre: MARKS.book };
const STUDY = { hebrew: PSALM_119_18, english: "Open my eyes that I may see wondrous things", source: "Psalm 119:18, “Open thou mine eyes, that I may behold wondrous things”", to: "/read/kjv/PSA/119?hl=18&with=wlc", inner: dots({ r: 19, count: 24, size: 0.7 }), centre: MARKS.scroll };
const APOLOGETICS = { hebrew: PSALM_18_3, english: "my rock, my fortress, and my deliverer", source: "Psalm 18:2, “my rock, and my fortress, and my deliverer”", to: "/read/kjv/PSA/18?hl=2&with=wlc", inner: dots({ r: 19, count: 12, size: 0.8 }), centre: MARKS.shield };
const RESOURCES = { hebrew: LEVITICUS_19_18, english: "love your neighbor as yourself", source: "Leviticus 19:18, “thou shalt love thy neighbour as thyself”", to: "/read/kjv/LEV/19?hl=18&with=wlc", inner: ring({ r: 19, look: "dot" }), centre: MARKS.heart };

/** Each part: 1, the owner's first pick; 2, the same in the large frame; 3, the large frame with a simpler figure ("open").
 *  The owner chose 2 for every part (2026-10-21); the homepage shows CHOSEN_DESIGN. */
export const CHOSEN_DESIGN = 1;

/** How long hovering the emblem takes to strengthen its ring's letters, first to last, as if reading it (HomeEmblems.tsx). */
export const READ_MS = 1400;
export const DESIGNS: Record<EmblemKind, Design[]> = {
  word: [
    { ...BIBLE, frame: "normal", outer: outerTicks(0, 72, 6), figure: starOutline({ r: 38.5, notch: 24, points: 8 }) },
    { ...BIBLE, frame: "large", outer: outerTicks(2, 72, 6), figure: starOutline({ r: 36, notch: 23.5, points: 8 }) },
    { ...BIBLE, frame: "open", hebrew: ISAIAH_40_8_FULL, english: "The grass withers and the flowers fall, but the word of our God stands forever", source: "Isaiah 40:8 in full, “The grass withereth, the flower fadeth: but the word of our God shall stand for ever”",
      outer: outerTicks(2, 72, 6), figure: starOutline({ r: 31.5, notch: 23.5, points: 8 }) },
  ],
  lens: [
    { ...STUDY, frame: "normal", outer: outerTicks(0, 120, 10), figure: <>{figure({ r: 38.5, points: 6 })}{ring({ r: 33.3 })}{ring({ r: 28, look: "dash" })}</> },
    { ...STUDY, frame: "large", outer: outerTicks(2, 120, 10), figure: <>{figure({ r: 36, points: 6 })}{ring({ r: 31.2 })}{ring({ r: 26.5, look: "dash" })}</> },
    { ...STUDY, frame: "open", hebrew: PSALM_119_18_FULL, english: "Open my eyes that I may see wondrous things from Your law", source: "Psalm 119:18 in full, “Open thou mine eyes, that I may behold wondrous things out of thy law”",
      outer: outerTicks(2, 120, 10), figure: figure({ r: 31.5, points: 6 }) },
  ],
  scales: [
    { ...APOLOGETICS, frame: "normal", outer: <>{dots({ r: 54.5, count: 36, size: 0.9 })}{ring({ r: 52, look: "faint" })}</>,
      figure: <>{ring({ r: 37.5 })}{ring({ r: 33.5, look: "dash" })}{ring({ r: 29.5 })}{ticks({ inner: 25, outer: 28.5, count: 24 })}</> },
    // The one with the most circles: the larger frames drop the faint circle outside the writing.
    { ...APOLOGETICS, frame: "large", outer: dots({ r: 56.3, count: 36, size: 0.9 }),
      figure: <>{ring({ r: 35.5 })}{ring({ r: 31.5, look: "dash" })}{ring({ r: 27.5 })}{ticks({ inner: 23.5, outer: 26.5, count: 24 })}</> },
    { ...APOLOGETICS, frame: "open", hebrew: PSALM_18_3_FULL, english: "my rock, my fortress, and my deliverer, my God, my rock, in whom I take refuge", source: "Psalm 18:2, “my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust”",
      outer: dots({ r: 56.3, count: 36, size: 0.9 }), figure: <>{ring({ r: 29.5 })}{ticks({ inner: 24, outer: 27.5, count: 24 })}</> },
  ],
  lamp: [
    { ...RESOURCES, frame: "normal", outer: <>{dots({ r: 54, count: 48, size: 0.75 })}{outerTicks(0, 24)}</>, figure: <>{ring({ r: 37 })}{beads({ r: 31.5, count: 12, size: 4 })}{ring({ r: 26 })}</> },
    { ...RESOURCES, frame: "large", outer: <>{dots({ r: 56, count: 48, size: 0.75 })}{outerTicks(2, 24)}</>, figure: <>{ring({ r: 35 })}{beads({ r: 30, count: 12, size: 3.6 })}{ring({ r: 25 })}</> },
    { ...RESOURCES, frame: "open", outer: <>{dots({ r: 56, count: 48, size: 0.75 })}{outerTicks(2, 24)}</>, figure: beads({ r: 27.5, count: 12, size: 3.2 }) },
  ],
};
