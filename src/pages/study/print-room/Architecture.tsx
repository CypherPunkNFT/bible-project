// Chapter 04: how a printed page is built. First the page anatomy (PageAnatomy: layers you lift apart and turn off and
// on), then polyglots, then family trees of editions. The timeline links straight to each part.
import { useId } from 'react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';
import { Cites, Pills, SectionHeading } from './PrintRoomShared';
import { PolyglotContext } from './PrintRoomInvestigations';
import { HebrewLineage } from './ProofSheet';
import { PageAnatomy } from './PageAnatomy';
import { usePrintState } from './usePrintState';

const { editions, networks } = dossier;
export type Edition = typeof editions[number];

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

/** Chapter 04: the page anatomy as designed, then its polyglots and family trees, which the timeline links to directly. */
export function Architecture({ edition, choose }: { edition: Edition; choose: (id: string) => void }) {
  return <>
    <PageAnatomy editionId={edition.id} choose={choose}/>
    <section id="polyglots" className="pr-inspection">
      <SectionHeading n="04" kicker="Read the architecture · Polyglots" title={<>Languages <em>alongside languages</em></>}
        text="Several languages in one scholarly instrument: comparison made visible, though not every column is an independent witness."/>
      <Polyglots/>
    </section>
    <section className="pr-inspection">
      <SectionHeading n="04" kicker="Read the architecture · Family trees" title={<>Family trees <em>of editions</em></>}
        text="An edition can inherit a printed text, consult manuscripts, and belong to a revised series. Those are three different connections."/>
      <EditionNetwork/>
    </section>
  </>;
}
