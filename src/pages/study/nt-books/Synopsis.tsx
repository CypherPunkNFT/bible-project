// Section 01: the synopsis. One event in two, three or four columns of the Berean's running text, the words they share
// marked word by word, and the tie (the same words in each column) drawn across them. A tie has no arrow: it shows a link,
// never its direction. Then the five layers of Synoptic material, drawn as three overlapping rings that are not to scale.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { D, NB, findCase, findLayer, type Case, type Column, type Word } from "./model";
import { Head, RefButton, Text, ThreeParts } from "./parts";

type Change = (values: Record<string, string | null>) => void;

const LEVEL_CLASS = ["", "nb-w1", "nb-w2"];

function Words({ words }: { words: Word[] }) {
  return <>{words.map((word, w) => {
    const [text, level] = word, tie = word.length > 2, shown = text.trimEnd(), space = text.slice(shown.length);
    const className = [LEVEL_CLASS[level], tie ? "nb-tie" : ""].filter(Boolean).join(" ");
    return <span key={w}>{className ? <span className={className} data-tie={tie ? "" : undefined}>{shown}</span> : shown}{space}</span>;
  })}</>;
}

/** One column in four parts (its head, the verses before the tie, the tied verse, the verses after), so that the tied
 *  verses of every column start on the same line, as a printed synopsis sets its parallels. */
function ColumnText({ column, index }: { column: Column; index: number }) {
  const tied = Math.max(0, column.verses.findIndex((v) => v.words.some((w) => w.length > 2)));
  const long = column.verses.length > 5;
  const verse = (v: Column["verses"][number], i: number) => <span key={v.label} className={long && Math.abs(i - tied) > 1 ? "nb-far" : undefined}>
    <sup>{v.n}</sup><Words words={v.words} />{" "}
  </span>;
  const style = { "--c": index + 1 } as CSSProperties;
  return <div className="nb-col" data-col={index}>
    <p className="nb-part r1 nb-col-head" style={style}><span>{column.book}</span> <RefButton refKey={column.ref} /></p>
    <p className="nb-part r2 nb-col-text" style={style}>{column.verses.slice(0, tied).map((v, i) => verse(v, i))}</p>
    <p className="nb-part r3 nb-col-text nb-tied" style={style}>{verse(column.verses[tied], tied)}</p>
    <p className="nb-part r4 nb-col-text" style={style}>{column.verses.slice(tied + 1).map((v, i) => verse(v, tied + 1 + i))}</p>
  </div>;
}

