import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { OutsideScroll } from "@/components/OutsideScroll";
import { WindowedRows } from "@/components/WindowedRows";
import { PEOPLE_PERIODS, periodOrder } from "@/lib/people-periods";
import { PERSON_ROLES, roleColor, type PersonRole } from "@/lib/people-roles";
import { usePersonRoles } from "@/lib/use-person-roles";
import type { PersonRow } from "@/lib/study";
import { formatNumber } from "@/lib/utils";
import "./people-catalog.css";
import { compareText, plural } from "@/lib/site-format";
import { gridRows, trackCount } from "@/lib/row-window";

/** Short period names, so the twelve buttons fit two rows beside the legend; the full name shows on hover. */
const SHORT: Record<string, string> = { exodus: "Exodus", "divided-kingdom": "Two kingdoms", "": "Undated" };

// The cards are drawn a window of rows at a time (WindowedRows; owner's scroll rule, 2026-11-17): drawing all ~3,000 at
// once (25,000 elements) was what made the People page slow to open on a phone (2026-11-19). The periods and their people
// are one list, each period's band a row of its own above its cards.
type Group = (typeof PEOPLE_PERIODS)[number] & { people: PersonRow[] };
interface Line { group: Group; person?: PersonRow }
const lineKey = (line: Line) => line.person ? line.person.id : `period:${line.group.id || "none"}`;
const isBand = (line: Line) => !line.person;
/** A card's usual height in px (two lines of brief), assumed before any row has been measured. */
const CARD_ESTIMATE = 112;

/** A period's gold band: its number, name and note, and how many people it holds. */
function PeriodBand({ group }: { group: Group }) {
  return <h3 className="people-catalog-band"><span className="people-catalog-number">{String(PEOPLE_PERIODS.findIndex((entry) => entry.id === group.id) + 1).padStart(2, "0")}</span>
    <span className="people-catalog-title">{group.label}<small>{group.note}</small></span><span className="people-catalog-count">{plural(group.people.length, "{n} person", "{n} people")}</span></h3>;
}

/** Everyone in the Bible as cards, grouped by period in the order of biblical history, scrolling in their own frame.
 *  A period button shows only that period (again to show everyone); each card opens that person's own page.
 *  The period, search and last-opened person live in the address, so the person page's back link returns to this view
 *  with that card in sight and outlined. */
