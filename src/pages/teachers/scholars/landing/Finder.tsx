// The landing's search box: a combobox that lists matching scholars (arrow keys move, Enter opens the profile, Esc
// clears). The query lives in the landing, which also lights the matches in the constellation.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { years } from "../marks/facts";
import { Mark } from "../marks/Mark";
import { toneStyle } from "../marks/shapes";
import type { Match } from "./search";

interface FinderProps { query: string; onQuery: (q: string) => void; found: Match[]; onOpen: (id: string, origin: Element | null) => void }
const optionId = (i: number) => `sc-lnd-opt-${i}`;

export function Finder({ query, onQuery, found, onOpen }: FinderProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null), list = useRef<HTMLDivElement>(null);
  const q = query.trim(), shown = open && q.length > 0;
  useEffect(() => {
    const away = (event: globalThis.PointerEvent) => { if (!(event.target instanceof Node && box.current?.contains(event.target))) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);
  const choose = (i: number) => {
    const m = found[i];
    if (!m) return;
    setOpen(false);
    onOpen(m.s.id, list.current?.querySelectorAll(".lnd-opt")[i] ?? null);
  };
  const move = (by: number) => {
    if (!found.length) return;
    const next = (active + by + found.length) % found.length;
    setActive(next);
    list.current?.querySelectorAll(".lnd-opt")[next]?.scrollIntoView({ block: "nearest" });
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
    else if (event.key === "Enter" && found.length) { event.preventDefault(); choose(Math.max(0, active)); }
    else if (event.key === "Escape") { onQuery(""); setOpen(false); }
  };
  return <div className="lnd-find" ref={box}>
    <label className="lnd-search"><Search size={18} aria-hidden="true" />
      <input type="search" placeholder="Find a scholar, a book or a field" autoComplete="off" spellCheck={false} value={query}
        role="combobox" aria-expanded={shown} aria-controls="sc-lnd-results" aria-autocomplete="list" aria-label="Find a scholar, a book or a field"
        aria-activedescendant={shown && found.length ? optionId(active) : undefined}
        onChange={(e) => { onQuery(e.target.value); setActive(0); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey} /></label>
    <div className="lnd-results" id="sc-lnd-results" role="listbox" aria-label="Matching scholars" hidden={!shown} ref={list}>
      {found.length ? <>
        {found.map((m, i) => <button key={m.s.id} type="button" role="option" id={optionId(i)} className="lnd-opt" aria-selected={i === active}
          style={toneStyle(m.s.field)} onClick={() => choose(i)}>
          <Mark scholar={m.s} size={34} className="lnd-mark" />
          <span className="lnd-opt-t"><b>{m.s.name}</b><small>{years(m.s)} · {"work" in m.why ? <><i>{m.why.work}</i>, {m.why.year}</> : m.why.text}</small></span>
          <span className="lnd-opt-go"><ArrowRight size={14} aria-hidden="true" /></span></button>)}
        <p className="lnd-res-n">{found.length} {found.length === 1 ? "match" : "matches"}</p>
      </> : <p className="lnd-none">Nothing matches “{q}”. Try a name like Jerome, a book like the Vulgate, or a field like archaeology.</p>}
    </div>
  </div>;
}
