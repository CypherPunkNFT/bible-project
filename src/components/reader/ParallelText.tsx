import { AlertTriangle } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import type { Chapter, Translation, Verse } from "@/lib/types";
import { NUMBERING_LABEL } from "@/lib/numbering";
import { inHighlight } from "@/lib/refs";
import { cn } from "@/lib/utils";
import { inlineRuns } from "./blocks";
import { Runs, type DisplayOptions } from "./RunView";

/** "29" -> [29, 29]; "29-30" -> [29, 30]; "12a" -> [12, 12]. */
function spanOf(label: string): [number, number] | null {
  const match = /^(\d+)[a-z]?(?:-(\d+))?/.exec(label);
  return match ? [Number(match[1]), Number(match[2] ?? match[1])] : null;
}

/** What one version shows on one row: its verse(s), a note that the verse was joined into an earlier row, or nothing. */
type Cell = { verses: Verse[] } | { joinedWith: string } | null;

export interface Column {
  translation: Translation;
  /** null = this version does not have the chapter */
  chapter: Chapter | null;
}

interface Props {
  columns: Column[];
  options: DisplayOptions;
  selected: string | null;
  highlight?: [number, number] | null;
  onSelect: (label: string) => void;
}

/**
 * Versions side by side, aligned by verse label. On phones the columns become an interleaved list:
 * each verse shows every version in turn.
 */
export function ParallelText({ columns, options, selected, highlight = null, onSelect }: Props) {
  const primary = columns[0];
  // Rows follow the first version's labels. A label from another version is added only if no row already covers
  // its verses, so a joined verse ("29-30", common in the Chinese Union Version) lines up with separate 29 and 30.
  const rows = useMemo(() => {
    const labels: string[] = [];
    const numbers = new Set<number>();
    const add = (label: string) => {
      labels.push(label);
      const span = spanOf(label);
      if (span) for (let n = span[0]; n <= span[1]; n++) numbers.add(n);
    };
    for (const [index, column] of columns.entries()) {
      for (const verse of column.chapter?.v ?? []) {
        if (index === 0) {
          add(verse.n);
          continue;
        }
        const span = spanOf(verse.n);
        const covered = span ? Array.from({ length: span[1] - span[0] + 1 }, (_, i) => span[0] + i).every((n) => numbers.has(n)) : labels.includes(verse.n);
        if (!covered) add(verse.n);
      }
    }
    const cellsFor = (column: Column, label: string): Cell => {
      const verses = column.chapter?.v ?? [];
      const exact = verses.find((v) => v.n === label);
      if (exact) return { verses: [exact] };
      const span = spanOf(label);
      if (!span) return null;
      const inside = verses.filter((v) => {
        const s = spanOf(v.n);
        return s && s[0] >= span[0] && s[1] <= span[1];
      });
      if (inside.length) return { verses: inside };
      const around = verses.find((v) => {
        const s = spanOf(v.n);
        return s && s[0] <= span[0] && s[1] >= span[0];
      });
      if (!around) return null;
      return spanOf(around.n)![0] === span[0] ? { verses: [around] } : { joinedWith: around.n };
    };
    return labels.map((label) => ({ label, cells: columns.map((column) => cellsFor(column, label)) }));
  }, [columns]);

  const gridColumns = { gridTemplateColumns: `2.5rem repeat(${columns.length}, minmax(0, 1fr))` };

  return (
    <div className="scripture text-[1.05rem]">
      <div className="sticky top-[7.25rem] z-10 hidden gap-4 border-b border-line bg-page/95 py-2 font-sans text-sm sm:grid" style={gridColumns}>
        <span />
        {columns.map((column) => (
          <div key={column.translation.slug} className="min-w-0">
            <span className="font-semibold">{column.translation.abbr}</span>{" "}
            <span className="text-muted">{column.translation.name}</span>
            {column.translation.numbering !== primary.translation.numbering && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-accent">
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden /> Numbers verses differently ({NUMBERING_LABEL[column.translation.numbering]}) — rows may not match.
              </p>
            )}
            {!column.chapter && <p className="text-xs text-muted">Not in this version.</p>}
          </div>
        ))}
      </div>
      {rows.map(({ label, cells }) => (
        <div
          key={label}
          onClick={() => onSelect(label)}
          className={cn(
            "grid cursor-pointer grid-cols-1 gap-x-4 gap-y-1 border-b border-line/60 py-3 transition-colors sm:[grid-template-columns:var(--cols)]",
            selected === label || inHighlight(label, highlight) ? "verse-highlight" : "hover:bg-accent/5",
          )}
          style={{ "--cols": gridColumns.gridTemplateColumns } as CSSProperties}
        >
          <button
            type="button"
            id={`v${label}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(label);
            }}
            aria-label={`Verse ${label}: show its cross-references`}
            aria-pressed={selected === label}
            className="scroll-mt-48 self-start text-left font-sans text-sm font-semibold text-muted hover:text-accent"
          >
            {label}
          </button>
          {cells.map((cell, index) => {
            const t = columns[index].translation;
            return (
              <div key={t.slug} lang={t.lang} dir={t.dir} className={cn("min-w-0", t.lang === "he" && "font-hebrew text-[1.3em]")}>
                <span className="me-2 font-sans text-[0.7rem] font-semibold uppercase tracking-wider text-muted sm:hidden">{t.abbr}</span>
                {cell && "verses" in cell ? (
                  cell.verses.map((verse) => (
                    <span key={verse.n}>
                      {(cell.verses.length > 1 || verse.n !== label) && (
                        <sup className="me-0.5 font-sans text-[0.65em] font-semibold text-muted">{verse.n}</sup>
                      )}
                      <Runs runs={inlineRuns(verse)} options={options} />{" "}
                    </span>
                  ))
                ) : cell ? (
                  <span className="font-sans text-xs text-muted">joined with verse {cell.joinedWith} above</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
