import { useLayoutEffect, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Footprints, MessageCircle, Search, Sparkles, ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cameFrom } from "@/lib/came-from";
import { personPath } from "@/lib/people-pages-index";
import index from "@/data/long-memory/index.json";
import "./long-memory.css";
import { LongMemoryChartTransition } from "./LongMemoryChartTransition";

type Mode = "mentions" | "words" | "moments" | "memory";
type Point = {id:number;b:number;c:number;v:number;n:number;text:string};
type Passage = {title:string;refs:number[]};
type MemoryData = {mentions:number[];lenses:Record<Exclude<Mode,"mentions">,Passage[]>;points:Point[]};
const files = import.meta.glob<{default:MemoryData}>("/src/data/long-memory/*.json");
const cache = new Map<string,MemoryData>();
const MODES = [
  {id:"mentions",label:"Mentions",icon:Search,description:"The indexed verses that name this person, including the names and titles assigned to them by the source."},
  {id:"words",label:"Words spoken",icon:MessageCircle,description:"Selected speech, prayer, and first-person writing. Read the surrounding exchange as well as the person’s own words."},
  {id:"moments",label:"Pivotal moments",icon:Footprints,description:"Selected scenes from this life. Whole passages appear here, including verses where the person is not named."},
  {id:"memory",label:"Remembered later",icon:Sparkles,description:"Selected passages that look back, bear witness, or reflect on this person elsewhere in Scripture."},
] as const;
const COLORS:Record<string,string> = {history:"#b67e61",poetry:"#64a799",prophets:"#83a9d8",gospels:"#b29ac9",epistles:"#d7b854",revelation:"#c88391"};
const number = (n:number) => n.toLocaleString("en-US");
const bookFor = (b:number) => index.books.find(book=>book.num===b)!;
const ref = (p:Point) => `${bookFor(p.b).name} ${p.c}:${p.v}`;

function MemoryField({points,selected,onSelect,openBook,onBook,reader}:{points:Point[];selected:number;onSelect:(id:number)=>void;openBook:string;onBook:(book:string)=>void;reader:ReactNode}) {
  const reduced=useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const [width,setWidth] = useState(1100);
  useLayoutEffect(()=>{
    if (!host.current) return;
    setWidth(host.current.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));
    observer.observe(host.current);
    return ()=>observer.disconnect();
  },[]);
  const groups = useMemo(()=>index.books.map(book=>({book,points:points.filter(p=>p.b===book.num)})).filter(g=>g.points.length),[points]);
  const columns = Math.max(1,Math.floor(width/150));
  const rows = Math.ceil(groups.length/columns);
  const perRow = Math.ceil(groups.length/Math.max(1,rows));
  function move(direction:number,focus=false) {
    const next=points[(points.findIndex(p=>p.id===selected)+direction+points.length)%points.length];
    if (!next) return;
    onSelect(next.id);
    if(focus) requestAnimationFrame(()=>host.current?.querySelector<SVGElement>(`[data-verse="${next.id}"]`)?.focus());
  }
  return <div ref={host} className="lm-field" aria-label="Verse light grid" onKeyDown={event=>{
    if((event.target as Element).closest(".lm-point")&&(event.key==="ArrowRight"||event.key==="ArrowLeft")){event.preventDefault();move(event.key==="ArrowRight"?1:-1,true);}
  }}>
    {Array.from({length:rows},(_,row)=>{
      const rowGroups=groups.slice(row*perRow,(row+1)*perRow);
      const expanded=rowGroups.find(g=>String(g.book.num)===openBook);
      return <div className="lm-book-row-group" key={row}><div className="lm-field-row">
      {groups.slice(row*perRow,(row+1)*perRow).map(({book,points:marks})=>{
        const cellWidth=width/Math.min(perRow,groups.length-row*perRow);
        return <div className="lm-book" key={book.num} style={{"--book-color":COLORS[book.section]} as CSSProperties}>
          <svg viewBox={`0 0 ${cellWidth} 142`} role="group" aria-label={`${book.name}: ${marks.length} verses`}>
            {[1,2,3].map(n=><path key={n} d={`M0 ${n*35}H${cellWidth}`} className="lm-guide"/>)}
            {Array.from({length:Math.min(book.chapters,8)-1},(_,i)=><path key={i} d={`M${(i+1)*cellWidth/Math.min(book.chapters,8)} 0V142`} className="lm-guide"/>)}
            {marks.map(p=>{
              const x=8+(p.c-.5)/book.chapters*(cellWidth-16),y=9+(p.v-.5)/p.n*122;
              return <g key={p.id} data-verse={p.id} role="button" tabIndex={selected===p.id?0:-1} aria-label={ref(p)} aria-pressed={selected===p.id}
                className={`lm-point ${selected===p.id?"is-selected":""}`} onClick={()=>onSelect(p.id)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect(p.id);}}}>
                <title>{ref(p)}</title><circle cx={x} cy={y} r="7" className="lm-point-hit"/>
                {selected===p.id&&<circle cx={x} cy={y} r="7" className="lm-point-ring"/>}<circle cx={x} cy={y} r="2.5" className="lm-point-light"/>
              </g>;
            })}
          </svg>
          <button type="button" className="lm-book-band" aria-expanded={openBook===String(book.num)} aria-controls={`lm-expanded-${book.num}`} onClick={()=>onBook(openBook===String(book.num)?"all":String(book.num))}>{book.name}<ChevronDown size={12}/></button>
        </div>;
      })}
    </div>
    <AnimatePresence initial={false}>{expanded&&<motion.div key={expanded.book.num} id={`lm-expanded-${expanded.book.num}`} className="lm-book-expansion" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:reduced?0:.42,ease:[.22,1,.36,1]}}>
      <div className="lm-expanded-inner"><header><div><span className="lm-eyebrow">A closer reading</span><h3>{expanded.book.name} <small>{expanded.points.length} verses</small></h3></div><button type="button" aria-label={`Close ${expanded.book.name}`} onClick={()=>onBook("all")}><X size={19}/></button></header>
      <svg className="lm-expanded-grid" viewBox={`0 0 ${width} 220`} role="group" aria-label={`${expanded.book.name} expanded verse grid`}>
      {Array.from({length:expanded.book.chapters},(_,i)=>{const x=12+(i+.5)/expanded.book.chapters*(width-24);return <g key={i}><path d={`M${x} 0V190`} className="lm-guide"/>{(width/expanded.book.chapters>18||i%5===0)&&<text x={x} y="211" textAnchor="middle">{i+1}</text>}</g>;})}
      {expanded.points.map(p=>{const x=12+(p.c-.5)/expanded.book.chapters*(width-24),y=12+(p.v-.5)/p.n*167;return <g key={p.id} role="button" tabIndex={selected===p.id?0:-1} aria-label={ref(p)} aria-pressed={selected===p.id} className="lm-point" onClick={()=>onSelect(p.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onSelect(p.id);}}}><title>{ref(p)}</title><circle className="lm-point-hit" cx={x} cy={y} r="8"/>{selected===p.id&&<circle className="lm-point-ring" cx={x} cy={y} r="8"/>}<circle className="lm-point-light" cx={x} cy={y} r="3"/></g>;})}</svg><p className="lm-chapter-label">Chapters</p>{reader}</div>
    </motion.div>}</AnimatePresence></div>;})}
  </div>;
}

