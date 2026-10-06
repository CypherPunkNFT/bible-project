import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { CITY_COLLECTIONS, type CityChoice } from "./city-collections";
import "./city-motion-lab.css";

const DESIGNS = [
  { id: "expand", name: "Clear & expand" },
  { id: "dissolve", name: "Soft dissolve" },
  { id: "slide", name: "Slide across" },
  { id: "unfold", name: "Reveal downward" },
] as const;
type Design = typeof DESIGNS[number]["id"];
type Collection = typeof CITY_COLLECTIONS[number];
const tint = (color: string) => ({ "--places-color": `var(--${color})` }) as CSSProperties;
const EASE = "cubic-bezier(.22, 1, .36, 1)";

export function CityMotionLab({ renderCity }: { renderCity: (city: CityChoice) => ReactNode }) {
  const [search, setSearch] = useSearchParams();
  const design = DESIGNS.find((item) => item.id === search.get("design")) ?? DESIGNS[0];
  return <div className="places-motion-lab">
    <header className="places-destination-intro"><p className="places-kicker">Explore by city</p><h1>Enter a city. Understand its story.</h1><p>Look beyond the dot on the map. Discover the setting, people, and passages that give a place its meaning.</p></header>
    <div className="motion-designs" role="group" aria-label="Animation designs">{DESIGNS.map((item, index) => <button type="button" key={item.id} aria-pressed={item.id === design.id} onClick={() => setSearch({ design: item.id }, { replace: true })}><span>0{index + 1}<span className={`motion-miniature motion-miniature-${item.id}`} aria-hidden><i /><i /><i /></span></span><strong>{item.name}</strong></button>)}</div>
    <CitySelection key={design.id} design={design.id} renderCity={renderCity} />
  </div>;
}

