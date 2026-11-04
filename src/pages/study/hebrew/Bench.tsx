// Section 04: the sounding bench. A verse is walked letter by letter, with the sound and the rule that gives it, and the spoken line builds
// up as it goes. Previous and Next carry the keyboard; pressing a word starts there. Then the reader sounds two lines alone.
import { useMemo, useState } from "react";
import { bare, clusters, D, H, ruleById, type Line } from "./model";
import { He, Head, Mixed, Quote, Test } from "./parts";

type Stop = { word: number; letter: number; piece: string; sound: string; rule: string };

function stopsOf(line: Line): Stop[] {
  return H.lines[line.id].words.flatMap((word, w) => clusters(bare(word.he)).map((piece, l) => {
    const [sound, rule] = line.words[w].steps![l];
    return { word: w, letter: l, piece, sound, rule };
  }));
}

export function Bench() {
  const guided = useMemo(() => D.lines.filter((l) => l.guided), []);
  const [lineId, setLine] = useState(guided[0].id);
  const [at, setAt] = useState(0);
  const line = guided.find((l) => l.id === lineId)!;
  const stops = useMemo(() => stopsOf(line), [line]);
  const stop = stops[at];
  const words = H.lines[line.id].words;
  const rule = ruleById.get(stop.rule);
  const firstOf = (w: number) => stops.findIndex((s) => s.word === w);
  const pick = (id: string) => { setLine(id); setAt(0); };
  return <>
    <Head letter="ד" num="04" kicker="Sound it out" title={<>Say it first.<em> Translate never.</em></>}
      lead={`Go one letter at a time, from the right, in the classroom sounds of section two. Say each sound aloud as it appears. A letter that says nothing is still a step: alef is there, and quiet. ${D.sound.noAudio}`} />
    <div className="hw-linepick" role="group" aria-label="Choose a verse to sound out">
      {guided.map((l) => <button key={l.id} type="button" aria-pressed={l.id === lineId} onClick={() => pick(l.id)}>{l.label}</button>)}
    </div>
    <div className="hw-sheet hw-bench">
      <p className="hw-dir" aria-hidden="true"><span>←</span> Read this way</p>
      <p className="hw-line" dir="rtl" lang="he">
        {words.map((word, w) => <button key={`${line.id}-${w}`} type="button" className={`hw-word${w === stop.word ? " chosen" : ""}`} aria-label={`Start at the word ${line.words[w].sound}`} onClick={() => setAt(firstOf(w))}>
          {clusters(bare(word.he)).map((piece, l) => <span key={l} className={w === stop.word && l === stop.letter ? "hw-now" : stops[firstOf(w) + l] && firstOf(w) + l < at ? "hw-done" : ""}>{piece}</span>)}
        </button>)}
      </p>
      <p className="hw-spoken" aria-hidden="true">{words.map((_, w) => {
        const said = stops.slice(0, at + 1).filter((s) => s.word === w);
        if (!said.length) return null;
        return <span key={w}>{w === stop.word ? said.map((s) => s.sound).join("") : line.words[w].sound}</span>;
      })}</p>
      <div className="hw-step">
        <p className="hw-step-now" aria-live="polite">
          <He big>{stop.piece}</He> <b>{stop.sound ? `Say “${stop.sound}”.` : "Say nothing here."}</b> {rule && <span><b>{rule.name}.</b> <Mixed text={rule.line} /></span>}
        </p>
        <div className="hw-step-keys">
          <button type="button" aria-disabled={at === 0} onClick={() => { if (at > 0) setAt(at - 1); }}>Previous letter</button>
          <button type="button" className="primary" aria-disabled={at === stops.length - 1} onClick={() => { if (at < stops.length - 1) setAt(at + 1); }}>Next letter</button>
        </div>
      </div>
      <p className="hw-whole"><b>The whole line:</b> {line.words.map((w) => w.sound).join(" ")}</p>
    </div>
    <Quote label={line.label} />
    {line.id === "gen1-3" && <p className="hw-note">Twice the same small word: <He>יְהִי</He>, ye-HI, "let there be", then <He>וַיְהִי</He>, vay-HI, "and there was". Section six comes back to why those are two forms.</p>}
    <h3 className="hw-sub">The rules you have just used</h3>
    <ol className="hw-rules">{D.rules.filter((r) => r.id !== "plain").map((r) => <li key={r.id} className={r.id === stop.rule ? "now" : ""}><b>{r.name}</b> <span><Mixed text={r.line} /></span></li>)}</ol>
    <p className="hw-note"><Mixed text={D.divineName} /></p>
    <h3 className="hw-sub">Your turn</h3>
    <p className="hw-para">Say each line aloud before you choose. Nothing here is translated until you have said it.</p>
    <div className="hw-turns">{D.tests.map((test) => <Test key={test.id} kicker={`${test.label} · ${test.note}`} right="Right." wrong="Not quite." options={test.options}
      question={<span className="hw-test-line" lang="he" dir="rtl">{test.line}</span>}><Quote label={test.label} /></Test>)}</div>
  </>;
}
