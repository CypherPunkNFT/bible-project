/**
 * One quiet line drawing per family of documents, in the house style: thin strokes in the family's own
 * tone, no fills and no glow, sized by the card around them. They are decoration beside a title that
 * already says what the family is, so each one is hidden from screen readers.
 */

const PATHS: Record<string, string> = {
  // A scroll, half unrolled: Scripture's own confessions.
  scroll:
    "M14 18h34a6 6 0 0 1 0 12H14a6 6 0 0 1 0-12Zm0 12v30a6 6 0 0 0 6 6h34a6 6 0 0 1-6-6V30M26 40h22M26 48h18M26 56h22",
  // A standing lamp: the rule of faith the early teachers handed on.
  lamp: "M32 14v8M24 30h16l4 10a12 12 0 0 1-24 0l4-10Zm8 22v14M22 66h20M28 24l-4-4M36 24l4-4",
  // Three arches: the creeds the councils settled.
  arches:
    "M10 62V40a8 8 0 0 1 16 0v22M26 62V34a10 10 0 0 1 20 0v28M46 62V40a8 8 0 0 1 16 0v22M6 62h60M18 48h0M36 44h0",
  // Cut stone: the medieval West.
  stone: "M12 26h40v12H12zM16 38h40v12H16zM12 50h40v12H12zM26 26v12M40 38v12M24 50v12",
  // A rose: the seal Luther used.
  rose: "M36 24a12 12 0 1 1-12 12 12 12 0 0 1 12-12Zm0 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM36 14v10M36 48v10M22 36h-8M58 36h-8M26 26l-6-6M46 46l6 6M46 26l6-6M26 46l-6 6",
  // Alpine peaks: Zurich, Basel, Berne.
  mountains: "M6 58 26 26l12 18 8-12 14 26H6ZM26 26l6 10M40 38l4-6",
  // A thistle: the Scots and Westminster standards.
  thistle: "M32 66V38M32 38a9 9 0 0 1 18 0 9 9 0 0 1-18 0Zm0 0a9 9 0 0 0-18 0 9 9 0 0 0 18 0ZM32 38V20M26 14l6 6 6-6M20 52c6 0 10 4 12 8M44 52c-6 0-10 4-12 8",
  // A plain crown: the Articles of the Church of England.
  crown: "M12 54h40M12 54 8 28l12 10L30 22l10 16 12-10-4 26M20 38h0M30 22h0M44 38h0",
  // Water: the Baptist confessions.
  water: "M6 34c8-6 16-6 24 0s16 6 24 0M6 46c8-6 16-6 24 0s16 6 24 0M6 58c8-6 16-6 24 0s16 6 24 0M30 14v14",
  // A flame: the Remonstrance and the Articles Wesley sent on.
  flame: "M32 68c-10 0-16-7-16-16 0-12 16-18 16-38 0 20 16 26 16 38 0 9-6 16-16 16Zm0-8c-4 0-6-3-6-7 0-5 6-8 6-16 0 8 6 11 6 16 0 4-2 7-6 7Z",
  // Two crossed keys: Rome.
  keys: "M22 22a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 23 23M44 52l5 5M50 46l5 5M46 22a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm-5 12L18 57M24 52l-5 5M18 46l-5 5",
  // A dome and cross: the Eastern churches.
  dome: "M34 10v8M30 14h8M34 18c-10 2-14 10-14 18h28c0-8-4-16-14-18ZM18 36h32v30H18zM26 48h6v18h-6M38 48h6v18h-6M14 66h40",
};

export function CreedFamilyArt({ kind, className = "" }: { kind: string; className?: string }) {
  const path = PATHS[kind] ?? PATHS.scroll;
  return (
    <svg className={`creed-art ${className}`} viewBox="0 0 68 76" fill="none" aria-hidden="true" focusable="false">
      <path d={path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
