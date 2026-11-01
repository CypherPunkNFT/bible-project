// MOCK-UP (/home_mockup11): five phone versions of the homepage's four convictions, each far shorter than the stacked list.
// A and B are native sideways scrolling, so they swipe and snap like the phone expects; C, D and E are tabs. Same words and
// drawings as the real list. Styles: convictions-phone.css (.cvm-*).
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ART, CONVICTIONS } from "@/pages/contact/AboutSections";
import { GLORY_TEXT } from "@/pages/home/HomeGuide";

const ITEMS = CONVICTIONS.map((item, index) => ({ ...item, text: index === 0 ? GLORY_TEXT : item.text, drawing: ART[item.art === "books" ? "shelf" : item.art] }));
const COUNT = ITEMS.length;
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
    <blockquote className="cvm-verse">“{item.verse}”<cite>{item.reference}</cite></blockquote>
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

/** The numerals under a sideways scroller: tapping one goes there; the gold line under them follows the finger. */
function NumeralRail({ active, goTo }: { active: number; goTo: (index: number) => void }) {
  return <div className="cvm-rail" role="group" aria-label="Choose a conviction">
    {ITEMS.map((item, index) => <button key={item.numeral} type="button" aria-label={item.title} aria-current={index === active} onClick={() => goTo(index)}>{item.numeral}</button>)}
    <span className="cvm-rail-line" aria-hidden="true" />
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

/** B: one long drawing behind all four. Swiping walks along it; the stars drift slower than the land, the numerals at their own pace. */
export function ConvictionsLongDrawing() {
  const { track, active, goTo } = useSideways();
  return <section className="cvm cvm-long" aria-label="Our four convictions">
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
    <NumeralRail active={active} goTo={goTo} />
  </section>;
}

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);

/** C: a dial. The numerals ride the ring, the chosen one turns to the top under the gold arc. Tap a numeral, or swipe anywhere on it. */
export function ConvictionsRing() {
  const [turn, setTurn] = useState(0);
  const active = ((turn % COUNT) + COUNT) % COUNT;
  const start = useRef<number | null>(null);
  const choose = (index: number) => setTurn(turn + ((index - active + COUNT + 2) % COUNT) - 2);
  const swipeEnd = (event: PointerEvent<HTMLElement>) => {
    if (start.current === null) return;
    const moved = event.clientX - start.current;
    start.current = null;
    if (Math.abs(moved) > 36) setTurn(turn + (moved < 0 ? 1 : -1));
  };
  return <section className="cvm cvm-ring" aria-label="Our four convictions" style={{ "--turn": `${turn * -90}deg` } as CSSProperties}
    onPointerDown={(event) => { start.current = event.clientX; }} onPointerUp={swipeEnd} onPointerCancel={() => { start.current = null; }}>
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
