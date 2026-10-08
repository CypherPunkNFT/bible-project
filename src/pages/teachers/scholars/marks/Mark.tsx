// A scholar's mark: the shape of their field with their initials (geometry in ./shapes.ts). `<Mark scholar size />` is
// the whole badge; `<MarkInner>` is its inside in the 48 × 48 box (for drawing inside a bigger SVG); `<FieldIcon>` is the
// bare field shape, small, for legends and filters.
import type { Field, Scholar } from "@/data/teachers/pages-types";
import { fieldShape, initials, toneVar } from "./shapes";
import "./marks.css";

/** The field's shape at scale k, as one SVG element (it takes its fill and stroke from the group around it). */
export function FieldShape({ field, k }: { field: Field; k: number }) {
  const g = fieldShape(field, k);
  if (g.kind === "circle") return <circle cx={g.cx} cy={g.cy} r={g.r} />;
  if (g.kind === "rect") return <rect x={g.x} y={g.y} width={g.width} height={g.height} rx={g.rx} />;
  return <path d={g.d} strokeLinejoin={g.round ? "round" : undefined} />;
}

export function MarkInner({ scholar }: { scholar: Scholar }) {
  const tone = toneVar(scholar.field), letters = initials(scholar), two = letters.length > 1;
  return <>
    <g style={{ fill: `color-mix(in srgb, ${tone} 15%, var(--surface))`, stroke: `color-mix(in srgb, ${tone} 50%, transparent)` }} strokeWidth={1.1}>
      <FieldShape field={scholar.field} k={1} />
    </g>
    <g fill="none" style={{ stroke: `color-mix(in srgb, ${tone} 22%, transparent)` }} strokeWidth={0.8}>
      <FieldShape field={scholar.field} k={0.82} />
    </g>
    <text x="24" y="25" textAnchor="middle" dominantBaseline="central"
      style={{ fill: tone, font: `${two ? 500 : 400} ${two ? 15.5 : 21}px var(--serif)`, letterSpacing: "-.02em" }}>{letters}</text>
  </>;
}

export function Mark({ scholar, size, className }: { scholar: Scholar; size: number; className?: string }) {
  return <svg className={className ? `sc-mark ${className}` : "sc-mark"} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <MarkInner scholar={scholar} />
  </svg>;
}

export function FieldIcon({ field, size }: { field: Field; size: number }) {
  const tone = toneVar(field);
  return <svg className="sc-field-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"
    style={{ fill: `color-mix(in srgb, ${tone} 22%, transparent)`, stroke: tone }} strokeWidth={4}>
    <FieldShape field={field} k={0.9} />
  </svg>;
}
