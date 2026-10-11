// Discovery geometry comes from Scholars data; attribution and site links come from reviewed evidence.
import evidenceData from "../../../../../content/teachers/discovery-evidence.json";
import type { CSSProperties } from "react";
import type { Field, Find, Scholar, ScholarsData } from "@/data/teachers/pages-types";

export type View = "holyland" | "med";
export const VIEWS: View[] = ["holyland", "med"];

const FIELD_TONE: Record<Field, string> = { history: "--gospels", texts: "--prophets", places: "--history", reference: "--epistles", theology: "--acts" };
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];

export const toneOf = (scholar: Scholar) => `var(${FIELD_TONE[scholar.field]})`;
export const word = (n: number) => WORDS[n] ?? String(n);
/** Custom properties for a style prop (React's CSSProperties has no index for "--name"). */
export const cssVars = (vars: Record<string, string>) => vars as CSSProperties;
export interface DiscoveryEvidence {
  year?: number; date: string; role: string; context: string;
  sources: { label: string; url: string }[];
  site?: { label: string; url: string; note: string; evidence: string; citation: string; match: string; sourceUrl: string; sourceTitle: string };
}
export const evidence: Record<string, DiscoveryEvidence> = evidenceData.cases;

export interface DiscoveryModel {
  data: ScholarsData;
  byId: Record<string, Scholar>;
  /** The finds in date order. */
  finds: Find[];
  /** Ids of the finds on the Holy Land & Sinai map. */
  inHoly: Set<string>;
  /** The first find beyond that map (Ramsay's), marked on its edge. */
  edgeFind: Find | null;

}

export function scholarById(byId: Record<string, Scholar>, id: string): Scholar {
  const scholar = byId[id];
  if (!scholar) throw new Error(`Discoveries: no scholar with id "${id}" in the Scholars data (named by a find or the chain of the text)`);
  return scholar;
}

export function buildModel(data: ScholarsData): DiscoveryModel {
  const byId = Object.fromEntries(data.scholars.map((s) => [s.id, s]));
  const finds = data.finds.map(f => {
    if (!evidence[f.id]) throw new Error(`Missing discovery evidence: ${f.id}`);
    return { ...f, year: evidence[f.id].year ?? f.year, line: evidence[f.id].context };
  }).sort((a, b) => a.year - b.year);
  if (!finds.length) throw new Error("Discoveries: the Scholars data lists no finds");
  const inHoly = new Set(finds.filter((f) => data.views.holyland.points[`find:${f.id}`]).map((f) => f.id));
  return { data, byId, finds, inHoly, edgeFind: finds.find((f) => !inHoly.has(f.id)) ?? null };
}

export interface Overview { span: string; title: string; from: string; lie: string; reach: string }

/** Overview counts describe this curated selection, never the full catalogue. */
export function overviewOf(model: DiscoveryModel): Overview {
  const { finds, inHoly } = model;
  const first = finds[0], last = finds[finds.length - 1];
  const linked = finds.filter(f => evidence[f.id].site).length;
  return {
    span: `${first.year}\u2013${last.year}`,
    title: `${word(finds.length)} selected case studies`,
    from: "A selection of manuscript studies, surveys and excavation campaigns. These seven are not the full archaeology collection or a count of its contributors.",
    lie: `${word(inHoly.size)} locations appear on the Holy Land and Sinai map; Asia Minor appears on the wider map. Dates mark the milestones described on each card.`,
    reach: `${word(linked)} cards include checked links to existing study passages. The others have historical sources but no verified feature connection in this review. That does not establish that they are absent everywhere on the site.`,
  };
}

/** Where a year sits on the year line, 0–100. */
export const railPos = (year: number) => ((year - 1830) / (1970 - 1830)) * 100;
