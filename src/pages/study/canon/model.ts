// The canon study's data and look-ups, as the approved mock-up's core.js holds them (design/canon-directions/, direction D):
// the research file itself, plus what design/canon-directions/build-data.py adds in canon-data.json (each record's span and
// place, the lanes, the ten questions, the trail notes and the six pictured codices).
import dossier from "../../../../content/academic-research/04-how-the-canon-took-shape.json";
import canonData from "./canon-data.json";

export interface Picture {
  q: string; name: string; date: string; holds: string; holder: string; shelf: string; material: string; record: string | null;
  w: number; h: number; file: string; page: string; licence: string; credit: string;
}
interface Question { prompt: string; answers: string[]; correct: number; why: string; ids: string[] }
interface Lane { key: string; label: string; line: string; ids: string[] }
interface Place { kind: "point" | "region" | "disputed" | "none"; label: string; x: number | null; y: number | null }
interface CanonData {
  names: Record<string, string>; questions: Question[]; trailNotes: Record<string, string>; findings: string[];
  spans: Record<string, { from: number; to: number; how: string }>; lanes: Lane[]; places: Record<string, Place>;
  pictured: Picture[]; map: { box: [number, number, number, number]; d: string | string[] };
}

export const CN = canonData as unknown as CanonData;
export const D = dossier;
export type CanonRecord = (typeof dossier.records)[number] & { books?: Record<string, string> };
export const records = dossier.records as CanonRecord[];
export const byId = new Map(records.map((r) => [r.id, r]));
export const sourceById = new Map(dossier.sources.map((s) => [s.id, s]));
export const pictureFor = new Map(CN.pictured.filter((p) => p.record).map((p) => [p.record as string, p]));
export const name = (id: string) => CN.names[id] ?? id;

// Each record's own kind, as written, sorted into one of four lanes; the lane sets the tone.
const LANE_TONE: Record<string, string> = { carried: "--history", used: "--gospels", listed: "--prophets", decided: "--revelation" };
const laneOf = new Map(CN.lanes.flatMap((lane) => lane.ids.map((id) => [id, lane] as const)));
export const tone = (id: string) => `var(${LANE_TONE[laneOf.get(id)?.key ?? ""] ?? "--accent"})`;
export const ERA_SPANS = ["Before & around the turn of the era", "2nd–3rd centuries", "4th century", "Late antiquity–Reformation"];

// The six pictures are the Manuscripts page's own copies.
export const imgSrc = (q: string) => `/images/manuscripts/${q}.jpg`;
export const pictureWhat = (p: Picture) => p.file.replace(/\.(jpe?g|png|gif)$/i, "");
