// The test page's setup bar, the last step before Begin, in four versions, one per page option (options-list.tsx). They
// replaced the bar of four kinds of question (owner, 2026-10-22: "outdated and useless"; keep how many, think about
// difficulty or age group). How many is real and drawn from; the bank does not yet record how hard a question is or what
// age it suits (only the children's collections, about a thousand questions, can be told apart), so those two settings
// are designs and change nothing yet. Styles: test-setup.css.
import { ArrowDown, ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LENGTHS, MAX_LENGTH, MIN_LENGTH } from "./engine";

export interface SetupBarProps { what: string; changeTo: string; available: number; length: number; setLength: (n: number) => void; redraw: () => void; onBegin: () => void }

const LEVELS = [
  { id: 1, label: "Gentle", line: "The best-known stories and names" },
  { id: 2, label: "Steady", line: "A mix, with some details" },
  { id: 3, label: "Deep", line: "Small details and lesser-known books" },
];
const AGES = [
  { id: "children", label: "Children", line: "Ages about 6 to 11" },
  { id: "teens", label: "Teens", line: "Ages about 12 to 17" },
  { id: "adults", label: "Adults", line: "Everything in the bank" },
];
/** About twenty seconds a question: reading it, choosing, and a glance at the verse. */
const minutesFor = (n: number) => `about ${Math.max(1, Math.round((n * 20) / 60))} min`;
const levelOf = (id: number) => LEVELS.find((l) => l.id === id)!;
const ageOf = (id: string) => AGES.find((a) => a.id === id)!;

/** How hard and who for: kept only in the bar until the bank can draw on them. */
function useDesignOnly() {
  const [level, setLevel] = useState(2);
  const [age, setAge] = useState("adults");
  return { level, setLevel, age, setAge };
}
type DesignOnly = ReturnType<typeof useDesignOnly>;

/** Three rising bars, filled up to the level: the mark for how hard. */
function Pips({ level }: { level: number }) {
  return <span className="tsu-pips" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} data-on={i <= level || undefined} />)}</span>;
}

/** Back to the questions page, where the theme or book is chosen. */
function Change({ changeTo }: Pick<SetupBarProps, "changeTo">) {
  return <Link className="tsu-change" to={changeTo}>Change</Link>;
}

function What({ what, changeTo, available }: Pick<SetupBarProps, "what" | "changeTo" | "available">) {
  return <div className="tsu-what"><span className="tp-field-label">Your test <Change changeTo={changeTo} /></span><strong>{what}</strong>
    <small>{available.toLocaleString()} questions to draw from</small></div>;
}

function Begin({ length, available, onBegin }: Pick<SetupBarProps, "length" | "available" | "onBegin">) {
  return <button type="button" className="tp-begin-go" disabled={!available} onClick={onBegin}>Begin · {Math.min(length, available)} questions<ArrowDown size={16} strokeWidth={1.7} aria-hidden /></button>;
}

function DrawAgain({ available, redraw }: Pick<SetupBarProps, "available" | "redraw">) {
  return <button type="button" className="tp-quiet" disabled={!available} onClick={redraw}><RotateCcw size={14} strokeWidth={1.8} aria-hidden />Draw again</button>;
}

function Segments<T extends string | number>({ label, items, value, onChoose }: { label: string; items: { id: T; label: ReactNode }[]; value: T; onChoose: (id: T) => void }) {
  return <div className="tp-segments" role="group" aria-label={label}>
    {items.map((item) => <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => onChoose(item.id)}>{item.label}</button>)}
  </div>;
}

/** The three settings side by side, each a row of buttons under its name (versions A and B). */
function Dials({ length, setLength, design }: Pick<SetupBarProps, "length" | "setLength"> & { design: DesignOnly }) {
  return <>
    <div className="tsu-dial"><span className="tp-field-label">Questions</span>
      <Segments label="How many questions" items={LENGTHS.map((n) => ({ id: n as number, label: n }))} value={length} onChoose={setLength} />
      <small>{minutesFor(length)}</small></div>
    <div className="tsu-dial"><span className="tp-field-label">How hard</span>
      <Segments label="How hard" items={LEVELS.map((l) => ({ id: l.id, label: <><Pips level={l.id} />{l.label}</> }))} value={design.level} onChoose={design.setLevel} />
      <small>{levelOf(design.level).line}</small></div>
    <div className="tsu-dial"><span className="tp-field-label">For</span>
      <Segments label="Who the test is for" items={AGES.map((a) => ({ id: a.id, label: a.label }))} value={design.age} onChoose={design.setAge} />
      <small>{ageOf(design.age).line}</small></div>
  </>;
}

/** A · The bar as it was, its kind-of-question buttons replaced by how many, how hard and who for. */
export function DialsBar(props: SetupBarProps) {
  const design = useDesignOnly();
  return <div className="tsu-bar tsu-v1"><What {...props} /><Dials {...props} design={design} /><Begin {...props} /></div>;
}

