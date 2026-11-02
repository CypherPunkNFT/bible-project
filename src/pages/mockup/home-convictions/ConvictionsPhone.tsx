// MOCK-UP (/home_mockup11): eight phone versions of the homepage's four convictions, each far shorter than the stacked list.
// B is the homepage's own now (pages/home/ConvictionsLongDrawing.tsx); these stay to compare against. A, B and G are native sideways scrolling, so they swipe and snap like the phone expects; the others are tabs or a swipe. Same words and
// drawings as the real list. Styles: convictions-phone.css (.cvm-*).
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ConvictionsLongDrawing, COUNT, ITEMS, position, useSideways, Words, type Item, type RailProps } from "@/pages/home/ConvictionsLongDrawing";

export { ConvictionsLongDrawing };

function Drawing({ item }: { item: Item }) {
  return <svg viewBox="0 0 120 92" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.drawing}</svg>;
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
function NumeralRail({ active, goTo }: RailProps) {
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

/** I: B with numerals over it instead of dots, for anyone who would not guess that it scrolls sideways. */
export function ConvictionsLongDrawingWithMenu() {
  return <ConvictionsLongDrawing Rail={NumeralRail} />;
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
