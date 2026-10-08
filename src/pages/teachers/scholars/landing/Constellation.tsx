// The landing's constellation: every scholar's field-shaped mark, grouped by field, with a thin line joining each
// field's scholars in order of birth. The marks ease in once (earliest first) and then drift very slowly (CSS only,
// paused off-screen, while the profile is open and for reduced motion). Hovering or keyboard-focusing a mark brings its
// field forward and shows a card; clicking opens the profile, grown out of the mark. Searching lights the matches.
// Hover and match highlights are classes set through refs, so the 35 marks never re-render on hover.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { byBirth, years } from "../marks/facts";
import { cssVars, reducedMotion, useMediaQuery } from "../marks/dom";
import { FieldIcon, MarkInner } from "../marks/Mark";
import { toneStyle, toneVar } from "../marks/shapes";
import { buildSky, driftStyle, type Sky } from "./layout";

interface SkyProps { data: ScholarsData; matches: ReadonlySet<string>; searching: boolean; onOpen: (id: string, origin: Element | null) => void }

export function Constellation(props: SkyProps) {
  const narrow = useMediaQuery("(max-width: 640px)");
  const sky = useMemo(() => buildSky(props.data, narrow ? "tall" : "wide"), [props.data, narrow]);
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const watch = new IntersectionObserver(([entry]) => el.classList.toggle("lnd-paused", !entry.isIntersecting));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  return <figure className="lnd-stage" ref={stage}>
    <figcaption className="lnd-cap"><span>Each mark is one scholar, shaped by field. A thin line joins each field's scholars in the order they were born.</span>
      <span className="lnd-cap-key"><i />Used on this site</span></figcaption>
    <div className="lnd-skyhold"><SkyView key={sky.name} sky={sky} {...props} /></div>
  </figure>;
}

const nodeOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<SVGGElement>(".lnd-node") : null);

function SkyView({ data, sky, matches, searching, onOpen }: SkyProps & { sky: Sky }) {
  const [entered, setEntered] = useState(reducedMotion);
  const [hover, setHover] = useState<string | null>(null);
  const skyRef = useRef<HTMLDivElement>(null), tipRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (entered) return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setEntered(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [entered]);
  useEffect(() => setHover(null), [matches]);
  useLayoutEffect(() => {
    const box = skyRef.current, tip = tipRef.current;
    if (!box || !tip) return;
    for (const node of box.querySelectorAll(".lnd-node")) node.classList.toggle("lnd-match", matches.has(node.getAttribute("data-id") ?? ""));
  }, [matches]);
  useLayoutEffect(() => {
    const box = skyRef.current, tip = tipRef.current;
    if (!box || !tip || !hover) return;
    const node = box.querySelector(`.lnd-node[data-id="${CSS.escape(hover)}"]`), hov = node?.querySelector(".lnd-hov");
    if (!node || !hov) return;
    node.classList.add("lnd-on");
    const frame = box.getBoundingClientRect(), r = hov.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    const above = r.top - frame.top - th - 12;
    tip.style.left = `${Math.max(4, Math.min(frame.width - tw - 4, r.left + r.width / 2 - frame.left - tw / 2))}px`;
    tip.style.top = `${Math.min(above >= 4 ? above : r.bottom - frame.top + 12, frame.height - th - 4)}px`;
    tip.classList.toggle("lnd-tip-below", above < 4);
    return () => node.classList.remove("lnd-on");
  }, [hover]);

  const art = useMemo(() => <SkyArt data={data} sky={sky} />, [data, sky]);
  const open = (node: SVGGElement) => { setHover(null); onOpen(node.dataset.id ?? "", node.querySelector(".lnd-hov")); };
  const hovered = hover ? data.scholars.find((s) => s.id === hover) : undefined;
  return <div ref={skyRef} className={`lnd-sky${entered ? " lnd-in" : ""}${searching ? " lnd-searching" : ""}`} data-layout={sky.name}
    data-hover={hovered?.field} style={{ aspectRatio: `${sky.w} / ${sky.h}` }}
    onPointerOver={(e: PointerEvent) => { const id = nodeOf(e.target)?.dataset.id; if (id && id !== hover) setHover(id); }}
    onPointerOut={(e: PointerEvent) => { const node = nodeOf(e.target); if (node && !(e.relatedTarget instanceof Node && node.contains(e.relatedTarget))) setHover(null); }}
    onPointerLeave={() => setHover(null)}
    onFocus={(e) => { const node = nodeOf(e.target); if (node?.matches(":focus-visible")) setHover(node.dataset.id ?? null); }}
    onBlur={() => setHover(null)}
    onClick={(e) => { const node = nodeOf(e.target); if (node) open(node); }}
    onKeyDown={(e: KeyboardEvent) => { const node = nodeOf(e.target); if (node && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(node); } }}>
    {art}
    <div className="lnd-flabels">{sky.fields.map((f) => <span key={f.field} className="lnd-flabel"
      style={{ ...toneStyle(f.field), left: `${(f.mx / sky.w * 100).toFixed(3)}%`, top: `${(Math.min(sky.h - 12, f.bottom + sky.size / 2 + 18) / sky.h * 100).toFixed(3)}%` }}>
      <FieldIcon field={f.field} size={12} /><span>{data.fields[f.field]}</span><b>{f.own.length}</b></span>)}</div>
    <div ref={tipRef} className="lnd-tip" hidden={!hovered}>{hovered && <TipCard data={data} id={hovered.id} />}</div>
  </div>;
}

