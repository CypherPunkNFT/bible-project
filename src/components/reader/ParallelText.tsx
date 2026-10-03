import { AlertTriangle } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import type { Chapter, Translation, Verse } from "@/lib/types";
import { inHighlight } from "@/lib/refs";
import { cn } from "@/lib/utils";
import { inlineRuns } from "./blocks";
import { Runs, type DisplayOptions } from "./RunView";

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
  const rows = useMemo(() => {
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const column of columns) {
      for (const verse of column.chapter?.v ?? []) {
        if (!seen.has(verse.n)) {
          seen.add(verse.n);
          labels.push(verse.n);
        }
      }
    }
    const maps = columns.map((c) => new Map<string, Verse>((c.chapter?.v ?? []).map((v) => [v.n, v])));
    return labels.map((label) => ({ label, verses: maps.map((m) => m.get(label) ?? null) }));
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
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden /> Numbers verses the {column.translation.numbering} way — rows may not match.
              </p>
            )}
            {!column.chapter && <p className="text-xs text-muted">Not in this version.</p>}
          </div>
        ))}
      </div>
      {rows.map(({ label, verses }) => (
        <div
          key={label}
          onClick={() => onSelect(label)}
          className={cn(
            "grid cursor-pointer grid-cols-1 gap-x-4 gap-y-1 border-b border-line/60 py-3 transition-colors hover:bg-accent/5 sm:[grid-template-columns:var(--cols)]",
            selected === label && "bg-accent/15 hover:bg-accent/20",
            selected !== label && inHighlight(label, highlight) && "bg-accent/[0.07]",
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
          {verses.map((verse, index) => {
            const t = columns[index].translation;
            return (
              <div key={t.slug} lang={t.lang} dir={t.dir} className={cn("min-w-0", t.lang === "he" && "font-hebrew text-[1.3em]")}>
                <span className="me-2 font-sans text-[0.7rem] font-semibold uppercase tracking-wider text-muted sm:hidden">{t.abbr}</span>
                {verse ? <Runs runs={inlineRuns(verse)} options={options} /> : <span className="text-muted">—</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
