import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen } from 'lucide-react';
import { sources, type Passage, type Scene } from './evidence';

export function Breadcrumb({ current }: { current: string }) {
  return <nav className="ha-breadcrumb" aria-label="Study navigation"><Link to="/study/academic?area=history"><ArrowLeft size={15}/> History & archaeology</Link><span>{current}</span></nav>;
}
export function SourceLinks({ ids }: { ids: string[] }) {
  return <div className="ha-source-links">{[...new Set(ids)].map(id => <a key={id} href={sources[id].url} target="_blank" rel="noopener noreferrer">{sources[id].label}<ArrowUpRight size={14}/><span className="sr-only"> (opens in a new tab)</span></a>)}</div>;
}
export function Passages({ items }: { items: Passage[] }) {
  return <div className="ha-passages">{items.map(p => <Link key={p.label} to={`/read/kjv/${p.book}/${p.chapter}`}><BookOpen size={17}/><span><strong>{p.label}</strong><small>{p.note}</small></span><ArrowUpRight size={15}/></Link>)}</div>;
}
export function SourceDirectory({ ids }: { ids: string[] }) {
  return <section className="ha-sources" id="sources"><div><p className="ha-kicker">Follow the evidence</p><h2>Records behind the reading</h2><p>Open an excavation account, object record or published interpretation. Each source has a particular scope.</p></div><div>{[...new Set(ids)].map(id => <details key={id}><summary>{sources[id].label}</summary><p>{sources[id].scope}</p><a href={sources[id].url} target="_blank" rel="noopener noreferrer">Open source <ArrowUpRight size={14}/></a></details>)}</div></section>;
}

// Deliberately schematic: these geometries illustrate a setting, not a surveyed building.
export function SceneDrawing({ kind, selected = 0 }: { kind: Scene['kind']; selected?: number }) {
  const patternId = useId().replace(/:/g, '') + '-stones';
  const sea = kind === 'sea', house = kind === 'village' || kind === 'house', port = kind === 'port';
  return <svg viewBox="0 0 640 350" className={`ha-scene-art ha-scene-${kind}`} role="img" aria-label={`Reconstructed ${kind} setting. The numbered markers correspond to the evidence buttons below; no building is an exact excavation plan.`}>
    <defs><pattern id={patternId} width="48" height="24" patternUnits="userSpaceOnUse"><path d="M0 0H48M0 24H48M24 0V12M0 12H48M12 12V24M42 12V24" fill="none" stroke="currentColor" strokeOpacity=".12"/></pattern></defs>
    <path d="M20 257L301 103 620 234 342 344Z" fill="currentColor" opacity=".035"/>
    <path d="M20 257L301 103 620 234M20 257L342 344 620 234" fill="none" stroke="currentColor" strokeOpacity=".25"/>
    {sea ? <g fill="none" stroke="currentColor"><path d="M145 219Q320 330 503 194L472 251Q314 331 183 261Z" fill="currentColor" fillOpacity=".1" strokeWidth="2"/><path d="M174 223Q318 278 482 205M323 239V47M314 65H441L335 206Z" strokeWidth="2"/><path d="M330 66Q426 104 431 184L335 206Z" fill="currentColor" fillOpacity=".12"/><path d="M315 66L181 214M323 47L492 200" opacity=".5"/>{[0, 1, 2, 3].map(i => <path key={i} d={`M${25+i*9} ${267+i*19}q65 -20 130 0t130 0t130 0t130 0`} opacity=".22"/>)}</g> : house ? <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M115 237V142L276 59 510 145V236L455 263V170L277 105 169 163V258Z" fill={`url(#${patternId})`}/><path d="M115 142L276 59 510 145 455 170 277 105 169 163Z" fill="currentColor" fillOpacity=".12"/><path d="M115 237L169 258V163L115 142M276 59V105M510 145L455 170" fill="none"/>
      <path d="M214 268L309 217 421 251 322 303Z" fill="currentColor" fillOpacity=".06" strokeDasharray="4 4"/>
      <ellipse cx="267" cy="258" rx="31" ry="13" fill="currentColor" fillOpacity=".13"/><ellipse cx="267" cy="253" rx="27" ry="11" fill="none"/><path d="M267 251l11 -17"/>
      <path d="M353 212V184Q355 159 369 176L379 201V221Q365 230 353 212Z" fill="currentColor" fillOpacity=".15"/>
      {kind === 'house' && <path d="M226 220L296 181 369 206 300 247Z M242 215v20m112-31v24m-55 18v22" fill="none"/>}
    </g> : <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M120 230L323 121 534 202 326 310Z" fill={`url(#${patternId})`}/><path d="M150 213L324 120 508 190 334 283Z" fill="currentColor" fillOpacity=".06"/>
      {[0, 1, 2, 3, 4].map(i => <g key={i} transform={`translate(${174+i*39} ${197-i*20})`}><path d="M0 0V-91h13V5l-13-5M-5-91h23v-8H-5Z" fill="currentColor" fillOpacity=".07"/><path d="M4-5V-87" opacity=".35"/></g>)}
      <path d="M150 98L326 5 524 80 508 102 326 33 168 119Z" fill="currentColor" fillOpacity=".12"/><path d="M500 100V191M326 33V120M150 98V213" fill="none"/>
      {kind === 'synagogue' ? <><path d="M198 219L326 151 447 196M205 229L326 164 435 206" fill="none"/><path d="M303 226v-26l37-19 37 13v26l-37 19Z" fill="currentColor" fillOpacity=".14"/></> : <><path d="M322 280L506 185M322 292L522 191M322 306L538 199" opacity=".55"/><path d="M212 207L359 127" strokeDasharray="4 4"/></>}
    </g>}
    {port && <path d="M22 288q40 -12 80 0t80 0t80 0M55 307q40 -12 80 0t80 0" stroke="currentColor" opacity=".4" fill="none"/>}
    {[[208, 222], [370, 219], [476, 276]].map(([x,y], i) => <g key={i} transform={`translate(${x} ${y})`} className={selected === i ? 'ha-art-point active' : 'ha-art-point'}><circle r="17"/><text textAnchor="middle" dy="5">{i+1}</text></g>)}
  </svg>;
}
