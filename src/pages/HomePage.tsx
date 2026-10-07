import { ArrowRight, ArrowUpRight, BookOpen, Compass, GitBranch, Map, Pause, Play } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { lastReadPath } from "@/lib/last-read";
import { BibleShelf, CollectionArtwork, HomeArtwork, OpenBible, QuestionOrbit } from "@/components/home/HomeArtwork";
import { HOME_PATHS, HOME_PREVIEWS, HOME_STUDIES, HOME_TOPICS } from "@/components/home/collection-data";
import "@/components/home/home-hub.css";
import "@/components/home/home-landing-options.css";

const tint = (color: string) => ({ "--home-color": `var(--${color})` } as CSSProperties);

function SectionHeading({ number, label, title, children, to, action }: { number: string; label: string; title: ReactNode; children: ReactNode; to: string; action: string }) {
  return <header className="home-section-heading"><div><p className="home-eyebrow"><span>{number}</span>{label}</p><h2>{title}</h2><p>{children}</p></div><Link className="home-text-link" to={to}>{action}<ArrowUpRight size={17} aria-hidden /></Link></header>;
}

function PreviewMarquee() {
  const [paused, setPaused] = useState(false);
  const [copies, setCopies] = useState(2);
  const viewport = useRef<HTMLDivElement>(null);
  const firstGroup = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = viewport.current;
    const group = firstGroup.current;
    if (!frame || !group) return;
    const measure = () => {
      const width = group.getBoundingClientRect().width;
      if (!width) return;
      // Keep one complete sequence beyond the visible width at every animation phase.
      setCopies(Math.max(2, Math.ceil(frame.clientWidth / width) + 1));
      frame.style.setProperty("--home-marquee-shift", `${-width}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);
  return <section className="home-preview-strip" aria-label="A glimpse of the collections">
    <div className="home-strip-heading"><span>A glimpse of what awaits</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Play collection previews" : "Pause collection previews"}>{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? "Play" : "Pause"}</span></button></div>
    <div className="home-marquee" ref={viewport} data-paused={paused}><div className="home-marquee-track">
      {Array.from({ length: copies }, (_, copy) => <div className="home-marquee-group" ref={copy === 0 ? firstGroup : undefined} key={copy} aria-hidden={copy > 0 ? true : undefined}>
        {HOME_PREVIEWS.map((item) => <Link key={item.to} to={item.to} tabIndex={copy ? -1 : undefined} className="home-preview" style={tint(item.color)} aria-label={item.label}><div><HomeArtwork kind={item.art} /></div><p>{item.label}<ArrowUpRight size={13} aria-hidden /></p><strong>{item.title}</strong></Link>)}
      </div>)}
    </div></div>
  </section>;
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLanding = searchParams.get("landing");
  const landingOptions = ["outline", "gallery", "rail"] as const;
  const comparing = landingOptions.some((option) => option === requestedLanding);
  const landing = comparing ? requestedLanding : "outline";
  const opening = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = document.querySelector("body header");
    if (!header) return;
    const measure = () => opening.current?.style.setProperty("--home-header-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const catalog = useCatalog();
  const last = lastReadPath();
  const [, , slug, code, chapter] = last?.split("/") ?? [];
  const version = catalog.translations.find((item) => item.slug === slug && item.books[code]?.includes(chapter));
  const book = catalog.books.find((item) => item.code === code);
  const resume = version && last ? last : "/read/kjv/JHN/1";
  const resumeLabel = version ? `Continue: ${book?.name ?? code} ${chapter}` : "Begin with John 1";
  const languages = new Set(catalog.translations.map((item) => item.lang)).size;

  return <div className="home-hub" data-landing={landing}>
    <div className="home-opening" ref={opening}>
    {comparing && <nav className="home-landing-options home-wrap" aria-label="Landing designs">
      {landingOptions.map((option, index) => <button key={option} type="button" aria-pressed={landing === option} onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set("landing", option); return next; }, { preventScrollReset: true })}><span>0{index + 1}</span>{option === "outline" ? "Outlined boxes" : option === "gallery" ? "Open gallery" : "Illustrated rail"}</button>)}
    </nav>}
    <section className="home-hero home-wrap" aria-labelledby="home-title">
      <div className="home-hero-copy"><p className="home-eyebrow"><span className="home-live-dot" />The Bible, open to you</p><h1 id="home-title">One Word.<br /><em>A world to<br className="home-hero-break" /> discover.</em></h1><p className="home-hero-lead">Read the Scriptures. Follow the connections.<br />Bring your questions. See the bigger story.</p><div className="home-hero-actions"><Link className="home-button" to={resume}><BookOpen size={17} aria-hidden />{resumeLabel}<ArrowRight size={17} aria-hidden /></Link></div><p className="home-hero-foot">Free to explore. Open to everyone.<span>{catalog.translations.length} Bible versions · {languages} languages</span></p></div>
      <div className="home-hero-art" aria-label="Scripture at the heart of the collection">
        <div className="home-art-orbit home-art-orbit-one" aria-hidden /><div className="home-art-orbit home-art-orbit-two" aria-hidden /><div className="home-art-crosshair" aria-hidden />
        <Link to="/bible" className="home-hero-book" aria-label="Explore the Bible"><OpenBible /></Link>
        <span className="home-hero-coordinate home-coordinate-top" aria-hidden>READ · UNDERSTAND · EXPLORE</span><span className="home-hero-coordinate home-coordinate-bottom" aria-hidden>ONE WORD. MANY WAYS IN.</span>
      </div>
    </section>

    <nav id="explore" className="home-doorways home-wrap" aria-label="Explore the five collections">{HOME_PATHS.map((item) => <Link to={item.to} key={item.title} style={tint(item.color)}><div className="home-doorway-art"><CollectionArtwork kind={item.title} /></div><div className="home-doorway-copy"><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUpRight size={16} aria-hidden /></div></Link>)}</nav>
    </div>
    <PreviewMarquee />

    <div className="home-wrap">
      <section className="home-section" aria-label="Bible preview" style={tint("epistles")}>
        <SectionHeading number="01" label="The Bible" title={<>It begins with <em>the Word.</em></>} to="/bible" action="Explore the Bible">A whole library of Scripture. An open page, just for you.</SectionHeading>
        <div className="home-bible-grid">
          <Link to={resume} className="home-reading-card" aria-label={resumeLabel}><div className="home-card-meta"><BookOpen size={17} /><span>MAKE ROOM TO READ</span><ArrowUpRight size={19} /></div><blockquote>“In the beginning was the Word, and the Word was with God, and the Word was God.”<cite>JOHN 1:1 · KING JAMES VERSION</cite></blockquote><div className="home-card-bottom"><span>Compare versions. Follow references. Keep your place.</span><strong>{version ? "Continue reading" : "Open John 1"}<ArrowRight size={17} /></strong></div></Link>
          <Link to="/library" className="home-library-card" aria-label="Explore the Bible library"><BibleShelf /><div><p className="home-eyebrow">FROM GENESIS TO REVELATION</p><h3>Find your place.</h3><p>{catalog.translations.length} versions. {languages} languages. Every chapter a doorway.</p><span className="home-card-action">Explore the library<ArrowRight size={16} /></span></div></Link>
        </div>
      </section>

      <section className="home-section" aria-label="Study preview" style={tint("gospels")}>
        <SectionHeading number="02" label="Study" title={<>There is more <em>to see.</em></>} to="/study" action="Explore every study">Put the accounts beside one another. Trace a connection. Let the details deepen your reading.</SectionHeading>
        <div className="home-study-grid">{HOME_STUDIES.map((item) => <Link key={item.to} to={item.to} className="home-study-card" style={tint(item.color)}><div className="home-card-meta"><span>{item.note.split(" · ")[0]}</span><ArrowUpRight size={17} /></div><div className="home-study-art"><HomeArtwork kind={item.art} /></div><h3>{item.title}</h3><p>{item.text}</p><div className="home-card-bottom"><span>{item.note}</span><ArrowRight size={16} /></div></Link>)}</div>
      </section>

      <section className="home-section home-apologetics" aria-label="Apologetics preview" style={tint("accent")}>
        <div><p className="home-eyebrow"><span>03</span>Apologetics</p><h2>Bring your<br /><em>hardest questions.</em></h2><p>Faith invites careful thought. Explore the reasons for Christian hope, read historic voices, and learn to speak with conviction and gentleness.</p><Link className="home-button" to="/apologetics">A reason for the hope<ArrowUpRight size={17} /></Link><div className="home-question-links"><Link to="/apologetics/topics/jesus">Who is Jesus?<ArrowUpRight size={14} /></Link><Link to="/apologetics/topics/bible">Can I trust Scripture?<ArrowUpRight size={14} /></Link><Link to="/apologetics/topics/doubt">What do I do with doubt?<ArrowUpRight size={14} /></Link></div></div>
        <div className="home-apologetics-visual"><QuestionOrbit /><div className="home-apologetics-paths"><Link to="/apologetics/paths">Learning paths<ArrowRight size={14} /></Link><Link to="/apologetics/texts">Historic texts<ArrowRight size={14} /></Link><Link to="/apologetics/practice">Practice & conversation<ArrowRight size={14} /></Link></div></div>
      </section>

      <section className="home-section" aria-label="Topics preview" style={tint("prophets")}>
        <SectionHeading number="04" label="Topics" title={<>Follow a subject.<br /><em>Find its Scriptures.</em></>} to="/topics" action="Explore all topics">From the nature of God to the things of daily life. A subject leads to passages; the passages invite you to read.</SectionHeading>
        <div className="home-topics-grid">{HOME_TOPICS.map((item) => <Link to={item.to} key={item.to} className="home-topic-card" style={tint(item.color)}><HomeArtwork kind={item.art} /><div><h3>{item.title}</h3><p>{item.text}</p><ArrowUpRight size={21} /></div></Link>)}</div>
        <nav className="home-topic-trail" aria-label="Subjects to explore"><span>Begin with a word</span>{[["Grace", "grace"], ["Prayer", "prayer"], ["Faith", "faith"], ["Love of God", "love-of-god"], ["Hope", "hope"], ["Heaven", "heaven"]].map(([name, id]) => <Link key={id} to={`/topics/${id}`}>{name}<ArrowUpRight size={12} /></Link>)}</nav>
      </section>

      <section className="home-section" aria-label="Atlas preview" style={tint("poetry")}>
        <SectionHeading number="05" label="Atlas" title={<>Real places.<br /><em>An unfolding story.</em></>} to="/study/atlas" action="Enter the Atlas">Look beyond a name on the page. Explore the land, the cities, and the settings of the biblical story.</SectionHeading>
        <div className="home-atlas-grid"><Link to="/study/atlas/map" className="home-map-card"><div className="home-map-grid" aria-hidden /><div className="home-map-label"><Map size={17} /><span>THE WORLD BEHIND THE WORD</span><ArrowUpRight size={19} /></div><div className="home-map-art"><HomeArtwork kind="atlas" /></div><div className="home-map-copy"><h3>Every place opens a passage.</h3><p>Move closer. Find a place. Read where it appears.</p><span className="home-card-action">Explore the map<ArrowRight size={16} /></span></div><Compass className="home-map-compass" size={68} strokeWidth={.7} aria-hidden /></Link><div className="home-atlas-side">{[{ to: "/study/atlas/cities", title: "Ancient Cities", text: "Enter a city. Understand its setting.", art: "cities", color: "history" }, { to: "/study/atlas/gospels", title: "Gospel Events", text: "Four accounts, rooted in a real world.", art: "gospels", color: "gospels" }].map((item) => <Link to={item.to} key={item.to} style={tint(item.color)}><HomeArtwork kind={item.art} /><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={18} /></Link>)}</div></div>
      </section>

      <section id="about" className="home-about-band" aria-label="An open invitation"><div><p className="home-eyebrow">An open invitation</p><h2>A lifetime of discovery.<br /><em>Freely shared.</em></h2><p>Scripture to read. Questions to explore. Sources you can follow. Built so anyone can begin, and keep going.</p><div className="home-about-links"><Link to="/sources">Sources & references<ArrowUpRight size={14} /></Link><a href="https://github.com/CypherPunkNFT/bible-project" target="_blank" rel="noreferrer">Open source<ArrowUpRight size={14} /></a></div></div><Link className="home-testimonies" to="/testimonies"><GitBranch size={28} strokeWidth={1.3} /><span className="home-eyebrow">Testimonies</span><h3>The story continues<br />in ordinary lives.</h3><p>Explore the testimony collection and the invitation to share your story.</p><span className="home-card-action">Explore testimonies<ArrowRight size={16} /></span></Link></section>
      <div className="home-final"><BookOpen size={22} strokeWidth={1.2} aria-hidden /><p>“Thy word is a lamp unto my feet,<br />and a light unto my path.”</p><Link to="/read/kjv/PSA/119?hl=105">Psalm 119:105<ArrowUpRight size={12} /></Link></div>
    </div>
  </div>;
}
