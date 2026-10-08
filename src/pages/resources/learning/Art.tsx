// Drawing the division's line art (art-data.ts) and a workbook's own drawings (learning.json outline.art) as React SVG.
import { createElement, type ReactNode } from "react";
import type { ArtShape } from "@/data/resources";
import { AUDIENCE_ART, GLYPHS, type Shape } from "./art-data";

const TRACK_GLYPH: Record<string, string> = { people: "people", books: "books", story: "bigstory", jesus: "jesus", places: "places", letters: "letters", defend: "defend", teachers: "teachers", life: "life" };

function draw(shapes: Shape[], prefix = ""): ReactNode[] {
  return shapes.map(([tag, props, children], i) => createElement(tag, { key: `${prefix}${i}`, ...props }, children ? draw(children, `${prefix}${i}.`) : undefined));
}

/** The shapes of a drawing, for placing inside another SVG (the centre of the built-from ring). */
export function AudienceShapes({ shapes }: { shapes: Shape[] }) {
  return <>{draw(shapes)}</>;
}

/** One reader's drawing (120 x 80, strokes only); parts marked mv- move on a slow loop. */
export function AudienceArt({ name, className = "" }: { name: string; className?: string }) {
  return <svg className={`lm-aud-art ${className}`} viewBox="0 -8 120 88" fill="none" stroke="currentColor" strokeWidth={1.15} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {draw(AUDIENCE_ART[name] ?? [])}
  </svg>;
}

export function Glyph({ name, size = 20, strokeWidth = 1.4 }: { name: string; size?: number; strokeWidth?: number }) {
  return <svg className="lm-glyph" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {draw(GLYPHS[name] ?? [])}
  </svg>;
}

export const TrackGlyph = ({ track, size, strokeWidth }: { track: string; size?: number; strokeWidth?: number }) =>
  <Glyph name={TRACK_GLYPH[track] ?? "life"} size={size} strokeWidth={strokeWidth} />;

const camel = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** A workbook session's own drawing, from the shapes the builder recorded (content/learning/art/<name>.svg). */
export function SessionArt({ shapes }: { shapes: ArtShape[] }) {
  return <svg className="lm-session-art" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {shapes.map(([tag, attrs], i) => createElement(tag, { key: i, ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [camel(k), v])) }))}
  </svg>;
}
