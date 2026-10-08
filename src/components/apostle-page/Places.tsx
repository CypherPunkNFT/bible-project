import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { refText, REDUCED, plural, whenShort } from "./data";
import { Tip } from "./tip";
import type { Apostle, Place } from "./types";
import { Icon, LayerChip, SecHead } from "./ui";

/**
 * 05 · Where was he? His places as a two-column list of compact cards, beside an SVG map drawn like the Atlas (the site's
 * own land outline and projection, src/data/atlas-map.json) that fills the rest of the width and runs the full height of
 * the list. The map is framed on his places and can never zoom or pan out beyond that frame. Choosing a card flies the
 * map there: if the place is outside the view it first eases out far enough to hold both, moves across, and zooms in
 * at the end. Dragging the map never selects text anywhere on the page. Tradition's places are dashed, with who placed
 * him there and when; places without coordinates are listed by name.
 */
const KIND_LABEL: Record<string, string> = { lake: "Lake", town: "Town", city: "City", port: "Port", region: "Region", island: "Island", tradition: "Tradition", unpinned: "No coordinates" };
const DIR_DEG: Record<string, number> = { north: 0, "north-east": 45, east: 90, "south-east": 135, south: 180, "south-west": 225, west: 270, "north-west": 315 };
const JERUSALEM = "a15257a";
interface Box { x: number; y: number; w: number; h: number }

