import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import PillScroll from './PillScroll';
import './country-finder.css';

export default function CountryFinder({ choose, collapsible = false }: { choose(code: string): void; collapsible?: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null), results = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState(''), [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { if (collapsible && expanded) input.current?.focus(); }, [collapsible, expanded]);
  const filtered = snapshot.countries.filter(country => country.name.toLowerCase().includes(search.trim().toLowerCase()));
  const close = (focus = false) => { setOpen(false); if (collapsible) { setExpanded(false); setSearch(''); if (focus) toggle.current?.focus(); } };
  const select = (code: string) => { choose(code); setSearch(''); close(true); if (!collapsible) input.current?.focus(); };
  return <div className={`mw-country-finder${collapsible ? ' is-collapsible' : ''}${expanded ? ' is-expanded' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }}>
    {!collapsible && <label htmlFor={id}><Search size={13} aria-hidden="true" /> Find a country</label>}
    <div className={collapsible ? 'mw-country-search-pill' : undefined}>
    {collapsible && <button ref={toggle} type="button" className="mw-country-search-toggle" aria-label={expanded ? 'Close country search' : 'Search countries'} aria-expanded={expanded} aria-controls={expanded ? id : undefined} onClick={() => { if (expanded) close(true); else setExpanded(true); }}><Search size={19} strokeWidth={1.5} aria-hidden="true" /></button>}
    {(!collapsible || expanded) && <input ref={input} id={id} type="search" aria-label="Find a country" aria-expanded={open && !!search} aria-controls={`${id}-results`} placeholder={`Search all ${snapshot.countries.length} countries`} value={search} onChange={event => { setSearch(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={event => {
      if (event.key === 'Escape') close(true);
      if (event.key === 'Enter' && search.trim() && filtered[0]) select(filtered[0].code);
      if (event.key === 'ArrowDown') { event.preventDefault(); results.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
    }} />}
    </div>
    {open && !!search && <div id={`${id}-results`} className="mw-country-results" ref={results} onKeyDown={event => {
      if (event.key === 'Escape') { close(true); if (!collapsible) input.current?.focus(); }
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault(); const buttons = [...results.current!.querySelectorAll<HTMLButtonElement>('button')];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}><PillScroll className="mw-country-results-list" label="Country search results"><div>{filtered.map(country => <button key={country.code} type="button" onClick={() => select(country.code)}>{country.name}</button>)}{!filtered.length && <p role="status">No matching countries.</p>}</div></PillScroll></div>}
  </div>;
}
