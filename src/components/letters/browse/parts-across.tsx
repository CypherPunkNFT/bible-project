import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Claim, Span } from "@/data/letters/types";
import { useKeep } from "../letter-hooks";
import { ClaimText, KeepX, Refs } from "../LetterParts";
import { GROUP_TONE, toneOfLetter, type GroupKey, type LettersData } from "./data";

const chip = (tone: string) => ({ "--chip": `var(--${tone})` }) as CSSProperties;

/** The letters a thread or person runs through, coloured by collection. */
export function LetterChips({ data, codes }: { data: LettersData; codes: string[] }) {
  return <div className="lb-letter-chips">{codes.map((c) => <span key={c} style={chip(toneOfLetter(data, c))}>{data.letter(c).name}</span>)}</div>;
}

/** A list of choices on the left, the chosen one's detail on the right. */
export function Choose<T>({ items, title, count, detail }: { items: T[]; title: (x: T) => ReactNode; count?: (x: T) => ReactNode; detail: (x: T) => ReactNode }) {
  const [i, setI] = useState(0);
  const x = items[Math.min(i, items.length - 1)];
  if (!x) return null;
  return <div className="lb-panel lb-choose"><ol>{items.map((it, n) => <li key={n}><button type="button" aria-pressed={n === i} onClick={() => setI(n)}>
    {title(it)}{count && <span className="lb-count">{count(it)}</span>}</button></li>)}</ol><article className="lb-detail">{detail(x)}</article></div>;
}

/** Torrey's topics on one subject, keeping only their passages in the letters; each links to the whole topic. */
export function TopicList({ data, subcategory }: { data: LettersData; subcategory: string }) {
  const sub = data.browse.christ[subcategory];
  return <><Choose items={sub.topics} title={(t) => t.title} count={(t) => t.n} detail={(t) => <>
    <h4>{t.title}</h4><ul className="lb-points">{t.points.map((p) => <li key={p.text}>{p.text} <Refs refs={p.refs} limit={12} /></li>)}</ul>
    <Link className="lb-open" to={`/topics/${t.id}`}>The whole topic, across the Bible →</Link></>} />
    <p className="lb-caption">From Torrey's New Topical Textbook (public domain), "{sub.title}", keeping only the passages in the twenty-one letters.</p></>;
}

/** One of the threads that run through the collections, with its letters and passages. */
export function ThemeDetail({ data, title }: { data: LettersData; title: string }) {
  const t = data.overview.themes.find((x) => x.title === title);
  if (!t) return null;
  return <div className="lb-panel"><article className="lb-detail"><h4>{t.title}</h4><ClaimText claim={t.claim} /><LetterChips data={data} codes={t.letters} /></article></div>;
}

/** A list of items, each with its claim and the letters it concerns (threads, people, the parts of a letter). */
export function ClaimChooser<T extends { claim: Claim }>({ data, items, title, letters, refs }: { data: LettersData; items: T[]; title: (x: T) => string; letters?: (x: T) => string[]; refs?: (x: T) => Span[] }) {
  return <Choose items={items} title={title} detail={(x) => <><h4>{title(x)}</h4><ClaimText claim={x.claim} />{letters && <LetterChips data={data} codes={letters(x)} />}
    {refs && <p style={{ marginTop: ".6rem" }}><Refs refs={refs(x)} limit={12} /></p>}</>} />;
}

/** Each letter's paragraph on one question (when, or from where), with its sources. */
export function FactsList({ data, field, heading }: { data: LettersData; field: "date" | "writtenFrom"; heading: string }) {
  return <Choose items={data.letters} title={(l) => l.name} detail={(l) => <><h4>{l.name}: {heading}</h4><ClaimText claim={l[field]} /></>} />;
}

