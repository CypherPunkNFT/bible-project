import { ArrowLeft, ArrowRight, ArrowUpRight, Check, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { CITY_COLLECTIONS } from "./city-collections";
import "./city-motion-lab.css";

const DESIGNS = [
  { id: "expand", name: "Clear & expand", hint: "Keep the card's identity", description: "The other cards disappear first. Only then does the chosen card grow; its cities arrive last.", steps: "Clear the neighbors → grow the card → reveal cities" },
  { id: "dissolve", name: "Soft dissolve", hint: "The quietest transition", description: "The collection grid and city panel crossfade in one continuous motion. No empty beat between views.", steps: "Fade the grid → settle the space → reveal cities" },
  { id: "slide", name: "Next chapter", hint: "A sense of going deeper", description: "The grid eases left as the city panel enters from the right. Both move together; going back reverses the direction.", steps: "Move out → pause → enter from the right" },
  { id: "unfold", name: "Unfold the collection", hint: "Open a layer of the story", description: "The new panel reveals downward over the fading cards. Its text stays still as the container opens.", steps: "Clear the grid → open downward → settle" },
] as const;
type Design = typeof DESIGNS[number]["id"];
type Collection = typeof CITY_COLLECTIONS[number];
const tint = (color: string) => ({ "--places-color": `var(--${color})` }) as CSSProperties;
const EASE = "cubic-bezier(.22, 1, .36, 1)";

export function CityMotionLab() {
  const [search, setSearch] = useSearchParams();
  const design = DESIGNS.find((item) => item.id === search.get("design")) ?? DESIGNS[0];
  const [slow, setSlow] = useState(false);
  return <div className="places-motion-lab">
    <header className="places-destination-intro"><p className="places-kicker">Interaction workshop</p><h1>Find the right rhythm.</h1><p>Four ways to open the same collection. Try any card, choose a city, then come back. Compare the feeling of each transition.</p></header>
    <div className="motion-designs" role="group" aria-label="Animation designs">{DESIGNS.map((item, index) => <button type="button" key={item.id} aria-pressed={item.id === design.id} onClick={() => setSearch({ design: item.id }, { replace: true })}><span>0{index + 1}<span className={`motion-miniature motion-miniature-${item.id}`} aria-hidden><i /><i /><i /></span></span><strong>{item.name}</strong><small>{item.hint}</small></button>)}</div>
    <div className="motion-design-explanation"><div><h2>{design.name}</h2><p>{design.description}</p></div><label><input type="checkbox" checked={slow} onChange={(event) => setSlow(event.target.checked)} />Slow motion</label></div>
    <MotionDemo key={`${design.id}-${slow}`} design={design.id} slow={slow} steps={design.steps} />
    <p className="motion-lab-note">This is a comparison mockup. <Link to="/study/places/mockup/cities">Return to Ancient Cities <ArrowUpRight size={13} aria-hidden /></Link></p>
  </div>;
}

function MotionDemo({ design, slow, steps }: { design: Design; slow: boolean; steps: string }) {
  const [collection, setCollection] = useState<Collection>(CITY_COLLECTIONS[0]);
  const [city, setCity] = useState(CITY_COLLECTIONS[0].cities[0]);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("Choose a collection to try it.");
  const stage = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const running = useRef(false);
  const generation = useRef(0);
  const animations = useRef(new Set<Animation>());
  const reduced = useReducedMotion();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (!running.current && stage.current) {
        const visible = panel.current?.hidden ? grid.current : panel.current;
        if (visible) stage.current.style.height = `${visible.offsetHeight}px`;
      }
    });
    if (grid.current) observer.observe(grid.current);
    if (panel.current) observer.observe(panel.current);
    const active = animations.current;
    const lifetime = generation;
    return () => { lifetime.current++; observer.disconnect(); active.forEach((animation) => animation.cancel()); active.clear(); };
  }, []);

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
    const animate = async (element: HTMLElement, keyframes: Keyframe[], duration: number) => {
      if (run !== generation.current) throw new Error("Transition cancelled");
      const animation = element.animate(keyframes, { duration: reduced ? 0 : duration * (slow ? 2 : 1), easing: EASE, fill: "forwards" });
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
          setPhase("1 / 3 ? Let the other cards fade.");
          await Promise.all(Array.from(list.children).filter((element) => element !== chosen).map((element) => animate(element as HTMLElement, [{ opacity: 1 }, { opacity: 0 }], 180)));
          Object.assign(shell.style, small);
          shell.hidden = false;
          list.style.opacity = "0";
        } else {
          setPhase("1 / 3 ? Close the city choices.");
          Object.assign(shell.style, large);
          shell.hidden = false;
          await animate(detail, [{ opacity: 1 }, { opacity: 0 }], 180);
        }
        setPhase(open ? "2 / 3 ? Expand into the cleared space." : "2 / 3 ? Return to the card's place.");
        await Promise.all([
          animate(shell, [open ? small : large, open ? large : small], 420),
          animate(facade, [{ opacity: open ? 1 : 0 }, { opacity: open ? 0 : 1 }], 420),
          resize(420),
        ]);
        setPhase(open ? "3 / 3 ? Reveal the cities." : "3 / 3 ? Bring the collection back.");
        await animate(to, [{ opacity: 0 }, { opacity: 1 }], 220);
        // The incoming view now fully covers the shell, so removing it cannot expose an empty frame.
        shell.hidden = true;
      } else {
        setPhase("Bring the next view in as the current view leaves.");
        const distance = open ? -22 : 22;
        const leaving: Keyframe[] = design === "slide" ? [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${distance}px)` }]
          : design === "unfold" && !open ? [{ opacity: 1, clipPath: "inset(0 0 0% 0)" }, { opacity: 0, clipPath: "inset(0 0 100% 0)" }]
          : [{ opacity: 1 }, { opacity: 0 }];
        const arriving: Keyframe[] = design === "slide" ? [{ opacity: 0, transform: `translateX(${-distance}px)` }, { opacity: 1, transform: "translateX(0)" }]
          : design === "unfold" && open ? [{ opacity: 0, clipPath: "inset(0 0 100% 0)" }, { opacity: 1, clipPath: "inset(0 0 0% 0)" }]
          : [{ opacity: 0 }, { opacity: 1 }];
        const duration = design === "dissolve" ? 320 : 380;
        await Promise.all([animate(from, leaving, duration), animate(to, arriving, duration), resize(duration)]);
      }
      if (run !== generation.current) return;
      from.hidden = true; to.hidden = false; shell.hidden = true;
      from.style.opacity = "1"; to.style.opacity = "1";
      list.style.zIndex = ""; detail.style.zIndex = "";
      box.style.height = `${endHeight}px`;
      to.inert = false;
      setExpanded(open);
      setPhase(open ? "Choose a city, or go back to feel the reverse transition." : "Choose another collection, or compare a different design.");
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

  async function replay() {
    if (running.current) return;
    const instance = stage.current;
    if (expanded) await transition(false);
    if (stage.current === instance && instance?.isConnected) await transition(true);
  }
  return <section className="motion-demo" aria-label="Interactive animation preview">
    <div className="motion-demo-toolbar"><span>{steps}</span><button type="button" onClick={replay} disabled={busy}><RotateCcw size={14} aria-hidden />Replay opening</button></div>
    <div ref={stage} className="motion-demo-stage" data-phase={busy ? "animating" : expanded ? "cities" : "collections"} onKeyDown={(event) => { if (event.key === "Escape" && expanded && !busy) { event.preventDefault(); void transition(false); } }}>
      <div ref={grid} hidden={expanded} className="places-city-collection-grid motion-demo-grid" role="group" aria-label="Preview collections">{CITY_COLLECTIONS.map((entry) => <button key={entry.id} type="button" data-motion-collection={entry.id} style={tint(entry.color)} className="places-city-card places-city-card-trigger" onClick={() => void transition(true, entry)} disabled={busy} aria-label={entry.title}><span className="places-city-collection-top"><entry.icon size={23} strokeWidth={1.4} aria-hidden /><span>{entry.cities.length} cities</span><ArrowUpRight size={15} aria-hidden /></span><strong>{entry.title}</strong><small>{entry.subtitle}</small></button>)}</div>
      <article ref={panel} hidden={!expanded} className="places-city-card is-expanded motion-demo-panel" style={tint(collection.color)}>
        <div className="places-city-card-interior">
          <div className="places-city-card-navigation"><button ref={back} type="button" className="places-collections-back" onClick={() => void transition(false)} disabled={busy}><ArrowLeft size={16} aria-hidden />All collections</button><span aria-hidden>/</span><span>{collection.title}</span></div>
          <div className="places-city-card-heading"><span className="places-city-icon"><collection.icon size={25} strokeWidth={1.4} aria-hidden /></span><div><h3>{collection.title}</h3><p>{collection.subtitle}</p></div><span className="places-city-count">{collection.cities.length} cities</span></div>
          <p className="places-city-card-description">{collection.description}</p>
          <div className="places-choices places-city-choices" role="group" aria-label="Preview cities">{collection.cities.map((item, index) => <button type="button" key={item.id} aria-pressed={item.id === city.id} disabled={busy} onClick={() => setCity(item)}><span className="places-choice-mark" aria-hidden>{String(index + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span>{item.id === city.id ? <Check size={15} aria-hidden /> : <ArrowRight size={15} aria-hidden />}</button>)}</div>
          <div className="places-city-card-footer"><span>Selected: <strong>{city.title}</strong></span><Link to={`/study/places/mockup/cities?collection=${collection.id}&focus=${city.id}`}>Open the city preview<ArrowUpRight size={13} aria-hidden /></Link></div>
        </div>
      </article>
      <div ref={ghost} hidden className="motion-demo-ghost" style={tint(collection.color)} aria-hidden />
    </div>
    <div className="motion-demo-status" role="status">{reduced ? "Reduced motion is on — transitions are immediate." : phase}</div>
  </section>;
}