function CitySelection({ design, renderCity }: { design: Design; renderCity: (city: CityChoice) => ReactNode }) {
  const [collection, setCollection] = useState<Collection>(CITY_COLLECTIONS[0]);
  const [city, setCity] = useState(CITY_COLLECTIONS[0].cities[0]);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const running = useRef(false);
  const generation = useRef(0);
  const animations = useRef(new Set<Animation>());
  const reservedHeight = useRef(0);
  const measuredWidth = useRef(0);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const fitStage = () => {
      if (running.current || !stage.current || !grid.current || !panel.current) return;
      const list = grid.current, detail = panel.current;
      if (design === "expand") {
        stage.current.style.height = `${(detail.hidden ? list : detail).offsetHeight}px`;
      } else {
        // Reserve the city panel's space before interaction: fading/sliding/revealing must not look like growing.
        const wasHidden = detail.hidden, visibility = detail.style.visibility;
        detail.style.visibility = "hidden";
        detail.hidden = false;
        const width = stage.current.clientWidth;
        reservedHeight.current = Math.max(measuredWidth.current === width ? reservedHeight.current : 0, list.offsetHeight, detail.offsetHeight);
        measuredWidth.current = width;
        detail.hidden = wasHidden;
        detail.style.visibility = visibility;
        stage.current.style.height = `${reservedHeight.current}px`;
      }
    };
    const observer = new ResizeObserver(fitStage);
    if (grid.current) observer.observe(grid.current);
    if (panel.current) observer.observe(panel.current);
    fitStage();
    const active = animations.current;
    const lifetime = generation;
    return () => { lifetime.current++; observer.disconnect(); active.forEach((animation) => animation.cancel()); active.clear(); };
  }, [design]);

  async function transition(open: boolean, entry = collection) {
    if (running.current) return;
    running.current = true;
    const run = ++generation.current;
    setBusy(true);
    setCollection(entry);
    if (!entry.cities.some((item) => item.id === city.id)) setCity(entry.cities[0]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (run !== generation.current) return;
    const box = stage.current!, list = grid.current!, detail = panel.current!, shell = ghost.current!;
    const from = open ? list : detail, to = open ? detail : list;
    const chosen = list.querySelector<HTMLElement>(`[data-motion-collection="${entry.id}"]`)!;
    const touched: Animation[] = [];
    const animate = async (element: HTMLElement, keyframes: Keyframe[], duration: number, easing = EASE) => {
      if (run !== generation.current) throw new Error("Transition cancelled");
      const animation = element.animate(keyframes, { duration: reduced ? 0 : duration, easing, fill: "forwards" });
      animations.current.add(animation); touched.push(animation);
      await animation.finished;
    };
    from.inert = true; to.inert = true;
    to.hidden = false; to.style.opacity = "0";
    const startHeight = from.offsetHeight, endHeight = to.offsetHeight;
    const cardRect = chosen.getBoundingClientRect(), boxRect = box.getBoundingClientRect();
    const small = { left: `${cardRect.left - boxRect.left}px`, top: `${cardRect.top - boxRect.top}px`, width: `${cardRect.width}px`, height: `${cardRect.height}px` };
    const large = { left: "0px", top: "0px", width: `${box.clientWidth}px`, height: `${detail.offsetHeight}px` };
    const resize = (duration: number) => animate(box, [{ height: `${startHeight}px` }, { height: `${endHeight}px` }], duration);
    if (design !== "expand") {
      reservedHeight.current = Math.max(reservedHeight.current, startHeight, endHeight);
      box.style.height = `${reservedHeight.current}px`;
    }
    let completed = false;
    try {
      if (reduced) {
        // The same content and focus changes, without spatial movement or staged delays.
      } else if (design === "expand") {
        // Keep a matching surface beneath each handoff; never remove the shell before its replacement is opaque.
        const facade = chosen.cloneNode(true) as HTMLElement;
        facade.removeAttribute("data-motion-collection");
        facade.classList.remove("places-city-card");
        Object.assign(facade.style, { border: "0", background: "transparent", opacity: open ? "1" : "0" });
        facade.inert = true;
        shell.replaceChildren(facade);
        const surface = getComputedStyle(open ? chosen : detail);
        Object.assign(shell.style, { background: surface.background, border: surface.border, borderTop: surface.borderTop, borderRadius: surface.borderRadius, opacity: "1", zIndex: "2" });
        to.style.zIndex = "3";
        detail.style.zIndex = "3";
        if (open) {
          await Promise.all(Array.from(list.children).filter((element) => element !== chosen).map((element) => animate(element as HTMLElement, [{ opacity: 1 }, { opacity: 0 }], 180)));
          Object.assign(shell.style, small);
          shell.hidden = false;
          list.style.opacity = "0";
        } else {
          Object.assign(shell.style, large);
          shell.hidden = false;
          await animate(detail, [{ opacity: 1 }, { opacity: 0 }], 180);
        }
        await Promise.all([
          animate(shell, [open ? small : large, open ? large : small], 420),
          animate(facade, [{ opacity: open ? 1 : 0 }, { opacity: open ? 0 : 1 }], 420),
          resize(420),
        ]);
        await animate(to, [{ opacity: 0 }, { opacity: 1 }], 220);
        // The incoming view now fully covers the shell, so removing it cannot expose an empty frame.
        shell.hidden = true;
      } else if (design === "dissolve") {
        await Promise.all([
          animate(from, [{ opacity: 1 }, { opacity: 0 }], 320, "ease-in-out"),
          animate(to, [{ opacity: 0 }, { opacity: 1 }], 320, "ease-in-out"),
        ]);
      } else if (design === "slide") {
        const direction = open ? -100 : 100;
        to.style.opacity = "1";
        await Promise.all([
          animate(from, [{ transform: "translateX(0%)" }, { transform: `translateX(${direction}%)` }], 480, "cubic-bezier(.65, 0, .35, 1)"),
          animate(to, [{ transform: `translateX(${-direction}%)` }, { transform: "translateX(0%)" }], 480, "cubic-bezier(.65, 0, .35, 1)"),
        ]);
      } else {
        // Reveal the stationary city panel over the grid; reverse by rolling its lower edge upward.
        detail.style.zIndex = "3";
        to.style.opacity = "1";
        await Promise.all([
          animate(detail, [{ clipPath: open ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }, { clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }], 480, "cubic-bezier(.65, 0, .35, 1)"),
          animate(list, [{ opacity: open ? 1 : 0 }, { opacity: open ? 0 : 1 }], 480, "cubic-bezier(.65, 0, .35, 1)"),
        ]);
      }
      if (run !== generation.current) return;
      from.hidden = true; to.hidden = false; shell.hidden = true;
      from.style.opacity = "1"; to.style.opacity = "1";
      list.style.zIndex = ""; detail.style.zIndex = "";
      box.style.height = `${design === "expand" ? endHeight : reservedHeight.current}px`;
      to.inert = false;
      setExpanded(open);
      completed = true;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError") && run === generation.current) throw error;
    } finally {
      touched.forEach((animation) => { animation.cancel(); animations.current.delete(animation); });
      if (run === generation.current) {
        running.current = false; setBusy(false);
        if (completed) requestAnimationFrame(() => { if (run === generation.current) (open ? back.current : chosen)?.focus({ preventScroll: true }); });
      }
    }
  }

  return <>
    <section className="motion-city-selection" aria-labelledby="motion-city-selection-title">
    <div className="places-section-heading"><h2 id="motion-city-selection-title"><span className="places-tier-number">01</span>{expanded ? "Choose a city" : "Choose a collection"}</h2><span>{expanded ? collection.title : "Eight doorways into the ancient world"}</span></div>
    <div ref={stage} className="motion-demo-stage" data-phase={busy ? "animating" : expanded ? "cities" : "collections"} onKeyDown={(event) => { if (event.key === "Escape" && expanded && !busy) { event.preventDefault(); void transition(false); } }}>
      <div ref={grid} hidden={expanded} className="places-city-collection-grid motion-demo-grid" role="group" aria-label="City collections">{CITY_COLLECTIONS.map((entry) => <button key={entry.id} type="button" data-motion-collection={entry.id} style={tint(entry.color)} className="places-city-card places-city-card-trigger" onClick={() => void transition(true, entry)} disabled={busy} aria-label={entry.title}><span className="places-city-collection-top"><entry.icon size={23} strokeWidth={1.4} aria-hidden /><span>{entry.cities.length} cities</span><ArrowUpRight size={15} aria-hidden /></span><strong>{entry.title}</strong><small>{entry.subtitle}</small></button>)}</div>
      <article ref={panel} hidden={!expanded} className="places-city-card is-expanded motion-demo-panel" style={tint(collection.color)}>
        <div className="places-city-card-interior">
          <div className="places-city-card-navigation"><button ref={back} type="button" className="places-collections-back" onClick={() => void transition(false)} disabled={busy}><ArrowLeft size={16} aria-hidden />All collections</button><span aria-hidden>/</span><span>{collection.title}</span></div>
          <div className="places-city-card-heading"><span className="places-city-icon"><collection.icon size={25} strokeWidth={1.4} aria-hidden /></span><div><h3>{collection.title}</h3><p>{collection.subtitle}</p></div><span className="places-city-count">{collection.cities.length} cities</span></div>
          <p className="places-city-card-description">{collection.description}</p>
          <div className="places-choices places-city-choices" role="group" aria-label="Which city will you explore?">{collection.cities.map((item, index) => <button type="button" key={item.id} aria-pressed={item.id === city.id} disabled={busy} onClick={() => setCity(item)}><span className="places-choice-mark" aria-hidden>{String(index + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span>{item.id === city.id ? <Check size={15} aria-hidden /> : <ArrowRight size={15} aria-hidden />}</button>)}</div>
          <div className="places-city-card-footer"><span>Choose a city to explore below.</span><Link to={collection.passage.path}><BookOpen size={14} aria-hidden />{collection.passage.label}<ArrowUpRight size={13} aria-hidden /></Link></div>
        </div>
      </article>
      <div ref={ghost} hidden className="motion-demo-ghost" style={tint(collection.color)} aria-hidden />
    </div>
    </section>
    {renderCity(city)}
  </>;
}
