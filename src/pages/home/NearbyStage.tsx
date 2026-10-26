// Homepage (live; first tried on home_mockup, home_mockup2): the map of "Close to home" (HomeNearby.tsx) as one stage with two views (owner,
// 2026-10-23). First the USA map with the chosen city's facts beside it; choosing a city (any dot, or the button under the
// facts) flies the USA map down onto it and opens the city's own map out of its dot in a widening circle.
// - Seamless (owner, 2026-10-23): the flight ends with the USA map at the city map's own scale, its window grown to the
//   city map's frame and the city's dot exactly on the city map's centre point, and the circle opens from that point.
// - A city opens in three steps, each with one job (owner, 2026-10-23: "make this much more defined as a system"):
//   its files are read (nearby-files.ts: every city's, in the background, once the section comes near); its map is
//   drawn, hidden, when the visitor shows they may open it (pointing at or focusing its dot or the button), in slices
//   (a React transition) so the page never stalls; then the zoom. The ring on the dot shows only while the files are not
//   here yet ("loading means it does not have the information").
// - A click starts the flight at once (owner, 2026-10-23: "start zooming before the whole thing is complete… slowly,
//   from start to finish"): it heads for a guess of where it ends while the steps still missing run, and turns onto the
//   real end once the map is ready. If that takes long it eases to a stop early on, the ring turning, and picks up again.
// - Every part runs on one clock (nearby-clock.ts) shown by the ticker (NearbyTicker.tsx): pause, step, speed, and a
//   simulated slow connection; only on the mock-up pages (the homepage itself has none). The geometry: nearby-zoom.ts. The pieces are the shared ones of /resources/life.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type SyntheticEvent } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "react-router-dom";
import { loadResource, useResource, type City, type CityMap as CityMapData, type UsStates } from "@/data/resources/index";
import { CityInfo, UsaMap } from "@/pages/resources/life/CitySection";
import { CityMap } from "@/pages/resources/life/CityMap";
import { CITY_FILES, hasCityFiles, kindsIn, plural, type CityWords } from "@/pages/resources/life/format";
import { NearbyTicker } from "./NearbyTicker";
import { zoomClock } from "./nearby-clock";
import { forgetAll, hasFiles, readAll, readCity } from "./nearby-files";
import { anchorOf, between, boxOf, circleAt, dotOf, easeInOut, easeOut, fade, fitBeside, frames, guessScale, poseOf, scrollToCentre, setView, union, viewFor, windowOf, type Box, type Pose, type View } from "./nearby-zoom";

export type Place = City & { id: keyof typeof CITY_FILES };
type Phase = "usa" | "opening" | "city" | "closing";
/** One stretch of the flight, from the clock time `from` on. */
interface Leg { from: number; pose: (time: number) => Pose }

/** The flight down takes FLIGHT ms of its own time. It glides over gently, seen to move from the first moment; its zoom
 *  is slow and steady while the coast and borders are in view, then plunges fast onto the city just as its map opens
 *  (owner, 2026-10-23: "a non-linear zoom… zoom in super fast"). */
const FLIGHT = 2800;
const plunge = (t: number) => 0.25 * t + 0.75 * t ** 5;
const easeSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
/** While the city's map is not ready the flight eases to a stop HOLD ms into its own time (slowing over the last
 *  EASE_OFF ms); once ready it gets back up to speed over RESUME ms, and turns from its guessed end to the real one over
 *  TURN ms. EASE_OFF is half of RESUME, so the flight is always back at full speed by HOLD + EASE_OFF, before the window
 *  starts to grow. */
const HOLD = 700, EASE_OFF = 250, RESUME = 500, TURN = 600;
/** The window grows over GROW of the flight (on past its end, with the circle) on GROW_EASE, a curve that gets going at
 *  once, so it is plainly under way by tick 5 (owner, 2026-10-23: "by tick 5 it should be starting already, not tick
 *  nine"); the circle starts OPEN_AT of the way, during the plunge, and takes OPEN ms. */
const GROW = [0.15, 1.15], GROW_EASE = "cubic-bezier(.25, .1, .25, 1)", OPEN_AT = 0.92, OPEN = 1250;
/** The way back: the circle closes in CLOSE ms; the flight out starts OUT_AT ms in and takes BACK ms. */
const CLOSE = 900, OUT_AT = 450, BACK = 2200;
const EASE = "cubic-bezier(.45, 0, .2, 1)";

