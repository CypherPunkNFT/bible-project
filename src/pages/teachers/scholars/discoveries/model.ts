import evidenceData from "../../../../../content/teachers/discovery-evidence.json";
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
  | { kind: "who"; scholar: Scholar; role?:string }
  | { kind: "came"; work: [string, string|number]; url?:string }
  | { kind: "next"; scholar: Scholar; what: string }
  | { kind: "site"; scholar: Scholar; site: NonNullable<Scholar["site"]>; url?:string; label?:string }
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

type Evidence = {year?:number;date:string;context:string;role:string;sources:{label:string;url:string}[];site?:{label:string;url:string;note:string;sourceTitle:string;sourceUrl:string}};
export const discoveryEvidence:Record<string,Evidence> = evidenceData.cases;
function threadOf(model: Pick<DiscoveryModel, "data" | "byId">, find: Find): Thread {
 const record=discoveryEvidence[find.id], steps:Step[]=[], reached:Scholar[]=[];
 for(const id of find.by)steps.push({kind:'who',scholar:scholarById(model.byId,id),role:record.role});
 steps.push({kind:'came',work:[record.sources[0].label,record.date],url:record.sources[0].url});
 if(record.site){
  const scholar=scholarById(model.byId,find.id==='sinaiticus'?'westcott':find.by[0]);
  if(find.id==='sinaiticus')steps.push({kind:'next',scholar,what:'Cited discussion of the manuscript; not a claim that this edition supplies the site text.'});
  steps.push({kind:'came',work:[record.site.sourceTitle,''],url:record.site.sourceUrl});
  reached.push(scholar);steps.push({kind:'site',scholar,site:{status:'in-use',note:record.site.note},url:record.site.url,label:record.site.label});
 }else steps.push({kind:'none'});
 return {steps,reached,people:new Set(steps.flatMap(st=>'scholar' in st?[st.scholar.id]:[]))};
}

export function scholarById(byId: Record<string, Scholar>, id: string): Scholar {
  const scholar = byId[id];
  if (!scholar) throw new Error(`Discoveries: no scholar with id "${id}" in the Scholars data (named by a find or the chain of the text)`);
  return scholar;
}

export function buildModel(data: ScholarsData): DiscoveryModel {
  const byId = Object.fromEntries(data.scholars.map((s) => [s.id, s]));
  const finds = data.finds.map(f=>({...f,year:discoveryEvidence[f.id].year??f.year,line:discoveryEvidence[f.id].context})).sort((a,b)=>a.year-b.year);
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
  const areas = [...new Set(reach.map((f) => discoveryEvidence[f.id].site?.label ?? "this site"))];
  const beyond = outside.map((f) => `${scholarById(byId, f.by[0]).short}'s lies beyond this map, at ${f.where[0]}`).join("; ");
  return {
    span: `${first.year}–${last.year}`,
    title: `The ${word(finds.length).toLowerCase()} discoveries`,
    from: `From ${scholarById(byId, first.by[0]).name} at ${first.where[0]} in ${first.year} to ${scholarById(byId, last.by[0]).name} at ${last.where[0]} in ${last.year}.`,
    lie: `${word(finds.length - outside.length)} lie in the Holy Land and Sinai${beyond ? `; ${beyond}` : ""}.`,
    reach: reach.length
      ? `${word(reach.length)} reach this site's ${areas.join(" and ")}: ${through}. The other ${word(finds.length - reach.length).toLowerCase()} have no verified feature connection in this review.`
      : "No feature connections verified in this review.",
  };
}

/** Where a year sits on the year line, 0–100. */
export const railPos = (year: number) => ((year - 1830) / (1970 - 1830)) * 100;
