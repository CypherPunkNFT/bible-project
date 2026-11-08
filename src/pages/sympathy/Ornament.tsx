// The four quiet card styles (design 6.6): line art only, strokes and no fill, so each prints with ink and no background.
// Left out on purpose: angels and wings, butterflies and balloons, and crosses as decoration.
import type { ReactNode } from "react";
import type { CardStyle } from "./message";

const SHAPES: Record<CardStyle, { viewBox: string; shape: ReactNode }> = {
  plain: { viewBox: "0 0 96 12", shape: <path d="M8 6h80" /> },
  olive: {
    viewBox: "0 0 96 32",
    shape: <>
      <path d="M14 22c18-2 40-6 68-14" />
      <path d="M30 19c-2-6 1-10 7-11 1 6-2 10-7 11zM46 16c0-6 4-9 10-9 0 6-4 9-10 9zM40 18c5 4 10 4 14 1-4-4-9-4-14-1zM58 13c5 3 10 3 13 0-4-3-9-3-13 0zM24 21c4 3 8 3 11 1-3-3-7-3-11-1z" />
      <circle cx="66" cy="18" r="2.2" />
    </>,
  },
  morning: {
    viewBox: "0 0 96 32",
    shape: <>
      <path d="M10 26h76" />
      <path d="M34 26a14 14 0 0128 0" />
      <path d="M48 4v5M30 11l3 4M66 11l-3 4M22 20h4M70 20h4" />
    </>,
  },
  lily: {
    viewBox: "0 0 96 40",
    shape: <>
      <path d="M48 38V18" />
      <path d="M48 18c-3-6-3-11 0-15 3 4 3 9 0 15z" />
      <path d="M48 18c-6-2-11-6-12-12 6 0 10 4 12 12zM48 18c6-2 11-6 12-12-6 0-10 4-12 12z" />
      <path d="M48 30c-5-1-9 0-12 3M48 27c5-2 10-1 13 2" />
    </>,
  },
};

export function Ornament({ style, colour, width }: { style: CardStyle; colour: string; width: string | number }) {
  const { viewBox, shape } = SHAPES[style] ?? SHAPES.plain;
  return (
    <svg className={`sy-ornament sy-ornament-${style}`} viewBox={viewBox} width={width} fill="none" stroke={colour} strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {shape}
    </svg>
  );
}
