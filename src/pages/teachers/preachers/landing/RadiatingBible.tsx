// Selected from design/teachers-radiating-bible: the shallow open Bible,
// expanding arcs and tightened ring of stars, hearts and crosses.
import { useEffect, useRef, type CSSProperties } from "react";
import "./radiating-bible.css";

const timing = (delay = 0, i = 0) => ({ "--delay": delay, "--i": i } as CSSProperties);
function Stroke({ d, kind = "", delay = 0 }: { d: string; kind?: string; delay?: number }) {
  return <path d={d} className={`rb-stroke ${kind}`} pathLength={1} style={timing(delay)} />;
}
const at = (x: number, y: number) => [180 + (x - 180) * .86, 146 + (y - 146) * .86];
const STARS = [[77,57,3.2],[119,31,3.7],[180,19,4.8],[238,34,3.4],[284,62,3.6],[59,115,2.5],[300,119,2.5],[101,60,1.9],[258,63,1.9]];
const DOTS = [[53,77,.65],[88,29,.8],[104,64,.6],[145,20,.65],[156,46,.7],[201,41,.65],[212,20,.7],[260,28,.75],[305,83,.65],[285,97,.6],[43,135,.8],[76,133,.6],[110,119,.65],[251,132,.7],[287,145,.6],[321,132,.7],[44,51,.5],[315,48,.5]];

function Symbol({ x, y, i, cross = false }: { x: number; y: number; i: number; cross?: boolean }) {
  const [cx, cy] = at(x, y);
  return <g transform={`translate(${cx} ${cy})${cross ? ` rotate(${i % 2 ? -7 : 6})` : ""}`}>
    <g className="rb-moving rb-symbol" style={timing(0, i)}>
      <Stroke kind="rb-fine" delay={.3 + i * .04} d={cross
        ? "M-2 -12H2V-5H8V-1H2V10H-2V-1H-8V-5H-2Z"
        : "M0 5C-13 -3 -10 -12 -5 -12C-2 -12 0 -10 0 -8C0 -10 2 -12 5 -12C10 -12 13 -3 0 5Z"} />
    </g>
  </g>;
}

function Drawing() {
  return <>
    <g className="rb-moving">{[25,44,63,82].map((r,i) => <path key={r} className="rb-wave" style={timing(0,i)} d={`M${180-r} 146A${r} ${r} 0 0 1 ${180+r} 146`} />)}</g>
    {STARS.map(([sx,sy,r],i) => {
      const [x,y] = at(sx,sy);
      return <path key={i} className="rb-stroke rb-fine rb-moving rb-star" pathLength={1} style={timing(.1+i*.035,i)}
        d={`M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z`} />;
    })}
    {DOTS.map(([x,y,r],i) => { const [cx,cy] = at(x,y); return <circle key={i} cx={cx} cy={cy} r={r} className="rb-moving rb-dot" style={timing(0,i)} />; })}
    <Symbol x={62} y={92} i={0} /><Symbol x={63} y={151} i={2} cross />
    <Symbol x={293} y={89} i={3} cross /><Symbol x={301} y={157} i={1} />
    <Stroke d="M100 163L68 211C105 202 148 207 180 222C212 207 255 202 292 211L260 163" kind="rb-fine" delay={.08} />
    <Stroke d="M68 211V217C105 208 148 213 180 228C212 213 255 208 292 217V211M180 222V228" kind="rb-fine" delay={.13} />
    <Stroke d="M104 160C130 147 158 153 180 166C202 153 230 147 256 160L286 203C252 191 212 197 180 214C148 197 108 191 74 203Z" kind="rb-paper" delay={.19} />
    <Stroke d="M104 160L74 203V210C108 198 148 204 180 221C212 204 252 198 286 210V203L256 160" kind="rb-fine" delay={.25} />
    <Stroke d="M180 166V214M75 206C109 194 148 201 178 217M182 217C212 201 251 194 285 206" kind="rb-fine" delay={.3} />
    <Stroke d="M76 208C110 197 148 203 176 219M184 219C212 203 250 197 284 208" kind="rb-faint" delay={.34} />
    <Stroke d="M107 160C132 150 156 156 176 167M184 167C204 156 228 150 253 160" kind="rb-faint" delay={.36} />
    {Array.from({length:6},(_,i) => {
      const t=.13+i*.13, left=+(104-30*t+8).toFixed(2), y=+(160+43*t).toFixed(2);
      const c1x=+(131-15*t).toFixed(2), c1y=+(148+44*t+3).toFixed(2), c2y=+(154+44*t+3).toFixed(2), endY=+(166+47*t-1).toFixed(2);
      return <g key={i}>
        <Stroke d={`M${left} ${y}C${c1x} ${c1y} 153 ${c2y} ${i===5?161:172} ${i===5?endY-5:endY}`} kind="rb-text" delay={.4+i*.03} />
        <Stroke d={`M188 ${endY}C207 ${c2y} ${360-c1x} ${c1y} ${i===5?360-left-13:360-left} ${i===5?y-2:y}`} kind="rb-text" delay={.42+i*.03} />
      </g>;
    })}
    <Stroke d="M191 216L202 228L208 226L214 230L203 211" kind="rb-fine" delay={.65} />
    <Stroke d="M177 221Q180 223 183 221" kind="rb-ink" delay={.68} />
  </>;
}

export function RadiatingBible() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const observer = new IntersectionObserver(([entry]) => svg.classList.toggle("rb-paused", !entry.isIntersecting));
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return <svg ref={ref} className="lnd-bible" viewBox="0 0 360 252" fill="none" aria-hidden="true" focusable="false">
    <g className="rb-base"><Drawing /></g><g className="rb-live"><Drawing /></g>
  </svg>;
}
