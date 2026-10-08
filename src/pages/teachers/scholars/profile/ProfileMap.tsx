// The profile's small map: the Mediterranean world when the scholar worked there, otherwise the whole world. The land is
// one even-odd path (lakes and inland seas stay open); faint dots are the other scholars, a pulsing halo marks this one,
// diamonds mark their finds. Stepping to another scholar on the same map glides the view box there (rAF, attribute only).
import { memo, useLayoutEffect, useRef } from "react";
import type { Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { reducedMotion } from "../marks/dom";
import { toneStyle } from "../marks/shapes";

type MapName = "med" | "world";
type Box = [number, number, number, number];

/** The land and the other scholars' dots: large and unchanging per map, so drawn once. */
const Base = memo(function Base({ data, name }: { data: ScholarsData; name: MapName }) {
  const v = data.views[name];
  return <>
    <path className="prf-land" fillRule="evenodd" d={v.land} />
    <g className="prf-others">{Object.entries(v.points).filter(([key]) => !key.startsWith("find:")).map(([key, [x, y]]) => <circle key={key} cx={x} cy={y} r={3.2} />)}</g>
  </>;
});

function viewFor(data: ScholarsData, name: MapName, [x, y]: [number, number]): Box {
  const v = data.views[name], w = name === "med" ? 620 : 440, h = w * 0.62;
  return [Math.max(0, Math.min(v.width - w, x - w / 2)), Math.max(0, Math.min(v.height - h, y - h / 2)), w, h];
}

export function ProfileMap({ data, s }: { data: ScholarsData; s: Scholar }) {
  const name: MapName = data.views.med.points[s.id] ? "med" : "world";
  const v = data.views[name], at = v.points[s.id];
  const svg = useRef<SVGSVGElement>(null), last = useRef<{ name: MapName; box: Box } | null>(null);
  const ax = at?.[0], ay = at?.[1];
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el || ax === undefined || ay === undefined) return;
    const box = viewFor(data, name, [ax, ay]), from = last.current?.name === name ? last.current.box : null;
    const set = (b: Box) => { last.current = { name, box: b }; el.setAttribute("viewBox", b.join(" ")); };
    if (!from || reducedMotion()) { set(box); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 520), k = 1 - Math.pow(1 - t, 3);
      set(from.map((a, i) => a + (box[i] - a) * k) as Box);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [data, name, ax, ay]);
  if (!at) return <div className="prf-map" hidden />;
  const [x, y] = at, w = viewFor(data, name, at)[2];
  const finds = data.finds.filter((f) => f.by.includes(s.id) && v.points[`find:${f.id}`]);
  return <div className="prf-map">
    <svg key={name} ref={svg} className="prf-svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={toneStyle(s.field)}>
      <Base data={data} name={name} />
      <g className="prf-me">
        {finds.map((f) => { const [fx, fy] = v.points[`find:${f.id}`]; return <rect key={f.id} className="prf-find" x={fx - 5} y={fy - 5} width={10} height={10} transform={`rotate(45 ${fx} ${fy})`} />; })}
        <circle className="prf-halo" cx={x} cy={y} r={w / 34} /><circle className="prf-dot" cx={x} cy={y} r={w / 110} />
        <text className="prf-label" x={x + w / 40} y={y - w / 52} style={{ fontSize: `${w / 30}px` }}>{s.place[0]}</text>
      </g>
    </svg>
  </div>;
}
