// One holy day in the year's list (design, "What the visitor sees" 5, and "Review"): a heading whose button opens the
// day's explanation, how its date is worked out and its key passages. The passages' Berean words load only when the day
// is opened, keyed by the row and the attempt so a late answer never fills another row; a failure offers Retry.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { useAsync } from "@/lib/useAsync";
import { showPassage } from "@/pages/countdowns/usePassages";
import type { HolyDay } from "./dates";
import { HOLY_DAYS, TRADITION_LABELS } from "./days";
import { lastDay, spanLine, weekdayDate } from "./format";

function Passages({ day }: { day: HolyDay }) {
  const catalog = useCatalog();
  const [attempt, setAttempt] = useState(0);
  const { passages } = HOLY_DAYS[day.key];
  const state = useAsync(() => Promise.all(passages.map((passage, index) => showPassage(catalog, passage, `${day.key}:${index}`))), `holy-days:${day.id}:${attempt}`);
  if (state.status === "loading") return <p className="hd-quiet" role="status">Loading the passages…</p>;
  if (state.status === "error") {
    return <p className="hd-failed" role="alert">The passages could not be loaded. <button type="button" className="hd-link-button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></p>;
  }
  return (
    <ul className="hd-passages">
      {state.value.map((item) => (
        <li key={item.key}>
          <blockquote className="scripture" lang="en">{item.text}</blockquote>
          <div className="hd-reference"><Link to={item.readHref}>{item.reference}</Link> <span>{item.passage.note}</span></div>
        </li>
      ))}
    </ul>
  );
}

export function DayRow({ day, open, onToggle }: { day: HolyDay; open: boolean; onToggle: () => void }) {
  const text = HOLY_DAYS[day.key];
  const panelId = `hd-day-${day.id.replace(/[^a-z0-9-]/g, "-")}`;
  const days = day.end === undefined ? 1 : day.end - day.start + 1;
  const button = useRef<HTMLButtonElement>(null);
  // Opening a day closes one above it, which moves the page: keep the opened day's heading in view.
  useEffect(() => { if (open) button.current?.scrollIntoView?.({ block: "nearest" }); }, [open]);
  return (
    <li className={`hd-day hd-${day.tradition}`}>
      <h4>
        <button ref={button} type="button" className="hd-day-button" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span className="hd-date">{weekdayDate(day.start)}</span>
          <span className="hd-name">{text.name}</span>
          <span className="hd-tradition">{TRADITION_LABELS[day.tradition]}</span>
          {day.end !== undefined && <span className="hd-span">{spanLine(days, lastDay(day.start, day.end))}</span>}
        </button>
      </h4>
      <div id={panelId} className="hd-detail" hidden={!open}>
        {open && <>
          <p>{text.explanation}</p>
          <p className="hd-reckoning"><strong>How the date is set:</strong> {text.reckoning}</p>
          {day.tradition === "feast" && <p className="hd-quiet">Like every day on the Hebrew calendar, it begins at sunset the evening before.</p>}
          <p className="hd-label">Key passages</p>
          <Passages day={day} />
        </>}
      </div>
    </li>
  );
}
