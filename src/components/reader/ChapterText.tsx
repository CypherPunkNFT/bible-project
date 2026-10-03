import { useMemo } from "react";
import type { Chapter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toBlocks } from "./blocks";
import { Runs, type DisplayOptions } from "./RunView";

const BLOCK_STYLE: Record<string, string> = {
  p: "mb-4",
  line: "mb-1.5",
  q1: "ps-8 -indent-6 mb-0.5",
  q2: "ps-14 -indent-6 mb-0.5",
  q3: "ps-20 -indent-6 mb-0.5",
  l1: "ps-8 -indent-4 mb-1",
  l2: "ps-14 -indent-4 mb-1",
  b: "mt-4",
};

const HEADING_STYLE: Record<string, string> = {
  s: "mt-8 mb-3 font-sans text-base font-semibold tracking-tight",
  s2: "mt-6 mb-2 font-sans text-sm font-semibold text-muted",
  ms: "mt-10 mb-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-muted",
  r: "-mt-2 mb-3 font-sans text-xs text-muted",
  sp: "mt-6 mb-1 font-sans text-sm italic text-muted",
  qa: "mt-6 mb-1 font-sans text-sm font-semibold uppercase tracking-widest text-accent",
  d: "mt-2 mb-3 italic text-muted",
};

interface Props {
  chapter: Chapter;
  options: DisplayOptions & { versePerLine: boolean };
  selected: string | null;
  onSelect: (label: string) => void;
  lang: string;
  dir: "ltr" | "rtl";
}

/** One version's chapter, laid out as the source paragraphs and poetry lines. */
export function ChapterText({ chapter, options, selected, onSelect, lang, dir }: Props) {
  const blocks = useMemo(() => toBlocks(chapter, options.versePerLine), [chapter, options.versePerLine]);
  return (
    <div className="scripture" lang={lang} dir={dir}>
      {chapter.t && (
        <p className="mb-4 font-serif text-[0.92em] italic text-muted">
          <Runs runs={chapter.t} options={options} />
        </p>
      )}
      {blocks.map((block, index) =>
        block.type === "heading" ? (
          <p key={index} className={HEADING_STYLE[block.kind] ?? HEADING_STYLE.s}>
            {block.text}
          </p>
        ) : (
          <p key={index} className={BLOCK_STYLE[block.style] ?? BLOCK_STYLE.p}>
            {block.pieces.map((piece, pieceIndex) => (
              <span
                key={`${piece.verse.n}-${pieceIndex}`}
                data-verse={piece.verse.n}
                onClick={() => onSelect(piece.verse.n)}
                className={cn(
                  "cursor-pointer rounded-sm transition-colors hover:bg-accent/10",
                  selected === piece.verse.n && "bg-accent/20 hover:bg-accent/25",
                )}
              >
                {piece.first && (
                  <button
                    type="button"
                    id={`v${piece.verse.n}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(piece.verse.n);
                    }}
                    aria-label={`Verse ${piece.verse.n}: show its cross-references`}
                    aria-pressed={selected === piece.verse.n}
                    className="me-1 ms-0.5 scroll-mt-40 align-super font-sans text-[0.62em] font-semibold text-muted hover:text-accent"
                  >
                    {piece.verse.n}
                  </button>
                )}
                <Runs runs={piece.runs} options={options} />{" "}
              </span>
            ))}
          </p>
        ),
      )}
      {chapter.e?.map(([, text], index) => (
        <p key={`end-${index}`} className="mt-6 border-t border-line pt-3 text-center font-serif text-[0.85em] italic text-muted">
          {text}
        </p>
      ))}
    </div>
  );
}
