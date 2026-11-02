// MOCK-UP (/home_mockup11): eight phone versions of the homepage's four convictions, each far shorter than the stacked list.
// A, B and G are native sideways scrolling, so they swipe and snap like the phone expects; the others are tabs or a swipe. Same words and
// drawings as the real list. Styles: convictions-phone.css (.cvm-*).
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ART, CONVICTIONS } from "@/pages/contact/AboutSections";
import { GLORY_TEXT } from "@/pages/home/HomeGuide";

const ITEMS = CONVICTIONS.map((item, index) => ({ ...item, text: index === 0 ? GLORY_TEXT : item.text, drawing: ART[item.art === "books" ? "shelf" : item.art] }));
const COUNT = ITEMS.length;
/** The verses' own words, held here because the shared list is moving from words to verse ids; the page must build either way. */
const VERSE_WORDS: Record<string, string> = {
  "1 Corinthians 10:31": "So whether you eat or drink or whatever you do, do it all to the glory of God.",
  "Matthew 10:8": "Freely you have received; freely give.",
  "Isaiah 55:1": "Come, all you who are thirsty, come to the waters.",
  "Proverbs 4:7": "Wisdom is supreme; so acquire wisdom.",
};
type Item = (typeof ITEMS)[number];

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const position = (index: number) => ({ "--i": index }) as CSSProperties;

function Drawing({ item }: { item: Item }) {
  return <svg viewBox="0 0 120 92" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.drawing}</svg>;
}

function Words({ item, title = true }: { item: Item; title?: boolean }) {
  return <>
    {title && <h3 className="cvm-title">{item.title}</h3>}
    <p className="cvm-text">{item.text}</p>
    <blockquote className="cvm-verse">“{VERSE_WORDS[item.reference]}”<cite>{item.reference}</cite></blockquote>
  </>;
}

/** All the words stacked in one spot, so the section keeps the height of the longest and nothing jumps as they change. */
function StackedWords({ active, title = true, id }: { active: number; title?: boolean; id: string }) {
  return <div className="cvm-stack">{ITEMS.map((item, index) => <div key={item.numeral} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} aria-hidden={index !== active} data-active={index === active}>
    <Words item={item} title={title} />
  </div>)}</div>;
}

/** Left and right arrow keys for a row of tabs. */
function arrowKeys(active: number, choose: (index: number) => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (active + step + COUNT) % COUNT;
    choose(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };
}

