import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUpRight, BookOpen } from "lucide-react";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { loadCreedsIndex } from "@/lib/data";
import { documentTypeLabel, type CreedCard, type CreedFamily, yearWithEra } from "@/lib/creeds";
import { useAsync } from "@/lib/useAsync";
import { CreedFamilyArt } from "./CreedsArt";
import "./creeds.css";
import "./creeds-collection.css";

type Entry = { card: CreedCard; family: CreedFamily };
const tone = (family: CreedFamily) => ({ "--seal-tone": `var(--${family.tone})` }) as CSSProperties;

function ManuscriptArt() {
  return <svg className="cc-manuscript" viewBox="0 0 520 440" fill="none" aria-hidden="true">
    <defs><radialGradient id="creed-glow"><stop stopColor="currentColor" stopOpacity=".1"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
    <circle cx="270" cy="210" r="205" fill="url(#creed-glow)"/>
    <g stroke="currentColor" strokeWidth="1.15">
      <circle cx="270" cy="210" r="165" strokeDasharray="1 9" opacity=".45"/>
      <path d="M111 253V181a159 159 0 0 1 318 0v72" opacity=".28"/>
      <path d="M163 98h194l-18 243H145z" fill="var(--cc-paper)"/>
      <path d="M173 87h194l-18 243H155z" fill="var(--cc-paper)"/>
      <path d="M196 112h143l-13 188H182z" opacity=".35"/>
      <path d="M267 127v33m-13-21h26M206 222h109m-111 12h110m-112 12h108m-110 12h91m-93 12h104m-106 12h75" opacity=".7"/>
      <path d="M359 287c14-53 28-106 81-148-3 55-28 95-65 116m-18 46 59-131m-35 80 3-40m8 19 28-13"/>
      <path d="m294 333-8 53 23-13 19 17 4-57" fill="var(--cc-paper)"/>
      <circle cx="312" cy="326" r="29" fill="var(--cc-paper)"/><circle cx="312" cy="326" r="23" strokeDasharray="2 3"/>
      <path d="M312 312v29m-10-19h20M94 137h17m-8-8v16M410 291h15m-7-7v14M136 310l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM388 95l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM238 42v16m-7-8h14M86 233h-17m379-12h18"/>
    </g>
    <text x="267" y="202" textAnchor="middle" fill="currentColor" fontFamily="Georgia, serif" fontSize="31" letterSpacing="5">CREDO</text>
    <text x="260" y="422" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="3">BELIEVED · CONFESSED · HANDED ON</text>
  </svg>;
}

const scale = [[-1500,0],[100,8],[500,15],[1000,22],[1500,32],[1550,46],[1600,60],[1650,72],[1700,80],[1800,90],[1900,100]];
function position(year: number) {
  for (let i=1;i<scale.length;i++) if (year<=scale[i][0]) return scale[i-1][1]+(year-scale[i-1][0])/(scale[i][0]-scale[i-1][0])*(scale[i][1]-scale[i-1][1]);
  return 100;
}

