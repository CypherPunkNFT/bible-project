import { useState, type CSSProperties } from "react";
import { PassageText } from "@/components/study/StudyParts";
import type { Letter, Named } from "@/data/letters/types";
import { useKeep, useSpanLabel, useVerseIndex, useWordVerses } from "../letter-hooks";
import { ClaimText, KeepX, Refs } from "../LetterParts";

const FACTS = [["author", "Who wrote it"], ["recipients", "To whom"], ["writtenFrom", "From where"], ["date", "When"], ["occasion", "Why"]] as const;
type Tab = (typeof FACTS)[number][0] | "people" | "places";

function Names({ list, empty }: { list: Named[]; empty: string }) {
  if (!list.length) return <p className="lb-fact">{empty}</p>;
  return <ul className="lb-names">{list.map((x) => <li key={x.name}><b>{x.name}</b>{x.implied && <span className="lg-muted"> (implied)</span>}
    {x.note && <small>{x.note}</small>}<Refs refs={x.refs} limit={3} /></li>)}</ul>;
}

/** One letter in one view: figures, the five questions plus who and where it names, its key verses (KJV), its themes. */
export function Glance({ letter }: { letter: Letter }) {
  const [tab, setTab] = useState<Tab>("author");
  const [verse, setVerse] = useState(0);
  const label = useSpanLabel();
  const v = letter.keyVerses[Math.min(verse, letter.keyVerses.length - 1)];
  const tabs: [Tab, string][] = [...FACTS, ["people", `People · ${letter.people.length}`], ["places", `Places · ${letter.places.length}`]];
  return <>
    <dl className="lb-figures">
      <div><dt>Verses</dt><dd>{letter.verses}</dd></div>
      <div><dt>{letter.greekWords ? "Greek words" : "Parts"}</dt><dd>{letter.greekWords ? letter.greekWords.toLocaleString("en-US") : letter.outline.length}</dd></div>
      <div><dt>Key verses</dt><dd>{letter.keyVerses.length}</dd></div><div><dt>Themes</dt><dd>{letter.themes.length}</dd></div>
    </dl>
    <div className="lb-glance">
      <div className="lb-panel"><p className="lb-panel-label">The letter</p>
        <div className="lb-tabs">{tabs.map(([id, name]) => <button key={id} type="button" className="lb-tab" aria-pressed={id === tab} onClick={() => setTab(id)}>{name}</button>)}</div>
        {tab === "people" ? <Names list={letter.people} empty={`${letter.name} names no one but its writer and readers.`} />
          : tab === "places" ? <Names list={letter.places} empty={`${letter.name} names no place.`} />
          : <div className="lb-fact"><ClaimText claim={letter[tab]} /></div>}
      </div>
      <div className="lb-panel"><p className="lb-panel-label">Key verses</p>
        <div className="lb-tabs">{letter.keyVerses.map((k, i) => <button key={k.span.join("-")} type="button" className="lb-tab" aria-pressed={k === v} onClick={() => setVerse(i)}>{label(k.span).replace(`${letter.name} `, "")}</button>)}</div>
        {v && <blockquote className="lb-quote"><PassageText span={v.span} /><cite>{label(v.span)} · KJV</cite></blockquote>}
        {v && <p className="lb-fact" style={{ marginTop: ".6rem" }}>{v.why}</p>}
      </div>
    </div>
    <div className="lb-panel" style={{ marginTop: "1rem" }}><p className="lb-panel-label">Themes</p>
      <ol className="lb-themes">{letter.themes.map((t) => <li key={t.text}><ClaimText claim={t} as="span" /></li>)}</ol></div>
  </>;
}

/** The letter's people and places, on their own (Hebrews' "Who and where" card). */
export function PeoplePlaces({ letter }: { letter: Letter }) {
  return <div className="lb-panel lb-glance" style={{ marginTop: 0 }}>
    <div><p className="lb-panel-label">People named · {letter.people.length}</p><Names list={letter.people} empty="No one named." /></div>
    <div><p className="lb-panel-label">Places named · {letter.places.length}</p><Names list={letter.places} empty="No place named." /></div>
  </div>;
}

const KIND_TONES: Record<string, string> = { teaching: "prophets", practice: "poetry", personal: "acts", praise: "epistles", defence: "history", appeal: "acts", "church order": "gospels",
  charge: "revelation", answer: "prophets", worship: "epistles", encouragement: "poetry", correction: "history", warning: "revelation", prayer: "gospels" };
