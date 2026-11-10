// Section 01: the whole list as one line. Every number in order, split by the letter its word begins with: the data graphic that
// shows the numbering follows spelling. The band is for pointing; the letter grid below it does the same by touch and keyboard.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { bandOf, D, findBand, lemmaById, parseAlphabet, SN, type Alphabet, type Band } from "./model";
import { Cite, Head, Lemma, Scan, ThreeParts } from "./parts";
import { formatNumber } from "@/lib/site-format";

const fmt = (n: number) => formatNumber(n);
const TOP: Record<Alphabet, number> = { greek: SN.counts.greekTop, hebrew: SN.counts.hebrewTop };
const PINS: Record<Alphabet, string[]> = { greek: ["G25", "G26", "G1411", "G2424", "G3056", "G5368"], hebrew: ["H430", "H1697", "H5315", "H7307"] };
const WIDTH = 1000;

function Line({ alphabet, shown, onPoint, onChoose }: { alphabet: Alphabet; shown: Band; onPoint: (b: Band | null) => void; onChoose: (b: Band) => void }) {
  const top = TOP[alphabet], x = (n: number) => ((n - 1) / top) * WIDTH;
  return <svg className="sn-band" viewBox={`0 0 ${WIDTH} 66`} preserveAspectRatio="none" aria-hidden="true" onMouseLeave={() => onPoint(null)}>
    {SN.bands[alphabet].map((b, i) => <g key={b.name} className={b === shown ? "on" : i % 2 ? "alt" : ""} onMouseEnter={() => onPoint(b)} onClick={() => onChoose(b)}>
      <rect x={x(b.from)} y={22} width={Math.max(1, x(b.to + 1) - x(b.from) - 1)} height={28} />
      {b.to - b.from > top / 28 && <text x={(x(b.from) + x(b.to + 1)) / 2} y={41} textAnchor="middle" lang={alphabet === "hebrew" ? "he" : "el"}>{b.letter}</text>}
    </g>)}
    {PINS[alphabet].map((id, i) => { const at = x(Number(id.slice(1))); return <g key={id} className="sn-pin"><path d={`M${at} 16v38`} /><text x={at} y={i % 2 ? 66 : 11} textAnchor={at > WIDTH - 40 ? "end" : at < 40 ? "start" : "middle"}>{id}</text></g>; })}
  </svg>;
}

function Neighbours() {
  const near = lemmaById.get("G25"), next = lemmaById.get("G26"), far = lemmaById.get("G5368");
  if (!near || !next || !far) return null;
  return <div className="sn-neighbours">
    <p className="sn-kicker">Side by side, and far apart</p>
    <ul>{[near, next, far].map((w) => <li key={w.id}><b>{w.id}</b> <Lemma lang={w.lang}>{w.lemma}</Lemma> <i>{w.translit}</i> “{w.gloss}”</li>)}</ul>
    <p>{`Two words spelled alike sit together. A third with almost the same sense sits ${fmt(5368 - 26)} numbers away, because it starts with phi. Strong knew: his entry for 25 ends “Comp. 5368”.`}</p>
  </div>;
}

export function Numbered() {
  const [params, setParams] = useSearchParams();
  const alphabet = parseAlphabet(params.get("alphabet"));
  const chosen = findBand(alphabet, params.get("letter")) ?? SN.bands[alphabet][0];
  const [pointed, setPointed] = useState<Band | null>(null);
  const shown = pointed ?? chosen;
  const update = (next: Record<string, string>) => setParams((p) => { const q = new URLSearchParams(p); Object.entries(next).forEach(([k, v]) => q.set(k, v)); return q; }, { replace: true, preventScrollReset: true });
  const out = SN.outOfPlace[alphabet], record = D.records[0];
  const pinsHere = PINS[alphabet].filter((id) => bandOf(alphabet, Number(id.slice(1))) === shown);
  return <>
    <Head num="01" kicker="What a number is" title={<>Numbered by spelling.<em> Not by sense.</em></>}
      lead={<>Strong said what the numbers are for. Each word is “known throughout by its appropriate number. This renders reference easy without recourse to the Greek characters.”</>} />
    <Scan id="plan" />
    <div className="sn-alpha">
      <p className="sn-q">Does the whole list really run by the alphabet? Choose a letter to see where it falls; every number is on this line.</p>
      <div className="sn-switch" role="group" aria-label="Which list">{(["greek", "hebrew"] as const).map((a) => <button key={a} type="button" aria-pressed={a === alphabet} onClick={() => { setPointed(null); update({ alphabet: a, letter: SN.bands[a][0].name }); }}>{a === "greek" ? `Greek · ${fmt(TOP.greek)} numbers` : `Hebrew · ${fmt(TOP.hebrew)} numbers`}</button>)}</div>
      <p className="sn-axis"><span>{alphabet === "greek" ? "G" : "H"}1</span><span>{alphabet === "hebrew" ? "Numbers run left to right, though Hebrew reads right to left" : "Numbers run left to right"}</span><span>{alphabet === "greek" ? "G" : "H"}{fmt(TOP[alphabet])}</span></p>
      <Line alphabet={alphabet} shown={shown} onPoint={setPointed} onChoose={(b) => update({ letter: b.name })} />
      <div className="sn-letters" role="group" aria-label="Choose a letter">{SN.bands[alphabet].map((b) => <button key={b.name} type="button" aria-pressed={b === chosen} aria-label={`${b.name} · numbers ${b.from} to ${b.to}`} onClick={() => update({ letter: b.name })}><Lemma lang={alphabet}>{b.letter}</Lemma></button>)}</div>
      <p className="sn-readout" aria-live="polite"><b>{shown.name}</b>{`: numbers ${fmt(shown.from)} to ${fmt(shown.to)}, ${fmt(shown.to - shown.from + 1)} in all. It begins with `}<Lemma lang={alphabet}>{shown.first.lemma}</Lemma> <i>{shown.first.translit}</i>, “{shown.first.gloss}”.{pinsHere.length > 0 && <>{` This study's words here: ${pinsHere.join(", ")}.`}</>}</p>
      <p className="sn-caption">{`The order holds. Reading the first spelling STEP Bible gives for each number, ${fmt(out.count)} of ${fmt(out.read)} fall out of alphabetical place; they join the range around them here. That count is from STEP Bible's data, not Strong's printed page.`}</p>
    </div>
    <div className="sn-pair">
      <Scan id="dictionary" />
      <div><Neighbours />
        <p className="sn-pagefact">On this page, numbers 1 to 5 are a letter of the alphabet, Aaron, Abaddon, a word for weightless, and Abba. Nothing joins them but their spelling.</p></div>
    </div>
    <ThreeParts evidence={record.evidence} inference={record.inference} limit={record.limit} />
    <Cite ids={record.sources} />
  </>;
}