export default function LongMemoryPage() {
  const [params,setParams] = useSearchParams();
  const person = index.people.find(p=>p.key===params.get("person"))??index.people[0];
  const mode:Mode = MODES.find(m=>m.id===params.get("lens"))?.id??"mentions";
  const [loaded,setLoaded] = useState<{key:string;data:MemoryData}|null>(null);
  const [error,setError] = useState(false);
  const [book,setBook] = useState("all");
  const [selected,setSelected] = useState(0);
  const [passage,setPassage] = useState(-1);
  const data=loaded?.key===person.key?loaded.data:cache.get(person.key);
  useEffect(()=>{
    let live=true;setError(false);
    const load=files[`/src/data/long-memory/${person.key}.json`];
    if(!cache.has(person.key)) void load().then(module=>{cache.set(person.key,module.default);if(live)setLoaded({key:person.key,data:module.default});}).catch(()=>{if(live)setError(true);});
    return()=>{live=false;};
  },[person.key]);
  useEffect(()=>{setBook("all");setPassage(-1);setSelected(0);},[person.key,mode]);
  const passages = data&&mode!=="mentions"?data.lenses[mode]:[];
  const points = useMemo(()=>{
    if(!data)return [];
    const ids=new Set(mode==="mentions"?data.mentions:(passage<0?data.lenses[mode]:[data.lenses[mode][passage]]).flatMap(p=>p?.refs??[]));
    return data.points.filter(p=>ids.has(p.id));
  },[data,mode,passage]);
  const books=index.books.filter(b=>points.some(p=>p.b===b.num));
  const filtered=useMemo(()=>points.filter(p=>book==="all"||p.b===Number(book)),[points,book]);
  const current=filtered.find(p=>p.id===selected)??filtered[0];
  const position=current?filtered.indexOf(current):0;
  const update=(key:string,value:string)=>{setBook("all");setPassage(-1);setSelected(0);const next=new URLSearchParams(params);next.set(key,value);setParams(next,{preventScrollReset:true});};
  const shiftPerson=(direction:number)=>update("person",index.people[(index.people.indexOf(person)+direction+index.people.length)%index.people.length].key);
  const reader=(current&&<div className="lm-reader" aria-live="polite"><div className="lm-reader-meta"><span><BookOpen size={16}/> {ref(current)} <small>KJV</small></span><div><button type="button" aria-label="Previous verse" disabled={position===0} onClick={()=>setSelected(filtered[position-1].id)}><ArrowLeft size={17}/></button><span>{position+1} / {number(filtered.length)}</span><button type="button" aria-label="Next verse" disabled={position===filtered.length-1} onClick={()=>setSelected(filtered[position+1].id)}><ArrowRight size={17}/></button></div></div><blockquote>{current.text}</blockquote><Link to={`/read/kjv/${bookFor(current.b).code}/${current.c}?hl=${current.v}-${current.v}`}>Read the chapter <ArrowRight size={14}/></Link></div>);
  const chooseBook=(value:string)=>{setBook(value);setSelected(0);if(value==="all")requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`button[aria-controls="lm-expanded-${book}"]`)?.focus({preventScroll:true}));};
  return <main className="long-memory-page" data-memory-ready={Boolean(data)}>
    <div className="lm-breadcrumb"><Link to="/study/theology?area=people"><ArrowLeft size={14}/> People of Scripture</Link><span>A study across the books</span></div>
    <header className="lm-hero lm-person-hero">
      <div><p className="lm-eyebrow">Long Memory · {person.role}</p><h1 id="lm-person-title">{person.name}<em> across Scripture</em></h1><p className="lm-lead">{person.line}</p><Link className="lm-life-link" to={personPath(person.id)} state={cameFrom("Long Memory")}>Explore {person.name} <ArrowRight size={16}/></Link></div>
      <div className="lm-shifter" aria-label="Switch person"><span>Choose a life</span><div><button type="button" aria-label="Previous person" onClick={()=>shiftPerson(-1)}><ArrowLeft size={20}/></button><span>{index.people.indexOf(person)+1} <small>/ {index.people.length}</small></span><button type="button" aria-label="Next person" onClick={()=>shiftPerson(1)}><ArrowRight size={20}/></button></div><small>{number(person.count)} indexed verses · {person.books} books</small></div>
    </header>
    <section className="lm-study" aria-labelledby="lm-person-title">
      <div className="lm-field-frame">
        <div className="lm-menu">
      <nav className="lm-people" aria-label="Choose a life">{index.people.map(p=><button type="button" key={p.key} onClick={()=>update("person",p.key)} aria-pressed={person.key===p.key}><span>{p.name}</span></button>)}</nav>
    </div>
        <div className="lm-field-heading"><div aria-live="polite"><strong>{data?number(points.length):"—"}</strong><span>{mode==="mentions"?"indexed verses":"verses in selected passages"}<small>{books.length} {books.length===1?"book":"books"} · one light, one verse</small></span></div><nav className="lm-lenses" aria-label="Study lens">{MODES.map(m=><button type="button" key={m.id} aria-pressed={mode===m.id} onClick={()=>update("lens",m.id)}><m.icon size={17}/><span>{m.label}</span></button>)}</nav><p className="lm-book-hint">Click a book’s name to unfold it <ChevronDown size={14}/></p></div>
      <LongMemoryChartTransition view={`${person.key}:${mode}:${passage}`} ready={Boolean(data)||error}>
      {passages.length>0&&<div className="lm-passages" aria-label="Selected passages"><button type="button" aria-pressed={passage===-1} onClick={()=>{setPassage(-1);setBook("all");}}>All selected passages</button>{passages.map((p,i)=><button type="button" key={p.title} aria-pressed={passage===i} onClick={()=>{setPassage(i);setBook("all");setSelected(0);}}>{p.title}</button>)}</div>}
        {error?<p className="lm-loading" role="alert">These passages could not be loaded. <button onClick={()=>window.location.reload()}>Try again</button></p>:!data?<p className="lm-loading" role="status">Gathering the points of light…</p>:<MemoryField points={points} selected={current?.id??0} onSelect={id=>{setSelected(id);if(book!=="all")setBook(String(Math.floor(id/1000000)));}} openBook={book} onBook={chooseBook} reader={reader}/>}
        {book==="all"&&reader}
      </LongMemoryChartTransition>
      </div>
      <p className="lm-help">Choose a light to read. Move between verses with the arrow buttons or the keyboard’s left and right arrows while a light is focused.</p>
    </section>
    <footer className="lm-source"><details><summary>About the counts &amp; study lenses</summary><p>These ten people are a featured selection with substantial reference counts, not an exhaustive top-ten ranking. Each mention count is the number of distinct verses assigned to the person in STEP Bible’s TIPNR index, including its name and title identifications. It is not a count of every pronoun, allusion, or occurrence of a word.</p><p>Words spoken, Pivotal moments, and Remembered later are editorial selections: two starting passages per person, with their surrounding context. Their counts describe the verses shown, not all speeches, events, or later references. The lenses can include verses outside the mentions index. “Later” describes reflection or retelling, not a claim about when a book was composed. The KJV calls Joshua “Jesus” in Hebrews 4:8.</p><p>Reference index: <a href="https://github.com/STEPBible/STEPBible-Data" target="_blank" rel="noreferrer">STEP Bible TIPNR</a> (Tyndale House Cambridge), CC BY 4.0, with this site’s catalogue corrections. Verse text: King James Version.</p></details></footer>
  </main>;
}
