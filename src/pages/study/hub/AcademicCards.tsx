import { Resource } from '../StudyResourceCards';
import { Icon, StudyLink } from './shared';
import type { STUDY_BRANCHES } from './collections';
import './academic-cards.css';

type Area = (typeof STUDY_BRANCHES)['academic']['areas'][number];
type Drawing = 'tablet'|'map'|'city'|'layers'|'rulers'|'manuscript'|'variants'|'press'|'canon'|'scroll'|'letter'|'language'|'timeline'|'scholars'|'church'|'museum';
const artFor = (href: string): Drawing => {
  if(href.includes('museum-archaeology'))return 'museum';
  if(href.includes('discoveries')||href.includes('from-discovery'))return 'tablet';
  if(href.includes('empires'))return 'map';
  if(href.includes('layers'))return 'layers';
  if(href.includes('world-of')||href.includes('/cities'))return 'city';
  if(href.includes('rulers'))return 'rulers';
  if(href.includes('surviving'))return 'manuscript';
  if(href.includes('passage-through'))return 'variants';
  if(href.includes('printed'))return 'press';
  if(href.includes('canon'))return 'canon';
  if(href.includes('scrolls'))return 'scroll';
  if(href.includes('#timeline'))return 'timeline';
  if(href.includes('versions')||href.includes('/words'))return 'language';
  if(href.includes('/teachers'))return 'scholars';
  if(href.includes('early-church')||href.includes('/read'))return 'church';
  if(href.includes('/atlas'))return 'map';
  return 'letter';
};
const captions:Record<Drawing,string>={tablet:'Objects · Context · Evidence',map:'Places · Relationships · Journeys',city:'Streets · Communities · Daily life',layers:'Layers · Finds · Interpretation',rulers:'Kingdoms · Reigns · People',manuscript:'Pages · Hands · Survival',variants:'Readings · Corrections · Comparison',press:'Manuscript · Type · Printed page',canon:'Lists · Reception · Collections',scroll:'Caves · Scrolls · Fragments',letter:'Writing · Carrying · Reading',language:'Words · Context · Meaning',timeline:'Editions · Dates · Connections',scholars:'People · Works · Ideas',church:'Communities · Reading · Reception',museum:'Museums · Records · Licences'};
const tones=['history','prophets','poetry','epistles','gospels','acts'];

// Promote reviewed, standalone studies only. A working link or an attractive
// title does not make a guide, directory, subsection or outline a full study.
// A finished collection that is plainly not a study carries `collection: true`
// in collections.ts instead, so it gets a card without being called a study.
const standaloneStudies = new Set([
  '/study/from-discovery-to-history',
  '/study/israel-among-the-empires',
  '/study/world-of-jesus-apostles',
  '/study/cities-through-their-layers',
  '/study/surviving-witnesses',
  '/study/passage-through-manuscripts',
  '/study/from-manuscript-to-printed-bible',
  '/study/how-the-canon-took-shape',
  '/study/dead-sea-scrolls',
]);