/** A native sideways scroller: reports the nearest item, and how far along it is as --p (0 to 3) for whatever moves with the finger. */
function useSideways() {
  const track = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const room = element.scrollWidth - element.clientWidth;
      const along = room > 0 ? (element.scrollLeft / room) * (COUNT - 1) : 0;
      element.parentElement?.style.setProperty("--p", along.toFixed(3));
      setActive(Math.round(along));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    element.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => { element.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  const goTo = useCallback((index: number) => {
    const element = track.current;
    const items = element?.querySelectorAll<HTMLElement>(":scope > li:not(.cvm-backdrop)");
    if (!element || !items) return;
    element.scrollTo({ left: items[index].offsetLeft - items[0].offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
  }, []);
  return { track, active, goTo };
}

/** A sideways swipe anywhere on the element: step is +1 for the next one, -1 for the one before. */
function useSwipe(onStep: (step: number) => void) {
  const start = useRef<number | null>(null);
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => { start.current = event.clientX; },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (start.current === null) return;
      const moved = event.clientX - start.current;
      start.current = null;
      if (Math.abs(moved) > 36) onStep(moved < 0 ? 1 : -1);
    },
    onPointerCancel: () => { start.current = null; },
  };
}

/** The numerals under a sideways scroller: tapping one goes there; the gold line under them follows the finger. */
function NumeralRail({ active, goTo }: { active: number; goTo: (index: number) => void }) {
  return <div className="cvm-rail" role="group" aria-label="Choose a conviction">
    {ITEMS.map((item, index) => <button key={item.numeral} type="button" aria-label={item.title} aria-current={index === active} onClick={() => goTo(index)}>{item.numeral}</button>)}
    <span className="cvm-rail-line" aria-hidden="true" />
  </div>;
}

/** Dots over a sideways scroller: tapping one goes there; the gold one follows the finger. */
function DotRail({ active, goTo }: { active: number; goTo: (index: number) => void }) {
  return <div className="cvm-dots" role="group" aria-label="Choose a conviction">
    {ITEMS.map((item, index) => <button key={item.numeral} type="button" aria-label={item.title} aria-current={index === active} onClick={() => goTo(index)}><span /></button>)}
  </div>;
}

/** A: swipe panel to panel, the next one peeking in; each giant numeral slides at its own pace behind the words. */
export function ConvictionsPanels() {
  const { track, active, goTo } = useSideways();
  return <section className="cvm cvm-panels" aria-label="Our four convictions">
    <ol className="cvm-track" ref={track} tabIndex={0}>
      {ITEMS.map((item, index) => <li key={item.numeral} style={position(index)} data-active={index === active}>
        <span className="cvm-numeral" aria-hidden="true">{item.numeral}</span>
        <div className="cvm-art"><Drawing item={item} /></div>
        <Words item={item} />
      </li>)}
    </ol>
    <NumeralRail active={active} goTo={goTo} />
  </section>;
}

const STARS = Array.from({ length: 70 }, (_, index) => ({ x: (index * 233) % 1600, y: 8 + ((index * 67) % 130), r: index % 5 === 0 ? 1.5 : 0.9, twinkle: index % 4 === 0 }));

/** The four drawings standing on one unbroken line of land, each at the middle of its 400-wide stretch. */
function Landscape() {
  const place = (x: number, ground: number) => `translate(${x - 96} ${ground - 134.4}) scale(1.6)`;
  return <svg className="cvm-land" viewBox="0 0 1600 240" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path className="cv-faint" d="M0 190C120 150 240 196 360 172S560 130 700 170 900 196 1040 160 1240 140 1380 176 1540 190 1600 170" />
    <path d="M0 214C90 214 130 178 200 178S310 214 400 214 520 206 600 206 720 214 800 214 920 210 1000 210 1120 214 1200 214 1320 206 1400 206 1530 214 1600 214" />
    <path className="cv-faint" d="M40 226H110M300 228H420M520 224H560M700 230H840M940 226H1060M1180 230H1290M1450 226H1570" />
    <g transform={place(200, 178)}>{ITEMS[0].drawing}</g>
    <g transform={place(600, 206)}>{ITEMS[1].drawing}</g>
    <g transform={place(1000, 210)}>{ITEMS[2].drawing}</g>
    <g transform={place(1400, 206)}>{ITEMS[3].drawing}</g>
  </svg>;
}

/** I: B with numerals over it instead of dots, for anyone who would not guess that it scrolls sideways. */
export function ConvictionsLongDrawingWithMenu() {
  return <ConvictionsLongDrawing menu />;
}

/** B: one long drawing behind all four. Swiping walks along it; the stars drift slower than the land, the numerals at their own pace. */
export function ConvictionsLongDrawing({ menu = false }: { menu?: boolean }) {
  const { track, active, goTo } = useSideways();
  return <section className="cvm cvm-long" aria-label="Our four convictions">
    {menu ? <NumeralRail active={active} goTo={goTo} /> : <DotRail active={active} goTo={goTo} />}
    <ol className="cvm-track" ref={track} tabIndex={0}>
      <li className="cvm-backdrop" aria-hidden="true">
        <svg className="cvm-stars" viewBox="0 0 1600 240">{STARS.map((star) => <circle key={star.x} cx={star.x} cy={star.y} r={star.r} data-twinkle={star.twinkle || undefined} />)}</svg>
        <Landscape />
      </li>
      {ITEMS.map((item, index) => <li key={item.numeral} style={position(index)} data-active={index === active}>
        <span className="cvm-numeral" aria-hidden="true">{item.numeral}</span>
        <Words item={item} />
      </li>)}
    </ol>
  </section>;
}

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);

