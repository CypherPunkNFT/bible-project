// Chapter 04: how a printed page is built. One chapter with three views on a switch: the pages themselves (layers you turn
// off and on), polyglots, and family trees of editions. The timeline can open any of them (usePrintState 'arch-tab').
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';
import { Cites, Pills, SectionHeading } from './PrintRoomShared';
import { PolyglotContext } from './PrintRoomInvestigations';
import { HebrewLineage } from './ProofSheet';
import { usePrintState } from './usePrintState';

const { editions, networks } = dossier;
export type Edition = typeof editions[number];
type ArchTab = 'pages' | 'polyglot' | 'trees';
/** The six printed editions, in date order, by the short names the timeline uses. */
const EDITION_PILLS = [['gutenberg', '1455 · Gutenberg'], ['complutensian', '1514 · Complutensian'], ['erasmus', '1516 · Erasmus'], ['bomberg', '1524 · Ben Hayyim'], ['bhq', '2004 · BHQ'], ['na28', '2012 · NA28']] as const;
const TABS = [['pages', 'Pages'], ['polyglot', 'Polyglots'], ['trees', 'Family trees']] as const;

// Functional diagrams only. Lines indicate text blocks, never transcribed readings.
function PageModel({ edition, visible }: { edition: Edition; visible: boolean[] }) {
  const uid = useId().replace(/:/g, '');
  const lines = (x: number, y: number, w: number, count: number, gap = 7, heavy = false) => Array.from({ length: count }, (_, i) => <path key={`${x}-${y}-${i}`} d={`M${x} ${y + i * gap}h${w - (i % 5 === 4 ? w * .17 : 0)}`} stroke="currentColor" strokeWidth={heavy ? 2.2 : 1.25} opacity={heavy ? .75 : .5}/>);
  const part = (i: number, children: ReactNode) => <g className="pr-page-layer" data-layer={i} opacity={visible[i] ? 1 : 0}>{children}</g>;
  return <svg viewBox="0 0 360 450" role="img" aria-label={`${edition.name}: schematic page; ${edition.layers.filter((_,i)=>visible[i]).map(l=>l.label).join(', ') || 'all layers hidden'}.`} className="pr-page-model">
    <defs><pattern id={uid} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".45" fill="#705f4220"/></pattern></defs>
    <path d="M23 13H337V433H23Z" fill="#eee4cc" stroke="#a58e66"/>
    <path d="M29 20H332V428H29Z" fill={`url(#${uid})`}/>
    <g fill="none" stroke="#9c8d7155"><path d="M15 35H345M15 410H345M43 5V441M317 5V441" strokeDasharray="2 5"/></g>
    <g color="#403b32">
    {edition.kind === 'gutenberg' && <>
      {part(0,<>{lines(55,76,114,40,7.6,true)}{lines(191,76,114,40,7.6,true)}</>)}
      {part(1,<g fill="#a33d32" color="#a33d32"><rect x="51" y="67" width="37" height="42" fill="#eee4cc"/><text x="54" y="102" fontSize="44" fontFamily="Georgia">I</text><path d="M47 111V60h45M48 61l-5-7m5 15l-8-2" fill="none" stroke="currentColor"/><text x="187" y="185" fontSize="26" fontFamily="Georgia">¶</text></g>)}
      {part(2,<g color="#a33d32"><text x="180" y="49" textAnchor="middle" fontSize="10" letterSpacing="3">LIBER</text><path d="M56 61h75m60 0h67" stroke="currentColor" strokeWidth="2"/></g>)}
    </>}
    {edition.kind === 'bomberg' && <>
      {part(0,<g>{lines(119,117,123,17,8,true)}<text x="180" y="103" textAnchor="middle" fontSize="13">Hebrew text</text></g>)}
      {part(1,<g color="#946325">{lines(121,75,116,4,6)}{lines(100,126,8,20,6)}{lines(252,126,8,20,6)}{lines(119,272,123,5,5)}</g>)}
      {part(2,<g color="#41646a">{lines(53,115,38,37,7)}{lines(272,115,33,37,7)}{lines(109,321,145,9,7)}<text x="180" y="400" textAnchor="middle" fontSize="10">Targum · commentary</text></g>)}
    </>}
    {edition.kind === 'polyglot' && <>
      {part(0,<>{lines(51,96,75,24,8,true)}{lines(237,96,73,24,8,true)}<text x="87" y="72" textAnchor="middle" fontSize="11">Greek</text><text x="273" y="72" textAnchor="middle" fontSize="11">Hebrew</text></>)}
      {part(1,<g color="#a33d32">{lines(145,96,70,24,8)}{lines(51,92,75,24,8)}<text x="179" y="72" textAnchor="middle" fontSize="11">Vulgate</text><text x="87" y="58" textAnchor="middle" fontSize="9">Latin aid</text></g>)}
      {part(2,<g color="#41646a"><path d="M51 304H310" stroke="currentColor"/><text x="109" y="325" textAnchor="middle" fontSize="11">Aramaic</text><text x="246" y="325" textAnchor="middle" fontSize="11">Latin aid</text>{lines(51,341,115,8,7)}{lines(188,341,122,8,7)}</g>)}
    </>}
    {edition.kind === 'erasmus' && <>
      {part(0,<><text x="108" y="67" textAnchor="middle" fontSize="14">Greek</text>{lines(53,89,112,30,7.5,true)}</>)}
      {part(1,<g color="#a33d32"><text x="248" y="67" textAnchor="middle" fontSize="14">Latin</text>{lines(192,89,112,30,7.5)}</g>)}
      {part(2,<g color="#41646a"><path d="M51 336H307" stroke="currentColor" strokeDasharray="4 4"/><text x="180" y="358" textAnchor="middle" fontSize="10">SEPARATE ANNOTATIONES</text>{lines(60,375,240,4,6)}</g>)}
    </>}
    {(edition.kind === 'bhq' || edition.kind === 'na28') && <>
      {part(0,<><text x="180" y="74" textAnchor="middle" fontSize="14">{edition.kind === 'bhq' ? 'Hebrew base text' : 'Edited Greek text'}</text>{lines(80,103,196,23,7.5,true)}</>)}
      {part(1,<g color="#946325">{lines(292,105,16,25,6)}{edition.kind === 'bhq' && <>{lines(78,49,199,3,6)}{lines(79,286,198,3,6)}</>}</g>)}
      {part(2,<g color="#41646a"><path d="M55 321H308" stroke="currentColor"/><text x="180" y="341" textAnchor="middle" fontSize="11">Critical apparatus</text>{lines(55,358,250,8,6)}</g>)}
    </>}
    </g>
    <text x="180" y="423" textAnchor="middle" fill="#76674e" fontSize="7" letterSpacing="2">SCHEMATIC · NOT A FACSIMILE</text>
  </svg>;
}