export function PeopleCatalog({ people: everyone, backLabel }: { people: PersonRow[]; backLabel: string }) {
  // Tribes, clans and peoples are in the data for family links, but they are not people (owner, 2026-10-07).
  const people = useMemo(() => everyone.filter((person) => !person.g), [everyone]);
  // Only periods someone belongs to (no one is left without a period).
  const periods = useMemo(() => PEOPLE_PERIODS.filter((entry) => people.some((person) => person.p === entry.id)), [people]);
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const root = useRef<HTMLElement>(null);
  const [query, setQueryState] = useState(() => params.get("q") ?? "");
  // "none" in the address stands for the period id '' (Period not given).
  const period = params.has("period") ? (params.get("period") === "none" ? "" : params.get("period")) : null;
  const last = params.get("person");
  // What each person was (king, prophet, priest…), read from their description; "?role=" shows one kind.
  const roles = usePersonRoles(people);
  const role = PERSON_ROLES.some((entry) => entry.id === params.get("role")) ? params.get("role") as PersonRole : null;
  const setRole = (value: PersonRole | null) => update({ role: value, person: null });
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) if (value === null) next.delete(key); else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const setQuery = (value: string) => { setQueryState(value); update({ q: value || null, person: null }); };
  const setPeriod = (value: string | null) => update({ period: value === null ? null : value || "none", person: null });
  /** The way back from a person's page: this view, remembering which card was opened. The address is built once, not
   *  once for every card. */
  const backPath = useMemo(() => {
    const next = new URLSearchParams(params);
    next.delete("person");
    const rest = next.toString();
    return `${pathname}?${rest}${rest ? "&" : ""}person=`;
  }, [params, pathname]);
  const backTo = (id: string) => ({ from: { path: backPath + encodeURIComponent(id), label: backLabel } });
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase();
    const list = words ? people.filter((p) => p.n.toLowerCase().includes(words) || p.o.some((o) => o.toLowerCase().includes(words)) || p.b.toLowerCase().includes(words)) : people;
    return [...list].sort((a, b) => periodOrder(a.p) - periodOrder(b.p) || b.c - a.c || compareText(a.n, b.n));
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
  const groups: Group[] = useMemo(() => periods.filter((entry) => period === null || entry.id === period)
    .map((entry) => ({ ...entry, people: shownPeople.filter((person) => person.p === entry.id) })).filter((group) => group.people.length), [shownPeople, period, periods]);
  const shown = groups.reduce((sum, group) => sum + group.people.length, 0);
  const lines = useMemo(() => groups.flatMap((group): Line[] => [{ group }, ...group.people.map((person) => ({ group, person }))]), [groups]);
  // Back from a person: bring the catalogue into view and that card into the middle of the frame. Only the rows near the
  // frame's view are drawn, so the card may not be on the page yet: the frame first scrolls to about where its row lies
  // (in rows of as many cards as the grid lays out), then, once the rows there are drawn, exactly onto the card.
  useEffect(() => {
    if (!last || !root.current || !lines.some((line) => line.person?.id === last)) return;
    root.current.scrollIntoView({ block: "start" });
    let frame = 0, tries = 0;
    const seek = () => {
      const list = root.current?.querySelector<HTMLElement>(".people-catalog-rows"), viewport = list?.closest<HTMLElement>(".outside-scroll-viewport");
      if (!list || !viewport) return;
      const view = viewport.getBoundingClientRect(), card = list.querySelector<HTMLElement>(`[data-person="${CSS.escape(last)}"]`);
      if (card) { viewport.scrollTop += card.getBoundingClientRect().top - view.top - viewport.clientHeight / 2 + card.offsetHeight / 2; return; }
      // A sticky band reports where it is stuck, not where it lies: measure from the cards.
      const drawn = list.querySelectorAll<HTMLElement>(":scope > [data-row]:not([data-sticky])");
      if (!drawn.length || ++tries > 8) return;
      const row = gridRows(lines, trackCount(getComputedStyle(list).gridTemplateColumns), isBand).findIndex((cells) => cells.some((line) => line.person?.id === last));
      const first = drawn[0], end = drawn[drawn.length - 1], firstRow = Number(first.dataset.row), endRow = Number(end.dataset.row);
      const top = first.getBoundingClientRect().top, pitch = endRow > firstRow ? (end.getBoundingClientRect().top - top) / (endRow - firstRow) : CARD_ESTIMATE;
      viewport.scrollTop += top + (row - firstRow) * pitch - view.top - viewport.clientHeight / 2;
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(seek); });
    };
    seek();
    return () => cancelAnimationFrame(frame);
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
      <div className="people-catalog-periods" role="group" aria-label="Show one period">{periods.map((entry) => {
        const count = counts.get(entry.id) ?? 0;
        return <button key={entry.id || "none"} type="button" aria-pressed={period === entry.id} disabled={!count && period !== entry.id}
          onClick={() => setPeriod(period === entry.id ? null : entry.id)} title={entry.label}><span>{SHORT[entry.id] ?? entry.label}</span><small>{formatNumber(count)}</small></button>;
      })}</div>
      {/* The kinds of people: a dot each, no boxes; a dot shows only that kind (again to show everyone). */}
      <div className="people-catalog-roles" role="group" aria-label="Show one kind of person" data-choosing={role ? "" : undefined}>
        {PERSON_ROLES.map((entry) => {
          const count = roleCounts.get(entry.id) ?? 0;
          return <button key={entry.id} type="button" title={`${entry.note} · ${plural(count, "{n} person", "{n} people")}`} aria-pressed={role === entry.id} disabled={!count && role !== entry.id}
            onClick={() => setRole(role === entry.id ? null : entry.id)} style={{ "--role": roleColor(entry.id) } as CSSProperties}>
            <span className="people-role-dot" aria-hidden />{entry.label}</button>;
        })}
      </div>
    </div>
    <OutsideScroll label="People, scrollable" className="people-catalog-scroll" frameClassName="people-catalog-frame" viewportClassName="people-catalog-viewport" resetKey={`${period}:${query}:${role}`}>
      {/* A period's band sticks at the top of the frame while its cards scroll beneath it; deep in a long period, where its
          own band is no longer drawn, a stand-in (pinned) takes its place. */}
      {lines.length > 0 && <WindowedRows as="ul" className="people-catalog-rows" items={lines} itemKey={lineKey} fullRow={isBand} estimate={CARD_ESTIMATE}
        dataVersion={`${period}:${query}:${role}`} aria-label="People"
        pinned={(first) => first.person ? <div className="people-catalog-pin" aria-hidden="true"><PeriodBand group={first.group} /></div> : null}
        renderItem={({ group, person }, row) => !person
          ? <li key={lineKey({ group })} className="people-catalog-heading" data-row={row} data-sticky=""><PeriodBand group={group} /></li>
          : <li key={person.id} data-row={row}><Link to={`/people/${person.id}`} state={backTo(person.id)} data-person={person.id} className={person.id === last ? "people-card is-last" : "people-card"}>
            <strong>{person.n}</strong><span className="people-card-brief">{person.b}</span>
            <span className="people-card-foot"><span className="people-card-role" style={{ "--role": roleColor(roles.get(person.id)!) } as CSSProperties}><span className="people-role-dot" aria-hidden />{PERSON_ROLES.find((entry) => entry.id === roles.get(person.id))?.label}</span><span>{plural(person.c, "{n} verse", "{n} verses")}</span></span>
          </Link></li>} />}
      {!groups.length && <p className="people-catalog-empty">No one matches.</p>}
    </OutsideScroll>
  </section>;
}