const clamp = (t: number) => Math.max(0, Math.min(1, t));
const glide = (from: number, ms: number, a: Pose, b: Pose, ease = easeInOut): Leg => ({ from, pose: (t) => between(a, b, ease(clamp((t - from) / ms))) });
function poseAt(legs: Leg[], time: number) {
  let leg = legs[0];
  for (const l of legs) if (l.from <= time) leg = l;
  return leg.pose(time);
}
/** The flight's own time at clock time `t`, the city's map ready at clock time `ready` (null: not yet). Worked out from
 *  the two alone, so the ticker can seek anywhere. */
function flightTime(t: number, ready: number | null) {
  const knee = HOLD - EASE_OFF, rate = (u: number) => (u <= knee ? 1 : Math.exp(-(u - knee) / EASE_OFF));
  const held = (u: number) => (u <= knee ? u : HOLD - EASE_OFF * rate(u));
  if (ready === null || t <= ready) return held(t);
  const r = rate(ready), u = Math.min(t - ready, RESUME);
  return held(ready) + r * u + ((1 - r) * u * u) / (2 * RESUME) + Math.max(0, t - ready - RESUME);
}
/** A waiting view is out of reach: not focusable, not read aloud (React 18 has no typed `inert`). */
const away = (hidden: boolean) => (hidden ? { inert: "", "aria-hidden": true } : {}) as object;
const viewOf = (svg: SVGSVGElement): View => { const b = svg.viewBox.baseVal; return { x: b.x, y: b.y, w: b.width, h: b.height }; };
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lays the USA map over `box` (its own box and the city map's frame together) for the move, keeping its stage's height. */
function spread(svg: SVGSVGElement, holder: HTMLElement, box: Box) {
  holder.style.height = `${holder.offsetHeight}px`;
  Object.assign(svg.style, { position: "absolute", left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, maxWidth: "none", aspectRatio: "auto" });
}
/** The USA map as tall as the facts and button beside it. */
function fitUsa(el: HTMLElement | null, states: UsStates) {
  const row = el?.querySelector<HTMLElement>(".hn-usa .lf-city-top"), info = row?.querySelector<HTMLElement>(".hn-info");
  if (row && info) fitBeside(row, info, states.width / states.height);
}
/** Scrolls the page from where it is to `to` between two clock times, so the map ends in the middle of the window. */
function scroller(from: number, ms: number, to: number) {
  const start = scrollY;
  return (t: number) => window.scrollTo(0, start + (to - start) * easeInOut(clamp((t - from) / ms)));
}
function unspread(svg: SVGSVGElement, holder: HTMLElement, aspect: string) {
  holder.style.height = "";
  svg.removeAttribute("style");
  svg.style.aspectRatio = aspect;
}

export function NearbyStage({ cities, words, checked }: { cities: Place[]; words: CityWords; checked: string }) {
  const states = useResource("us-states");
  const [cityId, setCityId] = useState<string>(() => (cities.find((c) => c.id === "jacksonville-fl") ?? cities[0]).id);
  const city = cities.find((c) => c.id === cityId) ?? cities[0];
  const facts = useResource(CITY_FILES[city.id].facts), map = useResource(CITY_FILES[city.id].map);
  const kinds = useMemo(() => kindsIn(city), [city]);
  const [phase, setPhase] = useState<Phase>("usa");
  /** The city whose map is drawn: hidden until it opens, then the open one. */
  const [drawnId, setDrawnId] = useState<string | null>(null);
  const drawnCity = cities.find((c) => c.id === drawnId) ?? null, drawnMap = useResource(CITY_FILES[(drawnCity ?? city).id].map);
  const drawnKinds = useMemo(() => (drawnCity ? kindsIn(drawnCity) : []), [drawnCity]);
  /** The city whose files are being read for a click, shown by a ring on its dot. */
  const [loading, setLoading] = useState<string | null>(null);
  const loader = useRef<HTMLDivElement>(null), phaseNow = useRef(phase);
  phaseNow.current = phase;
  const mockup = useLocation().pathname.includes("_mockup");
  const slowNet = useSyncExternalStore(zoomClock.subscribe, () => zoomClock.state.slowNet);
  const stage = useRef<HTMLDivElement>(null), busy = useRef(false), home = useRef<View | null>(null), lastEnd = useRef<{ x: number; y: number } | null>(null);
  const place = city.name.split(",")[0];
  const [drawnPlace, drawnRegion] = drawnCity ? [drawnCity.name.split(",")[0], drawnCity.name.split(",").slice(1).join(",").trim()] : ["", ""];
  const cityMap = useMemo(() => (drawnCity && typeof drawnMap === "object" ? <CityMap city={drawnCity} map={drawnMap} kinds={drawnKinds} words={words} /> : null), [drawnCity, drawnMap, drawnKinds, words]);

  // Drawing a map: one at a time. Ahead of a click it is rendered as a transition, so React builds it in slices between
  // frames; once a move has started it is drawn `now` (the ticker updates every frame of a move, and each update would
  // restart a transition: measured, 2026-10-23, the map then came 5 s late). `draw` resolves once it is on the page
  // (committed); its pins are placed in the frames after.
  const committed = useRef<string | null>(null), waiters = useRef(new Map<string, (() => void)[]>()), intent = useRef<string | null>(null);
  const draw = useCallback((id: string, now = false) => new Promise<void>((done) => {
    if (committed.current === id) { done(); return; }
    waiters.current.set(id, [...(waiters.current.get(id) ?? []), done]);
    if (now) flushSync(() => setDrawnId(id)); else startTransition(() => setDrawnId(id));
  }), []);
  useLayoutEffect(() => {
    committed.current = drawnId && cityMap ? drawnId : null;
    if (!committed.current) return;
    waiters.current.get(committed.current)?.forEach((done) => done());
    waiters.current.delete(committed.current);
  }, [drawnId, cityMap]);

  /** The visitor may open this city: read its files if they are not here, then draw its map. */
  const want = useCallback((id: string) => {
    if (busy.current || phaseNow.current !== "usa" || !hasCityFiles(id)) return;
    intent.current = id;
    void readCity(id).then((ok) => { if (ok && intent.current === id && !busy.current && phaseNow.current === "usa") void draw(id); });
  }, [draw]);
  const pointing = useRef(0);
  const showsIntent = (e: SyntheticEvent, now = false) => {
    const target = e.target as Element, id = target.closest<HTMLElement>(".lf-us-city[data-id]")?.dataset.id ?? (target.closest(".hn-open") ? city.id : null);
    window.clearTimeout(pointing.current);
    // Passing over dots on the way somewhere else draws nothing: only a pointer that rests a moment counts.
    if (id) pointing.current = window.setTimeout(() => want(id), now ? 0 : 90);
  };

  // A new simulated connection is a first visit: nothing read, nothing drawn. Then, once the section comes near, every
  // city's files are read in the background (the chosen city first) and the chosen city's map is drawn.
  useEffect(() => {
    forgetAll();
    intent.current = null;
    if (phaseNow.current === "usa" && !busy.current) setDrawnId(null);
    const el = stage.current;
    if (!el) return;
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      near.disconnect();
      const chosen = cities.find((c) => c.id === cityId) ?? cities[0];
      readAll([chosen.id, ...cities.map((c) => c.id)]);
      if (!intent.current) want(chosen.id);
    }, { rootMargin: "400px" });
    near.observe(el);
    return () => near.disconnect();
  }, [slowNet]); // eslint-disable-line react-hooks/exhaustive-deps -- re-armed only when the simulated connection changes

  // The USA map is sized to the facts beside it once they are here, and when the row's width changes (not while a move
  // runs, nor when a click swaps the facts: the map would jump as the zoom starts; closing refits it under cover).
  useLayoutEffect(() => {
    const el = stage.current, row = el?.querySelector<HTMLElement>(".hn-usa .lf-city-top");
    if (phase !== "usa" || !row || typeof states !== "object") return;
    const fit = () => fitUsa(el, states);
    fit();
    void document.fonts?.ready.then(() => { if (stage.current === el) fit(); });
    let width = row.clientWidth;
    const resize = new ResizeObserver(() => { if (row.clientWidth !== width) { width = row.clientWidth; fit(); } });
    resize.observe(row);
    return () => resize.disconnect();
  }, [phase, states, typeof facts === "object"]); // eslint-disable-line react-hooks/exhaustive-deps -- not on a city change: the map must not resize as a move starts

  const open = async (id: string) => {
    const el = stage.current, holder = el?.querySelector<HTMLElement>(".hn-usa .lf-usa .lf-stage"), svg = holder?.querySelector("svg"), next = cities.find((c) => c.id === id);
    if (!el || !holder || !svg || !next || typeof states !== "object") return;
    const dot = dotOf(states, next), name = next.name.split(",")[0];
    home.current = viewOf(svg);
    intent.current = id;
    window.clearTimeout(pointing.current);
    // Its files are read (only if they are not here yet, a ring turning on its dot meanwhile), its map drawn and its pins
    // placed, while the flight is already on its way.
    const missing = !hasFiles(id);
    flushSync(() => { setCityId(id); if (missing) setLoading(name); });
    if (missing) zoomClock.setLoading(name);
    const ready = readCity(next.id).then(async (here) => {
      if (!here) return false;
      const fresh = committed.current !== id;
      await draw(id, true);
      if (fresh) await frames(2);
      return true;
    });
    const stopLoading = () => { zoomClock.setLoading(null); setLoading(null); };
    if (!dot || reducedMotion()) { const here = await ready; stopLoading(); if (here) flushSync(() => setPhase("city")); return; }

    // The flight heads for a guess of its end (the city map's scale, and where the last city's centre point stood) until
    // the real end is known, then turns onto it.
    const R0 = boxOf(svg, holder), p0 = poseOf(dot, home.current, R0);
    const guess: Pose = { s: guessScale(states, next, R0), ...(lastEnd.current ?? { x: R0.left + R0.width / 2, y: R0.top + R0.height / 2 }) };
    flushSync(() => setPhase("opening"));
    let box = R0, end: Pose | null = null, readyAt: number | null = null, turnFrom = 0, scroll: ((t: number) => void) | null = null;
    const toward = (f: number) => (end ? between(guess, end, easeInOut(clamp((f - turnFrom) / TURN))) : guess);
    const flown = (f: number) => {
      const to = toward(f), zoom = plunge(clamp(f / FLIGHT)), glide = easeSine(clamp(f / FLIGHT));
      return { s: p0.s * (to.s / p0.s) ** zoom, x: p0.x + (to.x - p0.x) * glide, y: p0.y + (to.y - p0.y) * glide };
    };
    const done = zoomClock.start(el, `Opening ${name}`, (t) => {
      const f = flightTime(t, readyAt);
      setView(svg, states.width, viewFor(dot, flown(f), box));
      scroll?.(f);
      const m = svg.getScreenCTM(), o = el.getBoundingClientRect(), r = loader.current;
      if (m && r) Object.assign(r.style, { left: `${m.a * dot[0] + m.e - o.left}px`, top: `${m.d * dot[1] + m.f - o.top}px` });
    });
    zoomClock.add(fade(el.querySelector(".hn-info"), false, 150, 900, 8));
    zoomClock.name("The facts fading out", 150, 1050);
    const here = await ready;
    stopLoading();
    if (!here) { zoomClock.end(); setView(svg, states.width, home.current); flushSync(() => setPhase("usa")); return; }
    const layer = el.querySelector<HTMLElement>(".hn-city"), frame = layer?.querySelector(".lf-city-main > .lf-mapframe"), loaded = await loadResource(CITY_FILES[next.id].map);
    const anchor = frame && loaded ? anchorOf(frame, loaded as CityMapData, next, states, holder) : null;
    if (!layer || !frame || !anchor) { zoomClock.end(); flushSync(() => setPhase("city")); return; }

    // Hand the USA map over to a box covering its own and the city map's frame, still showing only its own, and turn
    // the flight onto its real end. From here on its own time runs `lag` ms behind the clock.
    const F = boxOf(frame, holder), U = union(R0, F), last = FLIGHT;
    readyAt = zoomClock.now();
    turnFrom = flightTime(readyAt, readyAt);
    const lag = readyAt + RESUME - flightTime(readyAt + RESUME, readyAt), at = (f: number) => last * f + lag;
    end = anchor;
    lastEnd.current = { x: anchor.x, y: anchor.y };
    spread(svg, holder, U);
    box = U;
    setView(svg, states.width, viewFor(dot, flown(turnFrom), box));
    scroll = scroller(turnFrom, Math.max(600, last * 0.7 - turnFrom), scrollToCentre(frame.getBoundingClientRect()));
    const usaLayer = el.querySelector<HTMLElement>(".hn-usa"), from = el.offsetHeight, to = from - (usaLayer?.offsetHeight ?? 0) + layer.offsetHeight;
    const grow = { delay: at(GROW[0]), duration: last * (GROW[1] - GROW[0]), easing: GROW_EASE, fill: "both" as const };
    const ring = circleAt(anchor.x, anchor.y, F), opens = at(OPEN_AT);
    zoomClock.add(
      svg.animate([{ clipPath: windowOf(R0, U) }, { clipPath: windowOf(F, U) }], grow),
      el.animate([{ height: `${from}px` }, { height: `${to}px` }], grow),
      layer.animate([{ opacity: 1 }, { opacity: 1 }], { delay: opens, duration: 1, fill: "forwards" }),
      frame.animate([{ clipPath: ring.closed }, { clipPath: ring.open }], { delay: opens, duration: OPEN, easing: EASE, fill: "both" }),
      fade(el.querySelector(".hn-bar"), true, opens + OPEN * 0.35, 650, 10),
      fade(el.querySelector(".hn-city .lf-places"), true, opens + OPEN * 0.5, 750, 18),
    );
    zoomClock.name(`The USA map flying down to ${name}`, 0, at(1));
    zoomClock.name("The map's window growing to the city map's frame", grow.delay, grow.delay + grow.duration);
    zoomClock.name(`${name}'s map opening in a circle from its centre`, opens, opens + OPEN);
    zoomClock.name("The list of places rising in", opens + OPEN * 0.35, opens + OPEN * 0.5 + 750);
    zoomClock.plan(Math.max(at(1), opens + OPEN * 0.5 + 750));
    await done;
    flushSync(() => setPhase("city"));
    zoomClock.end();
    el.querySelector<HTMLElement>(".hn-bar button")?.focus({ preventScroll: true });
  };

  const close = async () => {
    const el = stage.current, holder = el?.querySelector<HTMLElement>(".hn-usa .lf-usa .lf-stage"), svg = holder?.querySelector("svg");
    if (!el || !holder || !svg || typeof states !== "object" || typeof map !== "object") return;
    const dot = dotOf(states, city), back = home.current ?? { x: 0, y: 0, w: states.width, h: states.height }, aspect = `${states.width} / ${states.height}`;
    const finish = () => { unspread(svg, holder, aspect); setView(svg, states.width, back); };
    if (!dot || reducedMotion()) { finish(); setPhase("usa"); return; }
    const from = el.offsetHeight;
    flushSync(() => setPhase("closing"));
    const frame = el.querySelector<HTMLElement>(".hn-city .lf-city-main > .lf-mapframe"), anchor = frame ? anchorOf(frame, map, city, states, holder) : null;
    if (!frame || !anchor) { finish(); flushSync(() => setPhase("usa")); return; }
    // Start where the city's map stands now (it may have been zoomed), the USA map over its frame, then fly back out.
    // Its own box first: put back in place and sized to the facts it returns beside.
    unspread(svg, holder, aspect);
    fitUsa(el, states);
    const R0: Box = boxOf(svg, holder), F = boxOf(frame, holder), U = union(R0, F), p0 = poseOf(dot, back, R0);
    const holderTop = holder.getBoundingClientRect().top;
    spread(svg, holder, U);
    const legs: Leg[] = [{ from: 0, pose: () => anchor }, glide(OUT_AT, BACK, anchor, p0, (t) => easeOut(t) * 0.35 + easeInOut(t) * 0.65)];
    const scroll = scroller(OUT_AT, BACK * 0.7, scrollToCentre({ top: holderTop + R0.top, height: R0.height }));
    const cx = Math.max(F.left, Math.min(F.left + F.width, anchor.x)), cy = Math.max(F.top, Math.min(F.top + F.height, anchor.y)), ring = circleAt(cx, cy, F);
    // The circle closes into the dot wherever the dot has got to, not where it started (owner, 2026-10-23: "the circle
    // doesnt shrink in its dot location, it needs to"): its centre is the dot's place on each tick.
    const closing = (t: number, at: Pose) => {
      const r = ring.reach * (1 - easeInOut(clamp(t / CLOSE)));
      frame.style.clipPath = `circle(${r}px at ${at.x - F.left}px ${at.y - F.top}px)`;
    };
    const done = zoomClock.start(el, `Back to all cities from ${place}`, (t) => {
      const at = poseAt(legs, t);
      setView(svg, states.width, viewFor(dot, at, U));
      closing(t, at);
      scroll(t);
    });
    const shrink = { delay: OUT_AT, duration: BACK * 0.7, easing: EASE, fill: "both" as const };
    zoomClock.add(
      fade(el.querySelector(".hn-bar"), false, 0, 300, 10),
      fade(el.querySelector(".hn-city .lf-places"), false, 0, 360, 18),
      svg.animate([{ clipPath: windowOf(F, U) }, { clipPath: windowOf(R0, U) }], shrink),
      el.animate([{ height: `${from}px` }, { height: `${el.offsetHeight}px` }], shrink),
      fade(el.querySelector(".hn-info"), true, OUT_AT + BACK * 0.55, 800),
    );
    zoomClock.name("The list and the bar fading out", 0, 360);
    zoomClock.name(`${place}'s map closing into the dot as it flies`, 0, CLOSE);
    zoomClock.name("The USA map flying back out", OUT_AT, OUT_AT + BACK);
    zoomClock.name("The map's window shrinking back", shrink.delay, shrink.delay + shrink.duration);
    zoomClock.name("The facts rising in", OUT_AT + BACK * 0.55, OUT_AT + BACK * 0.55 + 800);
    zoomClock.plan(Math.max(OUT_AT + BACK, OUT_AT + BACK * 0.55 + 800));
    await done;
    frame.style.clipPath = "";
    finish();
    flushSync(() => setPhase("usa"));
    zoomClock.end();
    el.querySelector<HTMLElement>(".hn-open")?.focus({ preventScroll: true });
  };

  const run = (move: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    void move().finally(() => { busy.current = false; });
  };
  const openCity = (id: string) => run(() => open(id));

  return <>
    <div ref={stage} className="hn-stage" data-phase={phase} onPointerOver={(e) => showsIntent(e)} onPointerDown={(e) => showsIntent(e, true)} onFocus={(e) => showsIntent(e, true)}>
      {/* The USA view stays drawn, hidden, while a city is open, so its dots and names keep their sizes. */}
      <div className="hn-layer hn-usa" data-hidden={phase === "city" || undefined} {...away(phase === "city")}>
        <div className="lf-city-top">
          {typeof states === "object" ? <UsaMap states={states} city={city} cities={cities} onPick={openCity} onOpen={openCity} />
            : <p className="lf-wait lf-wait-usa">{states === "loading" ? "Loading the map…" : "The map outline is missing."}</p>}
          <div className="hn-info">
            <CityInfo city={city} facts={typeof facts === "object" ? facts : null} kinds={kinds} checked={city.checked ?? checked} words={words} />
            <button type="button" className="hn-open" aria-busy={loading ? true : undefined} onClick={() => openCity(city.id)}>{loading ? <>Loading the map of {place}…<i aria-hidden /></> : <>Open the map of {place}<ArrowRight size={16} aria-hidden /></>}</button>
          </div>
        </div>
      </div>
      {cityMap && <div className="hn-layer hn-city" data-under={phase === "closing" || undefined} data-hidden={phase === "usa" || phase === "opening" || undefined} {...away(phase !== "city")}>
        <div className="hn-bar">
          <button type="button" onClick={() => run(close)}><ArrowLeft size={15} aria-hidden />All cities</button>
          {drawnCity && <p><strong>{drawnPlace}</strong>{drawnRegion && <>, {drawnRegion}</>}<span>{plural(drawnCity.entries.length, "place")}{drawnCity.lines?.length ? ` · ${plural(drawnCity.lines.length, "phone line")}` : ""}</span></p>}
        </div>
        {cityMap}
      </div>}
      {loading && <div ref={loader} className="hn-loading" role="status"><i aria-hidden /><span>Loading {loading}…</span></div>}
    </div>
    {mockup && <NearbyTicker />}
  </>;
}
