// Section 04: using the tools. The anatomy of a printed entry, the four moves, and the live lookup. The lookup is the Letters study's
// reach and no more: Greek numbers in the 21 letters. A whole-Bible list is not built here (see the research record's boundaries).
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { lemmaById, parseNumber, readerHref } from "./model";
import { Head, Lemma } from "./parts";
import { useLetterLookup, type Found } from "./useLetterLookup";
import { formatNumber, plural } from "@/lib/site-format";

const PARTS = [
  { key: "number", text: "26.", label: "The number", says: "Its place in the list. It finds the entry and says nothing else." },
  { key: "word", text: "ἀγάπη agapē,", label: "The word", says: "The Greek word, then the same word in English letters." },
  { key: "sound", text: "ag-ah'-pay;", label: "How to say it", says: "Strong's guide to the sounds." },
  { key: "history", text: "from 25;", label: "Its history", says: "Where Strong traces the word from. History, and not the sense in any one verse. This is where the third mistake starts." },
  { key: "sense", text: "love, i.e. affection or benevolence; spec. (plur.) a love-feast:", label: "Strong's short sense", says: "A brief sketch by one scholar in 1890. A starting point, and a good one." },
  { key: "renderings", text: "—(feast of) charity ([-ably]), dear, love.", label: "The King James's English", says: "After the mark :— come the words the King James used. Choices, not meanings. This is where the second mistake starts." },
] as const;
type PartKey = (typeof PARTS)[number]["key"];

function Entry() {
  const [chosen, setChosen] = useState<PartKey>("number");
  const part = PARTS.find((p) => p.key === chosen) ?? PARTS[0];
  return <div className="sn-entry">
    <p className="sn-q">What is each part of a dictionary entry telling you? Choose a part. The words are from the page shown in section 01.</p>
    <p className="sn-entry-text">{PARTS.map((p) => <button key={p.key} type="button" aria-pressed={p.key === chosen} aria-label={`${p.label}: ${p.text}`} onMouseEnter={() => setChosen(p.key)} onClick={() => setChosen(p.key)}>{p.text}</button>)}</p>
    <p className="sn-entry-says" aria-live="polite"><b>{part.label}.</b> {part.says}</p>
  </div>;
}

const MOVES: [string, string][] = [
  ["Start in the verse", "Read the verse and the verses around it in your own Bible first. Most questions end here."],
  ["Find the number", "Find the word on a word card, or in a tool that tags the King James. Note that the tag belongs to that translation's English."],
  ["Read the entry for what it is", "Take the sense as a sketch and the list after :— as a record of choices."],
  ["Walk the verses, then come back", "Read other places in their own settings. Then return to your verse and ask what it says."],
];

function Results({ number, verses }: { number: string; verses: Found[] }) {
  const [all, setAll] = useState(false);
  if (!verses.length) return <p className="sn-readout">No King James tag for {number} in the 21 letters. It may still appear elsewhere in the New Testament; this tool reads only the letters.</p>;
  const shown = all ? verses : verses.slice(0, 24);
  return <>
    <p className="sn-readout"><b>{formatNumber(verses.length)}</b> {plural(verses.length, "verse", "verses")} in the 21 letters have a King James tag for {number}. Each link opens in the Berean, which has no tags, so read for the sense.</p>
    <ul className="sn-found">{shown.map((v) => <li key={`${v.code}${v.chapter}:${v.verse}`}><Link to={readerHref(v.code, v.chapter, v.verse)}>{v.book} {v.chapter}:{v.verse}</Link></li>)}</ul>
    {verses.length > shown.length && <button type="button" className="sn-more" onClick={() => setAll(true)}>Show all {verses.length} →</button>}
  </>;
}

function Lookup() {
  const [params, setParams] = useSearchParams();
  const asked = params.get("lookup") ?? "";
  const [typed, setTyped] = useState(asked);
  const [attempt, setAttempt] = useState(0);
  const parsed = parseNumber(asked);
  const lookup = useLetterLookup(parsed.kind === "ok" ? parsed.id : null, attempt);
  const ask = (value: string) => { setTyped(value); setParams((p) => { const q = new URLSearchParams(p); q.set("lookup", value); return q; }, { replace: true, preventScrollReset: true }); };
  const submit = (e: FormEvent) => { e.preventDefault(); ask(typed.trim()); };
  const failedLine = "The verses could not all be read, so no count is shown; a partial list would mislead.";
  return <div className="sn-lookup">
    <p className="sn-kicker">Try it: every verse with this word, in the letters</p>
    <p className="sn-q">This is the site's own lookup, from the Letters study. Which verses in the 21 letters carry this Greek number?</p>
    <form onSubmit={submit}><label htmlFor="sn-number">Greek number</label><input id="sn-number" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="G26" autoComplete="off" spellCheck={false} /><button type="submit">Look up</button></form>
    <div className="sn-presets" role="group" aria-label="Try one of these">{["G26", "G1411", "G3056", "G5368"].map((id) => { const w = lemmaById.get(id); return <button key={id} type="button" aria-pressed={asked === id} onClick={() => ask(id)}>{id}{w && <> · <Lemma lang={w.lang}>{w.lemma}</Lemma></>}</button>; })}</div>
    <div aria-live="polite">
      {parsed.kind === "bad" && <p className="sn-readout">That is not a number. Try G26, or just 26.</p>}
      {parsed.kind === "hebrew" && <p className="sn-readout">{parsed.id} is a Hebrew number. The letters are Greek, so this lookup has nothing to read for it.</p>}
      {parsed.kind === "range" && <p className="sn-readout">Greek numbers run from 1 to 5624; {parsed.n} is outside them.</p>}
      {parsed.kind === "unused" && <p className="sn-readout">{parsed.id} was never given to a word. Strong's Greek numbering skips 2717 and 3203 to 3302.</p>}
      {parsed.kind === "ok" && lookup.status === "loading" && <p className="sn-readout">Reading the 21 letters…</p>}
      {parsed.kind === "ok" && (lookup.status === "incomplete" || lookup.status === "timeout") && <p className="sn-readout">{failedLine} <button type="button" className="sn-more" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p>}
      {parsed.kind === "ok" && lookup.status === "ready" && <Results key={parsed.id} number={parsed.id} verses={lookup.verses} />}
    </div>
  </div>;
}

export function Bench() {
  return <>
    <Head num="04" kicker="Using them well" title={<>Start in the verse.<em> End in the verse.</em></>}
      lead={<>The site's word cards and verse lookup live in the Letters study: <Link to="/study/letters/what-runs-through-them/words">Words across the letters</Link> shows each card's Greek word, its English letters, a short sense and its number. A tool for tapping any word in the reader is not built yet.</>} />
    <Entry />
    <ol className="sn-moves">{MOVES.map(([title, text], i) => <li key={title}><span aria-hidden="true">{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    <Lookup />
  </>;
}
