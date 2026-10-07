import { Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cameFrom } from "@/lib/came-from";
import { PEOPLE_PERIODS, periodLabel, periodOrder } from "@/lib/people-periods";
import type { PersonRow } from "@/lib/study";
import { formatNumber } from "@/lib/utils";
import "./people-table.css";

/** Everyone in the Bible as one scrollable table, in period order; a period button jumps to its first row.
 *  Each row opens that person's own page, which offers the way back here. */
export function PeopleTable({ people, backLabel }: { people: PersonRow[]; backLabel: string }) {
  const [query, setQuery] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => {
    const words = query.trim().toLowerCase();
    const list = words ? people.filter((p) => p.n.toLowerCase().includes(words) || p.o.some((o) => o.toLowerCase().includes(words)) || p.b.toLowerCase().includes(words)) : people;
    // Period order, then the most-named first within each period.
    return [...list].sort((a, b) => periodOrder(a.p) - periodOrder(b.p) || b.c - a.c || a.n.localeCompare(b.n));
  }, [people, query]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.p, (map.get(row.p) ?? 0) + 1);
    return map;
  }, [rows]);
  const jump = (id: string) => {
    const box = scroller.current, first = box?.querySelector<HTMLElement>(`[data-period="${id || "none"}"]`);
    if (!box || !first) return;
    // Measured on screen, so the period's first row lands just under the sticky column headings.
    const top = box.scrollTop + first.getBoundingClientRect().top - box.getBoundingClientRect().top - (box.querySelector("thead")?.offsetHeight ?? 0);
    box.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <section className="people-table" aria-labelledby="people-table-title">
    <header className="people-table-header">
      <div><h2 id="people-table-title">Everyone in the Bible</h2><p>{formatNumber(rows.length)} of {formatNumber(people.length)} people, in the order of biblical history</p></div>
      <label className="people-table-search"><Search size={16} aria-hidden /><span className="sr-only">Search people</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, another name, or what they did" /></label>
    </header>
    <nav className="people-table-periods" aria-label="Jump to a period">{PEOPLE_PERIODS.map((period) => {
      const count = counts.get(period.id) ?? 0;
      return <button key={period.id || "none"} type="button" disabled={!count} onClick={() => jump(period.id)}>{period.label}<span>{formatNumber(count)}</span></button>;
    })}</nav>
    <div ref={scroller} className="people-table-scroll" tabIndex={0} role="region" aria-label="People, scrollable">
      <table>
        <thead><tr><th scope="col">Name</th><th scope="col">Period</th><th scope="col">Who they were</th><th scope="col" className="people-table-number">Verses</th></tr></thead>
        <tbody>{rows.map((person, index) => {
          const first = index === 0 || rows[index - 1].p !== person.p;
          return <tr key={person.id} {...(first ? { "data-period": person.p || "none" } : {})}>
            <td><Link to={`/people/${person.id}`} state={cameFrom(backLabel)}>{person.n}</Link></td>
            <td>{periodLabel(person.p)}</td>
            <td className="people-table-brief">{person.b}</td>
            <td className="people-table-number">{formatNumber(person.c)}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="people-table-empty">No one matches.</p>}
    </div>
  </section>;
}
