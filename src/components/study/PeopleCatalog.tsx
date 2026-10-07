import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { OutsideScroll } from "@/components/OutsideScroll";
import { PEOPLE_PERIODS, periodOrder } from "@/lib/people-periods";
import { assignRoles, PERSON_ROLES, roleColor, type PersonRole } from "@/lib/people-roles";
import type { PersonRow } from "@/lib/study";
import { formatNumber } from "@/lib/utils";
import "./people-catalog.css";

/** Short period names, so the twelve buttons fit two rows beside the legend; the full name shows on hover. */
const SHORT: Record<string, string> = { exodus: "Exodus", "divided-kingdom": "Two kingdoms", "": "Undated" };

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
  // What each person was (king, prophet, priest…), read from their description; "?role=" shows one kind.
  const roles = useMemo(() => assignRoles(people), [people]);
  const role = PERSON_ROLES.some((entry) => entry.id === params.get("role")) ? params.get("role") as PersonRole : null;
  const setRole = (value: PersonRole | null) => update({ role: value, person: null });
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
  const roleCounts = useMemo(() => {
    const map = new Map<PersonRole, number>();
    for (const person of matches) if (period === null || person.p === period) map.set(roles.get(person.id)!, (map.get(roles.get(person.id)!) ?? 0) + 1);
    return map;
  }, [matches, period, roles]);
  const shownPeople = useMemo(() => (role ? matches.filter((person) => roles.get(person.id) === role) : matches), [matches, role, roles]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of shownPeople) map.set(person.p, (map.get(person.p) ?? 0) + 1);
    return map;
  }, [shownPeople]);
  const groups = useMemo(() => PEOPLE_PERIODS.filter((entry) => period === null || entry.id === period)
    .map((entry) => ({ ...entry, people: shownPeople.filter((person) => person.p === entry.id) })).filter((group) => group.people.length), [shownPeople, period]);
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
  // Stopping the page near the catalogue settles it neatly in view, just under the site header (CSS snapping cannot: the
  // People page's view window is its own scroll container). It settles only when you were heading towards it, or just went
  // past it, and stopped within a quarter screen; moving away from it is never pulled back.
  useEffect(() => {
    const offsetOf = (box: HTMLElement) => box.getBoundingClientRect().top - parseFloat(getComputedStyle(box).scrollMarginTop);
    let previous = root.current ? offsetOf(root.current) : 0;
    const settle = () => {
      const box = root.current;
      if (!box) return;
      const offset = offsetOf(box), before = previous;
      previous = offset;
      const approaching = Math.sign(offset) === Math.sign(before) && Math.abs(offset) < Math.abs(before) - 2;
      const crossed = Math.abs(before) > 2 && Math.sign(offset) !== Math.sign(before);
      if ((approaching || crossed) && Math.abs(offset) > 2 && Math.abs(offset) < window.innerHeight * .25) {
        previous = 0;
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: window.scrollY + offset, behavior: smooth ? "smooth" : "instant" });
      }
    };
    window.addEventListener("scrollend", settle);
    return () => window.removeEventListener("scrollend", settle);
  }, []);
  return <section ref={root} className="people-catalog" aria-labelledby="people-catalog-title">
    <header className="people-catalog-header">
      <div><h2 id="people-catalog-title">Everyone in the Bible</h2>
        <p>{query || period !== null || role ? `${formatNumber(shown)} of ${formatNumber(people.length)} people shown` : `We've catalogued ${formatNumber(people.length)} people in order of biblical history.`}</p></div>
      <label className="people-catalog-search"><Search size={16} aria-hidden /><span className="sr-only">Search people</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, another name, or what they did" /></label>
    </header>
    <div className="people-catalog-filters">
      <div className="people-catalog-periods" role="group" aria-label="Show one period">{PEOPLE_PERIODS.map((entry) => {
        const count = counts.get(entry.id) ?? 0;
        return <button key={entry.id || "none"} type="button" aria-pressed={period === entry.id} disabled={!count && period !== entry.id}
          onClick={() => setPeriod(period === entry.id ? null : entry.id)} title={entry.label}><span>{SHORT[entry.id] ?? entry.label}</span><small>{formatNumber(count)}</small></button>;
      })}</div>
      {/* The kinds of people: a dot each, no boxes; a dot shows only that kind (again to show everyone). */}
      <div className="people-catalog-roles" role="group" aria-label="Show one kind of person" data-choosing={role ? "" : undefined}>
        {PERSON_ROLES.map((entry) => {
          const count = roleCounts.get(entry.id) ?? 0;
          return <button key={entry.id} type="button" title={`${entry.note} · ${formatNumber(count)} ${count === 1 ? "person" : "people"}`} aria-pressed={role === entry.id} disabled={!count && role !== entry.id}
            onClick={() => setRole(role === entry.id ? null : entry.id)} style={{ "--role": roleColor(entry.id) } as CSSProperties}>
            <span className="people-role-dot" aria-hidden />{entry.label}</button>;
        })}
      </div>
    </div>
    <OutsideScroll label="People, scrollable" className="people-catalog-scroll" frameClassName="people-catalog-frame" viewportClassName="people-catalog-viewport" resetKey={`${period}:${query}:${role}`}>
      {groups.map((group) => <section key={group.id || "none"} className="people-catalog-group" aria-label={group.label}>
        <h3><span className="people-catalog-number">{String(PEOPLE_PERIODS.findIndex((entry) => entry.id === group.id) + 1).padStart(2, "0")}</span>
          <span className="people-catalog-title">{group.label}<small>{group.note}</small></span><span className="people-catalog-count">{formatNumber(group.people.length)} {group.people.length === 1 ? "person" : "people"}</span></h3>
        <ul>{group.people.map((person) => <li key={person.id}><Link to={`/people/${person.id}`} state={backTo(person.id)} data-person={person.id} className={person.id === last ? "people-card is-last" : "people-card"}>
          <strong>{person.n}</strong><span className="people-card-brief">{person.b}</span>
          <span className="people-card-foot"><span className="people-card-role" style={{ "--role": roleColor(roles.get(person.id)!) } as CSSProperties}><span className="people-role-dot" aria-hidden />{PERSON_ROLES.find((entry) => entry.id === roles.get(person.id))?.label}</span><span>{formatNumber(person.c)} {person.c === 1 ? "verse" : "verses"}</span></span>
        </Link></li>)}</ul>
      </section>)}
      {!groups.length && <p className="people-catalog-empty">No one matches.</p>}
    </OutsideScroll>
  </section>;
}
