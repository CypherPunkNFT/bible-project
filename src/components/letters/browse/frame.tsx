import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CircleCheck, Clock, Cross, Globe2, GitCompare, Lamp, Link as LinkIcon, Mail, Map as MapIcon, PenTool, Route, Split, Star, Tags, Tent, Users, AlignLeft, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Citation } from "@/data/letters/types";
import { CitationProvider } from "../LetterParts";
import { SourcesList } from "../LetterBlocks";
import { drawing } from "./builders";

export const BASE = "/study/letters";
const ICONS = { route: Route, tent: Tent, globe: Globe2, lamp: Lamp, clock: Clock, map: MapIcon, mail: Mail, pen: PenTool, star: Star, link: LinkIcon, users: Users,
  compare: GitCompare, bars: AlignLeft, split: Split, check: CircleCheck, book: BookOpen, cross: Cross, tags: Tags } satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof ICONS;
const pad2 = (n: number) => String(n).padStart(2, "0");
const toneStyle = (tone: string) => ({ "--tone": `var(--${tone})` }) as CSSProperties;

export function Art({ name, className = "lb-art" }: { name: string; className?: string }) {
  return <svg className={className} viewBox="0 0 480 185" fill="none" strokeLinecap="round" aria-hidden="true">{drawing(name)}</svg>;
}
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={1.5} aria-hidden />;
}

export interface CardDef { art: string; tone: string; icon: IconName; eyebrow: string; title: string; text: string; foot: string; cta: string }
export interface PartDef { id: string; card: CardDef; lead: string; body: ReactNode }
export interface SectionDef { id: string; art: string; tone: string; title: string; lead: string; picker?: boolean; parts: PartDef[] }
/** A collection, or one of the four ways in: a title, a figures bar, and three rows of four cards. */
export interface PageDef {
  slug: string; title: string; crumb: string; right: string; tone: string; kicker: string; h1: string; em: string; intro: string;
  emblem: IconName; caption: string; bar: ReactNode; sections: SectionDef[]; citations: Citation[];
}

export function Card({ card, n, to }: { card: CardDef; n: number; to: string }) {
  return <Link to={to} className="lb-card" style={toneStyle(card.tone)}>
    <div className="lb-card-top"><Icon name={card.icon} /><span>{card.eyebrow}</span><ArrowUpRight size={19} aria-hidden /></div>
    <Art name={card.art} />
    <div><span className="lb-card-num">{pad2(n)}</span><h3>{card.title}</h3><p>{card.text}</p></div>
    <div className="lb-card-foot"><span>{card.foot}</span><strong>{card.cta}<ArrowRight size={15} aria-hidden /></strong></div>
  </Link>;
}

type Row = { id: string; title: string; lead: string; cards: { card: CardDef; to: string }[] };
export function CardRows({ rows, compact }: { rows: Row[]; compact?: boolean }) {
  let n = 0;
  return <>{rows.map((row, r) => <section key={row.id} id={`row-${row.id}`} className="lb-row">
    <div className="lb-row-head"><h2><span>{pad2(r + 1)}</span>{row.title}</h2><p>{row.lead}</p></div>
    <div className={`lb-cards${compact ? " lb-compact" : ""}`}>{row.cards.map(({ card, to }) => <Card key={to} card={card} n={++n} to={to} />)}</div>
  </section>)}</>;
}

export function Crumbs({ parts, right }: { parts: ReactNode[]; right: string }) {
  return <div className="lb-topline"><span className="lb-crumbs"><Link to={BASE}><ArrowLeft size={15} aria-hidden />Letters</Link>
    {parts.map((p, i) => <span key={i} style={{ opacity: 1 }}><span style={{ opacity: .5, marginRight: ".5rem" }}>/</span>{p}</span>)}</span><span>{right}</span></div>;
}

export function Jump({ items }: { items: { id: string; title: string }[] }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return <nav className="lb-jump" aria-label="On this page">{items.map((x, i) => <a key={x.id} href={`#${x.id}`} onClick={(e) => { e.preventDefault(); go(x.id); }}><span>{pad2(i + 1)}</span>{x.title}</a>)}</nav>;
}

