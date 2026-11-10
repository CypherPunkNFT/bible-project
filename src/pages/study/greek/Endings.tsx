// Section 03: one stem with threads to every ending the text really has, then the same endings at work in a real line, where a dotted arc
// runs from each article to its noun. The arcs use STEP's own link field, and are measured from the words as drawn, inside the line's scroller.
import { BibleName, VerseAt } from "@/components/Verse";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { arcPath, caseById, caseOfSlot, D, findLens, findLine, findNoun, G, SLOTS, thousands } from "./model";
import { Cite, Gk, Head, Mixed, VerseLink } from "./parts";
import { plural } from "@/lib/site-format";

function Fan({ nounId, onOpen }: { nounId: string; onOpen: (key: string) => void }) {
  const noun = findNoun(nounId), data = G.nouns[noun.id];
  return <div className="ng-fan">
    <p className="ng-fan-stem"><Gk>{noun.stem}</Gk><small>the part that holds still</small></p>
    <div className="ng-fan-col"><svg className="ng-fan-threads" viewBox="0 0 100 800" preserveAspectRatio="none" aria-hidden="true">
      {SLOTS.map((slot, i) => <path key={slot} d={`M0 400C60 400 40 ${i * 100 + 50} 100 ${i * 100 + 50}`} className={data.cells[slot] ? "" : "ng-fan-none"} />)}
    </svg></div>
    <ol className="ng-fan-rows">{SLOTS.map((slot) => {
      const cell = data.cells[slot], job = caseOfSlot(slot), count = slot[1] === "S" ? "one" : "many";
      const key = `cell:${noun.id}:${slot}`;
      if (!cell) return <li key={slot} className="ng-row-none"><span className="ng-fan-job"><b>{job.plain}</b> · {count}</span><span>Not in the text</span></li>;
      return <li key={slot}><button type="button" data-open={key} onClick={() => onOpen(key)}>
        <span lang="grc" className={`ng-fan-form ng-end-${job.id}`}><span className="ng-stemmed">{noun.stem}</span><b>{cell.end}</b></span>
        <span className="ng-fan-job"><b>{job.plain}</b> · {count}<span className="ng-hide"> {job.name}</span></span>
        <small>{plural(cell.all, "{n} time", "{n} times")}</small>
      </button></li>;
    })}</ol>
  </div>;
}

function Line({ lineId, lens, onOpen }: { lineId: string; lens: string; onOpen: (key: string) => void }) {
  const line = findLine(lineId), words = G.lines[line.id].words;
  const inner = useRef<HTMLOListElement>(null);
  const [arcs, setArcs] = useState<{ key: number; d: string }[]>([]);
  const [width, setWidth] = useState(0);
  const measure = () => {
    const box = inner.current;
    if (!box) return;
    const spots = [...box.querySelectorAll<HTMLElement>("[data-word]")].map((el) => el.offsetLeft + el.offsetWidth / 2);
    setWidth(box.scrollWidth);
    setArcs(words.flatMap((w, i) => (w.to === undefined || spots[i] === undefined || spots[w.to] === undefined ? [] : [{ key: i, d: arcPath(spots[i], spots[w.to], 26, 22) }])));
  };
  useLayoutEffect(measure, [line.id, lens]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // The first drawing may use a stand-in font, so measure again once the real one has arrived.
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); }).catch((error) => console.error("How New Testament Greek works page: the fonts did not settle", error));
    const watcher = new ResizeObserver(measure);
    if (inner.current) watcher.observe(inner.current);
    return () => { live = false; watcher.disconnect(); };
  }, [line.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="ng-scroll" role="region" aria-label={`${line.label}, word by word. Scroll sideways.`} tabIndex={0}>
    <div className="ng-scroll-in">
      <svg className="ng-arcs" width={width} height="28" aria-hidden="true">{arcs.map((a) => <path key={a.key} d={a.d} />)}</svg>
      <ol ref={inner} className="ng-words">{words.map((word, i) => {
        const key = `word:${line.id}:${i}`, job = word.k ? caseById.get(word.k) : undefined;
        const dim = lens !== "all" && word.k !== lens;
        return <li key={i} data-word={i} className={dim ? "dim" : ""}><button type="button" data-open={key} onClick={() => onOpen(key)}>
          <span lang="grc" className={`ng-word ${job ? `ng-mark-${job.id}` : ""}`}>{word.g}</span>
          {job && <span className="ng-hide"> {job.name}</span>}
          <small>{word.e}</small>
        </button></li>;
      })}</ol>
    </div>
  </div>;
}

