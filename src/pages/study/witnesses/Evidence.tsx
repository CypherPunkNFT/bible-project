// The parts of the Surviving witnesses page drawn from the open manuscript collection (/study/manuscripts, built by
// scripts/build-manuscripts.py): each witness's photograph, how much survives and from when, how close the copies come
// to the writing, and where they are kept now. The page stands without them; each appears once the collection loads.
// Choosing a manuscript anywhere here opens its record on the Manuscripts page.
import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { MsImage, MsRecord } from '@/lib/manuscripts';
import { Closeness } from '../manuscripts/Closeness';
import { MsContext } from '../manuscripts/context';
import { closenessLead } from '../manuscripts/leads';
import { byDate, formatNumber, isDated, kindOf, mid, ordinal, type MsIndex } from '../manuscripts/model';
import '../manuscripts/manuscripts.css';
import './evidence.css';

export const recordHref = (id: string) => `/study/manuscripts?record=${encodeURIComponent(id)}`;

/** A witness's own photograph, with its credit; the caller draws the schematic form when there is none. */
export function WitnessPhoto({ image, name }: { image: MsImage; name: string }) {
  return <figure className="sw-photo">
    <img src={image.src} width={image.w} height={image.h} alt={`${name}: a page of the manuscript`} loading="lazy" decoding="async"/>
    <figcaption><a href={image.page} target="_blank" rel="noopener noreferrer">{image.by === 'Unknown author' ? 'Photograph' : image.by} · {image.lic} · Wikimedia Commons<span className="sr-only"> (opens in a new tab)</span></a></figcaption>
  </figure>;
}

type Family = 'Greek New Testament' | 'Greek Old Testament' | 'Hebrew Bible' | 'Early translations';
const FAMILIES: { name: Family; colour: string }[] = [
  { name: 'Hebrew Bible', colour: '#81b6a6' },
  { name: 'Greek Old Testament', colour: '#c7a17e' },
  { name: 'Greek New Testament', colour: '#96b8d8' },
  { name: 'Early translations', colour: '#bf9bc8' },
];
const familyOf = (r: MsRecord) => kindOf(r.k).group as Family;
const centuryName = (c: number) => (c < 0 ? `${ordinal(-c)} century BC` : `${ordinal(c + 1)} century`);
const TRANSLATIONS = ['latin', 'syriac', 'coptic', 'gothic', 'armenian', 'georgian', 'geez', 'arabic', 'slavonic'];

/** The oldest dated record of a family; for the Hebrew Bible, only scrolls that hold a biblical book. */
function oldest(index: MsIndex, family: Family) {
  return index.data.records.filter((r) => isDated(r) && familyOf(r) === family && (family !== 'Hebrew Bible' || r.b?.length)).sort(byDate)[0];
}

export function HowMuchSurvives({ index }: { index: MsIndex }) {
  const C = index.data.counts, K = C.byKind;
  const translations = TRANSLATIONS.reduce((sum, k) => sum + (K[k] ?? 0), 0);
  const figures: { family: Family; big: string; label: string; line: string }[] = [
    { family: 'Hebrew Bible', big: formatNumber(K.dss), label: 'scroll records from the Judaean Desert', line: `${formatNumber(C.dssBiblical)} of them hold a book of the Bible. Beside them, ${formatNumber(K.hebrew)} Hebrew codices and ${formatNumber(K.samaritan)} Samaritan Pentateuchs.` },
    { family: 'Greek Old Testament', big: formatNumber(K.lxx), label: 'numbered Greek Old Testament manuscripts', line: `The Septuagint, the Bible of the first Greek-speaking churches. Only ${formatNumber(C.lxxDated)} of these records carry a date.` },
    { family: 'Greek New Testament', big: `≈ ${formatNumber(C.liste.total)}`, label: 'Greek New Testament manuscripts in the official register', line: `${formatNumber(C.gaTotal)} have an open record here, among them ${formatNumber(C.ga.papyrus)} of the ${formatNumber(C.liste.papyrus)} papyri.` },
    { family: 'Early translations', big: formatNumber(translations), label: 'open records of the early translations', line: 'Latin, Syriac, Armenian, Slavonic, Arabic, Georgian, Coptic, Gothic and Ge’ez. The real numbers are far larger: Latin copies alone run to thousands.' },
  ];
  return <section className="sw-count" aria-labelledby="sw-count-title">
    <div className="sw-count-head"><p className="sw-eyebrow">02 / How much survives</p><h2 id="sw-count-title">Thousands of copies.<br/><em>No originals.</em></h2>
      <p>Not one book of the Bible survives in its author’s own hand. What we have are copies, and copies of copies, in more languages and from more centuries than any other ancient text. These are the open records behind this site’s collection.</p></div>
    <div className="sw-count-grid">{figures.map((f) => {
      const colour = FAMILIES.find((x) => x.name === f.family)!.colour, first = oldest(index, f.family);
      return <article key={f.family} style={{ '--fam': colour } as CSSProperties}>
        <span className="sw-eyebrow">{f.family}</span><strong>{f.big}</strong><b>{f.label}</b><p>{f.line}</p>
        {first && <Link to={recordHref(first.i)}><small>Oldest dated here</small>{first.n}, {first.d}<ArrowUpRight size={13}/></Link>}
      </article>;
    })}</div>
    <Centuries index={index}/>
  </section>;
}