/** The drawing itself: glows, lines and marks. Built once per layout. */
function SkyArt({ data, sky }: { data: ScholarsData; sky: Sky }) {
  const order = new Map(byBirth(data.scholars).map((s, i) => [s.id, i]));
  const k = sky.size / 48, half = sky.size / 2;
  return <svg viewBox={`0 0 ${sky.w} ${sky.h}`} aria-label={`All ${data.scholars.length} scholars, grouped by field`}>
    <defs>{sky.fields.map((f) => <radialGradient key={f.field} id={`sc-lnd-glow-${f.field}-${sky.name}`}>
      <stop offset="0" style={{ stopColor: toneVar(f.field), stopOpacity: 0.13 }} /><stop offset="1" style={{ stopColor: toneVar(f.field), stopOpacity: 0 }} />
    </radialGradient>)}</defs>
    <g className="lnd-glows">{sky.fields.map((f) => <circle key={f.field} cx={f.mx.toFixed(1)} cy={f.my.toFixed(1)} r={(f.r * 1.15).toFixed(1)} fill={`url(#sc-lnd-glow-${f.field}-${sky.name})`} />)}</g>
    <g className="lnd-lines">{sky.fields.filter((f) => f.own.length > 1).map((f) => <polyline key={f.field} className="lnd-line" data-field={f.field} pathLength={1}
      style={{ stroke: toneVar(f.field), ...cssVars({ "--d": `${f.own[0].s.born / 2026 * 900 + 350}ms` }) }}
      points={f.own.map((n) => `${n.x.toFixed(1)},${n.y.toFixed(1)}`).join(" ")} />)}</g>
    <g className="lnd-nodes">{sky.nodes.map((n, i) => {
      const s = n.s;
      return <g key={s.id} className="lnd-node" data-id={s.id} data-field={s.field} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}
        tabIndex={0} role="button" aria-label={`${s.name}, ${years(s)}, ${data.faiths[s.faith]}. Open the profile`}>
        <g className="lnd-pop" style={cssVars({ "--d": `${(order.get(s.id) ?? 0) * 34}ms` })}><g className="lnd-float" style={cssVars(driftStyle(i))}><g className="lnd-hov">
          <circle className="lnd-hit" r={half + 4} />
          <g transform={`translate(${-half} ${-half}) scale(${k})`}><MarkInner scholar={s} /></g>
          {s.site?.status === "in-use" && <circle className="lnd-used-dot" cx={half - 5} cy={-half + 5} r={4.5} />}
        </g></g></g>
      </g>;
    })}</g>
  </svg>;
}

function TipCard({ data, id }: { data: ScholarsData; id: string }) {
  const s = data.scholars.find((x) => x.id === id);
  if (!s) return null;
  const [title, year] = s.works[0] ?? ["", 0], tone = toneVar(s.field);
  return <>
    <p className="lnd-tip-k" style={{ color: tone }}>{data.fields[s.field]}</p>
    <p className="lnd-tip-n">{s.name}</p>
    <p className="lnd-tip-y">{years(s)} · {s.place[0]}</p>
    <p className="lnd-tip-tags"><span className="lnd-faith">{data.faiths[s.faith]}</span>
      {s.site && (s.site.status === "in-use" ? <span className="lnd-badge lnd-badge-used"><i />Used on this site</span> : <span className="lnd-badge lnd-badge-held">In the library</span>)}</p>
    {title && <p className="lnd-tip-w"><span>Key work</span><b>{title}</b> <em style={{ color: tone }}>{year}</em></p>}
  </>;
}
