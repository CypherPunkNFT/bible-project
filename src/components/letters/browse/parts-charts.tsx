import { useState, type CSSProperties } from "react";
import { PassageText } from "@/components/study/StudyParts";
import type { Letter, Network, Parallel } from "@/data/letters/types";
import { useKeep, useSpanLabel, useVerseIndex } from "../letter-hooks";
import { KeepX, Refs } from "../LetterParts";
import { ParallelRibbon } from "../ParallelRibbon";
import { PeopleCards } from "../PeopleCards";
import { toneOfLetter, type LettersData } from "./data";
import { kindTone } from "./builders";
import { LetterWords } from "./parts-letter";

const chip = (tone: string) => ({ "--chip": `var(--${tone})` }) as CSSProperties;

/** A row of buttons choosing which of several charts is shown (pairings, networks). */
function Chooser<T extends { id: string; title: string }>({ items, render }: { items: T[]; render: (x: T) => JSX.Element }) {
  const [id, setId] = useState(items[0]?.id);
  const x = items.find((i) => i.id === id) ?? items[0];
  return <div>{items.length > 1 && <div className="lb-chips" style={{ marginBottom: "1rem" }}>{items.map((i) => <button key={i.id} type="button" className="lb-chip" aria-pressed={i === x} onClick={() => setId(i.id)}>{i.title}</button>)}</div>}
    {x && render(x)}</div>;
}
export const RibbonChooser = ({ parallels }: { parallels: Parallel[] }) => <Chooser items={parallels} render={(p) => <ParallelRibbon key={p.id} parallel={p} />} />;
export const NetworkChooser = ({ networks }: { networks: Network[] }) => <Chooser items={networks} render={(n) => <PeopleCards key={n.id} network={n} />} />;

/** The twenty-one as buttons, for parts that show one letter at a time. */
function LetterRow({ data, code, choose }: { data: LettersData; code: string; choose: (c: string) => void }) {
  return <div className="lb-chips" style={{ marginBottom: ".9rem" }}>{data.letters.map((l) => <button key={l.code} type="button" className="lb-chip" style={chip(toneOfLetter(data, l.code))} aria-pressed={l.code === code} onClick={() => choose(l.code)}>{l.name}</button>)}</div>;
}
export function LetterWordsChooser({ data }: { data: LettersData }) {
  const [code, setCode] = useState("ROM");
  return <><LetterRow data={data} code={code} choose={setCode} /><LetterWords key={code} letter={data.letter(code)} /></>;
}
export function KeyVerses({ data }: { data: LettersData }) {
  const [code, setCode] = useState("ROM"), label = useSpanLabel(), l = data.letter(code);
  return <><LetterRow data={data} code={code} choose={setCode} /><div className="lb-panel"><div className="lb-verse-cards">{l.keyVerses.map((v) => <blockquote key={v.span[0]} className="lb-quote">
    <PassageText span={v.span} /><cite>{label(v.span)} · KJV</cite><small>{v.why}</small></blockquote>)}</div></div></>;
}
export function OnlyHere({ data }: { data: LettersData }) {
  const [code, setCode] = useState("HEB"), list = data.browse.onlyHere[code] ?? [];
  return <><LetterRow data={data} code={code} choose={setCode} /><div className="lb-panel">
    <p className="lb-panel-label">{list.length} Greek words used in {data.letter(code).name} and nowhere else in the New Testament</p>
    <div className="lb-only">{list.slice(0, 60).map((w) => <div key={w.strongs}><b lang="grc">{w.greek}</b><small>{w.strongs}{w.count > 1 ? ` · ${w.count} times` : ""}</small> <Refs refs={w.refs} limit={2} /></div>)}</div>
    {list.length > 60 && <p className="lb-tip">The first 60 of {list.length}, most used first.</p>}
    <p className="lb-caption">Counted in the Byzantine Greek text by Strong's number: a word counts as "only here" when no other New Testament book uses that number.</p></div></>;
}
export function Translations({ data }: { data: LettersData }) {
  const [code, setCode] = useState("ROM"), label = useSpanLabel(), list = data.browse.translations.filter((t) => t.verses[code]);
  return <><LetterRow data={data} code={code} choose={setCode} /><div className="lb-panel"><p className="lb-panel-label">{label(data.letter(code).keyVerses[0].span)} in {list.length} of the site's translations</p>
    <div className="lb-translations">{list.map((t) => <div key={t.slug}><p className="t-name"><b>{t.abbr}</b> {t.name}{t.year ? ` · ${t.year}` : ""} <span>{t.lang}</span></p><p dir={t.dir} lang={t.lang}>{t.verses[code]}</p></div>)}</div></div></>;
}

