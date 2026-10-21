// The section emblems for the homepage banners: engraved rings turning slowly in place about the exact centre, around
// the part's own mark. Every ring keeps to its own band between solid circles, so nothing that turns ever crosses
// anything else. From the outside in: a solid rim, a band of marks (r 50-58), the Hebrew band (r 40-50, letters set
// close to its inner circle), the figure band (r 22-40), a narrow inner band (r 16-22) and the centre disc (r 16), whose
// mark stays within r 11. Each part has three designs; the first is the one the homepage uses. Motion: home-emblems.css.
import type { ReactNode } from "react";
import { useId } from "react";
import { DESIGNS, type EmblemKind } from "./emblem-designs";
import "./home-emblems.css";

export type { EmblemKind };

const TAU = Math.PI * 2;
const fixed = (n: number) => Math.round(n * 100) / 100;

/** Hebrew around the band (twice if short), stretched to close the circle; the baseline sits just outside the band's inner circle. */
function Hebrew({ text }: { text: string }) {
  const id = `he-ring-${useId().replace(/:/g, "")}`, r = 42.4;
  return <>
    <defs><path id={id} d={`M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}`} /></defs>
    <text className="he-hebrew" lang="he"><textPath href={`#${id}`} textLength={fixed(TAU * r - 2)} lengthAdjust="spacing">{text.length < 30 ? `${text} ✦ ${text} ✦ ` : `${text} ✦ `}</textPath></text>
  </>;
}

function Turn({ spin, children }: { spin: "slow" | "back" | "mid" | "fast"; children: ReactNode }) {
  return <g className={`he-turn he-${spin}`}>{children}</g>;
}

export function Emblem({ kind, variant = 0, className }: { kind: EmblemKind; variant?: number; className?: string }) {
  const design = DESIGNS[kind][variant] ?? DESIGNS[kind][0];
  return <svg className={`he-emblem ${className ?? ""}`} data-kind={kind} viewBox="-62 -62 124 124" fill="none" aria-hidden="true">
    {[58.5, 50, 40, 22].map((r) => <circle key={r} className="he-ring he-solid" r={r} />)}
    <Turn spin="slow">{design.outer}</Turn>
    <Turn spin="back"><Hebrew text={design.hebrew} /></Turn>
    <Turn spin="mid">{design.figure}</Turn>
    <Turn spin="fast">{design.inner}</Turn>
    <circle className="he-hub" r="16" />
    <g className="he-centre">{design.centre}</g>
  </svg>;
}