// Symbolic line drawings, not facsimiles, territorial maps or measured archaeological sections.
function AcademicArtwork({kind}:{kind:Drawing}) {
  const lines=(x:number,y:number,w:number,n=7)=>Array.from({length:n},(_,i)=><path key={`${x}-${y}-${i}`} d={`M${x} ${y+i*9}h${w-i%3*7}`} opacity={i%3===0?.7:.3}/>);
  const book=(x:number,y:number,w=70)=> <g><path d={`M${x} ${y}q${w/4} -12 ${w/2} 0q${w/4} -12 ${w/2} 0v72q-${w/4} -10 -${w/2} 0q-${w/4} -10 -${w/2} 0Z M${x+w/2} ${y}v72`} fill="var(--surface)"/>{lines(x+8,y+15,w/2-15,5)}{lines(x+w/2+8,y+15,w/2-15,5)}</g>;
  return <div className="study-art academic-card-art" aria-hidden="true"><svg viewBox="0 0 360 180" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
    <ellipse cx="180" cy="150" rx="117" ry="12" opacity=".08"/>
    <g className="academic-art-object">
    {kind==='tablet'&&<><path d="M129 145V65a51 51 0 0 1 102 0v80Z" fill="currentColor" fillOpacity=".04"/><path d="M140 134V65a40 40 0 0 1 80 0v69Z" opacity=".3"/>{Array.from({length:6},(_,i)=><g key={i} opacity={.25+i*.09}><path d={`M151 ${69+i*10}h58`} strokeDasharray="5 4 2 5"/><path d={`M155 ${66+i*10}v6m17-6v6m17-6v6m17-6v6`}/></g>)}<path d="m206 114-13 12 8 19M127 152h108"/></>}
    {kind==='map'&&<><path d="m77 42 65-13 72 17 66-12v105l-66 14-72-17-65 13Z" fill="currentColor" fillOpacity=".035"/><path d="M142 29v107m72-90v107" opacity=".3"/><path d="M104 111Q122 53 178 92T255 60" strokeDasharray="4 5"/>{[[104,111],[178,92],[255,60]].map(([x,y])=><g key={x}><circle cx={x} cy={y} r="10" opacity=".25"/><circle cx={x} cy={y} r="3" fill="currentColor"/></g>)}<path d="M260 121v-22m-5 6 5-6 5 6"/></>}
    {kind==='city'&&<><path d="M70 144h220M85 143V80h40v63m8 0V62h53v81m8 0V91h40v52m8 0V71h29v72M78 78l27-18 27 18m-5-19 33-24 33 24"/><path d="M147 143v-30q12-18 24 0v30M96 91h16m-16 13h16m34-29h27m-27 13h27m34 15h16m-16 13h16M77 154h206" opacity=".4"/></>}
    {kind==='layers'&&<>{[0,1,2,3].map(i=><g key={i} opacity={1-i*.18}><path d={`m83 ${49+i*25} 95-24 99 25-97 26Z`} fill="currentColor" fillOpacity=".045"/><path d={`M83 ${49+i*25}v13l97 26 97-26v-12M180 ${75+i*25}v13`}/></g>)}<path d="M118 42V27h26v9m49 1V18h23v24"/><circle cx="209" cy="96" r="5"/><path d="m129 109 13-3 7 7-10 4Z"/></>}
    {kind==='rulers'&&<><path d="m151 59-5-26 19 12 15-23 15 23 19-12-5 26Z" fill="currentColor" fillOpacity=".08"/><path d="M151 67h58M79 103h202m-202 29h202" opacity=".3"/>{[[80,102,49],[137,102,78],[223,102,58],[80,131,83],[172,131,44],[224,131,57]].map(([x,y,w])=><rect key={`${x}-${y}`} x={x} y={y-4} width={w} height="8" rx="2" fill="currentColor" fillOpacity=".3"/>)}</>}
    {kind==='manuscript'&&<><g transform="rotate(-9 172 85)"><path d="M116 22h122v127H116Z" opacity=".4"/></g><path d="m123 25 118 5-3 119-22-4-16 7-20-6-19 8-41-8Z" fill="var(--surface)"/>{lines(136,44,40,10)}{lines(188,44,36,10)}</>}
    {kind==='variants'&&<>{[85,209].map(x=><g key={x}><path d={`M${x} 27h69v117h-69Z`} fill="currentColor" fillOpacity=".04"/>{lines(x+10,44,49,9)}<rect x={x+6} y="75" width="57" height="14" fill="currentColor" fillOpacity=".15"/></g>)}<path d="M163 81h36m-6-5 6 5-6 5"/><path d="M176 37h9m-4-4v8" opacity=".4"/></>}
    {kind==='press'&&<><path d="M108 149V23h144v126M96 149h168M117 34h126M180 34v56m-18-41h36M140 92h80v15h-80ZM126 123h108v13H126Z"/><path d="M134 113h92l-9 9h-92Z" fill="currentColor" fillOpacity=".12"/><path d="M173 39v42m14-42v42" opacity=".3"/>{lines(143,115,52,1)}</>}
    {kind==='canon'&&<>{[0,1,2,3,4,5,6].map(i=><g key={i} transform={i===6?'rotate(-9 258 145)':undefined}><rect x={89+i*25} y={35+i%3*9} width="19" height={110-i%3*9} rx="2" fill="currentColor" fillOpacity={.03+i*.015}/><path d={`M${94+i*25} 126h9M${94+i*25} 58h9`} opacity=".5"/></g>)}<path d="M80 151h201" opacity=".5"/></>}
    {kind==='scroll'&&<><path d="M100 41h153q17 0 17 16v74H119V57q0-16-19-16q-16 0-16 16v14h35M119 131q0 16-17 16h148q20 0 20-16" fill="currentColor" fillOpacity=".035"/>{lines(136,60,114,7)}<path d="m220 47-6 26 6 16-5 31" opacity=".2"/></>}
    {kind==='letter'&&<><g transform="rotate(-7 175 88)"><path d="M105 23h139v126H105Z" fill="currentColor" fillOpacity=".035"/>{lines(121,45,105,8)}<path d="m121 129 18-5 12 5 18-5" opacity=".6"/></g><path d="m256 119 17-82 7-9-1 12-20 81m-2-6 6 1"/><circle cx="270" cy="140" r="12" opacity=".4"/></>}
    {kind==='language'&&<>{book(102,65,156)}<text x="139" y="54" fill="currentColor" stroke="none" fontFamily="Georgia" fontSize="28">א</text><text x="208" y="54" fill="currentColor" stroke="none" fontFamily="Georgia" fontSize="29">α</text><path d="M169 40h25m-5-4 5 4-5 4" opacity=".4"/></>}
    {kind==='timeline'&&<><path d="M72 128h216" opacity=".4"/>{[89,135,180,225,271].map((x,i)=><g key={x}><path d={`M${x} 128V${i%2?47:77}`}/><rect x={x-12} y={i%2?24:54} width="24" height="31" rx="2" fill="var(--surface)"/><path d={`M${x-7} ${i%2?34:64}h14m-14 5h10`} opacity=".5"/><circle cx={x} cy="128" r="3" fill="currentColor"/></g>)}</>}
    {kind==='scholars'&&<>{[111,180,249].map((x,i)=><g key={x} opacity={i===1?1:.45}><circle cx={x} cy={48+i%2*9} r="17"/><path d={`M${x-28} 106q0-33 28-33t28 33`}/>{book(x-24,111,48)}</g>)}</>}
    {kind==='museum'&&<><path d="M62 150h236M78 150V72h32v78m18 0V72h32v78m18 0V72h32v78m18 0V72h32v78" opacity=".55"/><path d="m70 72 110-44 110 44Z" fill="currentColor" fillOpacity=".05"/><path d="m70 72 110-44 110 44Z"/><path d="M140 150V106a40 40 0 0 1 80 0v44Z" fill="var(--surface)"/><path d="M140 150V106a40 40 0 0 1 80 0v44Z"/>{Array.from({length:4},(_,i)=><g key={i} opacity={.3+i*.14}><path d={`M152 ${110+i*9}h56`} strokeDasharray="5 4 2 5"/></g>)}<path d="M66 158h228" opacity=".3"/></>}
    {kind==='church'&&<><path d="M115 145V78l65-42 65 42v67M102 149h156M180 35V13m-9 9h18M163 145v-34q17-25 34 0v34"/><circle cx="180" cy="72" r="10"/><path d="M130 94h16v26h-16Zm84 0h16v26h-16Z" opacity=".5"/><path d="M91 161h179" opacity=".25"/></>}
    </g>
  </svg><span className="study-art-note">{captions[kind]}</span></div>;
}

export function AcademicCards({area}:{area:Area}) {
  const items=[area.featured,...area.items];
  const studies=items.filter(item=>(standaloneStudies.has(item.href)||item.collection) && !item.outline && !item.preview);
  const readings=items.filter(item=>!studies.includes(item));
  return <>
    {studies.length>0 && <ul className="study-resource-grid theology-original-cards academic-original-cards" aria-label={`${area.title} studies`}>
      {studies.map((item,i)=>{const drawing=artFor(item.href);return <Resource key={item.href} to={item.href} title={item.title} description={item.text} source={item.meta??captions[drawing]} number="" category={item.kind} color={tones[(tones.indexOf(area.tone)+i+tones.length)%tones.length]}><AcademicArtwork kind={drawing}/></Resource>;})}
    </ul>}
    {readings.length>0 && <div className="reading-list academic-reading-links"><h3>{area.group}</h3>{readings.map((item,i)=><StudyLink key={item.href} className="reading-row" to={item.href}><span className="reading-n">{String(i+1).padStart(2,'0')}</span><div><small>{item.kind}</small><h4>{item.title}</h4><p>{item.text}</p></div><Icon name="arrowUp"/></StudyLink>)}</div>}
  </>;
}
