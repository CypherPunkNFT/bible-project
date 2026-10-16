import type { City } from './evidence';

const kinds: Record<string,string[]> = {jericho:['burn','wall','tower'],lachish:['wall','siege','wall'],jerusalem:['reuse','house','kiln'],corinth:['church','platform','column']};
export const horizonLabels: Record<string,string[]> = {jericho:['Destruction','Urban growth','Neolithic'],lachish:['Level II','Level III','Levels V–IV'],jerusalem:['Workshop reuse','Residences','Craft production'],corinth:['Later reuse','Roman colony','Greek & interim']};
function Architecture({kind}:{kind:string}) {
  if(kind==='tower') return <><path className="ct-arch" d="M266 71V33q34-16 65 0v38l-32 9Z"/><path d="M299 80V43m-25 9 46 -9" fill="none" stroke="var(--ct-ochre)" strokeWidth="3"/></>;
  if(kind==='column') return <path className="ct-arch" d="M230 76V27h18v54m22 6V36h18v55m-65-64 73 18v-9l-73-18Z"/>;
  if(kind==='platform'||kind==='church') return <><path className="ct-arch" d="m225 83 94 -20 65 21 -94 22Zm12-4V65l82 -19 51 18v17"/>{kind==='church'&&<path className="ct-arch" d="M270 75V42l36 -26 48 13v48l-46 13Z"/>}</>;
  if(kind==='kiln') return <><path className="ct-arch" d="M248 82V55q30 -43 61 0v27l-30 9Z"/><path d="M273 84V66q7-12 14 0v18" fill="var(--ct-char)"/></>;
  if(kind==='reuse') return <><path className="ct-arch" d="m216 70 78 -15 89 27 -80 18Z"/><path d="m240 64 75 -15 0 14 -75 15Z" fill="var(--ct-ochre)" stroke="var(--ct-char)" strokeWidth="2"/></>;
  return <><path className="ct-arch" d="m170 63 131 -26 152 46 -23 8 -129 -38 -110 23v16l-21 -6Z"/><path className="ct-arch" d="M207 79V50l23 -5v40m126 12V63l22 7v34"/>{kind==='siege'?<path d="m101 117 106 -67v29l-51 53Z" fill="var(--ct-ochre)" stroke="var(--ct-char)" strokeWidth="2"/>:kind==='burn'?<path d="m230 94 18 -9 18 10 21 -7 29 13 22 -10" stroke="var(--ct-char)" strokeWidth="7" fill="none"/>:kind==='house'?<path d="m271 85 23 -4v6l18 6v7l18 6" stroke="var(--ct-char)" strokeWidth="3" fill="none"/>:null}</>;
}
export function CitiesSectionArt({city,index,overlay,onSelect}:{city:City;index:number;overlay:boolean;onSelect:(index:number)=>void}) {
  return <svg viewBox="0 0 690 470" className="ct-section-art" role="group" aria-label={`${city.name}: three selected contexts. Schematic illustration, not a measured excavation. Use the horizon buttons below for the same selection.`}>
    <defs><pattern id="ct-soil" width="28" height="20" patternUnits="userSpaceOnUse"><path d="M4 8h4m13 8h3" stroke="currentColor" opacity=".22"/></pattern></defs>
    {[2,1,0].map(i=>{const y=i*112;const burned=(city.id==='jericho'&&i===0)||(city.id==='lachish'&&i<2)||(city.id==='jerusalem'&&i===1);return <g key={i} className={`ct-earth ${index===i?'is-selected':''} ${burned?'is-burned':''}`} onClick={()=>onSelect(i)} aria-hidden="true">
      <path className="ct-front" d={`M69 ${111+y}L328 ${179+y}V${217+y}L69 ${149+y}Z`}/><path className="ct-side" d={`M328 ${179+y}L566 ${124+y}V${162+y}L328 ${217+y}Z`}/><path className="ct-top" d={`M69 ${111+y}L298 ${61+y} 566 ${124+y} 328 ${179+y}Z`}/><path d={`M69 ${111+y}L328 ${179+y}V${217+y}L69 ${149+y}Z`} fill="url(#ct-soil)"/><g transform={`translate(0 ${y})`}><Architecture kind={kinds[city.id][i]}/></g><circle cx="600" cy={139+y} r="15"/><text x="600" y={144+y} textAnchor="middle">{i+1}</text><path d={`M566 ${142+y}H581`} stroke="var(--ha-line)"/>
    </g>;})}
    {overlay&&<g transform={`translate(0 ${index*112})`} pointerEvents="none"><path d="M145 111V40l190 -31 195 58v67M145 40l195 60 190 -33M340 100v65" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="7 6"/></g>}
  </svg>;
}
export function FindIllustration({grain}:{grain:boolean}) {
  return <figure className="ct-find-object"><svg viewBox="0 0 210 150" aria-hidden="true"><ellipse cx="105" cy="130" rx="72" ry="9" fill="var(--ha-line)"/>{grain?<g fill="var(--ct-ochre)" stroke="var(--ha-accent)" strokeWidth="1.4"><ellipse cx="70" cy="82" rx="11" ry="23" transform="rotate(-25 70 82)"/><ellipse cx="110" cy="71" rx="12" ry="25" transform="rotate(30 110 71)"/><ellipse cx="135" cy="100" rx="11" ry="22" transform="rotate(70 135 100)"/></g>:<><path d="m48 39 89 -13 35 32 -14 61 -94 7 -26 -36Z" fill="var(--ct-clay)" stroke="var(--ha-accent)" strokeWidth="2"/><path d="m48 39 12 14 72 -11 40 16M60 53l4 73" fill="none" stroke="var(--ct-chalk)" strokeWidth="3"/></>}</svg><figcaption>{grain?'Illustrative material forms':'Illustrative fragment · no inscription reproduced'}</figcaption></figure>;
}
