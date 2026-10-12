import { useMemo } from "react";
import type { Field } from "@/data/teachers/pages-types";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { useScholars } from "./context";
import { toggled, type FacetKey } from "./catalogue/filtering";
import { FieldIcon } from "./marks/Mark";
import { toneStyle } from "./marks/shapes";
import { usedEntry } from "./site-evidence";
import "./Numbers.css";

export function Numbers() {
  const { data, library, filters, filterCatalogue, shownIds } = useScholars();
  const people = library ?? [];
  const shown = useMemo(() => new Set(shownIds), [shownIds]);
  const toggle = (key:FacetKey,value:string) => filterCatalogue(toggled(filters,key,value));
  const bars = (facet:'field'|'faith') => {
    const labels = facet==='field' ? data.fields : data.faiths;
    const rows = Object.entries(labels).map(([value,label])=>({value,label,entries:people.filter(p=>facet==='field' ? Boolean(p.fields[value as Field]) : (p.facts?.faith ?? p.scholar?.faith ?? 'unrecorded')===value)}));
    const top = Math.max(1,...rows.map(r=>r.entries.length));
    return <ul className="num-bars">{rows.map(({value,label,entries})=>{
      const n=entries.length, now=entries.filter(p=>shown.has(p.id)).length, share=`${n/top*100}%`;
      return <li key={value}><button type="button" className="num-row" data-facet={facet} data-value={value} aria-pressed={(filters[facet] as string[]).includes(value)} style={facet==='field'?toneStyle(value as Field):undefined} onClick={()=>toggle(facet,value)}>
        <span className="num-l">{facet==='field'&&<FieldIcon field={value as Field} size={12}/>} {label}</span><span className="num-track"><i style={{width:share}}/><b style={{width:share,transform:`scaleX(${n?now/n:0})`}}/></span><span className="num-n"><b>{now.toLocaleString()}</b>{now!==n&&<> of {n.toLocaleString()}</>}</span>
      </button></li>;
    })}</ul>;
  };
  const live=people.filter(usedEntry), held=people.filter(p=>!usedEntry(p)&&p.records>0), rest=people.length-live.length-held.length;
  return <>
    <SectionHead section="numbers" kicker="By the numbers" title={<>{people.length.toLocaleString()} entries, <em>counted</em></>} line="The full catalogue, including entries with unknown dates or faith. Counts describe recorded contributors, not a verified total of unique people. Bars filter catalogue 01."/>
    <div className="num-strip">
      <div className="num-card"><h3>By field</h3>{bars('field')}<p className="num-explain">Work subjects overlap; these are not professional qualifications. {people.filter(p=>!Object.keys(p.fields).length).length.toLocaleString()} entries have no assigned subject. Dark shading follows the catalogue selection.</p></div>
      <div className="num-card"><h3>By age</h3><ul className="num-dots">{Object.entries({...data.eras,unknown:'Era not documented'}).map(([era,label])=>{
        const entries=people.filter(p=>(p.facts?.dates.era??p.scholar?.era??'unknown')===era);
        return <li key={era}><button type="button" className="num-row num-dotrow" data-facet="era" data-value={era} aria-pressed={filters.era.includes(era as typeof filters.era[number])} onClick={()=>toggle('era',era)}><span className="num-l">{label}</span><span className="num-n"><b>{entries.length.toLocaleString()}</b></span><span className="num-dotset">{Array.from({length:Math.ceil(entries.length/100)},(_,i)=><i key={i} className={entries.slice(i*100,(i+1)*100).some(p=>shown.has(p.id))?undefined:'num-off'} title={`${Math.min(100,entries.length-i*100)} entries`} />)}</span></button></li>;
      })}</ul><p className="num-explain">One dot represents up to 100 entries. Ages use reviewed life dates, including source-supported dates; unknowns remain visible.</p></div>
      <div className="num-card"><h3>By faith</h3>{bars('faith')}<p className="num-explain">Only documented affiliations are assigned. The remaining entries stay unrecorded; a collection or a book's subject does not establish faith.</p></div>
      <div className="num-card"><h3>On this site</h3><button type="button" className="num-row num-site" data-used aria-pressed={filters.used} onClick={()=>filterCatalogue({...filters,used:!filters.used})}><span className="num-big"><b>{live.length.toLocaleString()}</b><span>catalogue entries linked to verified source use</span></span><span className="num-grid">{[[live.length,'in-use'],[held.length,'held'],[rest,'none']].flatMap(([n,status])=>Array.from({length:Math.ceil(Number(n)/100)},(_,i)=><i key={`${status}-${i}`} className={`num-${status}`} title={`${Math.min(100,Number(n)-i*100)} entries`}/>))}</span><span className="num-key"><span><i className="num-in-use"/>Verified use {live.length.toLocaleString()}</span><span><i className="num-held"/>Held; use unverified {held.length.toLocaleString()}</span><span><i className="num-none"/>No held record linked {rest.toLocaleString()}</span></span></button><p className="num-explain">One square represents up to 100 entries. Exact source-credit matches and reviewed profile aliases establish use; unmatched names are not proof of absence.</p></div>
    </div>
  </>;
}
