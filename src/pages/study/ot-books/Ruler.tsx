// The page's signature: one ruler of a book's chapters. Gold diamonds above the line where the book speaks of its own
// writing; open circles below where a later hand is seen or argued; a dashed cut where a theory proposes a division. The
// marks differ in shape and in words, never in colour alone. Point at a mark to read it on the line below the ruler;
// choose it (or its entry in the list) to open its record. The list carries the same marks for phones and keyboards.
import { useState } from "react";
import { markCode, markX, type Mark, type MarkKind, type Ruler as RulerData } from "./model";
import { MarkShape } from "./parts";

const W = 1000, LINE = 78, STEP = 15, PAD = 14;
const KIND_WORDS: Record<MarkKind, string> = { self: "The book speaks of its writing", later: "A later hand, seen or argued", divide: "A theory's proposed division" };

function stacked(marks: Mark[]): Map<string, number> {
  const seen = new Map<string, number>(), level = new Map<string, number>();
  for (const mark of marks) {
    const key = `${mark.kind === "self" ? "up" : "down"}:${mark.at.split(" ")[0]}:${mark.chapter}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    level.set(mark.id, n);
  }
  return level;
}

function Glyph({ kind, x, y }: { kind: MarkKind; x: number; y: number }) {
  if (kind === "self") return <path className="ob-g-self" d={`M${x} ${y - 7}l7 7-7 7-7-7Z`} />;
  if (kind === "later") return <circle className="ob-g-later" cx={x} cy={y} r="6" />;
  return <path className="ob-g-divide" d={`M${x} ${LINE - 22}V${LINE + 22}`} />;
}

function Ticks({ ruler }: { ruler: RulerData }) {
  const single = ruler.segments.length === 1;
  return <g className="ob-ticks">
    <rect className="ob-strip" x="0" y={LINE - 5} width={W} height="10" rx="5" />
    {ruler.segments.map((s) => <g key={s.code}>
      <path className="ob-bound" d={`M${(s.first / ruler.total) * W} ${LINE - 12}V${LINE + 12}`} />
      {!single && <text className="ob-rl-label" x={((s.first + s.chapters / 2) / ruler.total) * W} y="160" textAnchor="middle">{s.name}</text>}
    </g>)}
    {single && Array.from({ length: ruler.total }, (_, i) => i + 1).filter((c) => ruler.total <= 12 || c === 1 || c % 10 === 0 || c === ruler.total).map((c) =>
      <text key={c} className="ob-rl-label" x={((c - 0.5) / ruler.total) * W} y="160" textAnchor="middle">{c}</text>)}
    {ruler.band && <g className="ob-band">
      <path d={`M${((ruler.band.from - 0.6) / ruler.total) * W} ${LINE + 30}h${((ruler.band.to - ruler.band.from + 0.6) / ruler.total) * W}`} />
      <text className="ob-rl-label" x={((ruler.band.from + ruler.band.to - 1) / 2 / ruler.total) * W} y={LINE + 46} textAnchor="middle">{ruler.band.label}</text>
    </g>}
  </g>;
}

type Props = { ruler: RulerData; lit: string | null; question: string; onChoose: (mark: Mark) => void };

export function Ruler({ ruler, lit, question, onChoose }: Props) {
  const [pointed, setPointed] = useState<Mark | null>(null);
  const level = stacked(ruler.marks);
  const shown = pointed ?? ruler.marks.find((m) => m.id === lit) ?? null;
  const y = (mark: Mark) => (mark.kind === "self" ? LINE - 22 - (level.get(mark.id) ?? 0) * STEP : mark.kind === "later" ? LINE + 22 + (level.get(mark.id) ?? 0) * STEP : LINE);
  return <figure className="ob-ruler">
    <figcaption className="ob-rl-question">{question}</figcaption>
    <svg viewBox={`${-PAD} 0 ${W + 2 * PAD} 172`} className="ob-rl-svg" role="group" aria-label={`${ruler.name}: ${ruler.total} chapters, with ${ruler.marks.length} marks`}>
      <Ticks ruler={ruler} />
      {ruler.marks.map((mark) => {
        const x = markX(ruler, markCode(ruler, mark), mark.chapter) * W, my = y(mark);
        return <g key={mark.id} className={`ob-mark${mark.id === lit ? " on" : ""}`} role="button" tabIndex={0} data-opener={`ruler:${mark.id}`}
          aria-label={`${KIND_WORDS[mark.kind]}: ${mark.label}`} aria-pressed={mark.id === lit}
          onClick={() => onChoose(mark)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChoose(mark); } }}
          onMouseEnter={() => setPointed(mark)} onMouseLeave={() => setPointed(null)} onFocus={() => setPointed(mark)} onBlur={() => setPointed(null)}>
          <circle className="ob-hit" cx={x} cy={my} r="13" />
          <Glyph kind={mark.kind} x={x} y={my} />
        </g>;
      })}
    </svg>
    <p className="ob-rl-read" aria-live="polite">{shown ? <><MarkShape kind={shown.kind} /> <b>{KIND_WORDS[shown.kind]}.</b> {shown.label}</> : "Point at a mark to read it here; choose it to open its record."}</p>
    <MarkList ruler={ruler} lit={lit} onChoose={onChoose} />
  </figure>;
}

function MarkList({ ruler, lit, onChoose }: Omit<Props, "question">) {
  const kinds = (["self", "later", "divide"] as const).filter((k) => ruler.marks.some((m) => m.kind === k));
  return <div className="ob-rl-list">{kinds.map((kind) => <div key={kind} className={`ob-rl-col ob-rl-${kind}`}>
    <p className="ob-rl-kind"><MarkShape kind={kind} /> {KIND_WORDS[kind]}</p>
    <ul>{ruler.marks.filter((m) => m.kind === kind).map((mark) =>
      <li key={mark.id}><button type="button" className={mark.id === lit ? "on" : ""} aria-pressed={mark.id === lit} data-opener={`list:${mark.id}`} onClick={() => onChoose(mark)}>{mark.label}</button></li>)}
    </ul>
  </div>)}</div>;
}
