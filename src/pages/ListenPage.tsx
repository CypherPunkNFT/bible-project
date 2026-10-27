import { useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, Headphones, Mail, Music2, Play, Volume2 } from 'lucide-react';
import recordings from '@/data/listen/recordings.json';
import { BibleCardArt } from '@/components/bible/BibleCardArt';
import { AudioBibleCover } from '@/components/bible/AudioBibleCover';
import '@/components/bible/bible-card-art.css';
import './audio-bible.css';
import './listen.css';

const FIRST_BOOKS=['Colossians','Romans','Ephesians'];
const playOrder=(book:typeof recordings.books[number])=>{
 const first=FIRST_BOOKS.indexOf(book.name);
 return first>=0?first:book.group==='epistles'?3:book.group==='revelation'?4:5;
};
const BOOKS=[...recordings.books].sort((a,b)=>playOrder(a)-playOrder(b));
function Youtube({size=18}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/></svg>;}
const GROUPS=[{id:'all',label:'All recordings',count:24},{id:'wisdom',label:'Psalms & Proverbs',count:2},{id:'epistles',label:'Epistles',count:21},{id:'revelation',label:'Revelation',count:1}];
const TONES:Record<string,string>={wisdom:'poetry',epistles:'epistles',revelation:'revelation'};
const LABELS:Record<string,string>={wisdom:'Psalms & Proverbs',epistles:'Epistles',revelation:'Revelation'};
const DESCRIPTIONS:Record<string,string>={Psalms:'Prayers for every season. Make room for the words of praise, lament, and hope.',Proverbs:'Wisdom for ordinary days. Listen to words that shape how we speak, work, and live.',Revelation:'A vision of hope. Listen to the closing book of Scripture.'};
const readCodes:Record<string,string>={Psalms:'PSA',Proverbs:'PRO',Romans:'ROM','1 Corinthians':'1CO','2 Corinthians':'2CO',Galatians:'GAL',Ephesians:'EPH',Philippians:'PHP',Colossians:'COL','1 Thessalonians':'1TH','2 Thessalonians':'2TH','1 Timothy':'1TI','2 Timothy':'2TI',Titus:'TIT',Philemon:'PHM',Hebrews:'HEB',James:'JAS','1 Peter':'1PE','2 Peter':'2PE','1 John':'1JN','2 John':'2JN','3 John':'3JN',Jude:'JUD',Revelation:'REV'};