function Pages({ edition, choose }: { edition: Edition; choose: (id: string) => void }) {
  const [visible,setVisible] = useState([true,true,true]);
  const [activeLayer,setActiveLayer] = useState(0);
  useEffect(()=>{ setVisible([true,true,true]); setActiveLayer(0); },[edition.id]);
  return <>
    <div className="pr-architecture-guide">{[['bomberg','Text with a reading tradition','Masorah, targum and commentary surround the Hebrew text.'],['polyglot','Languages alongside languages','A polyglot makes comparison visible; columns have different functions.'],['bhq','Evidence beneath the text','An apparatus records alternatives without necessarily changing the main text.']].map(([kind,title,text])=>
      <div key={kind}><PageModel edition={editions.find(e=>e.kind===kind)!} visible={[true,true,true]}/><h3>{title}</h3><p>{text}</p></div>)}</div>
    <div className="pr-edition-select"><p className="pr-kicker">Inspect a printed edition</p><Pills label="Printed edition" options={EDITION_PILLS} value={edition.id} onChange={choose}/></div>
    <div id="pr-inspection-panel" className="pr-inspection-panel"><div className="pr-specimen"><div className="pr-specimen-label"><span>{edition.place}</span><span>{edition.language}</span></div><PageModel edition={edition} visible={visible}/><p>Functional diagram · no source image reproduced</p></div>
    <div className="pr-inspection-copy"><p className="pr-kicker">{edition.date} / {edition.place}</p><h3>{edition.name}</h3><p className="pr-claim">{edition.claim}</p><p className="pr-people">{edition.people}</p><div className="pr-layer-controls" role="group" aria-label="Show or hide page layers">{edition.layers.map((l,i)=><button key={l.label} aria-pressed={visible[i]} aria-controls="pr-layer-explanation" onClick={()=>{setActiveLayer(i);setVisible(v=>v.map((on,j)=>j===i?!on:on));}}><span className={`pr-layer-square pr-layer-${i}`}>{visible[i] && <Check size={12}/>}</span>{l.label}<small>{visible[i] ? 'visible' : 'hidden'}</small></button>)}</div><div className="pr-layer-explanation" id="pr-layer-explanation" aria-live="polite"><span className="pr-kicker">Layer {activeLayer+1} · {visible[activeLayer] ? 'visible' : 'hidden'}</span><h4>{edition.layers[activeLayer].title}</h4><p>{edition.layers[activeLayer].text}</p><Cites ids={edition.layers[activeLayer].sourceIds}/></div><p className="pr-note">{edition.limit}</p><Cites ids={edition.sourceIds}/></div></div>
  </>;
}

