// The band under the landing's headline: every teacher as a small mark on one arc of time. Marks ease in one after
// another when the band first comes into view; pointing at one (or focusing it) shows who they were; choosing one opens
// their profile. Search matches stay lit while the rest dim (ported from the mock-up's landing.js).
import { ArrowRight } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Person } from "@/data/teachers/pages-types";
import { familyOf, lifeLabel } from "../../shared/people";
import { cssVars, initials, prefersReducedMotion, toneOf } from "../drawer/helpers";
import { layoutArc, type ArcLayout } from "./arc";

interface ArcBandProps {
  people: Person[];
  hotId: string | null;
  onHot: (id: string | null) => void;
  matchIds: Set<string>;
  filtering: boolean;
  onOpen: (id: string, origin: Element) => void;
}

const HEADER_CLEARANCE = 76; // the tip goes below a mark rather than slide under the sticky site header

function runIntro(band: HTMLElement) {
  band.querySelector(".lnd-arc")?.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1400, easing: "cubic-bezier(.65,0,.35,1)", fill: "backwards" });
  band.querySelectorAll(".lnd-in").forEach((mark, i) => mark.animate(
    [{ opacity: 0, transform: "translateY(14px) scale(.35)" }, { opacity: 1, transform: "none" }],
    { duration: 700, delay: 260 + i * 34, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
}

/** Width of the band, re-measured on resize (once per frame at most). */
function useBandWidth(band: RefObject<HTMLDivElement>) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = band.current;
    if (!element) return;
    let frame = 0;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver(() => {
      frame ||= requestAnimationFrame(() => { frame = 0; setWidth(element.clientWidth); });
    });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [band]);
  return width;
}

function placeTip(tip: HTMLElement, band: HTMLElement, layout: ArcLayout, id: string) {
  const pos = layout.positions.find((q) => q.id === id);
  if (!pos) return;
  const tw = tip.offsetWidth, th = tip.offsetHeight, r = layout.r;
  const x = Math.max(8, Math.min(layout.width - tw - 8, pos.x - tw / 2));
  const above = band.getBoundingClientRect().top + pos.y - r - 14 - th >= HEADER_CLEARANCE;
  const y = above ? pos.y - r - 14 - th : pos.y + r + 14;
  tip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

export function ArcBand({ people, hotId, onHot, matchIds, filtering, onOpen }: ArcBandProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const width = useBandWidth(bandRef);
  const layout = useMemo(() => (width ? layoutArc(people, width) : null), [people, width]);
  const [ready, setReady] = useState(prefersReducedMotion);
  // The tip keeps its last person while it fades out.
  const [tipId, setTipId] = useState<string | null>(null);
  if (hotId && hotId !== tipId) setTipId(hotId);
  const tipPerson = people.find((p) => p.id === tipId) ?? null;
  const hasLayout = layout !== null;

  useEffect(() => {
    const band = bandRef.current;
    if (ready || !band || !hasLayout) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      runIntro(band);
      setReady(true);
    }, { threshold: 0.2 });
    observer.observe(band);
    return () => observer.disconnect();
  }, [ready, hasLayout]);

  useLayoutEffect(() => {
    if (hotId && layout && tipRef.current && bandRef.current) placeTip(tipRef.current, bandRef.current, layout, hotId);
  }, [hotId, layout]);

  const positionOf = new Map(layout?.positions.map((q) => [q.id, q]) ?? []);
  const bandClass = `lnd-band${ready ? " lnd-ready" : ""}${filtering ? " lnd-filtering" : ""}`;
  return <div ref={bandRef} className={bandClass} onPointerLeave={() => onHot(null)} onBlur={() => onHot(null)}
    style={layout ? { height: `${layout.height}px`, ...cssVars({ "--r": `${layout.r}px` }) } : undefined}>
    <p className="lnd-band-cap"><span className="lnd-pulse" />Each circle is one teacher, placed by the year they were born.</p>
    <svg className="lnd-art" aria-hidden="true" viewBox={layout ? `0 0 ${layout.width} ${layout.height}` : undefined}>
      {layout && <g className="lnd-grid">
        {layout.centuries.map((c) => <line key={c.year} x1={c.x.toFixed(1)} x2={c.x.toFixed(1)} y1={layout.gridTop} y2={layout.gridBottom} />)}
        <circle className="lnd-today" cx={layout.today.x.toFixed(1)} cy={layout.today.y.toFixed(1)} r="3" />
      </g>}
      <path className="lnd-arc" pathLength={1} d={layout?.arcPath} />
    </svg>
    <div className="lnd-marks">
      {people.map((p) => {
        const pos = positionOf.get(p.id);
        const cls = `lnd-mark${p.id === hotId ? " lnd-hot" : ""}${matchIds.has(p.id) ? " lnd-match" : ""}`;
        return <button key={p.id} type="button" className={cls} data-id={p.id} aria-label={`${p.name}, ${lifeLabel(p)}`}
          style={cssVars({ "--tone": toneOf(p), "--x": `${(pos?.x ?? 0).toFixed(1)}px`, "--y": `${(pos?.y ?? 0).toFixed(1)}px` })}
          onPointerEnter={() => { if (p.id !== hotId) onHot(p.id); }} onFocus={() => onHot(p.id)}
          onClick={(event) => onOpen(p.id, event.currentTarget)}>
          <span className="lnd-in"><span className="lnd-disc">{initials(p)}</span></span>
        </button>;
      })}
    </div>
    <div ref={tipRef} className={`lnd-tip${hotId ? " lnd-tip-on" : ""}`} aria-hidden="true" style={tipPerson ? cssVars({ "--tone": toneOf(tipPerson) }) : undefined}>
      {tipPerson && <>
        <p className="lnd-tip-fam">{familyOf(tipPerson).label}</p>
        <p className="lnd-tip-name">{tipPerson.name}</p>
        <p className="lnd-tip-years">{lifeLabel(tipPerson)}{tipPerson.died ? "" : " · living"}</p>
        <p className="lnd-tip-line">{tipPerson.line}</p>
        <p className="lnd-tip-go">Open profile<ArrowRight size={13} strokeWidth={1.5} aria-hidden /></p>
      </>}
    </div>
    <div className="lnd-axis" aria-hidden="true">
      {layout?.centuries.map((c) => <span key={c.year} style={{ left: `${c.x.toFixed(1)}px` }}>{c.year}</span>)}
      {layout?.showToday && <span className="lnd-axis-now" style={{ left: `${layout.today.x.toFixed(1)}px` }}>Today</span>}
    </div>
  </div>;
}
