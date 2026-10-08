// /teachers/preachers, /teachers/authors, /teachers/scholars: a plain-type intro with four small stats, a filter by
// tradition, era and (for scholars) where they come from, and a calm list in which each person opens in place.
// Everything shown is copied or counted from teachers.json; nothing is written about a person by hand.
import { ArrowLeft, ArrowUpRight, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { StationArt } from "@/components/stations/StationArt";
import { SECTIONS, TEACHERS, citedWorks, citingPages, genreCount, readableWorks, inSection, type SectionInfo } from "@/data/teachers";
import type { Section, Teacher } from "@/data/teachers/types";
import "./teachers.css";

const PAGE = 24;
const { labels } = TEACHERS;
const sermons = (t: Teacher) => t.holdings?.genres.find(([g]) => g === "sermon")?.[1] ?? 0;
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const sectionTitle = (s: Section) => SECTIONS.find((x) => x.section === s)!;

function stats(section: Section, people: Teacher[]): [string, number][] {
  if (section === "preacher") return [["Preachers", people.length], ["Sermons held", genreCount(people, ["sermon"])], ["To read here", readableWorks(people)], ["Traditions", new Set(people.flatMap((t) => t.traditions)).size]];
  if (section === "author") return [["Authors", people.length], ["Works held", people.reduce((n, t) => n + (t.holdings?.total ?? 0) - sermons(t), 0)], ["To read here", readableWorks(people)], ["Traditions", new Set(people.flatMap((t) => t.traditions)).size]];
  return [["Scholars", people.length], ["In the library", people.filter((t) => t.origin === "library").length], ["Works cited", citedWorks(people)], ["Pages citing", citingPages(people)]];
}

function summary(section: Section, t: Teacher) {
  const read = t.published.length ? ` · ${t.published.length} to read here` : "";
  if (section === "preacher") return `${plural(sermons(t), "sermon")}${read}`;
  if (t.origin === "cited") return plural(t.cited.length, "work cited", "works cited");
  const held = (t.holdings?.total ?? 0) - (section === "author" ? sermons(t) : 0);
  if (held) return `${plural(held, "work")} held${read}`;
  return `${plural(t.apologetics.length, "piece")} in Apologetics${read}`;
}

export default function TeacherList({ info }: { info: SectionInfo }) {
  const [params, setParams] = useSearchParams();
  const people = useMemo(() => inSection(info.section).sort((a, b) => (a.origin === b.origin ? 0 : a.origin === "library" ? -1 : 1)), [info.section]);
  const tradition = params.get("tradition") ?? "all", era = params.get("era") ?? "all", from = params.get("from") ?? "all", query = (params.get("q") ?? "").trim().toLowerCase();
  const visible = people.filter((t) => (tradition === "all" || t.traditions.includes(tradition)) && (era === "all" || t.era === era) && (from === "all" || t.origin === from) && (!query || t.name.toLowerCase().includes(query)));
  const filterKey = [tradition, era, from, query].join("|");
  const [shown, setShown] = useState({ key: filterKey, count: PAGE });
  const count = shown.key === filterKey ? shown.count : PAGE;
  const [open, setOpen] = useState<string[]>([]);
  useEffect(() => { document.title = `${info.title} · Teachers · Bible Project`; return () => { document.title = "Bible Project"; }; }, [info.title]);
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); if (value && value !== "all") next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const toggle = (id: string) => setOpen((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const traditions = [...new Set(people.flatMap((t) => t.traditions))].sort((a, b) => labels.traditions[a].localeCompare(labels.traditions[b]));
  const eras = [...new Set(people.map((t) => t.era).filter(Boolean) as string[])].sort();
  const firstCited = visible.findIndex((t) => t.origin === "cited");
  return <div className="tl-page mx-auto max-w-7xl px-4 sm:px-6" style={{ "--door": `var(--${info.color})` } as CSSProperties}>
    <nav className="tl-crumbs" aria-label="Teachers sections">
      <Link to="/teachers"><ArrowLeft size={14} aria-hidden="true" />Teachers</Link>
      {SECTIONS.map((s) => <Link key={s.slug} to={`/teachers/${s.slug}`} aria-current={s.slug === info.slug ? "page" : undefined}>{s.title}</Link>)}
    </nav>
    <header className="st-hero tl-hero">
      <div><p className="st-kick">Teachers · {String(SECTIONS.indexOf(info) + 1).padStart(2, "0")}</p><div className="tl-title-row"><h1>{info.title}</h1><span className="tl-hero-art"><StationArt kind={info.art} /></span></div></div>
      <div className="st-side"><p>{info.text}</p><StationStats items={stats(info.section, people)} /><p className="tl-rule">How this list is made: {TEACHERS.rules[info.section].replace(/^Listed as an? \w+ when /, "a person is here when ")}</p></div>
    </header>
    <div className="tl-filters">
      <label className="tl-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Find a name</span><input type="search" value={params.get("q") ?? ""} placeholder="Find a name" onChange={(e) => change("q", e.target.value)} /></label>
      {info.section === "scholar" && <Chips label="From" value={from} onChange={(v) => change("from", v)} options={[["all", "Everyone"], ["library", "In the library"], ["cited", "Cited on our pages"]]} />}
      {traditions.length > 0 && <Chips label="Tradition" value={tradition} onChange={(v) => change("tradition", v)} options={[["all", "Every tradition"], ...traditions.map((id) => [id, labels.traditions[id]] as [string, string])]} />}
      <Chips label="Era" value={era} onChange={(v) => change("era", v)} options={[["all", "Every era"], ...eras.map((id) => [id, labels.eras[id]] as [string, string])]} />
    </div>
    <p className="tl-status" role="status">{plural(visible.length, info.one, info.title.toLowerCase())}{visible.length > count ? ` · showing ${count}` : ""}</p>
    {visible.length === 0 ? <p className="tl-empty">No one matches these filters. <button type="button" onClick={() => setParams({}, { replace: true })}>Clear the filters</button></p> :
      <ol className="tl-list">{visible.slice(0, count).map((t, i) => <TeacherRow key={t.id} teacher={t} section={info.section} open={open.includes(t.id)} onToggle={() => toggle(t.id)} divider={i === firstCited && i > 0 && info.section === "scholar"} />)}</ol>}
    {visible.length > count && <button type="button" className="tl-more" onClick={() => setShown({ key: filterKey, count: count + PAGE })}>Show {Math.min(PAGE, visible.length - count)} more <span>of {visible.length - count}</span></button>}
  </div>;
}

function Chips({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <div className="tl-chips" role="group" aria-label={label}><span>{label}</span>{options.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}</div>;
}

function TeacherRow({ teacher: t, section, open, onToggle, divider }: { teacher: Teacher; section: Section; open: boolean; onToggle: () => void; divider: boolean }) {
  const panel = `tl-panel-${t.id}`;
  return <>
    {divider && <li className="tl-divider" aria-hidden="true"><span>Cited on our study pages</span></li>}
    <li className="tl-row" data-open={open || undefined}>
      <button type="button" className="tl-head" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
        <span className="tl-name">{t.name}</span>
        <span className="tl-when">{t.dates ?? (t.era ? labels.eras[t.era] : "")}</span>
        <span className="tl-trad">{t.traditions.map((id) => labels.traditions[id]).join(" · ") || (t.origin === "cited" ? "Cited on our pages" : "")}</span>
        <span className="tl-sum">{summary(section, t)}</span>
        <Plus className="tl-plus" size={18} aria-hidden="true" />
      </button>
      {open && <TeacherPanel id={panel} teacher={t} section={section} />}
    </li>
  </>;
}

function TeacherPanel({ id, teacher: t, section }: { id: string; teacher: Teacher; section: Section }) {
  const others = t.sections.filter((s) => s !== section);
  return <div id={id} className="tl-panel">
    <div className="tl-col">
      <h3>Why listed here</h3>
      <dl className="tl-basis">{t.sections.map((s) => <div key={s}><dt>{sectionTitle(s).one}</dt><dd>{t.basis[s]}</dd></div>)}</dl>
      {others.length > 0 && <p className="tl-also">Also among the {others.map((s, i) => <span key={s}>{i > 0 && " and "}<Link to={`/teachers/${sectionTitle(s).slug}?q=${encodeURIComponent(t.name)}`}>{sectionTitle(s).title.toLowerCase()}</Link></span>)}.</p>}
      <Record teacher={t} />
    </div>
    <div className="tl-col">
      {t.published.length > 0 && <Block title="Read on this site">
        <ul className="tl-works">{t.published.map((w) => <li key={w.title}><Link to={w.read}>{w.title}</Link>{w.source && <a href={w.source} target="_blank" rel="noreferrer">{w.rights === "public-domain" ? "Public-domain text" : "Text"}<ArrowUpRight size={12} aria-hidden="true" /></a>}</li>)}</ul>
        {t.shelf && <Link className="tl-link" to={t.shelf}>Their shelf in the reading library <ArrowUpRight size={13} aria-hidden="true" /></Link>}
      </Block>}
      {t.holdings && <Block title="In the library’s catalogue">
        <ul className="tl-genres">{t.holdings.genres.map(([g, n]) => <li key={g}><span>{labels.genres[g] ?? g}</span><b>{n.toLocaleString("en-US")}</b></li>)}</ul>
        {t.holdings.sermonBooks > 0 && <p className="tl-note">Sermons with a main text in {plural(t.holdings.sermonBooks, "book")} of the Bible.</p>}
        <p className="tl-note">Catalogued in the library; not published on the site.</p>
      </Block>}
      {t.apologetics.length > 0 && <Block title="On the Apologetics pages">
        <ul className="tl-works">{t.apologetics.map((a) => <li key={a.url}><a href={a.url} target="_blank" rel="noreferrer">{a.title}<ArrowUpRight size={12} aria-hidden="true" /></a>{a.studies.map((s) => <Link key={s.href} className="tl-sub" to={s.href}>{s.label}</Link>)}</li>)}</ul>
      </Block>}
      {t.cited.length > 0 && <Block title="Cited on our pages">
        <ul className="tl-works">{t.cited.map((c) => <li key={c.title}><span className="tl-title">{c.title}{c.year && <small> · {c.year}</small>}</span>{c.urls[0] && <a href={c.urls[0]} target="_blank" rel="noreferrer">Source<ArrowUpRight size={12} aria-hidden="true" /></a>}{c.citedOn.map((o) => <Link key={o.page} className="tl-sub" to={o.address}>{o.page}</Link>)}</li>)}</ul>
      </Block>}
    </div>
  </div>;
}

function Record({ teacher: t }: { teacher: Teacher }) {
  return <dl className="tl-record">
    {t.dates && <div><dt>Dates</dt><dd>{t.dates}</dd></div>}
    {t.traditions.length > 0 && <div><dt>Tradition</dt><dd>{t.traditions.map((id) => labels.traditions[id]).join(", ")}</dd></div>}
    {t.era && <div><dt>Era</dt><dd>{labels.eras[t.era]}{t.eraBasis && <small>{t.eraBasis}</small>}</dd></div>}
    {t.status === "provisional" && <div><dt>Status</dt><dd>Provisional in the library’s author registry: its open questions are still being checked.</dd></div>}
    {t.evidence && <div><dt>Registry evidence</dt><dd><a href={t.evidence.url} target="_blank" rel="noreferrer">{t.evidence.locator}<ArrowUpRight size={12} aria-hidden="true" /></a></dd></div>}
  </dl>;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <section className="tl-block"><h3>{title}</h3>{children}</section>;
}
