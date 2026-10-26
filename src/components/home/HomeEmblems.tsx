// The section emblems for the homepage banners: engraved rings turning slowly in place about the exact centre, around
// the part's own mark. Every ring keeps to its own band between solid circles, so nothing that turns ever crosses
// anything else. From the outside in: a solid rim, a band of marks (r 50-58), the Hebrew band (r 40-50, wider in the larger
// frames, letters set close to its inner circle), the figure band (r 22-40, narrower as the Hebrew grows), a narrow inner band (r 16-22) and the centre disc (r 16), whose
// mark stays within r 11. Designs: emblem-designs.tsx. Motion: home-emblems.css.
import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";
import { DESIGNS, FRAMES, READ_MS, type EmblemKind, type FrameKind } from "./emblem-designs";
import "./home-emblems.css";

export type { EmblemKind };

const TAU = Math.PI * 2;
const fixed = (n: number) => Math.round(n * 100) / 100;

/** One tspan per letter, numbered in reading order, so hovering can strengthen the letters in turn (home-emblems.css). */
function Letters({ text }: { text: string }) {
  return <>{Array.from(text, (letter, i) => <tspan key={i} className="he-ch" style={{ "--i": i } as CSSProperties}>{letter}</tspan>)}</>;
}

/** Hebrew around the band, repeated as many times as fits and then spaced to close the circle; the baseline sits just outside the
 *  band's inner circle. A Hebrew letter runs about 0.55 of the font size wide. Hovering strengthens the letters in reading order,
 *  READ_MS from first to last (home-emblems.css). */
function Hebrew({ text, frame }: { text: string; frame: FrameKind }) {
  const id = `he-ring-${useId().replace(/:/g, "")}`, { baseline: r, size } = FRAMES[frame];
  const copies = Math.max(1, Math.floor((TAU * r * 1.05) / ((text.length + 3) * size * 0.55)));
  const full = `${text} ✦ `.repeat(copies);
  return <>
    <defs><path id={id} d={`M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}`} /></defs>
    <text className="he-hebrew" lang="he" style={{ fontSize: size, "--step": `${fixed(READ_MS / full.length)}ms` } as CSSProperties}>
      <textPath href={`#${id}`} textLength={fixed(TAU * r - 2)} lengthAdjust="spacing"><Letters text={full} /></textPath></text>
  </>;
}

function Turn({ spin, children }: { spin: "slow" | "back" | "mid" | "fast"; children: ReactNode }) {
  return <g className={`he-turn he-${spin}`}>{children}</g>;
}

export function Emblem({ kind, variant = 0, className }: { kind: EmblemKind; variant?: number; className?: string }) {
  const design = DESIGNS[kind][variant] ?? DESIGNS[kind][0];
  return <svg className={`he-emblem ${className ?? ""}`} data-kind={kind} data-large={design.frame !== "normal" || undefined} viewBox="-62 -62 124 124" fill="none" aria-hidden="true">
    {[FRAMES[design.frame].rim, FRAMES[design.frame].hebrewOuter, FRAMES[design.frame].hebrewInner, 22].map((r) => <circle key={r} className="he-ring he-solid" r={r} />)}
    <Turn spin="slow">{design.outer}</Turn>
    <Turn spin="back"><Hebrew text={design.hebrew} frame={design.frame} /></Turn>
    <Turn spin="mid">{design.figure}</Turn>
    <Turn spin="fast">{design.inner}</Turn>
    <circle className="he-hub" r="16" />
    <g className="he-centre">{design.centre}</g>
  </svg>;
}