const PRESETS = [
  { name: "A quick look", length: 10, level: 1, age: "adults" },
  { name: "A good test", length: 25, level: 2, age: "adults" },
  { name: "The deep end", length: 50, level: 3, age: "adults" },
  { name: "For children", length: 10, level: 1, age: "children" },
];

/** B · Four ready-made tests to pick from, with a way to set your own. */
export function PresetsBar(props: SetupBarProps) {
  const design = useDesignOnly();
  const [own, setOwn] = useState(false);
  const picked = PRESETS.findIndex((p) => p.length === props.length && p.level === design.level && p.age === design.age);
  const choose = (p: (typeof PRESETS)[number]) => { props.setLength(p.length); design.setLevel(p.level); design.setAge(p.age); };
  return <div className="tsu-bar tsu-v2">
    <div className="tsu-v2-head"><What {...props} />
      <button type="button" className="tp-quiet" aria-expanded={own} onClick={() => setOwn(!own)}><SlidersHorizontal size={14} strokeWidth={1.8} aria-hidden />{own ? "Back to the four" : "Set your own"}</button></div>
    {own ? <div className="tsu-v2-own"><Dials {...props} design={design} /></div> : <div className="tsu-presets">
      {PRESETS.map((p, i) => <button key={p.name} type="button" className="tsu-preset" aria-pressed={picked === i} onClick={() => choose(p)}>
        <strong>{p.name}</strong>
        <span>{p.length} questions · {minutesFor(p.length)}</span>
        <span><Pips level={p.level} />{levelOf(p.level).label}</span>
        <span>{p.age === "children" ? "Questions written for children" : "For teens and adults"}</span>
      </button>)}
    </div>}
    <div className="tsu-foot"><DrawAgain {...props} /><Begin {...props} /></div>
  </div>;
}

/** One word in the sentence that opens a short list of the other choices. */
function Blank<T extends string | number>({ items, value, onChoose, label }: { items: { id: T; label: string }[]; value: T; onChoose: (id: T) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.id === value) ?? items[0];
  return <span className="tsu-blank">
    <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>{current.label}<ChevronDown size={18} strokeWidth={1.6} aria-hidden /></button>
    {open && <span className="tsu-blank-menu" role="menu">{items.map((i) => <button key={i.id} type="button" role="menuitemradio" aria-checked={i.id === value}
      onClick={() => { onChoose(i.id); setOpen(false); }}>{i.label}</button>)}</span>}
  </span>;
}

/** C · The test said as one sentence; each choice is a word that can be changed. */
export function SentenceBar(props: SetupBarProps) {
  const design = useDesignOnly();
  return <div className="tsu-bar tsu-v3">
    <span className="tp-field-label">Your test <Change changeTo={props.changeTo} /></span>
    <p className="tsu-sentence">Ask me <Blank label="How many questions" items={LENGTHS.map((n) => ({ id: n as number, label: String(n) }))} value={props.length} onChoose={props.setLength} />{" "}
      <Blank label="How hard" items={LEVELS.map((l) => ({ id: l.id, label: l.label.toLowerCase() }))} value={design.level} onChoose={design.setLevel} /> questions
      on <em>{props.what.replace(/^The /, "the ")}</em>, written for <Blank label="Who the test is for" items={AGES.map((a) => ({ id: a.id, label: a.label.toLowerCase() }))} value={design.age} onChoose={design.setAge} />.</p>
    <div className="tsu-foot"><small>{minutesFor(props.length)} · {props.available.toLocaleString()} questions to draw from</small>
      <span className="tsu-foot-go"><DrawAgain {...props} /><Begin {...props} /></span></div>
  </div>;
}

/** D · A slider for how many, rising bars for how hard, and who it is for. */
export function SliderBar(props: SetupBarProps) {
  const design = useDesignOnly();
  const fill = `${((props.length - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH)) * 100}%`;
  return <div className="tsu-bar tsu-v4"><What {...props} />
    <div className="tsu-slide"><span className="tp-field-label">Questions</span>
      <p><b>{props.length}</b><span>{minutesFor(props.length)}</span></p>
      <input type="range" min={MIN_LENGTH} max={MAX_LENGTH} step={5} value={props.length} aria-label="How many questions"
        onChange={(e) => props.setLength(Number(e.target.value))} style={{ "--fill": fill } as CSSProperties} /></div>
    <div className="tsu-meter"><span className="tp-field-label">How hard · {levelOf(design.level).label}</span>
      <div role="group" aria-label="How hard">{LEVELS.map((l) => <button key={l.id} type="button" aria-pressed={design.level === l.id} data-on={l.id <= design.level || undefined}
        style={{ height: 12 + l.id * 10 }} aria-label={l.label} title={l.line} onClick={() => design.setLevel(l.id)} />)}</div></div>
    <div className="tsu-ages"><span className="tp-field-label">For</span>
      <div role="group" aria-label="Who the test is for">{AGES.map((a) => <button key={a.id} type="button" aria-pressed={design.age === a.id} onClick={() => design.setAge(a.id)}>{a.label}</button>)}</div></div>
    <Begin {...props} />
  </div>;
}
