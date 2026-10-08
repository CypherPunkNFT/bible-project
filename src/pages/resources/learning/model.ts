// Plain helpers the Learning division's components share: addresses, colours, counts and layouts (no components here).
import type { CSSProperties } from "react";
import type { Audience, Division, Title } from "@/data/resources/learning-catalogue";

/** Where a link came from, carried in router state so the next page can name the way back (src/lib/came-from.ts). */
export interface Back { path: string; label: string }

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The CSS colours of a reader's door, from the site's section palette (light and dark come with the tokens). */
export const toneOf = (a: Audience) => ({ "--tone": `var(--${a.tone})`, "--tone-solid": `var(--${a.tone}-tab)`, "--tone-ink": `var(--${a.tone}-tab-ink)` }) as CSSProperties;

export const titleUrl = (id: string) => `/resources/learning/${id}`;
export const doorUrl = (audience: string) => `/resources/learning?for=${audience}`;
export const doorBack = (a: Audience): Back => ({ path: doorUrl(a.id), label: `the ${a.name.toLowerCase()} door` });

/** "Moses" and "three forties" from "Moses: three forties". */
export function splitTitle(title: string): [string, string] {
  const at = title.indexOf(":");
  return at < 0 ? [title, ""] : [title.slice(0, at), title.slice(at + 1).trim()];
}

/** Four pages that show what is inside a built workbook: how to use it, the introduction, session 1, its first questions. */
export function samplePages(title: Title): [number, string][] {
  const o = title.record?.outline;
  if (!o?.sessions.length) return [];
  const first = o.sessions[0];
  return [[o.pages.use, "How to use it"], [o.pages.intro, o.intro], [first.page, "Session 1"], [first.questionsPage, "Questions"]];
}

/** A door's stack, top to bottom: grouped by subject in the site's track order, the ready title first in its group. */
export function groupsFor(division: Division, audience: string) {
  const items = division.forAudience(audience);
  return division.tracks.map((track) => [track, items.filter((t) => t.track === track.id).sort((p, q) => Number(q.status === "ready") - Number(p.status === "ready"))] as const)
    .filter(([, list]) => list.length);
}

/** "Workbook · Adults (18 and up) · 8 sessions · 42 pages". */
export function facts(division: Division, t: Title) {
  const a = division.audience[t.audience];
  const bits = [division.kind[t.kind].name, a.setting ? a.name : `${a.name} (${a.age})`];
  if (t.record) bits.push(plural(t.record.sessions, "session"), plural(t.record.pages, "page"));
  else if (t.sessions) bits.push(`${plural(t.sessions, "session")} planned`);
  return bits.join(" · ");
}

/** The built-from ring: titles evenly round the inner ring, each source page near the titles written from it. */
export function ringLayout(items: Title[]) {
  const srcs = [...new Map(items.flatMap((t) => t.builtFrom.map((b) => [b.path, b] as const))).values()];
  const ia = new Map(items.map((t, i) => [t.id, (360 / items.length) * i + 360 / items.length / 2]));
  const meanAngle = (path: string) => {
    const as = items.filter((t) => t.builtFrom.some((b) => b.path === path)).map((t) => ((ia.get(t.id) ?? 0) * Math.PI) / 180);
    return ((Math.atan2(as.reduce((s, a) => s + Math.sin(a), 0), as.reduce((s, a) => s + Math.cos(a), 0)) * 180) / Math.PI + 360) % 360;
  };
  const sorted = srcs.map((s) => [s, meanAngle(s.path)] as const).sort((a, b) => a[1] - b[1]);
  const off = sorted.length ? sorted[0][1] - (360 / sorted.length) * 0.3 : 0;
  const sa = new Map(sorted.map(([s], i) => [s.path, off + (360 / sorted.length) * i]));
  return { srcs: sorted.map(([s]) => s), ia, sa };
}
