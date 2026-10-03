import type { Chapter, Run, Verse } from "@/lib/types";

export interface Piece {
  verse: Verse;
  runs: Run[];
  /** the first piece of its verse carries the verse number */
  first: boolean;
}

export type Block =
  | { type: "heading"; kind: string; text: string }
  | { type: "text"; style: string; pieces: Piece[] };

const isBreak = (run: Run): run is { b: string } => typeof run === "object" && !Array.isArray(run) && "b" in run;

/**
 * Lay a chapter out as headings, paragraphs and poetry lines. A verse may be split across several
 * blocks (a poetry line break mid-verse); each fragment stays tied to its verse for selection.
 */
export function toBlocks(chapter: Chapter, versePerLine: boolean): Block[] {
  const blocks: Block[] = [];
  let current: Extract<Block, { type: "text" }> = { type: "text", style: "p", pieces: [] };
  const close = (nextStyle: string) => {
    if (current.pieces.length) blocks.push(current);
    current = { type: "text", style: nextStyle, pieces: [] };
  };

  for (const verse of chapter.v) {
    for (const [kind, text] of verse.h ?? []) {
      close(current.style === "b" ? "p" : current.style);
      blocks.push({ type: "heading", kind, text });
    }
    if (versePerLine) {
      close("line");
      current.pieces.push({ verse, runs: verse.r.filter((r) => !isBreak(r)), first: true });
      continue;
    }
    let piece: Piece = { verse, runs: [], first: true };
    for (const run of verse.r) {
      if (isBreak(run)) {
        if (piece.runs.length) {
          current.pieces.push(piece);
          piece = { verse, runs: [], first: false };
        }
        close(run.b);
        continue;
      }
      piece.runs.push(run);
    }
    if (piece.runs.length || piece.first) current.pieces.push(piece);
  }
  close("p");
  return blocks;
}

/** Runs without layout breaks, for side-by-side cells. */
export const inlineRuns = (verse: Verse): Run[] => verse.r.filter((r) => !isBreak(r));

/** First integer in a verse label ("12a" -> 12, "15-16" -> 15); NaN when there is none. */
export const verseNumber = (label: string): number => Number(/^\d+/.exec(label)?.[0] ?? NaN);
