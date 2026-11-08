// One small line-art ornament per pack (design 6.6): strokes only, so it prints with ink and no background.
import type { ReactNode } from "react";

const SHAPES: Record<string, ReactNode> = {
  ring: <><circle cx="24" cy="29" r="11" /><path d="M19 14l5-6 5 6-5 4z" /></>,
  rings: <><circle cx="19" cy="26" r="10" /><circle cx="29" cy="26" r="10" /></>,
  vine: <><path d="M8 38c10-2 14-10 16-18s8-12 16-12" /><path d="M17 31c-4-1-6-4-6-8 4 0 7 3 6 8zM27 18c0-4 3-7 7-7 0 4-3 7-7 7zM24 26c4-2 8-1 10 2-4 2-8 1-10-2z" /></>,
  seed: <><ellipse cx="24" cy="32" rx="9" ry="6" /><path d="M24 26V12" /><path d="M24 18c-6 0-9-4-9-8 6 0 9 4 9 8zM24 15c5 0 8-3 8-7-5 0-8 3-8 7z" /></>,
  star: <path d="M24 6l4 13h13l-10.5 8 4 13L24 32l-10.5 8 4-13L7 19h13z" />,
  heart: <path d="M24 39S8 29 8 18a8 8 0 0116-2 8 8 0 0116 2c0 11-16 21-16 21z" />,
  sprig: <><path d="M24 42V8" /><path d="M24 34c-7 0-10-5-10-9 7 0 10 5 10 9zM24 26c7 0 10-5 10-9-7 0-10 5-10 9zM24 18c-5 0-7-4-7-7 5 0 7 4 7 7z" /></>,
  sunrise: <><path d="M6 34h36" /><path d="M14 34a10 10 0 0120 0" /><path d="M24 14v6M12 20l4 4M36 20l-4 4M6 28h4M38 28h4" /></>,
  water: <><path d="M6 20c4-4 8-4 12 0s8 4 12 0 8-4 12 0" /><path d="M6 28c4-4 8-4 12 0s8 4 12 0 8-4 12 0" /><path d="M6 36c4-4 8-4 12 0s8 4 12 0 8-4 12 0" /></>,
  lamp: <><path d="M8 30c4 6 24 6 30 0l4-6H30c-2 3-12 3-16 0z" /><path d="M38 24c2-4 2-8 0-10" /><path d="M14 22c0-4 2-8 2-12 2 3 4 6 2 10" /></>,
  path: <><path d="M18 42c0-10 12-12 12-20s-8-8-8-14" /><path d="M30 42c0-8 10-10 10-18" /><circle cx="22" cy="8" r="2" /></>,
  book: <><path d="M24 14c-6-4-12-4-17-2v24c5-2 11-2 17 2 6-4 12-4 17-2V12c-5-2-11-2-17 2z" /><path d="M24 14v24" /></>,
  mortarboard: <><path d="M4 18l20-8 20 8-20 8z" /><path d="M12 22v9c6 5 18 5 24 0v-9" /><path d="M40 20v12" /></>,
  key: <><circle cx="15" cy="24" r="8" /><path d="M23 24h19M36 24v6M41 24v5" /></>,
  tree: <><path d="M24 42V24" /><path d="M24 26c-10 0-15-6-15-12a10 10 0 0115-8 10 10 0 0115 8c0 6-5 12-15 12z" /><path d="M18 42h12" /></>,
};

export const ORNAMENT_NAMES = Object.keys(SHAPES);

export function Ornament({ name, colour, size = 40 }: { name: string; colour: string; size?: number | string }) {
  return (
    <svg className="le-ornament" viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={colour} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {SHAPES[name] ?? SHAPES.sprig}
    </svg>
  );
}
