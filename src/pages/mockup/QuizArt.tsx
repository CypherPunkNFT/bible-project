// MOCK-UP (study_mockup): the drawing on the Questions & Answers card (QuizDoor.tsx). An open Bible: the left page carries
// the chosen question's own picture (QuizScenes.tsx) as an illumination; the right page names that question's book,
// chapter and verse once it has been opened (a "?" until then) and lights the verse's line. Twelve seals ride the orbit
// around it, one per question (filled once opened); clicking one opens that question in the drawing. The 66 books stand
// beneath as spines sized by their chapters, and the passage is threaded down to its book. Styles: quiz-art.css.
import { useId } from "react";
import { BOOKS, OLD_TESTAMENT, QUESTIONS } from "../quiz-data";
import { QuizScene } from "../QuizScenes";
import "./quiz-art.css";

type Picked = (number | null)[];
const pad = (n: number) => String(n).padStart(2, "0");
const bookOf = (read: string) => read.split("/")[0];
/** "Genesis 5:27" → ["Genesis", 5, 27]. */
const parseRef = (ref: string) => { const m = ref.match(/^(.*) (\d+):(\d+)$/); return m ? [m[1], Number(m[2]), Number(m[3])] as const : [ref, 1, 1] as const; };

const SEALS = QUESTIONS.map((_, i) => {
  const a = (-90 + i * 30) * Math.PI / 180;
  return { x: 300 + 284 * Math.cos(a), y: 198 + 164 * Math.sin(a) };
});

/** The right page's ruled lines: four beside the chapter numeral, then thirteen full lines. */
const LINES = [...[150, 157, 164, 171].map((y, i) => ({ x: 346, y, w: 84 - (i % 3) * 6 })),
  ...Array.from({ length: 13 }, (_, i) => ({ x: 316, y: 180 + i * 7, w: 114 - ((i * 5) % 4) * 7 }))];

const SPINE_X0 = 190, SPINE_STEP = (220 - 8) / 66, SPINE_BASE = 330;
const spineX = (i: number) => SPINE_X0 + i * SPINE_STEP + (i >= OLD_TESTAMENT ? 8 : 0);
const spineH = (chapters: number) => 6 + chapters * 0.17;

const BOOK = "M158 118Q229 104 300 118Q371 104 442 118V278Q371 264 300 278Q229 264 158 278Z";
const COVER = "M150 124Q225 110 300 126Q375 110 450 124V287Q375 273 300 287Q225 273 150 287Z";

interface Props { picked: Picked; current: number; open: (i: number) => void }