export const kindTone = (kind?: string) => `var(--${(kind && KIND_TONES[kind]) || "epistles"})`;

/** The letter cut into its parts in our own words, each as long as it is, coloured by what it does. */
export function OutlineBar({ letter }: { letter: Letter }) {
  const index = useVerseIndex(), label = useSpanLabel(), keep = useKeep<number>();
  if (!index) return <div className="lb-panel" style={{ minHeight: 120 }} />;
  const parts = letter.outline, kinds = [...new Set(parts.map((p) => p.kind).filter(Boolean))] as string[];
  const verses = (i: number) => index(parts[i].span[1]) - index(parts[i].span[0]) + 1;
  const k = keep.active !== null ? parts[keep.active] : null;
  return <div className="lb-panel">
    {kinds.length > 0 && <div className="lb-legend">{kinds.map((kind) => <span key={kind}><i style={{ background: kindTone(kind) }} />{kind}</span>)}</div>}
    <div className="lb-outline">{parts.map((p, i) => <button key={p.span[0]} type="button" aria-pressed={keep.kept === i} style={{ flexGrow: verses(i), "--part": kindTone(p.kind) } as CSSProperties} {...keep.bind(i)}><span>{p.title}</span></button>)}</div>
    <p className="lb-tip">{k ? <><b>{k.title}</b>{keep.kept !== null && <KeepX onRelease={keep.release} />} · {label(k.span)} · {verses(parts.indexOf(k))} verses{k.kind ? ` · ${k.kind}` : ""}<Refs refs={[k.span]} /></>
      : `${letter.name} in ${parts.length} parts, each as long as it is, in our own words. Click a part to keep it.`}</p>
  </div>;
}

/** The letter's key Greek words as sized stars; keeping one lists every verse where it stands behind the KJV text. */
export function LetterWords({ letter }: { letter: Letter }) {
  const keep = useKeep<number>(), [all, setAll] = useState(false);
  const most = Math.max(1, ...letter.words.map((w) => w.count));
  const w = keep.active !== null ? letter.words[keep.active] : null;
  const verses = useWordVerses([letter.code], keep.kept !== null ? letter.words[keep.kept].strongs : null);
  return <div className="lb-panel">
    <div className="lb-word-grid">{letter.words.map((word, i) => { const r = 4 + 14 * Math.sqrt(word.count / most);
      return <button key={word.strongs} type="button" aria-pressed={keep.kept === i} {...keep.bind(i)}>
        <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r={r + 4} fill="var(--gospels)" opacity=".15" /><circle cx="20" cy="20" r={r} fill="var(--gospels)" /></svg>
        <span><b>{word.gloss}</b><small>{word.greek} {word.translit} · {word.strongs}</small></span><em>{word.count}</em></button>; })}</div>
    <div className="lb-tip">{w ? <><b>{w.gloss}</b> ({w.greek}, {w.translit}){keep.kept !== null && <KeepX onRelease={() => { keep.release(); setAll(false); }} />}{w.note ? ` · ${w.note}` : ""}
      {keep.kept !== null && (verses === undefined ? <p className="lg-muted">Finding the verses…</p>
        : <p>{verses.length} verses where the KJV text is tagged with this word: <Refs refs={all ? verses : verses.slice(0, 40)} limit={all ? verses.length : 40} />
          {verses.length > 40 && !all && <button type="button" className="lb-tab" onClick={() => setAll(true)}>Show all {verses.length}</button>}</p>)}</>
      : "A bigger star means more uses. Click a word to list every verse it appears in."}</div>
  </div>;
}

/** Each Old Testament quotation, linked to where the letter quotes and to the passage it comes from. */
export function OtList({ letter }: { letter: Letter }) {
  if (!letter.otQuotes.length) return <div className="lb-panel"><p className="lb-fact">{letter.name} quotes no Old Testament passage.</p></div>;
  return <div className="lb-panel"><ul className="lb-ot-list">{letter.otQuotes.map((q) => <li key={`${q.at[0]}-${q.from[0]}`}>
    <Refs refs={[q.at]} /> <span className="lg-muted">quotes</span> <Refs refs={[q.from]} />{q.note && <small>{q.note}</small>}</li>)}</ul></div>;
}
