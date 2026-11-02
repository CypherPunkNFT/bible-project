// The homepage's four convictions on phones: one long drawing behind all four, far shorter than the stacked list, which still shows on
// wider screens. Native sideways scrolling, so it swipes and snaps like the phone expects. Owner's pick from /home_mockup11, 2026-11-01.
// Styles: convictions-long-drawing.css (.cvm-*). The mock-up's other versions reuse the pieces exported here.
import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { ART, CONVICTIONS } from "@/pages/contact/AboutSections";
import "./convictions-long-drawing.css";

/** For the glory of God, said a little more fully than on the contact page, so it is not the shortest of the four. */
export const GLORY_TEXT = "Every page is offered back to the One it is about: the Almighty, the Alpha and Omega, the beginning and the ending, worthy of all praise.";

export const ITEMS = CONVICTIONS.map((item, index) => ({ ...item, text: index === 0 ? GLORY_TEXT : item.text, drawing: ART[item.art === "books" ? "shelf" : item.art] }));
export const COUNT = ITEMS.length;
/** The verses' own words, held here because the shared list is moving from words to verse ids; the page must build either way. */
const VERSE_WORDS: Record<string, string> = {
  "1 Corinthians 10:31": "So whether you eat or drink or whatever you do, do it all to the glory of God.",
  "Matthew 10:8": "Freely you have received; freely give.",
  "Isaiah 55:1": "Come, all you who are thirsty, come to the waters.",
  "Proverbs 4:7": "Wisdom is supreme; so acquire wisdom.",
};
export type Item = (typeof ITEMS)[number];
export interface RailProps { active: number; goTo: (index: number) => void }

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const position = (index: number) => ({ "--i": index }) as CSSProperties;

export function Words({ item, title = true }: { item: Item; title?: boolean }) {
  return <>
    {title && <h3 className="cvm-title">{item.title}</h3>}
    <p className="cvm-text">{item.text}</p>
    <blockquote className="cvm-verse">“{VERSE_WORDS[item.reference]}”<cite>{item.reference}</cite></blockquote>
  </>;
}

/** A native sideways scroller: reports the nearest item, and how far along it is as --p (0 to 3) for whatever moves with the finger. */
export function useSideways() {
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

/** Dots over a sideways scroller: tapping one goes there; the long gold one follows the finger. */
function DotRail({ active, goTo }: RailProps) {
  return <div className="cvm-dots" role="group" aria-label="Choose a conviction">
    {ITEMS.map((item, index) => <button key={item.numeral} type="button" aria-label={item.title} aria-current={index === active} onClick={() => goTo(index)}><span /></button>)}
  </div>;
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

/** One long drawing behind all four. Swiping walks along it; the stars drift slower than the land, the numerals at their own pace. */
export function ConvictionsLongDrawing({ Rail = DotRail }: { Rail?: ComponentType<RailProps> }) {
  const { track, active, goTo } = useSideways();
  return <section className="cvm cvm-long" aria-label="Our four convictions">
    <Rail active={active} goTo={goTo} />
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