/** C: a dial. The numerals ride the ring, the chosen one turns to the top under the gold arc. Tap a numeral, or swipe anywhere on it. */
export function ConvictionsRing() {
  const [turn, setTurn] = useState(0);
  const active = ((turn % COUNT) + COUNT) % COUNT;
  const choose = (index: number) => setTurn(turn + ((index - active + COUNT + 2) % COUNT) - 2);
  const swipe = useSwipe((step) => setTurn(turn + step));
  return <section className="cvm cvm-ring" aria-label="Our four convictions" style={{ "--turn": `${turn * -90}deg` } as CSSProperties} {...swipe}>
    <div className="cvm-dial">
      <svg className="cvm-dial-fixed" viewBox="0 0 320 320" fill="none" aria-hidden="true">
        <circle className="cvm-dial-dash" cx="160" cy="160" r="112" />
        <path className="cvm-dial-arc" d="M62.4 62.4A138 138 0 0 1 257.6 62.4" />
      </svg>
      <div className="cvm-dial-turning">
        <svg viewBox="0 0 320 320" fill="none" aria-hidden="true">
          <circle className="cvm-dial-line" cx="160" cy="160" r="138" />
          {TICKS.map((angle) => <path key={angle} className="cvm-dial-tick" transform={`rotate(${angle} 160 160)`} d={angle % 45 === 0 ? "M160 8V18" : "M160 11V16"} />)}
        </svg>
        <div role="tablist" aria-label="Choose a conviction" onKeyDown={arrowKeys(active, choose)}>
          {ITEMS.map((item, index) => <button key={item.numeral} type="button" role="tab" id={`cvm-ring-tab-${index}`} aria-controls={`cvm-ring-panel-${index}`} aria-label={item.title} aria-selected={index === active} tabIndex={index === active ? 0 : -1} style={position(index)} onClick={() => choose(index)}>{item.numeral}</button>)}
        </div>
      </div>
      <div className="cvm-dial-art">{ITEMS.map((item, index) => <div key={item.numeral} data-active={index === active}><Drawing item={item} /></div>)}</div>
    </div>
    <StackedWords active={active} id="cvm-ring" />
  </section>;
}

/** D: all four at a glance. The lines that divide them are a cross; the chosen one lights and its words open underneath. */
export function ConvictionsCross() {
  const [active, setActive] = useState(0);
  return <section className="cvm cvm-cross" aria-label="Our four convictions">
    <div className="cvm-cross-grid" role="tablist" aria-label="Choose a conviction" onKeyDown={arrowKeys(active, setActive)}>
      {ITEMS.map((item, index) => <button key={item.numeral} type="button" role="tab" id={`cvm-cross-tab-${index}`} aria-controls={`cvm-cross-panel-${index}`} aria-selected={index === active} tabIndex={index === active ? 0 : -1} data-active={index === active} onClick={() => setActive(index)}>
        <span className="cvm-numeral" aria-hidden="true">{item.numeral}</span>
        <span className="cvm-art"><Drawing item={item} /></span>
        <span className="cvm-cross-title">{item.title}</span>
      </button>)}
    </div>
    <StackedWords active={active} title={false} id="cvm-cross" />
  </section>;
}

/** F: a book. Swipe or tap a numeral and the page turns on its spine to the next conviction. */
export function ConvictionsBook() {
  const [active, setActive] = useState(0);
  const swipe = useSwipe((step) => setActive((current) => Math.min(COUNT - 1, Math.max(0, current + step))));
  return <section className="cvm cvm-book" aria-label="Our four convictions" style={{ "--p": active } as CSSProperties} {...swipe}>
    <div className="cvm-book-pages">
      {ITEMS.map((item, index) => <article key={item.numeral} aria-hidden={index !== active} data-active={index === active} data-turned={index < active} style={{ zIndex: COUNT - index }}>
        <span className="cvm-numeral" aria-hidden="true">{item.numeral}</span>
        <div className="cvm-art"><Drawing item={item} /></div>
        <Words item={item} />
      </article>)}
    </div>
    <NumeralRail active={active} goTo={setActive} />
  </section>;
}

/** G: the numerals are the picture: huge and outlined, racing past faster than the words as you swipe, each drawing standing in front. */
export function ConvictionsGiantNumerals() {
  const { track, active, goTo } = useSideways();
  return <section className="cvm cvm-giant" aria-label="Our four convictions">
    <ol className="cvm-track" ref={track} tabIndex={0}>
      {ITEMS.map((item, index) => <li key={item.numeral} style={position(index)} data-active={index === active}>
        <div className="cvm-giant-stage">
          <span className="cvm-giant-numeral" aria-hidden="true">{item.numeral}</span>
          <div className="cvm-art"><Drawing item={item} /></div>
        </div>
        <Words item={item} />
      </li>)}
    </ol>
    <NumeralRail active={active} goTo={goTo} />
  </section>;
}