export function Endings({ nounValue, lineValue, lensValue, onParam, onOpen }: { nounValue: string | null; lineValue: string | null; lensValue: string | null; onParam: (name: string, value: string | null) => void; onOpen: (key: string) => void }) {
  const noun = findNoun(nounValue), line = findLine(lineValue), lens = findLens(lensValue);
  return <>
    <Head title={<>One stem, many endings.<em> Each ending has a job.</em></>}
      lead="A Greek noun carries its job on its end. Grammar books call these jobs cases, and there are four main ones. On this page each has its own underline, and a word with it." />
    <dl className="ng-cases">{D.cases.map((c) => <div key={c.id}><dt><span className={`ng-mark-${c.id}`}>{c.plain}</span></dt><dd>{c.name}. {c.line} <small>{`${plural(G.counts.cases[c.id], "{n} noun", "{n} nouns")}.`}</small></dd></div>)}</dl>
    <ul className="ng-picks" aria-label="Which noun">{D.nouns.map((n) => <li key={n.id}><button type="button" aria-pressed={n.id === noun.id} onClick={() => onParam("noun", n.id === "logos" ? null : n.id)}><Gk>{n.name}</Gk> {n.means}</button></li>)}</ul>
    <p className="ng-lineline" aria-live="polite"><Mixed text={`${noun.name}, said ${noun.say}, ${noun.gender}, ${thousands(G.nouns[noun.id].total)} times as a noun. ${noun.line}`} /></p>
    <Fan nounId={noun.id} onOpen={onOpen} />
    <p className="ng-caption">Each form is the commonest spelling for its job, as STEP Bible tags it. Greek has a fifth form, for calling out to someone, which these four nouns never take in the words counted.</p>
    <h3 className="ng-sub">Now in a real line</h3>
    <ul className="ng-picks" aria-label="Which verse">{D.lines.map((l) => <li key={l.id}><button type="button" aria-pressed={l.id === line.id} onClick={() => onParam("line", l.id === "rom5-8" ? null : l.id)}>{l.label}</button></li>)}</ul>
    <ul className="ng-picks ng-picks-small" aria-label="Which job to pick out">
      <li><button type="button" aria-pressed={lens === "all"} onClick={() => onParam("lens", null)}>Every job</button></li>
      {D.cases.map((c) => <li key={c.id}><button type="button" aria-pressed={lens === c.id} onClick={() => onParam("lens", c.id)}>{c.plain}</button></li>)}
    </ul>
    <Line lineId={line.id} lens={lens} onOpen={onOpen} />
    <p className="ng-lineline" aria-live="polite"><Mixed text={line.note} /></p>
    <blockquote className="ng-verse"><p><VerseAt verse={G.verses[G.lines[line.id].label]} /></p><cite><VerseLink label={G.lines[line.id].label} />, <BibleName /></cite></blockquote>
    <p className="ng-caption">Only nouns and the article are marked. Pronouns, adjectives and participles have endings too, and the page leaves them plain to keep the line readable. Dotted arcs join an article to its noun, as STEP links them. The glosses under the words are STEP's and keep the Greek order, so they read oddly on purpose.</p>
    <Cite ids={["stepTagnt"]} />
  </>;
}
