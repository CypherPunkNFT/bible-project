// Line-art borders for the colouring page (design 6.1): outline shapes only, large enough to colour, and never people,
// faces or pictures of God (design 7.2). Stars and moons for bedtime, wheat and loaves for graces, a house and a garden
// for the home.
import type { ReactNode } from "react";
import type { Theme } from "../print-job";

const MOTIFS: Record<string, ReactNode> = {
  star: <path d="M24 6l4 13h13l-10.5 8 4 13L24 32l-10.5 8 4-13L7 19h13z" />,
  moon: <path d="M30 7a17 17 0 1 0 11 30A14 14 0 0 1 30 7z" />,
  cloud: <path d="M12 34h24a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-5 16z" />,
  wheat: <><path d="M24 44V8" /><path d="M24 15c-4-2-6-6-5-9 4 2 6 6 5 9zM24 15c4-2 6-6 5-9-4 2-6 6-5 9zM24 24c-4-2-6-6-5-9 4 2 6 6 5 9zM24 24c4-2 6-6 5-9-4 2-6 6-5 9zM24 33c-4-2-6-6-5-9 4 2 6 6 5 9zM24 33c4-2 6-6 5-9-4 2-6 6-5 9z" /></>,
  loaf: <><path d="M7 34c0-11 8-18 17-18s17 7 17 18v4H7z" /><path d="M17 22l3 7M24 20l1 8M31 22l-1 7" /></>,
  apple: <><path d="M24 17c-6-4-16-2-16 10s8 18 16 14c8 4 16-2 16-14S30 13 24 17z" /><path d="M24 17c0-4 2-8 6-9" /></>,
  house: <><path d="M7 24L24 9l17 15" /><path d="M11 21v19h26V21" /><path d="M21 40v-9h6v9" /><path d="M14 26h5v5h-5z" /></>,
  tree: <><path d="M24 44V26" /><path d="M24 28c-10 0-15-6-15-12a10 10 0 0115-8 10 10 0 0115 8c0 6-5 12-15 12z" /></>,
  flower: <><path d="M24 44V26" /><circle cx="24" cy="11" r="5" /><circle cx="31" cy="18" r="5" /><circle cx="24" cy="25" r="5" /><circle cx="17" cy="18" r="5" /><circle cx="24" cy="18" r="3" /><path d="M24 38c-6 0-8-4-8-7 6 0 8 4 8 7z" /></>,
};

const SETS: Record<Theme, string[]> = {
  night: ["star", "moon", "cloud"],
  table: ["wheat", "loaf", "apple"],
  house: ["house", "tree", "flower"],
};

function Motif({ name }: { name: string }) {
  return (
    <svg className="hbs-motif" viewBox="0 0 48 48" fill="none" stroke="#1f1b16" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {MOTIFS[name]}
    </svg>
  );
}

const run = (theme: Theme, count: number, offset: number) => Array.from({ length: count }, (_, index) => SETS[theme][(index + offset) % 3]);

/** The border: a row of motifs top and bottom and a column down each side, clear of the words in the middle. */
export function ColouringBorder({ theme }: { theme: Theme }) {
  return (
    <div className="hbs-border" aria-hidden="true">
      <div className="hbs-border-row hbs-border-top">{run(theme, 6, 0).map((name, index) => <Motif key={index} name={name} />)}</div>
      <div className="hbs-border-column hbs-border-left">{run(theme, 6, 1).map((name, index) => <Motif key={index} name={name} />)}</div>
      <div className="hbs-border-column hbs-border-right">{run(theme, 6, 2).map((name, index) => <Motif key={index} name={name} />)}</div>
      <div className="hbs-border-row hbs-border-bottom">{run(theme, 6, 1).map((name, index) => <Motif key={index} name={name} />)}</div>
    </div>
  );
}

export const MOTIF_NAMES = Object.keys(MOTIFS);