/** The window's panes: outline, the middle of the drawing, where its numeral sits, and the invisible tap area over it (percent). */
const PANES = [
  { outline: "M24 186V130C24 73 92 35 156 17V186Z", x: 96, y: 112, numeralY: 174, tap: { left: "0", top: "0", width: "50%", height: "55%" } },
  { outline: "M296 186V130C296 73 228 35 164 17V186Z", x: 224, y: 112, numeralY: 174, tap: { left: "50%", top: "0", width: "50%", height: "55%" } },
  { outline: "M24 194H156V332H24Z", x: 90, y: 248, numeralY: 318, tap: { left: "0", top: "55%", width: "50%", height: "45%" } },
  { outline: "M164 194H296V332H164Z", x: 230, y: 248, numeralY: 318, tap: { left: "50%", top: "55%", width: "50%", height: "45%" } },
];

/** H: an arched church window with four leaded panes, one drawing in each. Tap a pane and it fills with light. */
export function ConvictionsWindow() {
  const [active, setActive] = useState(0);
  return <section className="cvm cvm-window" aria-label="Our four convictions">
    <div className="cvm-window-frame">
      <svg viewBox="0 0 320 352" fill="none" aria-hidden="true">
        <defs><pattern id="cvm-lattice" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H22M0 0V22" className="cvm-window-lead" /></pattern></defs>
        <path className="cvm-window-arch" d="M16 340V130C16 66 90 26 160 6C230 26 304 66 304 130V340" />
        <path className="cvm-window-arch" d="M4 340H316" />
        <path className="cvm-window-sill" d="M16 348H304" />
        {PANES.map((pane, index) => <g key={pane.outline} data-active={index === active}>
          <path className="cvm-window-light" d={pane.outline} />
          <path d={pane.outline} fill="url(#cvm-lattice)" />
          <path className="cvm-window-pane" d={pane.outline} />
          <g className="cvm-window-art" data-active={index === active} transform={`translate(${pane.x - 51} ${pane.y - 39}) scale(.85)`} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{ITEMS[index].drawing}</g>
          <text className="cvm-window-numeral" x={pane.x} y={pane.numeralY} textAnchor="middle">{ITEMS[index].numeral}</text>
        </g>)}
      </svg>
      <div role="tablist" aria-label="Choose a conviction" onKeyDown={arrowKeys(active, setActive)}>
        {ITEMS.map((item, index) => <button key={item.numeral} type="button" role="tab" id={`cvm-window-tab-${index}`} aria-controls={`cvm-window-panel-${index}`} aria-label={item.title} aria-selected={index === active} tabIndex={index === active ? 0 : -1} style={PANES[index].tap} onClick={() => setActive(index)} />)}
      </div>
    </div>
    <StackedWords active={active} id="cvm-window" />
  </section>;
}

function FoldingRow({ item, open, onOpen, children }: { item: Item; open: boolean; onOpen: () => void; children: ReactNode }) {
  return <li data-active={open}>
    <h3><button type="button" aria-expanded={open} onClick={onOpen}>
      <span className="cvm-fold-numeral" aria-hidden="true">{item.numeral}</span>
      <span className="cvm-fold-title">{item.title}</span>
      <span className="cvm-art"><Drawing item={item} /></span>
    </button></h3>
    <div className="cvm-fold-open" aria-hidden={!open}><div>{children}</div></div>
  </li>;
}

/** E: four quiet rows, one always open. The plainest and the shortest. */
export function ConvictionsFolding() {
  const [active, setActive] = useState(0);
  return <section className="cvm cvm-fold" aria-label="Our four convictions">
    <ol>{ITEMS.map((item, index) => <FoldingRow key={item.numeral} item={item} open={index === active} onOpen={() => setActive(index)}>
      <span className="cvm-numeral" aria-hidden="true">{item.numeral}</span>
      <Words item={item} title={false} />
    </FoldingRow>)}</ol>
  </section>;
}
