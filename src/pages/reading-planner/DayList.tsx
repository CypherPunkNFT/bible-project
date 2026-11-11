// Every reading day of the plan (design 1 and 7): its date, its chapters linking to the reader, its time and, once the
// visitor keeps progress, a tick box. Rows are windowed with the site's useRowWindow: about 50 rows drawn above and below
// the screen, more as the reader scrolls, with no "load more" button.
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRowWindow } from "@/lib/useRowWindow";

const ROW_ESTIMATE = 52;

export interface DayRow { n: number; date: string; label: string; time: string; href: string; isToday: boolean }

export interface DayListHandle { scrollToDay: (n: number) => void }

interface DayListProps {
  rows: readonly DayRow[];
  /** Days ticked as read (empty when no progress is kept for this plan). */
  read: ReadonlySet<number>;
  onToggle: (n: number) => void;
  version: string;
}

export const DayList = forwardRef<DayListHandle, DayListProps>(function DayList({ rows, read, onToggle, version }, ref) {
  const [container, setContainer] = useState<HTMLOListElement | null>(null);
  const rowOf = useMemo(() => new Map(rows.map((row, i) => [String(row.n), i])), [rows]);
  const rowKey = useCallback((i: number) => String(rows[i].n), [rows]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after, offsetOf } = useRowWindow({
    rowCount: rows.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: 0, scroller: "window", container, dataVersion: version,
  });

  useImperativeHandle(ref, () => ({
    scrollToDay: (n: number) => {
      if (!container) return;
      const row = rowOf.get(String(n));
      if (row === undefined) return;
      // The list's top on the page plus the row's place in the whole list (drawn or not).
      const top = container.getBoundingClientRect().top + window.scrollY + offsetOf(row);
      window.scrollTo({ top: Math.max(0, top - 96), behavior: "smooth" });
    },
  }), [container, rowOf, offsetOf]);

  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k);
  return (
    <ol ref={setContainer} className="rp-days" aria-label="Reading days" style={{ paddingTop: before, paddingBottom: after }}>
      {drawn.map((i) => {
        const row = rows[i];
        const done = read.has(row.n);
        return (
          <li key={row.n} data-row={i} className={`rp-day${done ? " is-read" : ""}${row.isToday ? " is-today" : ""}`} aria-posinset={i + 1} aria-setsize={rows.length}>
            <label className="rp-tick">
              <input type="checkbox" checked={done} onChange={() => onToggle(row.n)} />
              <span className="sr-only">Read</span>
            </label>
            <span className="rp-day-date">{row.date}{row.isToday && <span className="rp-today">Today</span>}</span>
            <Link to={row.href} className="rp-day-reading">{row.label}</Link>
            <span className="rp-day-time">{row.time}</span>
          </li>
        );
      })}
    </ol>
  );
});