/** The Bible's order beside the order of the earliest date proposed for each letter. */
export function OrderSlope({ data }: { data: LettersData }) {
  const keep = useKeep<string>(), bible = data.letters.map((l) => l.code);
  const byDate = [...bible.filter((c) => data.letter(c).date.from).sort((a, b) => (data.letter(a).date.from! - data.letter(b).date.from!) || (data.letter(a).date.to ?? 0) - (data.letter(b).date.to ?? 0)), ...bible.filter((c) => !data.letter(c).date.from)];
  const W = 1000, ROW = 26, H = bible.length * ROW + 30, L = 300, R = 700, y = (i: number) => 30 + i * ROW, k = keep.active;
  return <div className="lb-panel"><div className="lg-figure"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The letters in the Bible's order and by earliest date proposed">
    <text x={L} y={14} textAnchor="end" className="lg-svg-text">IN THE BIBLE</text><text x={R} y={14} className="lg-svg-text">BY EARLIEST DATE PROPOSED</text>
    {bible.map((c, i) => { const j = byDate.indexOf(c), l = data.letter(c), on = !k || k === c;
      return <g key={c} style={{ cursor: "pointer" }} opacity={on ? 1 : 0.2} {...keep.bind(c)}>
        <path d={`M${L + 10} ${y(i)}C${(L + R) / 2} ${y(i)} ${(L + R) / 2} ${y(j)} ${R - 10} ${y(j)}`} stroke={`var(--${toneOfLetter(data, c)})`} strokeWidth={k === c ? 3 : 1.6} fill="none" />
        <text x={L} y={y(i) + 4} textAnchor="end" className="lg-svg-strong">{String(i + 1).padStart(2, "0")} {l.name}</text>
        <text x={R} y={y(j) + 4} className="lg-svg-text">{l.name} · {l.date.from ? `AD ${l.date.from}–${l.date.to}` : "not dated"}</text></g>; })}
  </svg></div>
  <p className="lb-tip">{k ? <><b>{data.letter(k).name}</b>{keep.kept && <KeepX onRelease={keep.release} />} · {bible.indexOf(k) + 1} in the Bible, {byDate.indexOf(k) + 1} by earliest date proposed</>
    : "The Bible puts Paul's letters first, longest to shortest. By the earliest date proposed, James comes first (AD 40), then 1 Thessalonians and Galatians (AD 48). Click a letter."}</p></div>;
}

const ROLES = { secretary: "Secretaries", "own-hand": "In the writer's own hand", carrier: "Carriers", "co-sender": "Co-senders" } as const;
/** The named hands, for the chosen roles: who wrote, who carried, who sent with the writer. */
export function Hands({ data, roles }: { data: LettersData; roles: (keyof typeof ROLES)[] }) {
  const keep = useKeep<number>(), hands = data.overview.hands, h = keep.active !== null ? hands[keep.active] : null;
  return <div className="lb-panel"><div className="lb-hands">{roles.map((role) => <div key={role}><p className="lb-panel-label">{ROLES[role]}</p><ul>
    {hands.map((x, i) => (x.role === role ? <li key={i}><button type="button" aria-pressed={keep.kept === i} style={chip(toneOfLetter(data, x.letter))} {...keep.bind(i)}><b>{x.name}</b><span>{data.letter(x.letter).name}</span></button></li> : null))}</ul></div>)}</div>
    <p className="lb-tip">{h ? <><b>{h.name}</b>{keep.kept !== null && <KeepX onRelease={keep.release} />} · {data.letter(h.letter).name}{h.note ? ` · ${h.note}` : ""}<Refs refs={h.refs} /></> : "Click a name to read what the letter says."}</p></div>;
}

/** Where one letter speaks of another, including letters now lost. */
export function LetterLinks({ data }: { data: LettersData }) {
  const name = (c: string) => (data.letters.some((l) => l.code === c) ? data.letter(c).name : c);
  return <div className="lb-panel"><ul className="lb-ot-list">{data.overview.letterLinks.map((l, i) => <li key={i}><b>{name(l.from)}</b> <span className="lg-muted">→</span> <b>{name(l.to)}</b> <span className="lg-muted">· {l.label}</span>
    <small><ClaimText claim={l.claim} as="span" /></small></li>)}</ul></div>;
}

/** The Old Testament passages quoted in more than one place in the letters. */
export function RepeatedQuotes({ data, label }: { data: LettersData; label: (span: Span) => string }) {
  const by = new Map<string, { from: Span; quotes: { at: Span; note?: string; code: string }[] }>();
  data.letters.forEach((l) => l.otQuotes.forEach((q) => { const k = label(q.from); const e = by.get(k) ?? { from: q.from, quotes: [] }; e.quotes.push({ ...q, code: l.code }); by.set(k, e); }));
  const list = [...by].filter(([, e]) => e.quotes.length > 1).sort((a, b) => b[1].quotes.length - a[1].quotes.length);
  return <><Choose items={list} title={([k]) => k} count={([, e]) => e.quotes.length} detail={([k, e]) => <><h4>{k}</h4>
    <ul className="lb-points">{e.quotes.map((q) => <li key={q.at[0]}><Refs refs={[q.at]} />{q.note ? ` · ${q.note}` : ""}</li>)}</ul>
    <LetterChips data={data} codes={[...new Set(e.quotes.map((q) => q.code))]} /></>} />
    <p className="lb-caption">{list.length} Old Testament passages are quoted in more than one place in the letters.</p></>;
}

