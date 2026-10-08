// 03 · The discoveries: everything the section shows, derived from the Scholars data only (approved mock-up:
// design/scholars-directions/scholars/discoveries.js). The finds in date order, which lie on the Holy Land & Sinai map,
// and each find's "from the dig to your screen" thread: who found or studied it, what came of it, and where it reaches
// this site (or that it does not yet).
import type { CSSProperties } from "react";
import type { Field, Find, Scholar, ScholarsData } from "@/data/teachers/pages-types";

export type View = "holyland" | "med";
export const VIEWS: View[] = ["holyland", "med"];

const FIELD_TONE: Record<Field, string> = { history: "--gospels", texts: "--prophets", places: "--history", reference: "--epistles", theology: "--acts" };
/** Site areas a scholar's site note may name, and where each lives. */
export const AREA_ROUTE: Record<string, string> = {
  "Letters study": "/study/letters", Apologetics: "/apologetics", Topics: "/topics", "People pages": "/study/people", Rulers: "/study/rulers",
};
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];

export const toneOf = (scholar: Scholar) => `var(${FIELD_TONE[scholar.field]})`;
export const word = (n: number) => WORDS[n] ?? String(n);
/** Custom properties for a style prop (React's CSSProperties has no index for "--name"). */
export const cssVars = (vars: Record<string, string>) => vars as CSSProperties;
/** The site area a scholar's site note names, if any. */
export const areaOf = (scholar: Scholar) => (scholar.site ? Object.keys(AREA_ROUTE).find((area) => scholar.site?.note.includes(area)) : undefined);

export type Step =
  | { kind: "who"; scholar: Scholar }
  | { kind: "came"; work: [string, number] }
  | { kind: "next"; scholar: Scholar; what: string }
  | { kind: "site"; scholar: Scholar; site: NonNullable<Scholar["site"]> }
  | { kind: "none" };
export interface Thread { steps: Step[]; reached: Scholar[]; people: Set<string> }

export interface DiscoveryModel {
  data: ScholarsData;
  byId: Record<string, Scholar>;
  /** The finds in date order. */
  finds: Find[];
  /** Ids of the finds on the Holy Land & Sinai map. */
  inHoly: Set<string>;
  /** The first find beyond that map (Ramsay's), marked on its edge. */
  edgeFind: Find | null;
  threads: Record<string, Thread>;
}

/** A scholar's listed work counts as "what came of" a find when it is their only find, or when its title names the find. */
function workFor(model: Pick<DiscoveryModel, "data">, scholar: Scholar, find: Find): [string, number] | null {
  const theirs = model.data.finds.filter((f) => f.by.includes(scholar.id));
  if (theirs.length === 1) return scholar.works[0] ?? null;
  return scholar.works.find(([title]) => title.toLowerCase().includes(find.name.toLowerCase())) ?? null;
}

/** The site is reached through the scholar's own work, or else through the next scholar in the chain of the text whose
 *  work the site uses (Codex Sinaiticus → Tischendorf → Westcott → the Letters study). */
function threadOf(model: Pick<DiscoveryModel, "data" | "byId">, find: Find): Thread {
  const steps: Step[] = [], reached: Scholar[] = [];
  const chain = model.data.chain.steps;
  for (const id of find.by) {
    const scholar = scholarById(model.byId, id);
    steps.push({ kind: "who", scholar });
    const work = workFor(model, scholar, find);
    if (work) steps.push({ kind: "came", work });
    if (scholar.site) { reached.push(scholar); continue; }
    const at = chain.findIndex(([cid]) => cid === id);
    const later = at >= 0 ? chain.slice(at + 1).find(([cid]) => model.byId[cid]?.site) : undefined;
    if (later) { const next = scholarById(model.byId, later[0]); steps.push({ kind: "next", scholar: next, what: later[1] }); reached.push(next); }
  }
  for (const scholar of reached) if (scholar.site) steps.push({ kind: "site", scholar, site: scholar.site });
  if (!reached.length) steps.push({ kind: "none" });
  const people = new Set(steps.flatMap((st) => ("scholar" in st ? [st.scholar.id] : [])));
  return { steps, reached, people };
}

export function scholarById(byId: Record<string, Scholar>, id: string): Scholar {
  const scholar = byId[id];
  if (!scholar) throw new Error(`Discoveries: no scholar with id "${id}" in the Scholars data (named by a find or the chain of the text)`);
  return scholar;
}

export function buildModel(data: ScholarsData): DiscoveryModel {
  const byId = Object.fromEntries(data.scholars.map((s) => [s.id, s]));
  const finds = [...data.finds].sort((a, b) => a.year - b.year);
  if (!finds.length) throw new Error("Discoveries: the Scholars data lists no finds");
  const inHoly = new Set(finds.filter((f) => data.views.holyland.points[`find:${f.id}`]).map((f) => f.id));
  const threads = Object.fromEntries(finds.map((f) => [f.id, threadOf({ data, byId }, f)]));
  return { data, byId, finds, inHoly, edgeFind: finds.find((f) => !inHoly.has(f.id)) ?? null, threads };
}

export interface Overview { span: string; title: string; from: string; lie: string; reach: string }

/** The "All 7" card's words, computed from the finds and their threads. */
export function overviewOf(model: DiscoveryModel): Overview {
  const { finds, byId, threads, inHoly } = model;
  const first = finds[0], last = finds[finds.length - 1];
  const outside = finds.filter((f) => !inHoly.has(f.id));
  const reach = finds.filter((f) => threads[f.id].reached.length);
  const through = reach.map((f) => `${f.name}, through ${threads[f.id].reached.map((s) => s.short).join(" and ")}`).join("; ");
  const areas = [...new Set(reach.flatMap((f) => threads[f.id].reached.map((s) => areaOf(s) ?? "this site")))];
  const beyond = outside.map((f) => `${scholarById(byId, f.by[0]).short}'s lies beyond this map, at ${f.where[0]}`).join("; ");
  return {
    span: `${first.year}–${last.year}`,
    title: `The ${word(finds.length).toLowerCase()} discoveries`,
    from: `From ${scholarById(byId, first.by[0]).name} at ${first.where[0]} in ${first.year} to ${scholarById(byId, last.by[0]).name} at ${last.where[0]} in ${last.year}.`,
    lie: `${word(finds.length - outside.length)} lie in the Holy Land and Sinai${beyond ? `; ${beyond}` : ""}.`,
    reach: reach.length
      ? `${word(reach.length)} reach this site's ${areas.join(" and ")}: ${through}. The other ${word(finds.length - reach.length).toLowerCase()} are not used on this site yet.`
      : "None of them is used on this site yet.",
  };
}

/** Where a year sits on the year line, 0–100. */
export const railPos = (year: number) => ((year - 1830) / (1970 - 1830)) * 100;