/** Every dated record by the century of its date's middle, stacked by family. */
function Centuries({ index }: { index: MsIndex }) {
  const rows = useMemo(() => {
    const by = new Map<number, Record<Family, number>>();
    for (const r of index.data.records) {
      if (!isDated(r)) continue;
      const c = Math.floor(mid(r) / 100), row = by.get(c) ?? { 'Hebrew Bible': 0, 'Greek Old Testament': 0, 'Greek New Testament': 0, 'Early translations': 0 };
      row[familyOf(r)] += 1;
      by.set(c, row);
    }
    const keys = [...by.keys()], low = Math.min(...keys), high = Math.max(...keys);
    return Array.from({ length: high - low + 1 }, (_, i) => {
      const c = low + i, row = by.get(c) ?? { 'Hebrew Bible': 0, 'Greek Old Testament': 0, 'Greek New Testament': 0, 'Early translations': 0 };
      return { c, row, total: Object.values(row).reduce((a, b) => a + b, 0) };
    });
  }, [index]);
  const top = Math.max(...rows.map((r) => r.total));
  const [pointed, setPointed] = useState<(typeof rows)[number] | null>(null);
  const dated = rows.reduce((a, r) => a + r.total, 0);
  const say = pointed ? <><b>{centuryName(pointed.c)}</b>: {formatNumber(pointed.total)} dated {pointed.total === 1 ? 'copy' : 'copies'}{pointed.total ? ` · ${FAMILIES.filter((f) => pointed.row[f.name]).map((f) => `${f.name} ${formatNumber(pointed.row[f.name])}`).join(' · ')}` : ''}</>
    : <>The {formatNumber(dated)} records that carry a date, by century. The scrolls end with the first century; the Greek papyri begin in the second; most copies of everything are mediaeval. Point at a century to count it.</>;
  return <div className="sw-centuries">
    <div className="sw-cent-key">{FAMILIES.map((f) => <span key={f.name}><i style={{ background: f.colour }}/>{f.name}</span>)}</div>
    <div className="sw-cent-bars" role="img" aria-label={`Dated manuscript records by century, ${rows.map((r) => `${centuryName(r.c)} ${r.total}`).join(', ')}`} onPointerLeave={() => setPointed(null)}>
      {rows.map((r) => <div key={r.c} className={`sw-cent${pointed?.c === r.c ? ' sw-cent-on' : ''}`} onPointerEnter={() => setPointed(r)}>
        <span className="sw-cent-stack" style={{ height: `${(r.total / top) * 100}%` }}>{FAMILIES.map((f) => r.row[f.name] ? <i key={f.name} style={{ flexGrow: r.row[f.name], background: f.colour }}/> : null)}</span>
        <small>{r.c === 0 ? 'AD' : r.c < 0 ? `${-r.c} BC` : r.c + 1}</small>
      </div>)}
    </div>
    <p className="sw-cent-say" aria-live="polite">{say}</p>
  </div>;
}

/** The Manuscripts page's own chart of the years between each New Testament book and its oldest copy here. */
export function HowClose({ index }: { index: MsIndex }) {
  const navigate = useNavigate();
  const context = useMemo(() => ({ index, openRecord: (id: string) => navigate(recordHref(id)) }), [index, navigate]);
  return <section className="sw-close" aria-labelledby="sw-close-title">
    <div className="sw-count-head"><p className="sw-eyebrow">03 / How close to the writing</p><h2 id="sw-close-title">The gap between author<br/><em>and oldest copy.</em></h2>
      <p>{closenessLead()} For most ancient books the gap is many centuries; for several New Testament books it is a few generations.</p></div>
    <MsContext.Provider value={context}><div className="ms-root sw-close-chart"><Closeness/></div></MsContext.Provider>
  </section>;
}

export function WhereKept({ index }: { index: MsIndex }) {
  const C = index.data.counts, holders = [...index.data.holders].sort((a, b) => b.n - a.n);
  const cities = new Set(index.data.holders.map((h) => h.city)).size;
  return <section className="sw-kept" aria-labelledby="sw-kept-title">
    <div><p className="sw-eyebrow">05 / Where they are kept now</p><h2 id="sw-kept-title">Scattered like P46,<br/><em>across three continents.</em></h2>
      <p>{formatNumber(C.placed)} records name a library we can place on a map: {formatNumber(C.holders)} libraries, museums and monasteries in {formatNumber(cities)} cities. The largest keepers are national and university libraries that gathered manuscripts from the eastern Mediterranean over the last five centuries.</p>
      <Link className="sw-text-link" to="/study/manuscripts#places">See them on the map <ArrowRight size={14}/></Link></div>
    <ol className="sw-kept-list">{holders.slice(0, 10).map((h, i) => <li key={h.id}><span>{String(i + 1).padStart(2, '0')}</span><b>{h.name}<small>{h.city}</small></b><em>{formatNumber(h.n)}</em><i style={{ width: `${(h.n / holders[0].n) * 100}%` }}/></li>)}</ol>
  </section>;
}

export function OpenCollection({ index }: { index: MsIndex | null }) {
  return <Link className="sw-collection" to="/study/manuscripts">
    <span className="sw-eyebrow">The collection</span>
    <h2>Every manuscript, <em>one by one.</em></h2>
    <p>{index ? `${formatNumber(index.data.records.length)} open records` : 'Over five thousand open records'} through time and book by book, the great witnesses on one shelf, and the libraries that keep them on a map.</p>
    <span>Open the Manuscripts collection <ArrowRight size={17}/></span>
  </Link>;
}
