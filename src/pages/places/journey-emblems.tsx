// A Journeys person's emblem and round seal (shapes in journey-emblems-data.ts). Strokes draw in via journeys-pilgrim.css.
import type { CSSProperties } from "react";
import { PERSON_TONE, STROKES } from "./journey-emblems-data";

export function Emblem({ id, size = 48, stroke = 1.6 }: { id: string; size?: number; stroke?: number }) {
  return <svg className="pg-emblem" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {(STROKES[id] ?? []).map((d) => <path key={d} pathLength={1} d={d} />)}
  </svg>;
}

/** A person's round seal with their emblem; `tone` sets the colour (see PERSON_TONE). */
export function Seal({ id, size = "md", draw }: { id: string; size?: "md" | "lg"; draw?: boolean }) {
  return <span className={`pg-seal${size === "lg" ? " pg-seal-lg" : ""}${draw ? " pg-draw-in" : ""}`} style={{ "--tone": `var(--${PERSON_TONE[id] ?? "accent"})` } as CSSProperties}>
    <Emblem id={id} size={size === "lg" ? 46 : 40} stroke={size === "lg" ? 1.4 : 1.5} />
  </span>;
}
