// The questions page's header drawing, in the line style of the surviving witnesses page (owner, 2026-10-22, in place
// of the "Try one" question): three sheets on two gold rings among things from a desk (Artifacts), a catechism page of questions and answers at the back,
// a Sunday school lesson card in the middle and a quiz card in front. Everything fades in whole once; hovering fans the sheets
// apart, lights the quiz card's answers one by one and ticks the right one; the sheets also lean a little after the
// pointer, each by its own depth. Styles: questions-art.css. Drawings show forms only, not any source's page.
import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import "./questions-art.css";

/** A sheet's outline and its soft paper fill over a solid backing (so the sheets behind do not show through), with what
 *  is written on it clipped inside. */
function Sheet({ shape, children }: { shape: string; children: ReactNode }) {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 300 360" className="qa-sheet-svg" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".24" /><stop offset="1" stopColor="currentColor" stopOpacity=".05" /></linearGradient>
      <clipPath id={`${id}-clip`}><path d={shape} /></clipPath>
    </defs>
    <path d={shape} transform="translate(8 9)" fill="none" stroke="currentColor" opacity=".14" />
    <path d={shape} fill="var(--page)" stroke="none" />
    <path d={shape} fill={`url(#${id}-paper)`} stroke="currentColor" strokeOpacity=".7" />
    <g clipPath={`url(#${id}-clip)`}>{children}</g>
  </svg>;
}

const lines = (x: number, y: number, widths: number[], gap = 9) =>
  widths.map((w, i) => <path key={`${x}-${y}-${i}`} d={`M${x} ${y + i * gap}h${w}`} />);

/** At the back: a catechism page, questions and their answers in turn. */
function CatechismPage() {
  return <Sheet shape="M44 34Q150 24 256 36L256 326Q150 316 44 326Z">
    <g stroke="currentColor" strokeWidth="1.3" opacity=".75">
      {[0, 1, 2].map((block) => <g key={block} transform={`translate(0 ${block * 92})`}>
        <text x="62" y="70" className="qa-letter">Q.</text>{lines(84, 66, [138, 112])}
        <text x="62" y="102" className="qa-letter qa-letter-soft">A.</text>{lines(84, 98, [146, 150, 120, 84], 8)}
      </g>)}
    </g>
  </Sheet>;
}

/** In the middle: a Sunday school lesson card, its picture of a hill and three crosses, its lesson lines below. */
function LessonCard() {
  return <Sheet shape="M48 40L252 36 256 320 232 330 208 318 184 332 158 320 130 334 104 320 78 332 52 322Z">
    <g stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".8">
      {lines(70, 64, [70])}<path d="M214 60h18" />
      <rect x="70" y="80" width="160" height="104" rx="3" opacity=".7" />
      <path d="M70 168Q120 132 150 140T230 158" />
      <path d="M150 140V104M140 114H160M122 148V122M115 130H129M178 150V124M171 132H185" />
      <circle className="qa-twinkle" cx="206" cy="98" r="1.6" /><circle className="qa-twinkle" cx="92" cy="96" r="1.2" style={{ animationDelay: "-1.4s" }} />
      {lines(70, 206, [150, 156, 132, 148, 96], 12)}
    </g>
  </Sheet>;
}

const ROWS = [118, 96, 132, 104];

/** In front: a quiz card, its question mark and four answers; the second is the right one. */
function QuizCard() {
  return <Sheet shape="M40 30H260V330H40Z">
    <g stroke="currentColor" strokeWidth="1.4" fill="none">
      <path d="M62 56h56M222 56h16" opacity=".7" />
      <g className="qa-mark">
        <path d="M128 112C128 90 144 78 160 78C178 78 192 90 192 108C192 126 176 132 168 140C162 146 160 152 160 162" strokeWidth="5" />
        <circle className="qa-mark-dot" cx="160" cy="184" r="5" fill="currentColor" stroke="none" />
      </g>
      {ROWS.map((width, i) => <g key={width} className="qa-row" data-right={i === 1 || undefined} style={{ "--i": i } as CSSProperties}>
        <rect className="qa-row-glow" x="52" y={206 + i * 30} width="196" height="26" rx="4" stroke="none" />
        <circle cx="72" cy={219 + i * 30} r="7" />
        <path d={`M90 ${219 + i * 30}h${width}`} opacity=".75" />
      </g>)}
      <path className="qa-check" d="M67.5 249.5l3.5 3.5 7-8" strokeWidth="2" />
    </g>
  </Sheet>;
}

/** The things on the desk around the sheets, each its own small drawing placed by the stylesheet: a pencil, a wax seal
 *  and a reading glass whose lens lets the card show through (owner, 2026-10-22: no inkwell). Hovering the drawing
 *  moves each a little in its own way. */
function Artifacts() {
  const svg = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return <>
    <svg className="qa-thing qa-pencil" viewBox="0 0 220 40" {...svg}>
      <path className="qa-solid" d="M8 12H180L206 20L180 28H8Q4 28 4 24V16Q4 12 8 12Z" />
      <path d="M22 12V28M28 12V28M180 12V28M198 18L206 20L198 22M40 20H170" />
    </svg>
    <svg className="qa-thing qa-seal" viewBox="0 0 100 124" {...svg}>
      <path className="qa-solid" d="M38 64L26 116L38 106L48 118L54 70ZM62 64L74 116L62 106L52 118L46 70Z" />
      <circle className="qa-solid" cx="50" cy="50" r="31" strokeDasharray="4 3" />
      <circle cx="50" cy="50" r="21" />
      <path d="M50 36V64M40 46H60" strokeWidth="2" />
    </svg>
    <svg className="qa-thing qa-glass" viewBox="0 0 120 120" {...svg}>
      <circle className="qa-lens" cx="48" cy="48" r="30" />
      <circle cx="48" cy="48" r="24" opacity=".45" />
      <path d="M30 40A20 20 0 0 1 42 28" opacity=".7" />
      <path d="M70 70L104 104" strokeWidth="6" />
    </svg>
  </>;
}

// Everything has arrived once the glass's fade ends (0.6s delay + 0.6s); hover waits for it.
const DRAWN_MS = 1300;

export function QuestionsArt() {
  const art = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setReady(true), DRAWN_MS);
    return () => window.clearTimeout(timer);
  }, [ready]);
  // The pointer's place over the drawing, from -1 to 1 each way; each sheet leans after it by its own depth.
  const lean = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  };
  const rest = () => { art.current?.style.setProperty("--px", "0"); art.current?.style.setProperty("--py", "0"); };
  return <div className="qa-art" ref={art} data-ready={ready || undefined} onPointerMove={lean} onPointerLeave={rest} aria-hidden="true">
    <div className="qa-orbit qa-orbit-one" /><div className="qa-orbit qa-orbit-two" />
    <div className="qa-sheet qa-sheet-back"><div className="qa-depth"><CatechismPage /></div></div>
    <div className="qa-sheet qa-sheet-mid"><div className="qa-depth"><LessonCard /></div></div>
    <div className="qa-sheet qa-sheet-front"><div className="qa-depth"><QuizCard /></div></div>
    <Artifacts />
    <span className="qa-note"><i />A question asked.<br /><span>An answer kept.</span></span>
  </div>;
}
