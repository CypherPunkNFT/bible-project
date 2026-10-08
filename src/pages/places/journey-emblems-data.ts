// The six people of Atlas → Journeys, each drawn by hand in one line style (48-unit grid). Every stroke gets
// pathLength 1 in journey-emblems.tsx, so CSS can draw it in. Chosen by the owner from the Pilgrim direction (2026-10-07).

export const STROKES: Record<string, string[]> = {
  // Paul: a sailing ship on the waves, the way he went to Cyprus, to Asia Minor and at last to Rome.
  paul: ["M7 31h34l-4.5 7.5h-25z", "M24 6v25", "M24 9c7 3 10 8.5 10 18H24", "M24 12c-5 2.5-8 7-8.5 15H24", "M24 6l5 1.8L24 9.6",
    "M5 43c2.5 0 2.5-1.6 5-1.6s2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6 2.5-1.6 5-1.6"],
  // Abraham: a tent under the stars ("look now toward heaven, and tell the stars").
  abraham: ["M7 39 24 15l17 24", "M24 15v24", "M24 39l-6-10", "M4 39h40", "M21 15l3-4 3 4",
    "M10 6v5M7.5 8.5h5", "M38 9v4M36 11h4", "M31 3.5v3M29.5 5h3", "M42 20v2.5M40.75 21.25h2.5"],
  // Moses: the two tablets, with the staff behind them.
  moses: ["M37 4 30 44", "M9 41V17a6.5 6.5 0 0 1 13 0v24z", "M26 41V17a6.5 6.5 0 0 1 13 0v24z", "M13 21h5M13 26h5M13 31h5M30 21h5M30 26h5M30 31h5"],
  // Ruth: a sheaf of barley, bound in the middle.
  ruth: ["M24 44V13", "M24 44c-1-9-4-16-10-24", "M24 44c1-9 4-16 10-24", "M19 31h10",
    "M24 13c-2.6-1.8-2.6-6.2 0-8 2.6 1.8 2.6 6.2 0 8z", "M24 22c-3.6.2-6-2-6.2-5.4 3.6-.2 6 2 6.2 5.4z", "M24 22c3.6.2 6-2 6.2-5.4-3.6-.2-6 2-6.2 5.4z",
    "M15.5 15c-3.1-.8-4.4-3.8-3.4-6.8 3.1.8 4.4 3.8 3.4 6.8z", "M32.5 15c3.1-.8 4.4-3.8 3.4-6.8-3.1.8-4.4 3.8-3.4 6.8z"],
  // David: the lyre he played for Saul.
  david: ["M16 36c-5.5-6-7-15-3-24", "M32 36c5.5-6 7-15 3-24", "M13 12c-1-3 1-5.5 3.5-4.5", "M35 12c1-3-1-5.5-3.5-4.5", "M12 15h24", "M19 15v21M24 15v21M29 15v21", "M14 36h20l-2 6H16z"],
  // Peter: a fishing boat with its net let down over the side.
  peter: ["M5 27h30l-4 7.5H10z", "M17 8v19", "M17 9l13 9", "M30 18v10", "M30 28l6 12M30 28l-1 12M33 34h-4M34.5 37h-5.5",
    "M8 40c1.8-2 4.6-2 6.4 0-1.8 2-4.6 2-6.4 0zM14.4 40l2.3-1.6v3.2", "M3 31.5h2.5M37 31.5h8"],
};

/** Each person's colour: a site section colour token. */
export const PERSON_TONE: Record<string, string> = { paul: "epistles", abraham: "history", moses: "poetry", ruth: "gospels", david: "revelation", peter: "acts" };

export const hasEmblem = (id: string) => id in STROKES;
