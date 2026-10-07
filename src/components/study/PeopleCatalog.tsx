import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cameFrom } from "@/lib/came-from";
import { PEOPLE_PERIODS, periodLabel, periodOrder } from "@/lib/people-periods";
import type { PersonRow } from "@/lib/study";
import { formatNumber } from "@/lib/utils";
import "./people-catalog.css";

/** Everyone in the Bible as cards, grouped by period in the order of biblical history, scrolling in their own frame.
 *  A period button shows only that period (again to show everyone); each card opens that person's own page. */
export function PeopleCatalog({ people, backLabel }: { people: PersonRow[]; backLabel: string }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<string | null>(null);
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase();
    const list = words ? people.filter((p) => p.n.toLowerCase().includes(words) || p.o.some((o) => o.toLowerCase().includes(words)) || p.b.toLowerCase().includes(words)) : people;
    return [...list].sort((a, b) => periodOrder(a.p) - periodOrder(b.p) || b.c - a.c || a.n.localeCompare(b.n));
  }, [people, query]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of matches) map.set(person.p, (map.get(person.p) ?? 0) + 1);
    return map;
  }, [matches]);
  const groups = useMemo(() => PEOPLE_PERIODS.filter((entry) => period === null || entry.id === period)
    .map((entry) => ({ ...entry, people: matches.filter((person) => person.p === entry.id) })).filter((group) => group.people.length), [matches, period]);
  const shown = groups.reduce((sum, group) => sum + group.people.length, 0);
  return <section className="people-catalog" aria-labelledby="people-catalog-title">
    <header className="people-catalog-header">
      <div><h2 id="people-catalog-title">Everyone in the Bible</h2>
        <p>{query || period !== null ? `${formatNumber(shown)} of ${formatNumber(people.length)} people shown` : `We've catalogued ${formatNumber(people.length)} people in order of biblical history.`}</p></div>
      <label className="people-catalog-search"><Search size={16} aria-hidden /><span className="sr-only">Search people</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, another name, or what they did" /></label>
    </header>
    <div className="people-catalog-periods" role="group" aria-label="Show one period">{PEOPLE_PERIODS.map((entry) => {
      const count = counts.get(entry.id) ?? 0;
      return <button key={entry.id || "none"} type="button" aria-pressed={period === entry.id} disabled={!count && period !== entry.id}
        onClick={() => setPeriod(period === entry.id ? null : entry.id)}><span>{entry.label}</span><small>{formatNumber(count)}</small></button>;
    })}</div>
    <div className="people-catalog-scroll" tabIndex={0} role="region" aria-label="People, scrollable">
      {groups.map((group) => <section key={group.id || "none"} className="people-catalog-group" aria-label={group.label}>
        <h3>{group.label}<span>{formatNumber(group.people.length)}</span></h3>
        <ul>{group.people.map((person) => <li key={person.id}><Link to={`/people/${person.id}`} state={cameFrom(backLabel)} className="people-card">
          <strong>{person.n}</strong><span className="people-card-brief">{person.b}</span>
          <span className="people-card-foot"><span>{periodLabel(person.p)}</span><span>{formatNumber(person.c)} {person.c === 1 ? "verse" : "verses"}</span></span>
        </Link></li>)}</ul>
      </section>)}
      {!groups.length && <p className="people-catalog-empty">No one matches.</p>}
    </div>
  </section>;
}