function Timeline({ entries, onExplore }: { entries: Entry[]; onExplore: (id: string) => void }) {
  const [selected, setSelected] = useState("nicene-creed-381");
  const [hovered, setHovered] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(820);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);
  const active = entries.find(e=>e.card.id===selected) ?? entries[0];
  const layout = useMemo(() => {
    const placed: { entry: Entry; x: number; y: number }[]=[];
    const levels = Array.from({ length: entries.length }, (_, i) => i === 0 ? 0 : Math.ceil(i / 2) * 40 * (i % 2 ? -1 : 1));
    for (const entry of [...entries].filter(e=>e.card.year!==null).sort((a,b)=>a.card.year!-b.card.year!)) {
      const x=34+position(entry.card.year!)*(width-68)/100;
      const y=levels.find(level=>!placed.some(p=>Math.hypot(p.x-x,p.y-level)<36)) ?? 0;
      placed.push({entry,x,y});
    }
    const minY = Math.min(0, ...placed.map(p => p.y));
    const maxY = Math.max(0, ...placed.map(p => p.y));
    return { points: placed.map(p => ({ ...p, y: p.y - minY + 30 })), height: maxY - minY + 94, axis: 30 - minY };
  },[entries,width]);
  return <section className="cc-section" id="creed-timeline" aria-labelledby="cc-time-title">
    <div className="cc-heading"><span className="eyebrow">01 / The faith through time</span><h2 id="cc-time-title">Different centuries.<br/><em>The same enduring questions.</em></h2><p>Explore the documents in their historical moment. Choose a seal to take a closer look.</p></div>
    <div className="cc-timeline">
      <div className="cc-chart-wrap">
        <div className="cc-hover-name" aria-live="polite">{hovered}</div>
        <div ref={chartRef} className="cc-chart" style={{ height: layout.height, "--guide-height": `${layout.height - 72}px` } as CSSProperties} role="group" aria-label="Dated documents">
        <div className="cc-axis" style={{ top: layout.axis }}/>
        {(width < 550 ? [-1500,1500,1700,1900] : [-1500,500,1000,1500,1600,1700,1900]).map(year=><span className="cc-tick" key={year} style={{left:34+position(year)*(width-68)/100}}>{year<0?"1500 BC":`${year} AD`}</span>)}
        {layout.points.map(({entry,x,y})=><button type="button" key={entry.card.id} className={`cc-time-seal ${selected===entry.card.id?"is-selected":""}`} style={{...tone(entry.family),left:x,top:y}} aria-label={`${entry.card.title}, ${yearWithEra(entry.card.yearLabel)}`} aria-pressed={selected===entry.card.id} onClick={()=>setSelected(entry.card.id)} onFocus={()=>setHovered(entry.card.title)} onBlur={()=>setHovered(null)} onPointerEnter={event=>{if(event.pointerType==="mouse")setHovered(entry.card.title);}} onPointerLeave={()=>setHovered(null)}><span aria-hidden="true">{entry.card.title.replace(/^The /,"").split(/[ ’'-]/).filter(Boolean).slice(0,2).map(w=>w[0]).join("")}</span></button>)}
      </div></div>
      <div className="cc-time-detail" style={tone(active.family)}>
        <div className="cc-detail-top"><CreedFamilyArt kind={active.family.art}/><span>{yearWithEra(active.card.yearLabel)}</span></div>
        <span className="cc-small-label">{documentTypeLabel(active.card.documentType)}</span><h3 className={active.card.title.length > 55 ? "cc-long-title" : undefined}>{active.card.title}</h3><p>{active.family.title}</p>
        <div className="cc-detail-figures">{active.card.sections.toLocaleString()} sections <span>·</span> {active.card.references.toLocaleString()} proof-texts</div>
        <Link className="cc-text-link" to={`/study/creeds/${active.card.id}`}>Read the document <ArrowUpRight size={16}/></Link>
        <button className="cc-explore" onClick={()=>{onExplore(active.family.id);document.getElementById("creed-catalogue")?.scrollIntoView({behavior:"instant"});}}>Explore this tradition <ArrowDown size={13}/></button>
      </div>
    </div>
  </section>;
}

function DocumentCard({ entry, featured=false, number }: { entry: Entry; featured?: boolean; number?: number }) {
  const {card,family}=entry;
  return <li className={`cc-document ${featured?"cc-featured-document":""}`} style={tone(family)}><Link to={`/study/creeds/${card.id}`}>
    <div className="cc-book-art"><span className="cc-small-label">{featured?`A place to begin / 0${number}`:documentTypeLabel(card.documentType)}</span><CreedFamilyArt kind={family.art}/><span className="cc-book-date">{yearWithEra(card.yearLabel)}</span><span className="cc-book-rule"/></div>
    <div className="cc-book-copy"><span className="cc-small-label">{featured?documentTypeLabel(card.documentType):family.title}</span><h3>{card.title}</h3><p>{card.sections.toLocaleString()} {card.documentType==="catechism"?"questions & sections":card.sections===1?"section":"sections"}{card.references>0?` · ${card.references.toLocaleString()} proof-texts`:""}</p><span className="cc-text-link">Open and read <ArrowUpRight size={16}/></span></div>
  </Link></li>;
}

export default function CreedsPage() {
  const index=useAsync(loadCreedsIndex,"creeds-index");
  const [params,setParams]=useSearchParams();
  useEffect(()=>{document.title="Catechisms & Creeds · Study · Bible Project";return()=>{document.title="Bible Project";};},[]);
  if(index.status==="loading") return <div className="mx-auto max-w-7xl px-4 py-10"><p className="font-serif text-muted">Opening the collection…</p></div>;
  if(index.status==="error") return <div className="mx-auto max-w-7xl px-4 py-10"><StudyBackLink/><h1>Catechisms &amp; Creeds</h1><p>This collection could not be loaded. Please try again.</p></div>;
  const {families,counts,sources,scripture}=index.value;
  const entries=families.flatMap(family=>family.documents.map(card=>({card,family})));
  const family=families.find(f=>f.id===params.get("family"));
  const pick=(id:string)=>{const next=new URLSearchParams(params);if(id==="all")next.delete("family");else next.set("family",id);setParams(next,{preventScrollReset:true});};
  const found=entries.filter(e=>!family||e.family.id===family.id);
  const featured=["apostles-creed-710","nicene-creed-381","heidelberg-catechism-1563"].map(id=>entries.find(e=>e.card.id===id)).filter((e):e is Entry=>!!e);
  return <div className="creeds-page creed-collection"><div className="cc-container">
    <header className="cc-hero"><div className="cc-hero-copy"><StudyBackLink/><p className="eyebrow">Catechisms &amp; Creeds</p><h1>The faith,<br/><em>said out loud.</em></h1><p className="cc-lead">Words to confess together. Questions to grow into. Explore the creeds, confessions, and catechisms that have given Christian belief a voice across the centuries.</p><nav className="cc-jumps" aria-label="On this page"><a href="#creed-timeline">Through time <ArrowDown size={12}/></a><a href="#creed-first-reads">Begin reading <ArrowDown size={12}/></a><a href="#creed-catalogue">The collection <ArrowDown size={12}/></a></nav></div><ManuscriptArt/></header>
    <dl className="cc-stats">{[[counts.documents,"Historic documents"],[counts.families,"Traditions & families"],[counts.catechisms,"Catechisms"],[counts.references.toLocaleString(),"Scripture proof-texts"]].map(([n,label])=><div key={label}><dd>{n}</dd><dt>{label}</dt></div>)}</dl>
    <Timeline entries={entries} onExplore={pick}/>
    <section className="cc-section" id="creed-first-reads" aria-labelledby="cc-begin-title"><div className="cc-heading cc-heading-row"><div><span className="eyebrow">02 / A few open doors</span><h2 id="cc-begin-title">Start with <em>the familiar.</em></h2></div><p>A short confession, a shared statement of faith, or a catechism to take one question at a time.</p></div><ul className="cc-featured">{featured.map((entry,i)=><DocumentCard key={entry.card.id} entry={entry} featured number={i+1}/>)}</ul></section>
    <section className="cc-section" id="creed-catalogue" aria-labelledby="cc-catalogue-title"><div className="cc-heading"><span className="eyebrow">03 / The complete collection</span><h2 id="cc-catalogue-title">Many traditions.<em> Room to read.</em></h2><p>Browse a family, find a familiar title, or discover a document you have yet to open.</p></div>
      <div className="cc-catalogue">
        <div className="cc-families" role="group" aria-label="Filter by tradition">
          <button className={!family?"active":""} aria-pressed={!family} onClick={()=>pick("all")}><BookOpen size={22}/><span>All documents</span><small>{counts.documents}</small></button>
          {families.map(f=><button key={f.id} className={family?.id===f.id?"active":""} style={tone(f)} aria-pressed={family?.id===f.id} onClick={()=>pick(f.id)}><CreedFamilyArt kind={f.art}/><span>{f.title}</span><small>{f.documents.length}</small></button>)}
        </div>
        <div className="cc-scroll"><ul className="cc-document-grid" aria-label={family?`${family.title} documents`:"All documents"}>{found.map(entry=><DocumentCard key={entry.card.id} entry={entry}/>)}</ul></div>
      </div>
    </section>
    <footer className="cc-sources"><div><span className="eyebrow">Preserved &amp; passed on</span><h2>Old words.<br/><em>Open to everyone.</em></h2><p>The historic texts are credited to their source editions. Find individual attributions and reading notes on each document’s page.</p></div><div><h3>Where these texts come from</h3><ul>{sources.map(s=><li key={s.slug}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={14}/></a><span>{s.publisher?`${s.publisher} · `:""}{s.licence}</span></li>)}<li><a href={scripture.home??"https://berean.bible/"} target="_blank" rel="noopener noreferrer">{scripture.title}<ArrowUpRight size={14}/></a><span>{scripture.licence}</span></li></ul><details><summary>A note on Scripture quotations</summary><p>Scripture is shown in the {scripture.title}, given to the public domain in 2023. Matched quotations use the Berean wording in {counts.quotations.toLocaleString()} places. Where a match could not be made with confidence, the document retains its older wording and the reader explains why. The collection contains {counts.sections.toLocaleString()} questions and sections. Sources, licences, and checksums are recorded in the project’s source register.</p></details></div></footer>
  </div></div>;
}