/** Who placed him there, from his own tradition records (those that name the place). */
function tradFor(d: Apostle, p: Place) {
  const word = p.name.replace(/[“”"]/g, "").split(/[ ,(]/)[0];
  if (word.length <= 3) return [];
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
  return d.trad.filter((t) => re.test(`${t.text} ${t.who}`));
}

function Card({ d, p, i, on, onPick }: { d: Apostle; p: Place; i: number; on: boolean; onPick: () => void }) {
  const ents = p.entries.map((k) => d.byKey[k]).filter(Boolean), what = p.note ?? ents[0]?.title ?? "", tr = p.tradition ? tradFor(d, p) : [];
  const from = p.from ? <><svg width="10" height="10" viewBox="0 0 12 12" style={{ transform: `rotate(${DIR_DEG[p.from.dir]}deg)` }} aria-hidden="true"><path d="M6 1v10M6 1 3 4M6 1l3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>{p.from.km.toLocaleString("en-GB")} km {p.from.dir}</>
    : p.placeId === JERUSALEM ? "The city itself" : p.xy ? null : "No coordinates";
  return <button type="button" className={`pcard${p.tradition ? " trad" : ""}${p.xy ? "" : " nopin"}${on ? " on" : ""}`} data-place={i} onClick={onPick}>
    <span className="pcard-icon"><Icon name={p.kind} size={22} /></span>
    <span className="pcard-body">
      <span className="pcard-line"><span className="pcard-name">{p.name}</span><span className="pcard-n">{String(i + 1).padStart(2, "0")} · {KIND_LABEL[p.kind] ?? ""}</span></span>
      <span className="pcard-what">{what}</span>
      <span className="pcard-foot">{from && <span className="pcard-from">{from}</span>}
        {p.tradition ? <><LayerChip layer="tradition" />{tr[0] && <small>{tr[0].who!.split(/,|\(/)[0]}, {whenShort(tr[0].when)}{tr.length > 1 ? ` · +${tr.length - 1}` : ""}</small>}</>
          : p.refs.length ? <small>{refText(p.refs[0])}{p.refs.length > 1 ? ` +${p.refs.length - 1}` : ""}</small> : null}</span>
    </span></button>;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const centreOf = (v: Box) => [v.x + v.w / 2, v.y + v.h / 2];

export function PlacesSection({ d }: { d: Apostle }) {
  const pinned = d.places.map((p, i) => ({ p, i })).filter(({ p }) => p.xy);
  const unpinned = d.places.filter((p) => !p.xy);
  const svgRef = useRef<SVGSVGElement>(null), cards = useRef<HTMLDivElement>(null);
  const [land, setLand] = useState<string | null>(null);
  const [sel, setSel] = useState(-1);
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const map = useRef<{ frame: Box | null; view: Box | null; pxW: number; anim: number; drag: { x: number; y: number; vx: number; vy: number } | null; moved: boolean }>({ frame: null, view: null, pxW: 1, anim: 0, drag: null, moved: false });

  useEffect(() => {
    let live = true;
    import("@/data/atlas-map.json").then((m) => { if (live) setLand(m.default.land); }).catch((error: unknown) => console.error("apostle page: could not load the Atlas land outline (src/data/atlas-map.json)", error));
    return () => { live = false; };
  }, []);

  const clamp = useCallback((v: Box): Box => {
    const f = map.current.frame!, w = Math.min(f.w, Math.max(f.w / 10, v.w)), h = w * (f.h / f.w);
    return { w, h, x: Math.min(f.x + f.w - w, Math.max(f.x, v.x)), y: Math.min(f.y + f.h - h, Math.max(f.y, v.y)) };
  }, []);
  // The frame: his places with padding, shaped like the map's box. Drawn again whenever the box changes size.
  useEffect(() => {
    const el = svgRef.current, m = map.current;
    if (!el) return;
    const fit = () => {
      const box = el.getBoundingClientRect();
      m.anim++; m.pxW = Math.max(1, box.width);
      const aspect = box.width / Math.max(1, box.height), xs = pinned.map(({ p }) => p.xy![0]), ys = pinned.map(({ p }) => p.xy![1]);
      let [x0, x1, y0, y1] = xs.length ? [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)] : [480, 520, 280, 300];
      const pad = Math.max(10, Math.max(x1 - x0, y1 - y0) * 0.16);
      x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
      const minW = pinned.length < 3 ? 46 : 36;
      if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
      if ((x1 - x0) / (y1 - y0) < aspect) { const c = (x0 + x1) / 2, w = (y1 - y0) * aspect; x0 = c - w / 2; x1 = c + w / 2; } else { const c = (y0 + y1) / 2, h = (x1 - x0) / aspect; y0 = c - h / 2; y1 = c + h / 2; }
      m.frame = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; m.view = { ...m.frame };
      redraw();
    };
    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver(([en]) => { const w = Math.round(en.contentRect.width), h = Math.round(en.contentRect.height); if (w === lastW && h === lastH) return; lastW = w; lastH = h; fit(); });
    ro.observe(el);
    // Scroll zooms the map (and never the page) while the pointer is over it.
    const onWheel = (e: WheelEvent) => {
      if (!m.view) return;
      e.preventDefault(); m.anim++;
      const r = el.getBoundingClientRect(), v = m.view, mx = v.x + ((e.clientX - r.left) / r.width) * v.w, my = v.y + ((e.clientY - r.top) / r.height) * v.h, w = v.w * Math.exp(e.deltaY * 0.0016);
      m.view = clamp({ x: mx - (mx - v.x) * (w / v.w), y: my - (my - v.y) * (w / v.w), w, h: v.h });
      redraw();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const onMove = (e: PointerEvent) => {
      if (!m.drag || !m.view) return;
      const r = el.getBoundingClientRect(), dx = e.clientX - m.drag.x, dy = e.clientY - m.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) m.moved = true;
      m.view = clamp({ ...m.view, x: m.drag.vx - (dx / r.width) * m.view.w, y: m.drag.vy - (dy / r.height) * m.view.h });
      redraw();
    };
    const onUp = () => { if (m.drag) document.documentElement.classList.remove("no-select"); m.drag = null; };
    addEventListener("pointermove", onMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);
    return () => {
      ro.disconnect(); el.removeEventListener("wheel", onWheel); removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp);
      document.documentElement.classList.remove("no-select"); m.anim++;
    };
  // The places of one apostle never change while the section is mounted (the page remounts per apostle).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Animates the view's centre and its width (on a log scale, so zooming reads as an even speed). */
  const tween = (from: Box, to: Box, ms: number) => new Promise<boolean>((done) => {
    const m = map.current, f = m.frame!, [ax, ay] = centreOf(from), [bx, by] = centreOf(to), t0 = performance.now(), run = ++m.anim;
    const step = (now: number) => {
      if (run !== m.anim) return done(false);
      const t = Math.min(1, (now - t0) / ms), e = ease(t), w = Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * e), h = w * (f.h / f.w);
      m.view = { x: ax + (bx - ax) * e - w / 2, y: ay + (by - ay) * e - h / 2, w, h };
      redraw();
      if (t < 1) requestAnimationFrame(step); else done(true);
    };
    requestAnimationFrame(step);
  });
  async function flyTo(xy: [number, number]) {
    const m = map.current, f = m.frame, v = m.view;
    if (!f || !v) return;
    const viewAt = (cx: number, cy: number, w: number) => { const h = w * (f.h / f.w); return { x: cx - w / 2, y: cy - h / 2, w, h }; };
    const target = clamp(viewAt(xy[0], xy[1], Math.max(f.w / 10, Math.min(v.w, f.w * 0.3))));
    if (REDUCED()) { m.anim++; m.view = target; redraw(); return; }
    const inView = xy[0] > v.x + v.w * 0.08 && xy[0] < v.x + v.w * 0.92 && xy[1] > v.y + v.h * 0.08 && xy[1] < v.y + v.h * 0.92;
    if (inView) { await tween({ ...v }, target, 650); return; }
    // Out of view: ease out until both the present centre and the place fit, then glide over and zoom in.
    const [cx, cy] = centreOf(v), span = Math.max(Math.abs(xy[0] - cx) * 1.5, Math.abs(xy[1] - cy) * 1.5 * (f.w / f.h), v.w);
    const wide = clamp(viewAt((cx + xy[0]) / 2, (cy + xy[1]) / 2, Math.min(f.w, span)));
    if (await tween({ ...v }, wide, 520)) await tween(wide, target, 780);
  }
  const select = (i: number, from: "card" | "pin") => {
    setSel(i);
    const p = d.places[i];
    if (p?.xy) void flyTo(p.xy);
    if (from === "pin") cards.current?.querySelector(`[data-place="${i}"]`)?.scrollIntoView({ behavior: REDUCED() ? "auto" : "smooth", block: "nearest" });
  };

  const { frame, view, pxW } = map.current;
  const k = view ? view.w / pxW : 1, f2 = (v: number) => v.toFixed(2);
  // A name is written only where it does not crowd one already written (the chosen place always is).
  const labelled: [number, number, number][] = [];
  for (const { p, i } of [...pinned].sort((a, b) => Number(b.i === sel) - Number(a.i === sel) || Number(b.p.placeId === JERUSALEM) - Number(a.p.placeId === JERUSALEM)))
    if (labelled.every(([x, y]) => Math.abs(x - p.xy![0]) / k > 90 || Math.abs(y - p.xy![1]) / k > 16)) labelled.push([p.xy![0], p.xy![1], i]);
  const named = new Set(labelled.map((l) => l[2]));

  return <section className="sec" data-sec="places">
    <SecHead num="05" kicker="Near and far" title="Where was " em="he?" sub={`${plural(d.places.length, "place")} named in his story, with what happened there and how far each lies from Jerusalem. Tradition's places are dashed, with who placed him there and when. Choose a card or a pin.`} />
    <div className="pl-grid">
      <div className="pl-cards" ref={cards} aria-label={`${d.short}'s places`}>{d.places.map((p, i) => <Card key={i} d={d} p={p} i={i} on={i === sel} onPick={() => select(i, "card")} />)}</div>
      <div className="pl-map-col"><figure className="pl-map">
        <svg ref={svgRef} className="pl-svg" role="img" aria-label={`Map of ${d.short}'s places`} viewBox={view ? `${f2(view.x)} ${f2(view.y)} ${f2(view.w)} ${f2(view.h)}` : undefined}
          onPointerDown={(e) => {
            if (e.button !== 0 || !map.current.view) return;
            // No text selection may start from the map, or follow the drag across the page.
            e.preventDefault(); getSelection()?.removeAllRanges(); document.documentElement.classList.add("no-select");
            const m = map.current; m.anim++; m.drag = { x: e.clientX, y: e.clientY, vx: m.view!.x, vy: m.view!.y }; m.moved = false;
          }}
          onPointerLeave={() => Tip.hide()}>
          {frame && <>
            <defs><linearGradient id="pl-land" x1="0" y1="0" x2=".4" y2="1"><stop className="pl-land1" offset="0" /><stop className="pl-land2" offset="1" /></linearGradient></defs>
            <rect className="pl-water" x={f2(frame.x - frame.w)} y={f2(frame.y - frame.h)} width={f2(frame.w * 3)} height={f2(frame.h * 3)} />
            {land && <path className="pl-landp" d={land} vectorEffect="non-scaling-stroke" />}
            <g className="pl-pins">{pinned.map(({ p, i }) => {
              const [x, y] = p.xy!, on = i === sel, r = (on ? 7 : 5) * k;
              return <g key={i} className={`pin-g${on ? " on" : ""}`} data-place={i} onClick={() => { if (!map.current.moved) select(i, "pin"); }}
                onPointerMove={(e) => { if (map.current.drag) { Tip.hide(); return; } Tip.show({ title: p.name, lines: [p.note ?? (p.tradition ? "Tradition" : "")] }, e.clientX, e.clientY); }}>
                {on && <circle className="pin-halo" cx={f2(x)} cy={f2(y)} r={f2(16 * k)} />}
                {p.tradition ? <circle className="pin-t" cx={f2(x)} cy={f2(y)} r={f2(r)} strokeWidth={f2(1.6 * k)} strokeDasharray={`${f2(2.2 * k)} ${f2(1.8 * k)}`} />
                  : <circle className="pin" cx={f2(x)} cy={f2(y)} r={f2(r)} strokeWidth={f2(1.4 * k)} />}
                <circle className="pin-hit" cx={f2(x)} cy={f2(y)} r={f2(12 * k)} />
                {named.has(i) && <text x={f2(x + 9 * k)} y={f2(y + 4 * k)} fontSize={f2((on ? 13 : 11.5) * k)} strokeWidth={f2(3 * k)}>{p.name.replace(/\s*\(.*\)$/, "")}</text>}
              </g>;
            })}</g>
          </>}
        </svg>
        <figcaption><span><Icon name="compass" size={13} />Scroll to zoom · drag to move · the map stays on his places</span><span>Land outline: the Atlas (Natural Earth)</span></figcaption>
      </figure></div>
    </div>
    {unpinned.length > 0 && <p className="unpinned">Not on the map, because our places data gives no coordinates: {unpinned.map((p, i) => <span key={p.name}>{i > 0 && "; "}<b>{p.name}</b>{p.note ? ` (${p.note.replace(/\.$/, "")})` : ""}</span>)}.</p>}
  </section>;
}
