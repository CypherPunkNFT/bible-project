import { HeroStack } from './HeroStack';
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
        <HeroStack />
        <span className="home-hero-coordinate home-coordinate-top" aria-hidden>READ · UNDERSTAND · EXPLORE</span><span className="home-hero-coordinate home-coordinate-bottom" aria-hidden>ONE WORD. MANY WAYS IN.</span>
      </div>
    </section>

    <nav id="explore" className="home-doorways home-wrap" aria-label="Explore the five collections">{HOME_PATHS.map((item) => <Link to={item.to} key={item.title} style={tint(item.color)}><div className="home-doorway-art"><CollectionArtwork kind={item.title} /></div><div className="home-doorway-copy"><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUpRight size={16} aria-hidden /></div></Link>)}</nav>
    </div>
  </div>;
}