function Sources({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return <section className="lb-sources" aria-label="Where this page comes from"><p className="lb-panel-label">Where this page comes from</p><SourcesList citations={citations} /></section>;
}

function Hero({ page }: { page: PageDef }) {
  return <header className="lb-intro to-bar" style={toneStyle(page.tone)}>
    <div className="lb-intro-copy"><p className="lb-kicker">{page.kicker}</p><h1>{page.h1}<br /><em>{page.em}</em></h1><p>{page.intro}</p></div>
    <div className="lb-emblem" aria-hidden="true"><Icon name={page.emblem} size={120} /><span>{page.caption}</span></div>
  </header>;
}

/** A collection or way-in page: title, its bar, and three rows of cards; each card opens its section at its part. */
export function CollectionPage({ page }: { page: PageDef }) {
  const { search } = useLocation();
  const rows = page.sections.map((s) => ({ id: s.id, title: s.title, lead: s.lead, cards: s.parts.map((p) => ({ card: p.card, to: `${BASE}/${page.slug}/${s.id}/${p.id}${search}` })) }));
  return <CitationProvider citations={page.citations}><div className="lb" style={toneStyle(page.tone)}>
    <Crumbs parts={[page.crumb]} right={page.right} />
    <Hero page={page} />
    {page.bar}
    <CardRows rows={rows} compact />
    <Sources citations={page.citations} />
  </div></CitationProvider>;
}

/** A section's own page: where it sits, its title, its four parts one under another, and the way to the other two. */
export function SectionPage({ page, sectionId }: { page: PageDef; sectionId: string }) {
  const { search } = useLocation();
  const s = page.sections.find((x) => x.id === sectionId) ?? page.sections[0], n = page.sections.indexOf(s) + 1;
  return <CitationProvider citations={page.citations}><div className="lb" style={toneStyle(s.tone)}>
    <Crumbs parts={[<Link key="c" to={`${BASE}/${page.slug}${search}`}>{page.title}</Link>, s.title]} right={`SECTION ${pad2(n)} OF ${pad2(page.sections.length)}`} />
    <header className="lb-chapter-head"><div><p className="lb-kicker">{page.title} · {s.parts.map((p) => p.card.eyebrow).join(" · ")}</p><h1>{s.title}</h1><p>{s.lead}</p></div><Art name={s.art} /></header>
    {s.picker && page.bar}
    <Jump items={s.parts.map((p) => ({ id: `part-${p.id}`, title: p.card.title }))} />
    {s.parts.map((p, i) => <section key={p.id} id={`part-${p.id}`} className="lb-part" style={toneStyle(p.card.tone)}>
      <div className="lb-part-head"><span className="lb-part-num">{pad2(i + 1)}</span>
        <div><p className="lb-kicker"><Icon name={p.card.icon} size={14} /> {p.card.eyebrow}</p><h2>{p.card.title}</h2><p>{p.lead}</p></div><Art name={p.card.art} className="lb-part-art" /></div>
      {p.body}
    </section>)}
    <nav className="lb-pager" aria-label="Other sections">{page.sections.filter((x) => x !== s).map((x) => <Link key={x.id} to={`${BASE}/${page.slug}/${x.id}${search}`} style={toneStyle(x.tone)}>
      <Art name={x.art} className="lb-mini" /><span><small>Section</small><b>{x.title}</b></span></Link>)}</nav>
    <Sources citations={page.citations} />
  </div></CitationProvider>;
}

/** The Letters home: the four collections, then four ways in across all twenty-one. */
export function LettersHome({ collections, ways, figures }: { collections: { card: CardDef; to: string }[]; ways: { card: CardDef; to: string }[]; figures: [string, string][] }) {
  const rows = [{ id: "collections", title: "The four collections", lead: "Choose a group to read its letters one at a time.", cards: collections },
    { id: "across", title: "Across all twenty-one", lead: "Four ways to read the letters together.", cards: ways }];
  return <div className="lb">
    <div className="lb-topline"><Link to="/study"><ArrowLeft size={15} aria-hidden />Back to Study</Link><span>LETTERS</span></div>
    <header className="lb-intro">
      <div className="lb-intro-copy"><p className="lb-kicker">Study · New Testament letters</p><h1>Twenty-one letters.<br /><em>Read as they were sent.</em></h1>
        <p>Written to real churches and friends, dictated and signed, carried by hand and read aloud. Choose a collection to read its letters, or a way in to read across all twenty-one.</p></div>
      <div className="lb-emblem" aria-hidden="true"><Mail size={120} strokeWidth={1.5} /><span>WRITTEN · CARRIED · READ ALOUD</span></div>
    </header>
    <dl className="lb-figures">{figures.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}</dl>
    <Jump items={rows.map((r) => ({ id: `row-${r.id}`, title: r.title }))} />
    <CardRows rows={rows} />
    <p className="lb-sources-line">Public-domain works and the biblical text itself; each page lists its sources at its foot.</p>
  </div>;
}