/** Every pair of letters, shaded by how many cross-references join them. */
export function LinkGrid({ data }: { data: LettersData }) {
  const keep = useKeep<string>(), codes = data.letters.map((l) => l.code), grid = data.browse.grid, max = Math.max(...Object.values(grid));
  const [a, b] = keep.active ? keep.active.split("|") : [];
  return <div className="lb-panel"><div className="lb-scroll"><table className="lb-heat"><thead><tr><th />{codes.map((c) => <th key={c}><span>{data.letter(c).name}</span></th>)}</tr></thead>
    <tbody>{codes.map((r) => <tr key={r}><th>{data.letter(r).name}</th>{codes.map((c) => (r === c ? <td key={c} className="self" /> : <td key={c}>
      <button type="button" title={`${data.letter(r).name} and ${data.letter(c).name}: ${grid[`${r}|${c}`]}`} aria-pressed={keep.kept === `${r}|${c}`}
        style={{ background: `color-mix(in srgb, var(--epistles) ${Math.round(Math.sqrt((grid[`${r}|${c}`] ?? 0) / max) * 100)}%, transparent)` }} {...keep.bind(`${r}|${c}`)} /></td>))}</tr>)}</tbody></table></div>
    <p className="lb-tip">{a ? <><b>{data.letter(a).name} and {data.letter(b).name}</b>{keep.kept && <KeepX onRelease={keep.release} />} · {grid[`${a}|${b}`]} cross-reference links</> : "Each square: how many cross-references join two letters; darker means more. Click a square."}</p>
    <p className="lb-caption">Cross references from OpenBible.info (CC BY), counted in both directions.</p></div>;
}
export function GospelsGrid({ data }: { data: LettersData }) {
  const keep = useKeep<string>(), books = Object.keys(data.browse.gospelNames), g = data.browse.gospels;
  const max = Math.max(...data.letters.flatMap((l) => books.map((b) => g[l.code][b])));
  const [c, b] = keep.active ? keep.active.split("|") : [];
  return <div className="lb-panel"><div className="lb-scroll"><table className="lb-heat wide"><thead><tr><th />{books.map((x) => <th key={x}>{data.browse.gospelNames[x]}</th>)}</tr></thead>
    <tbody>{data.letters.map((l) => <tr key={l.code}><th>{l.name}</th>{books.map((x) => <td key={x}><button type="button" aria-pressed={keep.kept === `${l.code}|${x}`}
      style={{ background: `color-mix(in srgb, var(--gospels) ${Math.round(Math.sqrt(g[l.code][x] / max) * 100)}%, transparent)` }} {...keep.bind(`${l.code}|${x}`)}>{g[l.code][x]}</button></td>)}</tr>)}</tbody></table></div>
    <p className="lb-tip">{c ? <><b>{data.letter(c).name} and {data.browse.gospelNames[b]}</b>{keep.kept && <KeepX onRelease={keep.release} />} · {g[c][b]} cross-reference links</> : "Cross-references from each letter to the four Gospels and Acts. Click a square."}</p></div>;
}

/** Each letter's parts, coloured by what they do (teaching, practice, warning…). */
export function KindBars({ data }: { data: LettersData }) {
  const index = useVerseIndex(), label = useSpanLabel(), keep = useKeep<string>();
  if (!index) return <div className="lb-panel" style={{ minHeight: 320 }} />;
  const verses = (l: Letter, i: number) => index(l.outline[i].span[1]) - index(l.outline[i].span[0]) + 1;
  const longest = Math.max(...data.letters.map((l) => l.verses)), kinds = [...new Set(data.letters.flatMap((l) => l.outline.map((o) => o.kind ?? "not classed")))];
  const [kc, ki] = keep.active ? keep.active.split(":") : [], kept = kc ? data.letter(kc).outline[Number(ki)] : null;
  return <div className="lb-panel"><div className="lb-legend">{kinds.map((k) => <span key={k}><i style={{ background: k === "not classed" ? "var(--line)" : kindTone(k) }} />{k}</span>)}</div>
    <div className="lb-shape">{data.letters.map((l) => <div key={l.code}><span>{l.name}</span><div className="lb-shape-bar" style={{ width: `${(l.verses / longest) * 100}%` }}>
      {l.outline.map((o, i) => <button key={i} type="button" title={o.title} aria-pressed={keep.kept === `${l.code}:${i}`} style={{ flexGrow: verses(l, i), background: o.kind ? kindTone(o.kind) : "var(--line)" }} {...keep.bind(`${l.code}:${i}`)} />)}</div><em>{l.verses}</em></div>)}</div>
    <p className="lb-tip">{kept ? <><b>{kept.title}</b>{keep.kept && <KeepX onRelease={keep.release} />} · {label(kept.span)} · {kept.kind ?? "not classed"}</> : "Each letter's parts, coloured by what they do. Click a part."}</p></div>;
}