const OT_PEOPLE = ["Adam", "Cain", "Enoch", "Noah", "Abraham", "Sarah", "Esau", "Moses", "Rahab", "Elijah (Elias)"];
/** The Old Testament people named in more than one collection. */
export function OtPeople({ data }: { data: LettersData }) {
  const people = data.overview.sharedPeople.filter((p) => OT_PEOPLE.includes(p.name)).sort((a, b) => OT_PEOPLE.indexOf(a.name) - OT_PEOPLE.indexOf(b.name));
  return <ClaimChooser data={data} items={people} title={(p) => p.name} letters={(p) => p.letters} />;
}

/** A labelled bar per letter, coloured by collection; keeping one shows its detail. */
export function LetterBars({ data, value, detail, format = (n) => String(n), hint }: { data: LettersData; value: (code: string) => number; detail: (code: string) => ReactNode; format?: (n: number) => string; hint: string }) {
  const keep = useKeep<string>(), most = Math.max(1, ...data.letters.map((l) => value(l.code))), k = keep.active;
  return <div className="lb-panel"><div className="lb-bars">{data.letters.map((l) => <button key={l.code} type="button" aria-pressed={keep.kept === l.code} style={chip(toneOfLetter(data, l.code))} {...keep.bind(l.code)}>
    <span>{l.name}</span><i style={{ width: `${(value(l.code) / most) * 100}%` }} /><em>{format(value(l.code))}</em></button>)}</div>
    <div className="lb-tip">{k ? <><b>{data.letter(k).name}</b>{keep.kept && <KeepX onRelease={keep.release} />} · {detail(k)}</> : hint}</div></div>;
}

/** Every place the letters name, most named first, with the letters that name it. */
export function PlacesNamed({ data }: { data: LettersData }) {
  const by = new Map<string, { code: string; note?: string; implied?: boolean; refs: Span[] }[]>();
  data.letters.forEach((l) => l.places.forEach((p) => { const k = p.name.replace(/ \(.*\)$/, ""); by.set(k, [...(by.get(k) ?? []), { ...p, code: l.code }]); }));
  const list = [...by].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return <Choose items={list} title={([n]) => n} count={([, xs]) => xs.length} detail={([n, xs]) => <><h4>{n}</h4>
    <ul className="lb-points">{xs.map((x, i) => <li key={i}><b>{data.letter(x.code).name}</b>{x.implied ? " (implied)" : ""}{x.note ? ` · ${x.note}` : ""} <Refs refs={x.refs} limit={3} /></li>)}</ul></>} />;
}

/** The Topics that cite the letters most, each bar split by collection. */
export function TopicsTop({ data }: { data: LettersData }) {
  const keep = useKeep<string>(), list = data.browse.topicsTop, most = list[0]?.total ?? 1, k = list.find((t) => t.id === keep.active);
  const split = (t: (typeof list)[number]) => Object.entries(t.letters).reduce<Record<GroupKey, number>>((m, [c, n]) => ({ ...m, [data.groupOf(c)]: (m[data.groupOf(c)] ?? 0) + n }), {} as Record<GroupKey, number>);
  return <div className="lb-panel"><div className="lb-bars">{list.map((t) => <button key={t.id} type="button" aria-pressed={keep.kept === t.id} {...keep.bind(t.id)}><span>{t.title}</span>
    <span className="lb-stack" style={{ width: `${(t.total / most) * 100}%` }}>{(Object.entries(split(t)) as [GroupKey, number][]).map(([g, n]) => <i key={g} style={{ flexGrow: n, background: `var(--${GROUP_TONE[g]})` }} />)}</span><em>{t.total}</em></button>)}</div>
    <div className="lb-tip">{k ? <><b>{k.title}</b>{keep.kept && <KeepX onRelease={keep.release} />} · {Object.entries(k.letters).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${data.letter(c).name} ${n}`).join(" · ")} · <Link to={`/topics/${k.id}`} className="lg-cite">Open the topic →</Link></>
      : "The Topics that cite the letters most, coloured by collection. Click one."}</div></div>;
}
