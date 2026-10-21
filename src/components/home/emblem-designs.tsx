// The twelve emblem designs for the homepage banners, three per part, and the small drawn pieces they are made of
// (HomeEmblems.tsx draws the frame, the Hebrew band and the turning). Each piece is drawn only within the radii it is
// given, so every ring keeps to its own band: marks r 50-58, Hebrew r 40-50, figure r 22-40, inner r 16-22, and a
// centre mark within r 11 on the disc of r 16. The first design of each part is the one the homepage uses.
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

/* ---------- Centre marks, all within r 11 ---------- */

const MARKS = {
  star: <text className="he-star" y="6" textAnchor="middle">✦</text>,
  beth: <text className="he-letter" lang="he" y="6" textAnchor="middle">ב</text>,
  book: <path className="he-mark" d="M-10 -5Q-5 -8 0 -5Q5 -8 10 -5V6Q5 3 0 6Q-5 3 -10 6ZM0 -5V6" />,
  scroll: <path className="he-mark" d="M-6 -6.5h12M-6 6.5h12M-7.5 -8v16M7.5 -8v16M-3.5 -2.5h7M-3.5 0h5.5M-3.5 2.5h4.5" />,
  eye: <><path className="he-mark" d="M-10.5 0Q0 -9 10.5 0Q0 9 -10.5 0Z" /><circle className="he-mark" r="3.6" /><circle className="he-dot" r="1.3" /></>,
  lens: <path className="he-mark" d="M-2 -8.5a6.5 6.5 0 1 0 0.01 0M2.6 2.6L8 8" />,
  anchor: <path className="he-mark" d="M0 -9a2.4 2.4 0 1 0 0.01 0M0 -4.2V9M-5 -1.5H5M-8.5 3.5q1.5 5.5 8.5 5.5q7 0 8.5-5.5M-8.5 3.5l-1.6 2M8.5 3.5l1.6 2" />,
  scales: <path className="he-mark" d="M0 -8V7M-5 7H5M-8 -5H8M-8 -5L-10.5 1H-5.5ZM8 -5L5.5 1H10.5ZM-10.5 1Q-8 3 -5.5 1M5.5 1Q8 3 10.5 1" />,
  shield: <path className="he-mark" d="M0 -10L8.5 -6.5V-0.5Q8.5 6.5 0 10.5Q-8.5 6.5 -8.5 -0.5V-6.5ZM0 -5.5V5M-4 -1.5H4" />,
  heart: <path className="he-mark" d="M0 2C-2.6 -0.6 -6 -2 -6 -5a3 3 0 0 1 6 -0.7a3 3 0 0 1 6 0.7C6 -2 2.6 -0.6 0 2ZM-10 1q2.6 6.6 10 7.3q7.4-0.7 10-7.3" />,
  lamp: <path className="he-mark" d="M-8 1Q-7 6 0 6Q6 6 9 0.5H-8ZM-8 2Q-11 2 -10.5 -1M-1.5 6V7.5H2.5V6M8 -0.5Q6 -4 8 -8Q10 -4 8 -0.5Z" />,
  house: <path className="he-mark" d="M-8.5 8.5V-1.5L0 -9.5L8.5 -1.5V8.5ZM-2.6 8.5V2.5H2.6V8.5" />,
};

/* ---------- The twelve designs ---------- */

export type Design = { name: string; hebrew: string; source: string; outer: ReactElement; figure: ReactElement; inner: ReactElement; centre: ReactElement };

const ISAIAH_40_8 = "דבר אלהינו יקום לעולם";
const GENESIS_1_1 = "בראשית ברא אלהים את השמים ואת הארץ";
const PSALM_119_18 = "גל עיני ואביטה נפלאות מתורתך";
const PSALM_119_105 = "נר לרגלי דברך ואור לנתיבתי";
const ISAIAH_1_18 = "לכו נא ונוכחה";
const PSALM_18_3 = "סלעי ומצודתי ומפלטי";
const LEVITICUS_19_18 = "ואהבת לרעך כמוך";
const ISAIAH_58_7 = "הלוא פרס לרעב לחמך";
const PSALM_46_2 = "אלהים לנו מחסה ועז";
const WORD_SOURCE = "Isaiah 40:8, “the word of our God shall stand for ever”";
const EYES_SOURCE = "Psalm 119:18, “Open thou mine eyes, that I may behold wondrous things out of thy law”";
const REASON_SOURCE = "Isaiah 1:18, “Come now, and let us reason together”";
const FINE_TICKS = ticks({ inner: 52, outer: 56.5, count: 120, major: 10 });