export function QuizArt({ picked, current, open }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const focus = QUESTIONS[current];
  const shown = picked[current] !== null; // the passage is named only once its question is opened
  const [book, chapter, verse] = parseRef(focus.ref);
  const line = LINES[(verse - 1) % LINES.length];
  const bookIndex = BOOKS.findIndex(([code]) => code === bookOf(focus.read));
  const stateOf = (i: number) => picked[i] === null ? undefined : picked[i] === QUESTIONS[i].answer ? "right" : "wrong";

  // Thread from the chosen seal to the illumination (left seals) or to the verse's line (right seals), bowing outward.
  const seal = SEALS[current];
  const left = seal.x < 300 - 1;
  const [tx, ty] = left ? [166, 172] : shown ? [line.x + line.w + 5, line.y] : [436, 200];
  const angle = Math.atan2(ty - seal.y, tx - seal.x), sx = seal.x + 19 * Math.cos(angle), sy = seal.y + 19 * Math.sin(angle);
  const thread = `M${sx} ${sy}Q${left ? Math.min(sx, tx) - 34 : Math.max(sx, tx) + 34} ${(sy + ty) / 2} ${tx} ${ty}`;
  const spine = bookIndex >= 0 ? { x: spineX(bookIndex) + 1.2, top: SPINE_BASE - spineH(BOOKS[bookIndex][2]) } : null;

  return <svg className="hqa" viewBox="0 20 600 400" fill="none" role="group" aria-label="The questions drawn as an open Bible, with one seal per question">
    <defs>
      <linearGradient id={`${uid}l`} x1="0" x2="1"><stop stopColor="currentColor" stopOpacity=".03" /><stop offset=".8" stopColor="currentColor" stopOpacity=".06" /><stop offset="1" stopColor="currentColor" stopOpacity=".18" /></linearGradient>
      <linearGradient id={`${uid}r`} x1="1" x2="0"><stop stopColor="currentColor" stopOpacity=".03" /><stop offset=".8" stopColor="currentColor" stopOpacity=".06" /><stop offset="1" stopColor="currentColor" stopOpacity=".18" /></linearGradient>
      <radialGradient id={`${uid}g`}><stop stopColor="currentColor" stopOpacity=".12" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="300" cy="206" rx="250" ry="150" fill={`url(#${uid}g)`} />
    <ellipse className="hqa-orbit" cx="300" cy="198" rx="284" ry="164" />
    <ellipse className="hqa-orbit hqa-orbit-inner" cx="300" cy="200" rx="226" ry="118" />

    <g className="hqa-book">
      <path className="hqa-cover" d={COVER} />
      <path className="hqa-under" d={BOOK} transform="translate(0 4)" />
      <path className="hqa-page" d={BOOK} />
      <path d="M158 118Q229 104 300 118V278Q229 264 158 278Z" fill={`url(#${uid}l)`} />
      <path d="M300 118Q371 104 442 118V278Q371 264 300 278Z" fill={`url(#${uid}r)`} />
      <path className="hqa-gutter" d="M300 118V278" />

      {/* Left page: the illumination, its label and a few lines beneath. */}
      <rect className="hqa-plate-frame" x="168" y="126" width="124" height="94" rx="2" />
      <rect className="hqa-plate-inner" x="171.5" y="129.5" width="117" height="87" rx="1" />
      <svg key={focus.scene} className="hqa-plate" x="172" y="130" width="116" height="87" viewBox="0 0 320 240" overflow="visible"><QuizScene scene={focus.scene} bare /></svg>
      <text className="hqa-label" x="230" y="234" textAnchor="middle">{`QUESTION ${pad(current + 1)} OF ${QUESTIONS.length}`}</text>
      <path className="hqa-ink" d="M172 246h116M172 253h108M172 260h116M172 267h80" />

      {/* Right page: book, chapter and verse, named once answered. */}
      <g key={`${current}-${shown}`} className="hqa-passage" data-shown={shown || undefined}>
        {shown ? <text className="hqa-head" x="373" y="135" textAnchor="middle">{book.toUpperCase()}</text> : <path className="hqa-ink" d="M352 132h42" />}
        <text className="hqa-numeral" x="318" y="174">{shown ? chapter : "?"}</text>
        <path className="hqa-ink" d={LINES.map((l) => `M${l.x} ${l.y}h${l.w}`).join("")} />
        {shown && <><rect className="hqa-verse-bg" x={line.x - 3} y={line.y - 3.6} width={line.w + 6} height="7.2" rx="2" />
          <path className="hqa-verse" d={`M${line.x} ${line.y}h${line.w}`} />
          <text className="hqa-verse-no" x={line.x - 6} y={line.y + 2.4} textAnchor="end">{verse}</text></>}
      </g>
      <path className="hqa-ribbon" d="M388 278V302L393 297L398 302V278" />
    </g>

    {/* The 66 books beneath, height by chapters. */}
    <g className="hqa-shelf">
      {BOOKS.map(([code, name, chapters], i) => {
        const states = QUESTIONS.map((q, k) => (bookOf(q.read) === code ? stateOf(k) : undefined));
        const state = shown && i === bookIndex ? "current" : states.includes("right") ? "right" : states.includes("wrong") ? "wrong" : undefined;
        return <rect key={code} className="hqa-spine" data-state={state} x={spineX(i)} y={SPINE_BASE - spineH(chapters)} width="2.1" height={spineH(chapters)} rx=".6"><title>{name}</title></rect>;
      })}
      <path className="hqa-shelf-line" d={`M182 ${SPINE_BASE + 0.5}H418`} />
      <text className="hqa-shelf-label" x={(SPINE_X0 + spineX(OLD_TESTAMENT - 1) + 2.4) / 2} y={SPINE_BASE + 13} textAnchor="middle">OLD TESTAMENT</text>
      <text className="hqa-shelf-label" x={(spineX(OLD_TESTAMENT) + spineX(65) + 2.4) / 2} y={SPINE_BASE + 13} textAnchor="middle">NEW TESTAMENT</text>
    </g>
    {shown && spine && <path key={`down-${current}`} className="hqa-thread hqa-thread-down" d={`M${line.x - 10} ${line.y + 3}Q303 ${line.y + 4} 303 ${line.y + 22}V288Q303 ${spine.top - 10} ${spine.x} ${spine.top - 3}`} />}

    <path key={`up-${current}-${shown}`} className="hqa-thread" d={thread} />
    <g className="hqa-seals">{SEALS.map((s, i) => {
      const state = stateOf(i);
      return <g key={i} className="hqa-seal" data-state={state} data-current={i === current || undefined} role="button" tabIndex={0} aria-pressed={i === current}
        aria-label={`Question ${i + 1}${state === "right" ? ", opened" : ""}`}
        onClick={() => open(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } }}>
        {i === current && <circle className="hqa-halo" cx={s.x} cy={s.y} r="22" />}
        <circle className="hqa-seal-disc" cx={s.x} cy={s.y} r="16" />
        <circle className="hqa-seal-ring" cx={s.x} cy={s.y} r="12.5" />
        <text x={s.x} y={s.y + 3.2} textAnchor="middle">{pad(i + 1)}</text>
      </g>;
    })}</g>

    <text className="hqa-caption" x="300" y="404" textAnchor="middle">TWELVE QUESTIONS · ONE OPEN BOOK</text>
  </svg>;
}
