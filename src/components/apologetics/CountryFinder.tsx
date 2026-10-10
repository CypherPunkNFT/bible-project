import { useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import PillScroll from './PillScroll';
import './country-finder.css';

export default function CountryFinder({ choose }: { choose(code: string): void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null), results = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState(''), [open, setOpen] = useState(false);
  const filtered = snapshot.countries.filter(country => country.name.toLowerCase().includes(search.trim().toLowerCase()));
  const select = (code: string) => { choose(code); setSearch(''); setOpen(false); input.current?.focus(); };
  return <div className="mw-country-finder" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <label htmlFor={id}><Search size={13} aria-hidden="true" /> Find a country</label>
    <input ref={input} id={id} type="search" aria-label="Find a country" aria-expanded={open && !!search} aria-controls={`${id}-results`} placeholder={`Search all ${snapshot.countries.length} countries`} value={search} onChange={event => { setSearch(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={event => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Enter' && search.trim() && filtered[0]) select(filtered[0].code);
      if (event.key === 'ArrowDown') { event.preventDefault(); results.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
    }} />
    {open && !!search && <div id={`${id}-results`} className="mw-country-results" ref={results} onKeyDown={event => {
      if (event.key === 'Escape') { setOpen(false); input.current?.focus(); }
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault(); const buttons = [...results.current!.querySelectorAll<HTMLButtonElement>('button')];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}><PillScroll className="mw-country-results-list" label="Country search results"><div>{filtered.map(country => <button key={country.code} type="button" onClick={() => select(country.code)}>{country.name}</button>)}{!filtered.length && <p role="status">No matching countries.</p>}</div></PillScroll></div>}
  </div>;
}
