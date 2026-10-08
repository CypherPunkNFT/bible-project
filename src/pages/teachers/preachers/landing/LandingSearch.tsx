// The landing's search: names and every town they lived in. The list offers the first seven matches to open (arrow keys
// move, Enter opens, Esc clears); every match also stays lit on the arc below (ported from the mock-up's landing.js).
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { lifeLabel } from "../../shared/people";
import { cssVars, toneOf } from "../drawer/helpers";
import { RESULTS_SHOWN, type SearchHit } from "./content";

interface LandingSearchProps {
  query: string;
  onQuery: (query: string) => void;
  hits: SearchHit[];
  onHot: (id: string | null) => void;
  onOpen: (id: string, origin: Element) => void;
}

export function LandingSearch({ query, onQuery, hits, onHot, onOpen }: LandingSearchProps) {
  const listId = useId();
  const findRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const typed = query.trim();
  const expanded = listOpen && Boolean(typed);
  const shown = hits.slice(0, RESULTS_SHOWN);

  // A press anywhere outside the search folds the list away (the query and the lit marks stay).
  useEffect(() => {
    if (!expanded) return;
    const onDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !findRef.current?.contains(event.target)) setListOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [expanded]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!shown.length) return;
      event.preventDefault();
      setListOpen(true);
      setActive((a) => (a + (event.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length);
    } else if (event.key === "Enter" && shown[active]) {
      event.preventDefault();
      onOpen(shown[active].person.id, event.currentTarget);
    } else if (event.key === "Escape") onQuery("");
  };

  return <div className="lnd-find" ref={findRef}>
    <label className="lnd-search">
      <Search size={17} strokeWidth={1.5} aria-hidden />
      <input type="search" placeholder="Find a teacher or a city" aria-label="Find a teacher or a city" autoComplete="off"
        aria-controls={listId} aria-expanded={expanded} value={query}
        onChange={(event) => { onQuery(event.target.value); setActive(0); setListOpen(true); }}
        onFocus={() => setListOpen(true)} onKeyDown={onKeyDown} />
    </label>
    <ul className="lnd-results" id={listId} role="listbox" aria-label="Matching teachers" hidden={!expanded} onPointerLeave={() => onHot(null)}>
      {shown.map((hit, i) => <li key={hit.person.id} role="option" aria-selected={i === active}>
        <button type="button" tabIndex={-1} onClick={(event) => onOpen(hit.person.id, event.currentTarget)} onPointerEnter={() => onHot(hit.person.id)}>
          <i style={cssVars({ "--tone": toneOf(hit.person) })} />
          <span><b>{hit.person.name}</b><small>{lifeLabel(hit.person)}{hit.town ? ` · lived in ${hit.town}` : ""}</small></span>
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
        </button>
      </li>)}
      {hits.length > RESULTS_SHOWN && <li className="lnd-more">{hits.length - RESULTS_SHOWN} more lit on the arc below</li>}
      {!hits.length && <li className="lnd-more">No teacher or town matches “{typed}”.</li>}
    </ul>
  </div>;
}
