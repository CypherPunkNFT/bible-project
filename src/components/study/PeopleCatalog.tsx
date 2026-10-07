import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { OutsideScroll } from "@/components/OutsideScroll";
import { PEOPLE_PERIODS, periodLabel, periodOrder } from "@/lib/people-periods";
import type { PersonRow } from "@/lib/study";
import { formatNumber } from "@/lib/utils";
import "./people-catalog.css";

/** Everyone in the Bible as cards, grouped by period in the order of biblical history, scrolling in their own frame.
 *  A period button shows only that period (again to show everyone); each card opens that person's own page.
 *  The period, search and last-opened person live in the address, so the person page's back link returns to this view
 *  with that card in sight and outlined. */
export function PeopleCatalog({ people, backLabel }: { people: PersonRow[]; backLabel: string }) {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const root = useRef<HTMLElement>(null);
  const [query, setQueryState] = useState(() => params.get("q") ?? "");
  // "none" in the address stands for the period id '' (Period not given).
  const period = params.has("period") ? (params.get("period") === "none" ? "" : params.get("period")) : null;
  const last = params.get("person");
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) if (value === null) next.delete(key); else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const setQuery = (value: string) => { setQueryState(value); update({ q: value || null, person: null }); };
  const setPeriod = (value: string | null) => update({ period: value === null ? null : value || "none", person: null });
  /** The way back from a person's page: this view, remembering which card was opened. */
  const backTo = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("person", id);
    return { from: { path: `${pathname}?${next}`, label: backLabel } };
  };
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
  // Back from a person: bring the catalogue into view and that card into the middle of the frame.
  useEffect(() => {
    if (!last || !root.current) return;
    const card = root.current.querySelector<HTMLElement>(`[data-person="${CSS.escape(last)}"]`);
    const viewport = card?.closest<HTMLElement>(".outside-scroll-viewport");
    if (!card || !viewport) return;
    root.current.scrollIntoView({ block: "start" });
    viewport.scrollTop += card.getBoundingClientRect().top - viewport.getBoundingClientRect().top - viewport.clientHeight / 2 + card.offsetHeight / 2;
    // Only on arrival; later filtering clears the remembered card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <section ref={root} className="people-catalog" aria-labelledby="people-catalog-title">
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
    <OutsideScroll label="People, scrollable" className="people-catalog-scroll" frameClassName="people-catalog-frame" viewportClassName="people-catalog-viewport" resetKey={`${period}:${query}`}>
      {groups.map((group) => <section key={group.id || "none"} className="people-catalog-group" aria-label={group.label}>
        <h3><span className="people-catalog-number">{String(PEOPLE_PERIODS.findIndex((entry) => entry.id === group.id) + 1).padStart(2, "0")}</span>
          <span className="people-catalog-title">{group.label}<small>{group.note}</small></span><span className="people-catalog-count">{formatNumber(group.people.length)} {group.people.length === 1 ? "person" : "people"}</span></h3>
        <ul>{group.people.map((person) => <li key={person.id}><Link to={`/people/${person.id}`} state={backTo(person.id)} data-person={person.id} className={person.id === last ? "people-card is-last" : "people-card"}>
          <strong>{person.n}</strong><span className="people-card-brief">{person.b}</span>
          <span className="people-card-foot"><span>{periodLabel(person.p)}</span><span>{formatNumber(person.c)} {person.c === 1 ? "verse" : "verses"}</span></span>
        </Link></li>)}</ul>
      </section>)}
      {!groups.length && <p className="people-catalog-empty">No one matches.</p>}
    </OutsideScroll>
  </section>;
}