export default function ListenPage(){
 const [selected,setSelected]=useState(BOOKS[0]);
 const [playing,setPlaying]=useState(false);
 const [filter,setFilter]=useState('all');
 const player=useRef<HTMLElement>(null);
 const activeIndex=BOOKS.findIndex(book=>book.id===selected.id);
 const found=BOOKS.filter(book=>filter==='all'||book.group===filter);
 const watch=`https://www.youtube.com/watch?v=${selected.id}`;
 function select(book:typeof selected,start=false){setSelected(book);setPlaying(start);}
 function playBook(book:typeof selected){select(book,true);player.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 return <div className="listen-page mx-auto max-w-7xl px-4 sm:px-6">
  <nav className="listen-breadcrumb" aria-label="Breadcrumb"><Link to="/bible"><ArrowLeft size={14}/>Bible</Link><span>/</span><span>Listen</span></nav>
  <header className="listen-intro"><div><p className="listen-kicker">Scripture, heard</p><h1>Make room.<br/><em>Listen to the Word.</em></h1><p>Listen to the complete Bible, or explore selected recordings from Streetlights.</p><div className="listen-intro-meta"><span><Headphones size={14}/>The complete ASV</span><span><BookOpen size={14}/>66 books</span><span><Music2 size={14}/>Streetlights selections</span></div></div><div className="listen-heading-art"><BibleCardArt kind="listen" variant="hero"/></div></header>

  <Link className="listen-asv-feature" to="/listen/asv" aria-labelledby="listen-asv-title"><AudioBibleCover compact/><div className="listen-asv-copy"><p className="listen-kicker">Featured / The complete audio Bible</p><h2 id="listen-asv-title">The whole Word.<br/><em>At your own pace.</em></h2><p>The American Standard Version, read by Ron Altman. A complete, freely available Bible to listen to here, from Genesis to Revelation.</p><div className="listen-asv-facts"><span>66 books</span><span>104 hours</span><span>Public domain</span></div><span className="listen-asv-cta"><Play size={14} fill="currentColor"/>Open the ASV playlist<ArrowRight size={16}/></span></div><span className="listen-asv-go" aria-hidden="true"><ArrowRight size={30} strokeWidth={1.6}/></span></Link>
  <section className="listen-streetlights" aria-labelledby="listen-sources-title">
   <header className="listen-sources"><div><p className="listen-kicker">Listen with musical inspiration</p><h2 id="listen-sources-title">From Streetlights,<br/><em>with gratitude.</em></h2><p>These selections come from Streetlights’ audio Bible visualizers on YouTube. Each book opens its own recording.</p></div><div className="listen-selection-reasons"><article><h3><Mail size={22}/><span>Epistles & Revelation</span></h3><p>We love how Streetlights’ cadence and rhythm bring emphasis to the letters and give Revelation’s vivid imagery room to resonate.</p></article><article><h3><Music2 size={22}/><span>Psalms & Proverbs</span></h3><p>The musical setting feels at home with the poetry of Psalms and the memorable wisdom of Proverbs, inviting us to linger with the words.</p></article></div></header>
   <div className="listen-streetlights-card">

  <section ref={player} className="listen-player" aria-label="Bible audio player" style={{'--listen-tone':`var(--${TONES[selected.group]})`} as CSSProperties}>
   <div className="listen-screen">
    <iframe key={selected.id} title={`${selected.name} audio Bible by Streetlights`} src={`https://www.youtube-nocookie.com/embed/${selected.id}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
   </div>
   <div className="listen-player-copy"><p className="listen-kicker">{playing?'Selected recording':'Ready when you are'}<span className="listen-status-dot"/></p><span className="listen-group-label">{LABELS[selected.group]}</span><h2>{selected.name}</h2><p className="listen-book-description">{DESCRIPTIONS[selected.name]??'Letters of faith, grace, and everyday discipleship. Take time to hear the whole book.'}</p><div className="listen-recording-facts"><span><Headphones size={15}/>Streetlights</span><span><Music2 size={15}/>Narration with music</span><span><Volume2 size={15}/>{selected.duration}</span></div><div className="listen-actions"><a href={watch} target="_blank" rel="noopener noreferrer">Open in YouTube <ArrowUpRight size={15}/></a><Link to={`/read/kjv/${readCodes[selected.name]}/1`}><BookOpen size={15}/>Read alongside</Link></div><div className="listen-transport"><button type="button" disabled={activeIndex===0} onClick={()=>select(BOOKS[activeIndex-1],playing)} aria-label="Previous book"><ChevronLeft size={18}/></button><span>{String(activeIndex+1).padStart(2,'0')} <i>/</i> {BOOKS.length} selected books</span><button type="button" disabled={activeIndex===BOOKS.length-1} onClick={()=>select(BOOKS[activeIndex+1],playing)} aria-label="Next book"><ChevronRight size={18}/></button></div></div>
  </section>
  <div className="listen-shelf">
   <div className="listen-filters" role="group" aria-label="Recording collection">{GROUPS.map(group=><button type="button" key={group.id} aria-pressed={filter===group.id} onClick={()=>setFilter(group.id)}>{group.label}<span>{group.count}</span></button>)}</div>
   <div className="listen-book-list">{found.map(book=><button key={book.id} className={`listen-book-row${selected.id===book.id?' is-selected':''}`} type="button" aria-label={`Listen to ${book.name}`} aria-pressed={selected.id===book.id} onClick={()=>playBook(book)} style={{'--book-tone':`var(--${TONES[book.group]})`} as CSSProperties}><span className="listen-row-play">{selected.id===book.id?<Check size={16}/>:<Play size={13}/>}</span><span className="listen-row-name">{book.name}<small>STREETLIGHTS</small></span><span className="listen-duration">{book.duration}</span></button>)}</div>
   <nav className="listen-playlist-links" aria-label="Streetlights playlists"><span><Youtube size={17}/>Explore Streetlights on YouTube</span><a href="https://www.youtube.com/playlist?list=PLzdekiijsY-Io4l4txjh1zNARaNoRQoxK" target="_blank" rel="noopener noreferrer">New Testament playlist<ArrowUpRight size={15}/></a><a href="https://www.youtube.com/playlist?list=PLzdekiijsY-KecBWfn4sA-GKPptBptCV2" target="_blank" rel="noopener noreferrer">Old Testament playlist<ArrowUpRight size={15}/></a><p>Full playlists include books beyond the selections above.</p></nav>
  </div>
   </div>
  </section>

  <section className="listen-later" aria-labelledby="listen-later-title"><p className="listen-kicker">02</p><h2 id="listen-later-title">Audio Bible <em>alternatives.</em></h2>
   <nav className="listen-reading-options" aria-label="More Bible recordings"><a href="https://www.youtube.com/watch?v=jx_65lT1pUc&list=PLs0kYUO87ryQ58A2PZGnrHd4Ie1zFPzbn" target="_blank" rel="noopener noreferrer"><Headphones size={22}/><span><small>A calmer reading</small><strong>Read by David Suchet</strong><p>A steady, non-dramatized reading for time spent listening to Scripture.</p><span className="listen-option-action">Explore the playlist<ArrowUpRight size={15}/></span></span></a><a href="https://www.youtube.com/watch?v=B2tlR3nfzjQ&list=PLHZp_z2RSv22-oT8SQ66ADvEImLMsS8ZD" target="_blank" rel="noopener noreferrer"><Volume2 size={22}/><span><small>Another way to listen</small><strong>Dramatized NIV Bible</strong><p>A dramatized recording for listeners who enjoy a more expressive telling.</p><span className="listen-option-action">Explore the playlist<ArrowUpRight size={15}/></span></span></a></nav>
  </section>
 </div>;
}
