import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Person } from '@/data/teachers/pages-types';
import { SectionHead } from '../../shared/Frame';
import { FAMILIES, familyOf, formatNumber, lifeEnd, lifeLabel, THIS_YEAR } from '../../shared/people';
import { usePreachers } from '../context';
import { cssVars, initials, toneOf } from '../drawer/helpers';
import { continentFor, regionGroups } from '../directory/regions';
import './teacher-catalogue.css';

type Facet = 'region' | 'family' | 'era';
type Filters = Record<Facet, string[]>;
type Sort = 'featured' | 'az' | 'year' | 'works';
interface Row { person: Person; region: string; town: string; family: string; era: string; search: string }
const EMPTY: Filters = { region: [], family: [], era: [] };
const SORTS: [Sort,string][] = [['featured','Featured'],['az','A–Z'],['year','Birth year'],['works','Most works']];
const normalise = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();

function TeacherCard({ row, start, onOpen }: { row: Row; start: number; onOpen: (id: string, origin: Element) => void }) {
  const p = row.person, family = familyOf(p), work = p.known.find(w => w.inLibrary) ?? p.known[0];
  const title = work?.t ?? p.notable[0]?.t;
  const percent = (year: number) => `${Math.max(0,Math.min(100,(year-start)/(THIS_YEAR-start)*100))}%`;
  return <article className="pc-card" data-id={p.id} style={cssVars({'--tone':toneOf(p)})}>
    <div className="pc-card-top"><span className="pc-mark" aria-hidden="true">{initials(p)}</span><span className="pc-badge">{!p.died ? 'Living teacher' : p.works || p.heldTexts ? 'In the library' : 'Profile'}</span></div>
    <h3>{p.name}</h3><p className="pc-meta">{lifeLabel(p)} · {row.town}</p>
    <p className="pc-tags"><span>{family.label}</span><span>{row.region}</span></p>
    <div className="pc-work"><small>{title ? 'Key work' : 'Library collection'}</small><div><strong>{title ?? 'Explore their held works'}</strong>{work && <span>{work.y}</span>}</div></div>
    <p className="pc-counts">{p.works ? <>{formatNumber(p.works)} catalogue works · {formatNumber(p.genres.sermon ?? 0)} sermons</> : p.heldTexts ? <>{formatNumber(p.heldTexts)} held texts</> : 'No works linked yet'}</p>
    <div className="pc-life" aria-hidden="true"><i style={{left:percent(p.born),width:`max(4px, calc(${percent(lifeEnd(p))} - ${percent(p.born)}))`}} /></div>
    <button className="pc-card-hit" type="button" aria-label={`Open the profile of ${p.name}`} onClick={e => onOpen(p.id,e.currentTarget)} />
  </article>;
}

export function TeacherCatalogue() {
  const { data, openProfile } = usePreachers();
  const rows = useMemo<Row[]>(() => regionGroups(data.people).flatMap(group => group.rows.map(({person,town}) => ({ person, region:continentFor(group.region,town), town, family:familyOf(person).key, era:String(Math.floor(person.born/100)*100), search:normalise([person.name,town,group.region,continentFor(group.region,town),familyOf(person).label,...person.places.map(p=>p[0]),...person.known.map(w=>w.t)].join(' ')) }))),[data.people]);
  const [query,setQuery] = useState(''), [filters,setFilters] = useState<Filters>(EMPTY), [sort,setSort] = useState<Sort>('featured');
  const viewport = useRef<HTMLDivElement>(null);
  const words = normalise(query).trim().split(/\s+/).filter(Boolean);
  const matches = (row: Row, ignore?: Facet) => words.every(word => row.search.includes(word)) && (['region','family','era'] as Facet[]).every(key => key===ignore || !filters[key].length || filters[key].includes(row[key]));
  const visible = rows.filter(row => matches(row)).sort((a,b) => sort==='az' ? a.person.name.localeCompare(b.person.name) : sort==='works' ? b.person.works-a.person.works || a.person.name.localeCompare(b.person.name) : a.person.born-b.person.born || a.person.name.localeCompare(b.person.name));
  const regions = [...new Set(rows.map(row=>row.region))].sort((a,b)=>a.localeCompare(b));
  const eras = [...new Set(rows.map(row=>row.era))].sort();
  const active = Boolean(query.trim() || Object.values(filters).some(values=>values.length));
  const start = Math.floor(Math.min(...data.people.map(p=>p.born))/100)*100;
  useEffect(()=>{viewport.current?.scrollTo({top:0});},[query,filters,sort]);
  const toggle = (key: Facet, value: string) => setFilters(previous => ({...previous,[key]:previous[key].includes(value)?previous[key].filter(v=>v!==value):[...previous[key],value]}));
  const clear = () => {setQuery('');setFilters(EMPTY);};
  const facet = (key: Facet, title: string, options: {value: string; label: string; tone?: string}[]) => <div className="pc-facet" data-facet={key}><h3>{title}</h3><div className="pc-options">{options.map(option => <button key={option.value} type="button" aria-pressed={filters[key].includes(option.value)} data-value={option.value} onClick={()=>toggle(key,option.value)} style={option.tone?cssVars({'--tone':option.tone}):undefined}>{option.tone && <i aria-hidden="true"/>}<span>{option.label}</span><em>{rows.filter(row=>row[key]===option.value&&matches(row,key)).length}</em></button>)}</div></div>;
  return <>
    <SectionHead num="02" kicker="The catalogue" title={<>Every teacher, <em>one place</em></>} line="Browse their works and open a profile. Region follows the continent where each teacher served longest after their birthplace." />
    <div className="pc-layout">
      <aside className="pc-filters" aria-label="Filter the preachers">
        <div className="pc-filter-head"><span>Filter</span>{active&&<button type="button" onClick={clear}>Clear all</button>}</div>
        <label className="pc-search"><Search size={16} aria-hidden="true"/><input type="search" aria-label="Search preachers" placeholder="Name, town or work" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        {facet('region','Region',regions.map(region=>({value:region,label:region})))}
        {facet('family','Tradition',FAMILIES.map(f=>({value:f.key,label:f.label,tone:`var(${f.tone})`})))}
        {facet('era','Era',eras.map(era=>({value:era,label:`${era}–${+era+99}`})))}
      </aside>
      <div className="pc-results"><div className="pc-toolbar"><p className="pc-result-count" aria-live="polite"><strong>{visible.length}</strong> of {rows.length} teachers</p><div className="pc-sort" role="radiogroup" aria-label="Sort preachers"><span>Sort</span>{SORTS.map(([key,label])=><button key={key} type="button" role="radio" aria-checked={sort===key} onClick={()=>setSort(key)}>{label}</button>)}</div></div>
        <div className="pc-scroll slim-scroll" ref={viewport} role="region" aria-label="Preacher cards" tabIndex={0}><div className="pc-grid">{visible.map(row=><TeacherCard key={row.person.id} row={row} start={start} onOpen={openProfile}/>)}</div>{!visible.length&&<div className="pc-empty"><p>No teacher matches these filters.</p><button type="button" onClick={clear}>Clear the filters</button></div>}</div>
      </div>
    </div>
  </>;
}
