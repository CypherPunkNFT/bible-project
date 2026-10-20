// Section 06 (mock-up direction A's editions, as D keeps them): the editions on a lane from 1850 to 2025, each step a span
// or a point; pointing at or choosing one names it on the line below. Under it, D's "Why a computer does not simply
// count the copies" (js/cbgm.js): the method in five steps beside an invented textual flow diagram. The diagram is drawn
// for this study: the sigla are examples and every link is invented. It is not INTF's diagram, data or calculation.
import { useState, type CSSProperties, type ReactNode } from "react";
import { cbgm, editions, heads } from "./evidence";
import { Cite, Head } from "./parts";
import { Rich } from "./Rich";

const at = (year: number) => ((year - 1850) / (2025 - 1850)) * 100;

function Lane() {
  const [step, setStep] = useState(0);
  const s = editions.steps[step];
  return <>
    <div className="eds-lane" role="group" aria-label="The editions, 1857 to 2021">
      <div className="eds-axis">{[1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025].map((y) => <span key={y} style={{ left: `${at(y)}%` }}>{y}</span>)}</div>
      {editions.steps.map((x, i) => <button key={x.when} type="button" className="eds-step" data-step={i} aria-pressed={i === step}
        style={{ "--a": `${at(x.from)}%`, "--b": `${at(x.to)}%` } as CSSProperties} onClick={() => setStep(i)} onPointerOver={() => setStep(i)}>
        <i />{x.marks.map(([y, n]) => <span key={n} className={`eds-mark${at(y) > 80 ? " is-flip" : ""}`} style={{ left: `${at(y)}%` }}><b>{n}</b><small>{y}</small></span>)}
      </button>)}
    </div>
    <div className="eds-say ms-say" aria-live="polite"><p className="kicker">{s.when}</p><b>{s.title}</b><p>{s.text}</p><Cite ids={s.links} /></div>
  </>;
}

/** Invented flow: id → [x, y, closest potential ancestor, second ancestor (mixture)]. */
const NODES: Record<string, [number, number, string?, string?]> = {
  A: [230, 32], P74: [110, 104, "A"], "03": [230, 104, "A"], "01": [350, 104, "A"],
  "02": [56, 180, "P74"], P45: [146, 180, "03"], 1175: [236, 180, "03"], 33: [322, 180, "01"], "05": [410, 180, "01"],
  1739: [56, 256, "02"], 81: [236, 256, "1175"], 614: [410, 256, "05"],
  307: [26, 332, "1739"], 453: [100, 332, "1739"], 1891: [320, 332, "614", "1739"], 2818: [430, 332, "614"],
};
const VARIANT = new Set(["05", "614", "2818", "1891"]);
function pathTo(id: string): string[] {
  const out = [id];
  for (let parent = NODES[id][2]; parent; parent = NODES[parent][2]) out.push(parent);
  return out;
}
const EDGES: [string, string, string][] = [
  ...Object.entries(NODES).filter(([, n]) => n[2]).map(([id, n]) => [n[2] as string, id, VARIANT.has(id) && n[2] !== "1739" ? "is-var" : ""] as [string, string, string]),
  ["1739", "1891", "is-mix"],
];

function say(id: string | null): ReactNode {
  if (!id) return <Rich text={cbgm.idle} />;
  if (id === "A") return <Rich text={cbgm.initial} />;
  const [, , parent, second] = NODES[id];
  const tail = id === "05" ? ` ${cbgm.arises}` : second ? ` Mixed ancestry: it also draws on ${second}, so one line cannot describe it.` : VARIANT.has(id) ? ` ${cbgm.inherits}` : "";
  return <><b>{id}</b> · closest potential ancestor here: <b>{parent}</b>. Path to the initial text: {pathTo(id).join(" → ")}.{tail}</>;
}

function Cbgm() {
  const [pinned, setPinned] = useState<string | null>(null), [lit, setLit] = useState<string | null>(null);
  const on = new Set(lit ? pathTo(lit) : []);
  const pin = (id: string) => { const next = pinned === id ? null : id; setPinned(next); setLit(next); };
  return <div className="cb">
    <div className="cb-text"><p className="kicker">{cbgm.title}</p>
      <ol className="cb-steps">{cbgm.steps.map(([t, p], i) => <li key={t}><span>0{i + 1}</span><b>{t}</b><p><Rich text={p} /></p></li>)}</ol><Cite ids={cbgm.links} /></div>
    <figure className="cb-fig">
      <svg className={`cb-svg${lit ? " is-lit" : ""}`} viewBox="0 0 460 362" aria-label="Illustrative textual flow diagram" onPointerLeave={() => setLit(pinned)}>
        {EDGES.map(([from, to, cls]) => {
          const [x1, y1] = NODES[from], [x2, y2] = NODES[to];
          const onPath = on.has(to) && NODES[to][2] === from && on.has(from), onMix = to === lit && NODES[to][3] === from;
          return <path key={`${from}>${to}`} className={`cb-edge ${cls}${onPath ? " is-on" : ""}${onMix ? " is-on-mix" : ""}`}
            d={`M${x1} ${y1 + 15}C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2 - 15}`} />;
        })}
        <g className="cb-arise"><circle cx="380" cy="142" r="4" /><text x="390" y="145">new reading</text></g>
        {Object.entries(NODES).map(([id, [x, y, , second]]) => <g key={id} className={`cb-node${id === "A" ? " is-a" : ""}${VARIANT.has(id) ? " is-var" : ""}${second ? " is-mixed" : ""}${on.has(id) ? " is-on" : ""}`}
          data-node={id} tabIndex={0} role="button" aria-label={`Witness ${id}`} onPointerOver={() => setLit(id)} onClick={() => pin(id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPinned(id); setLit(id); } }}>
          <circle cx={x} cy={y} r={id === "A" ? 19 : 15} /><text x={x} y={y + 4}>{id}</text></g>)}
      </svg>
      <figcaption><b>{cbgm.caption[0]}</b> {cbgm.caption[1]}</figcaption>
      <p className="cb-say" role="status">{say(lit)}</p>
      <p className="cb-key"><span><i className="k-flow" />{cbgm.key[0]}</span><span><i className="k-var" />{cbgm.key[1]}</span><span><i className="k-mix" />{cbgm.key[2]}</span></p>
    </figure>
  </div>;
}

export function Editions({ num }: { num: string }) {
  return <>
    <Head num={num} kicker={heads.editions.kicker} title={editions.title} lead={editions.lead} />
    <div className="a-eds eds"><Lane /><Cbgm /></div>
  </>;
}
