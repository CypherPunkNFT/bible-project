// 02 · Built on their work (approved mock-up: design/scholars-directions/scholars/built.js). Ribbons run from each part
// of this site to the book it draws on and on to the scholar who wrote it: solid for live features, dashed for books
// held in the library. Hovering lights a path and fills the fixed caption bar; clicking a feature pins it. The ribbons
// sweep in once, the first time the card comes into view. On a phone the same links stack as one list per feature.
// Every book, name and ribbon opens the shared profile.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject, type SyntheticEvent } from "react";
import { SectionHead } from "../shared/Frame";
import { Caption } from "./built/Caption";
import { reducedMotion } from "./marks/dom";
import { buildModel, layoutFor, litBy, type Focus } from "./built/model";
import { Stack } from "./built/Stack";
import { Stage } from "./built/Stage";
import { useScholars } from "./context";
import "./Built.css";

const keyOf = (f: string | undefined, s: string | undefined) => `${f ?? ""}|${s ?? ""}`;

/** Sweeps in once on first view (or at once with reduced motion); "settled" drops the staggered delays afterwards. */
function useSweepIn(target: RefObject<HTMLElement>) {
  const [stage, setStage] = useState<"hidden" | "in" | "settled">("hidden");
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) { setStage("settled"); return; }
    let timer = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      setStage("in");
      timer = window.setTimeout(() => setStage("settled"), 2200);
      io.disconnect();
    }, { threshold: .2 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [target]);
  return stage;
}

/** The stage's width while it is shown (the phone layout hides it), re-read on resize in the next frame. */
function useStageWidth(card: RefObject<HTMLElement>, stage: RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    let frame = 0;
    const measure = () => { const s = stage.current; if (s?.offsetParent) setWidth(s.clientWidth); };
    const ro = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    ro.observe(el);
    measure();
    return () => { ro.disconnect(); cancelAnimationFrame(frame); };
  }, [card, stage]);
  return width;
}

export function Built() {
  const { data, openProfile } = useScholars();
  const model = useMemo(() => buildModel(data.scholars), [data]);
  const cardRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const width = useStageWidth(cardRef, stageRef);
  const layout = useMemo(() => (width ? layoutFor(model, width) : null), [model, width]);
  const sweep = useSweepIn(cardRef);
  const [pinned, setPinned] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);

  // One Focus object per node, so hovering the same thing twice changes nothing.
  const focusFor = useMemo(() => {
    const cache = new Map<string, Focus>();
    return (f: string | undefined, s: string | undefined) => {
      const key = keyOf(f, s);
      if (!cache.has(key)) cache.set(key, { f: model.features.find((x) => x.id === f) ?? null, s: s ? data.scholars.find((x) => x.id === s) ?? null : null });
      return cache.get(key) as Focus;
    };
  }, [model, data]);
  const pinnedFocus = pinned ? focusFor(pinned, undefined) : null;
  const nodeFocus = useCallback((target: EventTarget) => {
    const node = (target as Element).closest<HTMLElement>("[data-f], [data-s]");
    return node ? focusFor(node.dataset.f, node.dataset.s) : null;
  }, [focusFor]);
  const lit = useMemo(() => (focus ? litBy(model, focus) : null), [model, focus]);

  const onStageClick = (event: SyntheticEvent) => {
    const feat = (event.target as Element).closest<HTMLElement>(".blt-feat");
    if (!feat?.dataset.f) return;
    const next = pinned === feat.dataset.f ? null : feat.dataset.f;
    setPinned(next);
    setFocus(focusFor(feat.dataset.f, undefined));
  };
  const onCardClick = (event: SyntheticEvent) => {
    const hit = (event.target as Element).closest<HTMLElement>("[data-scholar]");
    const id = hit?.dataset.scholar;
    if (!hit || !id) return;
    const origin = hit.matches(".blt-rib") ? stageRef.current?.querySelector(`.blt-work[data-s="${id}"]`) ?? hit : hit;
    openProfile(id, origin);
  };
  const capTone = focus?.f?.tone ?? (focus?.s ? model.rows.find((r) => r.s === focus.s)?.fs[0].tone : undefined) ?? "--accent";

  return <>
    <SectionHead num="02" kicker="Behind the features" title={<>Built on <em>their work</em></>}
      line="Each ribbon joins a part of this site to the book it draws on, and that book to the scholar who wrote it. Solid ribbons are live today; dashed ones are books in the library, planned for features." />
    <div ref={cardRef} className={`blt-card${sweep !== "hidden" ? " blt-in" : ""}${sweep === "settled" ? " blt-settled" : ""}`}
      style={{ "--cap-tone": `var(${capTone})` } as CSSProperties} onClick={onCardClick}>
      <div className="blt-cap" aria-live="polite"><span className="blt-cap-dot" aria-hidden="true" /><p className="blt-cap-text"><Caption data={data} model={model} focus={focus} /></p></div>
      <div ref={stageRef} className={`blt-stage${focus ? " blt-dim" : ""}`} style={layout ? { height: layout.height } : undefined}
        onPointerOver={(e) => setFocus(nodeFocus(e.target) ?? pinnedFocus)} onPointerLeave={() => setFocus(pinnedFocus)}
        onFocus={(e) => { const f = nodeFocus(e.target); if (f) setFocus(f); }} onBlur={() => setFocus(pinnedFocus)} onClick={onStageClick}>
        <Stage data={data} model={model} layout={layout} lit={lit} pinned={pinned} />
      </div>
      <Stack data={data} model={model} />
      <ul className="blt-legend">
        <li><i className="blt-key-live" />Live on the site today</li>
        <li><i className="blt-key-planned" />In the library, planned</li>
        <li>Click a book or a name to open the scholar's profile</li>
      </ul>
    </div>
  </>;
}
