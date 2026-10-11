import { ArrowRight, ArrowUpRight, BookOpen, Library, MessageCircle, Route as RouteIcon, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { APOLOGETICS_ANCHOR } from "@/data/apologetics";
import { PATHS, SOURCES, STUDIES, TOPICS, WORLDVIEWS, DEBATES } from "@/data/apologetics-library";
import type { ApNotebook } from "@/lib/apologetics-notebook";
import { ApSourcePolicy, Constellation, PathCard } from "@/components/ApologeticsParts";
import { RefLink } from "@/components/study/StudyParts";
import { REFORMED_LIBRARY } from "@/generated/reading-library";
import { apSourceUrl } from "@/lib/reading-sources";
import "./apologetics-alternate.css";

const base="/apologetics2";
const kinds=SOURCES.filter((source,index)=>SOURCES.findIndex(other=>other.kind===source.kind)===index).slice(0,4);
const featured=REFORMED_LIBRARY.featuredWorkIds.map(id=>REFORMED_LIBRARY.works.find(work=>work.id===id)!).filter(Boolean);

export function ExploreAlternate({book}:{book:ApNotebook}){
  return <div className="ap-alt">
    <header className="ap-alt-hero"><div><p className="ap-eyebrow">Apologetics · a connected way in</p><h1>A reason for <em>the hope.</em></h1><p className="ap-alt-lead">Begin with the question in front of you. Follow it into Scripture, evidence and the people who have thought about it before you.</p><div className="ap-alt-verse"><RefLink span={APOLOGETICS_ANCHOR} label="1 Peter 3:15–16"/><p>Give a reason with gentleness and respect.</p></div></div><Constellation/></header>
    <section className="ap-alt-section"><div className="ap-alt-section-head"><p className="ap-eyebrow">Choose your entrance</p><h2>What brought you here?</h2><p>These are ways through the same collection, not separate libraries.</p></div><div className="ap-alt-doors">
      <Link to={base+"/questions"}><span>01 / ASK</span><Search size={30} strokeWidth={1.2}/><h3>I have a question.</h3><p>Choose one of {TOPICS.length} fields or search all {STUDIES.length} studies. Examine an answer, its objection, and its sources.</p><strong>Explore questions <ArrowRight size={16}/></strong></Link>
      <Link to={base+"/paths"}><span>02 / FOLLOW</span><RouteIcon size={30} strokeWidth={1.2}/><h3>Guide me through.</h3><p>Choose one of {PATHS.length} learning paths. Each orders existing studies so one question can prepare you for the next.</p><strong>Follow a path <ArrowRight size={16}/></strong></Link>
      <Link to={base+"/sources"}><span>03 / EXAMINE</span><Library size={30} strokeWidth={1.2}/><h3>Show me the sources.</h3><p>Open cited records and historic Christian works. See what each source can establish and where the studies use it.</p><strong>Open Sources <ArrowRight size={16}/></strong></Link>
    </div></section>
    <section className="ap-alt-section"><div className="ap-alt-section-head ap-alt-section-head-row"><div><p className="ap-eyebrow">Guided learning</p><h2>Take a route through the questions.</h2></div><Link to={base+"/paths"}>See all {PATHS.length} paths <ArrowUpRight size={15}/></Link></div><div className="ap-path-grid ap-alt-paths">{PATHS.map((path,index)=><PathCard key={path.id} path={path} index={index} book={book}/>)}</div></section>
    <section className="ap-alt-section"><div className="ap-alt-section-head"><p className="ap-eyebrow">Continue the investigation</p><h2>Compare a claim. Examine an exchange.</h2></div><div className="ap-alt-next"><Link to={base+"/worldviews"}><span>WORLDVIEWS</span><h3>Understand another tradition on its own terms.</h3><p>{WORLDVIEWS.length} collections begin with beliefs and texts, then open the connected questions.</p><strong>Explore worldviews <ArrowRight size={15}/></strong></Link><Link to={base+"/debates"}><span>DEBATES</span><MessageCircle size={24} strokeWidth={1.2}/><h3>Follow what each side actually argued.</h3><p>{DEBATES.length} exchanges connect transcripts and claims to the studies underneath.</p><strong>Enter the debate room <ArrowRight size={15}/></strong></Link></div></section>
    <ApSourcePolicy compact/>
  </div>;
}

export function SourcesAlternate(){
  return <div className="ap-alt ap-alt-sources">
    <header className="ap-alt-source-hero"><p className="ap-eyebrow">Sources · a library with a paper trail</p><h1>Read what the answer <em>rests on.</em></h1><p>The studies make claims. Here you can inspect the records they cite and read historic Christian arguments in fuller form. These are different kinds of sources with different roles.</p></header>
    <div className="ap-alt-source-doors">
      <Link to={base+"/source-records"}><span>01 / THE EVIDENCE BEHIND THE STUDIES</span><Library size={34} strokeWidth={1.1}/><h2>Cited records</h2><p>Confessions, manuscripts, religious texts, debate transcripts and other records cited by the question studies and exchanges.</p><div><strong>{SOURCES.length} records</strong><b>Browse cited records <ArrowRight size={16}/></b></div></Link>
      <Link to={base+"/texts"}><span>02 / HISTORIC CHRISTIAN READING</span><BookOpen size={34} strokeWidth={1.1}/><h2>Historic works & authors</h2><p>Read fuller arguments from the Reformed reading library. Each work identifies an edition, author, starting point and connected studies.</p><div><strong>{REFORMED_LIBRARY.works.length} works · {REFORMED_LIBRARY.authors.length} authors</strong><b>Open the reading library <ArrowRight size={16}/></b></div></Link>
    </div>
    <section className="ap-alt-section"><div className="ap-alt-section-head ap-alt-section-head-row"><div><p className="ap-eyebrow">Inside the cited records</p><h2>Different claims need different evidence.</h2></div><Link to={base+"/source-records"}>All records <ArrowUpRight size={15}/></Link></div><div className="ap-alt-source-list">{kinds.map(source=><Link key={source.id} to={apSourceUrl(source.id)}><small>{source.kind}</small><strong>{source.title}</strong><span>{source.author}</span><ArrowUpRight size={16}/></Link>)}</div></section>
    <section className="ap-alt-section"><div className="ap-alt-section-head ap-alt-section-head-row"><div><p className="ap-eyebrow">Inside the historic library</p><h2>Meet an argument in full.</h2></div><Link to={base+"/texts"}>All works & authors <ArrowUpRight size={15}/></Link></div><div className="ap-alt-work-list">{featured.map(work=><Link key={work.id} to={base+"/texts?q="+encodeURIComponent(work.title)}><BookOpen size={22} strokeWidth={1.1}/><h3>{work.title}</h3><p>{work.summary}</p><span>Find the work <ArrowRight size={15}/></span></Link>)}</div></section>
    <div className="ap-alt-return"><div><p className="ap-eyebrow">Follow the citation both ways</p><h2>From a question to its source. From a source back to the question.</h2></div><Link to={base+"/questions"}>Open the question library <ArrowRight size={16}/></Link></div>
    <ApSourcePolicy compact/>
  </div>;
}