export const DESIGNS: Record<EmblemKind, Design[]> = {
  word: [
    { name: "Star and seal", hebrew: ISAIAH_40_8, source: WORD_SOURCE,
      outer: ticks({ inner: 52, outer: 56.5, count: 72, major: 6 }), figure: <>{figure({ r: 38.5, points: 8, step: 2 })}{ring({ r: 27, look: "faint" })}</>,
      inner: ticks({ inner: 17.5, outer: 20.5, count: 16, major: 2 }), centre: MARKS.star },
    { name: "Open book", hebrew: ISAIAH_40_8, source: WORD_SOURCE,
      outer: dots({ r: 54, count: 48, size: 0.8 }), figure: <>{ring({ r: 36 })}{beads({ r: 31, count: 12, size: 4.2 })}{ring({ r: 26 })}</>,
      inner: ring({ r: 19, look: "dot" }), centre: MARKS.book },
    { name: "Beth, the first letter", hebrew: GENESIS_1_1, source: "Genesis 1:1, “In the beginning God created the heaven and the earth”",
      outer: FINE_TICKS, figure: <>{figure({ r: 38.5, points: 6 })}{ring({ r: 33.3, look: "faint" })}{dots({ r: 38.5, count: 6, size: 1.6 })}{ring({ r: 28, look: "dash" })}</>,
      inner: ticks({ inner: 17.5, outer: 20.5, count: 24 }), centre: MARKS.beth },
  ],
  lens: [
    { name: "Open scroll", hebrew: PSALM_119_18, source: EYES_SOURCE,
      outer: FINE_TICKS, figure: <>{figure({ r: 38.5, points: 6 })}{ring({ r: 33.3 })}{ring({ r: 28, look: "dash" })}</>,
      inner: dots({ r: 19, count: 24, size: 0.7 }), centre: MARKS.scroll },
    { name: "Opened eyes", hebrew: PSALM_119_18, source: EYES_SOURCE,
      outer: ticks({ inner: 52, outer: 56.5, count: 48, major: 2 }), figure: <>{ring({ r: 37 })}{ticks({ inner: 32.5, outer: 36, count: 36 })}{ring({ r: 31.5, look: "dash" })}{ring({ r: 27 })}</>,
      inner: ticks({ inner: 17.5, outer: 20.5, count: 12 }), centre: MARKS.eye },
    { name: "Lamp and lens", hebrew: PSALM_119_105, source: "Psalm 119:105, “Thy word is a lamp unto my feet, and a light unto my path”",
      outer: dots({ r: 54, count: 60, size: 0.75 }), figure: <>{figure({ r: 38.5, points: 8 })}{ring({ r: 35.5, look: "faint" })}{beads({ r: 30.5, count: 16, size: 2.2 })}{ring({ r: 26 })}</>,
      inner: ring({ r: 19, look: "dash" }), centre: MARKS.lens },
  ],
  scales: [
    { name: "Anchor", hebrew: ISAIAH_1_18, source: REASON_SOURCE,
      outer: <>{ring({ r: 55.5, look: "faint" })}{ring({ r: 53, look: "dash" })}</>, figure: <>{ring({ r: 37.5 })}{beads({ r: 33.5, count: 8, size: 3 })}{ring({ r: 29.5 })}{ring({ r: 25.5, look: "faint" })}</>,
      inner: ring({ r: 19, look: "dash" }), centre: MARKS.anchor },
    { name: "Scales", hebrew: ISAIAH_1_18, source: REASON_SOURCE,
      outer: ticks({ inner: 52, outer: 56.5, count: 36 }), figure: <>{ring({ r: 38 })}{beads({ r: 32, count: 16, size: 2.4 })}{ring({ r: 26 })}</>,
      inner: ticks({ inner: 17.5, outer: 20.5, count: 12 }), centre: MARKS.scales },
    { name: "Shield", hebrew: PSALM_18_3, source: "Psalm 18:2, “my rock, and my fortress, and my deliverer”",
      outer: <>{dots({ r: 54.5, count: 36, size: 0.9 })}{ring({ r: 52, look: "faint" })}</>, figure: <>{ring({ r: 37.5 })}{ring({ r: 33.5, look: "dash" })}{ring({ r: 29.5 })}{ticks({ inner: 25, outer: 28.5, count: 24 })}</>,
      inner: dots({ r: 19, count: 12, size: 0.8 }), centre: MARKS.shield },
  ],
  lamp: [
    { name: "Heart in hand", hebrew: LEVITICUS_19_18, source: "Leviticus 19:18, “thou shalt love thy neighbour as thyself”",
      outer: <>{dots({ r: 54, count: 48, size: 0.75 })}{ticks({ inner: 52, outer: 56.5, count: 24 })}</>, figure: <>{ring({ r: 37 })}{beads({ r: 31.5, count: 12, size: 4 })}{ring({ r: 26 })}</>,
      inner: ring({ r: 19, look: "dot" }), centre: MARKS.heart },
    { name: "Lamp", hebrew: ISAIAH_58_7, source: "Isaiah 58:7, “deal thy bread to the hungry”",
      outer: ticks({ inner: 52, outer: 56.5, count: 60, major: 5 }), figure: <>{ring({ r: 38 })}{ticks({ inner: 27, outer: 35, count: 32, major: 2 })}{ring({ r: 25.5 })}</>,
      inner: dots({ r: 19, count: 16, size: 0.7 }), centre: MARKS.lamp },
    { name: "Shelter", hebrew: PSALM_46_2, source: "Psalm 46:1, “God is our refuge and strength”",
      outer: <>{ring({ r: 55, look: "dash" })}{dots({ r: 52.5, count: 24, size: 0.7 })}</>, figure: <>{figure({ r: 38.5, points: 8, turn: 1 / 16 })}{ring({ r: 35.5 })}{ring({ r: 30, look: "faint" })}{ring({ r: 26, look: "dash" })}</>,
      inner: ticks({ inner: 17.5, outer: 20.5, count: 16 }), centre: MARKS.house },
  ],
};