function EditionNetwork() {
  const [family,setFamily] = usePrintState("family",0);
  const [selected,setSelected] = usePrintState("network-node",networks[0].defaultNode);
  const network = networks[family];
  const selectedNode = (network.nodes.find(n=>n.id===selected) ?? network.nodes[0]);
  const edges = network.edges.filter(e=>e.from===selectedNode.id || e.to===selectedNode.id);
  const uid = useId().replace(/:/g,'');
  return <div id="edition-network" className="pr-network-section">
    <div className="pr-network-top"><Pills label="Choose an edition network" options={networks.map((g,i)=>[i,g.title] as const)} value={family} onChange={i=>{setFamily(i);setSelected(networks[i].defaultNode);}}/><p className="pr-network-intro">{network.intro}</p></div>
    {family===0 ? <HebrewLineage/> : <><div className="pr-graph" role="group" aria-label={`${network.title}: select an edition or witness`}>
      <svg viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true"><defs><marker id={uid} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="none" stroke="currentColor"/></marker></defs>{network.edges.map((e,i)=>{
        const a=network.nodes.find(n=>n.id===e.from)!, b=network.nodes.find(n=>n.id===e.to)!;
        const sameRow=a.y===b.y;
        const ax=a.x*10+(sameRow?85:0), ay=a.y*4.6+(sameRow?0:30), bx=b.x*10-(sameRow?85:0), by=b.y*4.6-(sameRow?0:31);
        const d=sameRow ? `M${ax} ${ay} C${ax+20} ${ay-(b.x-a.x>45?100:0)},${bx-20} ${by-(b.x-a.x>45?100:0)},${bx} ${by}` : `M${ax} ${ay} C${ax} ${(ay+by)/2},${bx} ${(ay+by)/2},${bx} ${by}`;
        return <path key={i} d={d} className={`pr-edge pr-edge-${e.type} ${e.from===selectedNode.id || e.to===selectedNode.id ? 'pr-edge-selected' : ''}`} markerEnd={`url(#${uid})`}/>;
      })}</svg>
      {network.nodes.map(n=><button key={n.id} style={{left:`${n.x}%`,top:`${n.y}%`}} aria-pressed={selectedNode.id===n.id} aria-controls="pr-edge-record" onClick={()=>setSelected(n.id)}><small>{n.date}</small><strong>{n.label}</strong></button>)}
    </div>
    <div className="pr-network-key"><span><i/> Textual basis / influence</span><span><i className="pr-key-collation"/> Collation evidence</span><span><i className="pr-key-series"/> Editorial succession</span></div>
    <div className="pr-edge-record" id="pr-edge-record" aria-live="polite"><div><p className="pr-kicker">Selected record</p><h3>{selectedNode.label}</h3><p>{selectedNode.note}</p></div><ul>{edges.map((e,i)=><li key={i}><span>{network.nodes.find(n=>n.id===e.from)!.label} <b aria-label="to">→</b> {network.nodes.find(n=>n.id===e.to)!.label}</span><strong>{e.label}</strong><Cites ids={e.sourceIds}/></li>)}</ul></div>
    </>}<p className="pr-note">{network.limit} Positions are schematic; spacing does not measure time.</p>
  </div>;
}

function Polyglots() {
  return <>
    <PolyglotContext/>
    <details className="pr-date-note"><summary>Printed first? Published first? Why two dates matter.</summary><div><p>The Complutensian New Testament colophon dates printing to <strong>10 January 1514</strong>. Its Old Testament followed in 1517; papal authorization is dated 1520, and circulation is usually placed around 1522. Erasmus’s edition was available in 1516. “First printed” and “first published” therefore identify different achievements.</p><Cites ids={['complutensian','eton','cambridge']}/></div></details>
  </>;
}

const INTRO: Record<ArchTab, string> = {
  pages: 'Choose a book. Switch its layers off and on. The marks can look equally authoritative while doing very different jobs.',
  polyglot: 'Several languages in one scholarly instrument: comparison made visible, though not every column is an independent witness.',
  trees: 'An edition can inherit a printed text, consult manuscripts, and belong to a revised series. Those are three different connections.',
};

export function Architecture({ edition, choose }: { edition: Edition; choose: (id: string) => void }) {
  const [tab,setTab] = usePrintState<ArchTab>('arch-tab','pages');
  return <section id="page-inspection" className="pr-inspection">
    <SectionHeading n="04" kicker="Read the architecture" title={<>A page is more than <em>its main text</em></>} text={INTRO[tab]}
      aside={<Pills label="Pages, polyglots or family trees" options={TABS} value={tab} onChange={setTab}/>}/>
    {tab === 'pages' && <Pages edition={edition} choose={choose}/>}
    {tab === 'polyglot' && <Polyglots/>}
    {tab === 'trees' && <EditionNetwork/>}
  </section>;
}