/** Joins each column's tied words to the next column's with one line, when the columns stand side by side. */
function useTiePath(box: RefObject<HTMLDivElement>, caseId: string): string {
  const [path, setPath] = useState("");
  const measure = useCallback(() => {
    const root = box.current;
    if (!root) return;
    const frame = root.getBoundingClientRect();
    const ends = [...root.querySelectorAll<HTMLElement>("[data-col]")].map((column) => {
      const tied = [...column.querySelectorAll<HTMLElement>("[data-tie]")];
      if (!tied.length) return null;
      // The line runs in the gap under a line of text, not through its words: from the tie's rightmost word out, and in
      // to the next column's first tied word.
      const lineHeight = parseFloat(getComputedStyle(tied[0]).lineHeight) || 0;
      const under = (r: DOMRect) => r.bottom - frame.top + Math.max(2, (lineHeight - r.height) / 2);
      const rects = tied.map((el) => el.getBoundingClientRect());
      const first = rects[0], right = rects.reduce((a, r) => (r.right > a.right ? r : a));
      return { start: [first.left - frame.left, under(first)], end: [right.right - frame.left, under(right)] };
    });
    const sideBySide = ends.length > 1 && ends.every((e, i) => e && (i === 0 || e.start[0] > ends[i - 1]!.end[0]));
    if (!sideBySide) { setPath(""); return; }
    let d = "";
    for (let i = 1; i < ends.length; i++) {
      const [ax, ay] = ends[i - 1]!.end, [bx, by] = ends[i]!.start, mid = (ax + bx) / 2;
      d += `M${ax.toFixed(1)} ${ay.toFixed(1)}C${mid.toFixed(1)} ${ay.toFixed(1)} ${mid.toFixed(1)} ${by.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    setPath(d);
  }, [box]);
  useLayoutEffect(() => { measure(); }, [measure, caseId]);
  useEffect(() => {
    const root = box.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(root);
    return () => observer.disconnect();
  }, [box, measure]);
  return path;
}

function Synopsis({ chosen }: { chosen: Case }) {
  const synopsis = NB.synopsis[chosen.id];
  const box = useRef<HTMLDivElement>(null);
  const path = useTiePath(box, chosen.id);
  if (!synopsis) { console.error(`How the New Testament books were written: no synopsis was built for "${chosen.id}"`); return null; }
  return <figure className="nb-synopsis">
    <div ref={box} className={`nb-cols n${synopsis.columns.length}`}>
      {synopsis.columns.map((column, i) => <ColumnText key={column.ref} column={column} index={i} />)}
      {path && <svg className="nb-tieline" aria-hidden="true"><path d={path} /><path className="nb-tieline-run" d={path} /></svg>}
    </div>
    <figcaption>
      <p className="nb-tie-note"><span className="nb-tie">{synopsis.tie.words}</span> · {synopsis.tie.note}. The line joins the same words; it has no arrow, because it shows a link and not which way it ran.</p>
      <ul className="nb-key" aria-label="How the shared words are marked">
        <li><span className="nb-w2">Solid underline</span> the same run of four or more words in every column</li>
        {synopsis.columns.length > 2 && <li><span className="nb-w1">Dotted underline</span> the same run in one other column only</li>}
        <li className="nb-key-small">Small screens show only the verses around the tie; open a passage to read it whole.</li>
      </ul>
      <p className="nb-english"><Text text={D.reach[2]} /></p>
    </figcaption>
  </figure>;
}

/** Three rings for Matthew, Mark and Luke. The areas mean nothing: the record gives no counts, so nothing is sized. */
const LAYER_SPOT: Record<string, [number, number]> = { triple: [160, 132], double: [160, 72], matthew: [84, 96], luke: [236, 96], mark: [160, 226] };

function Layers({ layerId, onChange }: { layerId: string | null; onChange: Change }) {
  const chosen = findLayer(layerId);
  return <div className="nb-layers">
    <div>
      <p className="nb-kicker">Where the three agree, and where they do not</p>
      <div className="nb-layer-list" role="group" aria-label="The five layers of material">
        {D.synoptic.layers.map((layer) => <button key={layer.id} type="button" aria-pressed={layer.id === chosen.id}
          onClick={() => onChange({ layer: layer.id })}>{layer.name}</button>)}
      </div>
      <p className="nb-para nb-layer-note" aria-live="polite"><Text text={chosen.note} /></p>
    </div>
    <svg className="nb-rings" viewBox="0 0 320 290" role="img" aria-label={`Three overlapping rings for Matthew, Mark and Luke, not to scale. Marked: ${chosen.name}.`}>
      <circle cx="118" cy="110" r="84" /><circle cx="202" cy="110" r="84" /><circle cx="160" cy="182" r="84" />
      <text x="58" y="40">Matthew</text><text x="262" y="40" textAnchor="end">Luke</text><text x="160" y="284" textAnchor="middle">Mark</text>
      {D.synoptic.layers.map((layer) => {
        const [x, y] = LAYER_SPOT[layer.id] ?? [0, 0], on = layer.id === chosen.id;
        return <g key={layer.id} className={on ? "on" : undefined} transform={`translate(${x} ${y})`}>
          <path d={on ? "M0-9 2.2-2.2 9 0 2.2 2.2 0 9-2.2 2.2-9 0-2.2-2.2Z" : "M0-3.5 3.5 0 0 3.5-3.5 0Z"} />
        </g>;
      })}
    </svg>
  </div>;
}

export function Tellings({ caseId, layerId, onChange }: { caseId: string | null; layerId: string | null; onChange: Change }) {
  const chosen = findCase(caseId);
  return <>
    <Head num="01" kicker="Three tellings" title={<>Three columns.<em> One aside.</em></>} lead={D.synoptic.lead} />
    <div className="nb-cases" role="group" aria-label="Choose a case">
      {D.synoptic.cases.map((item, i) => <button key={item.id} type="button" aria-pressed={item.id === chosen.id} onClick={() => onChange({ case: item.id })}>
        <b>{String(i + 1).padStart(2, "0")}</b><span>{item.title}</span><small>{item.passages.join(" · ")}</small>
      </button>)}
    </div>
    <Synopsis chosen={chosen} />
    <ThreeParts evidence={chosen.evidence} inference={chosen.inference} limit={chosen.limit} />
    <Layers layerId={layerId} onChange={onChange} />
  </>;
}
