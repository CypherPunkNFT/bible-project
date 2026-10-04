import { PROPHECY_PASSAGES, type PassageEntry } from "@/data/chart-insights";
import { loadHarmony, loadMiracles, loadNames, type Harmony, type Miracles, type NamesOfGod } from "./study";
import type { BookInfo, SectionId } from "./types";

export const TEXT_MEASURES = [
  { id: "books", label: "Books" }, { id: "chapters", label: "Chapters" },
  { id: "verses", label: "Verses" }, { id: "words", label: "Words" }, { id: "red", label: "Words of Jesus" },
] as const;
export const STUDY_MEASURES = [
  { id: "miracles", label: "Miracles", note: "Robertson's 35 miracles of Jesus and Torrey's miracles through God's servants. These are entries in those study lists, not a census of every miracle in Scripture; evil agents are excluded." },
  { id: "prophecies", label: "Selected prophecies", note: "21 selected passages of promise, warning and hope, chosen for this reading guide. This is a small editorial selection, not a total of biblical prophecies or a claim about which predictions are fulfilled." },
  { id: "episodes", label: "Gospel episodes", note: "Sections of A. T. Robertson's 1922 Gospel harmony. A shared scene counts once in its section, however many Gospel accounts record it." },
  { id: "names", label: "Names of God", note: "Names and titles from this site's Study collection, placed by their cited passages. A title appearing in several sections counts once in each section." },
] as const;
export type TextMeasure = (typeof TEXT_MEASURES)[number]["id"];
export type StudyMeasure = (typeof STUDY_MEASURES)[number]["id"];
export type Measure = TextMeasure | StudyMeasure;

export function buildStudyMeasures(harmony: Harmony, miracles: Miracles, names: NamesOfGod): Record<StudyMeasure, PassageEntry[]> {
  const scenes = harmony.parts.flatMap((p) => p.sections);
  const refsOf = (scene: (typeof scenes)[number]) => ["MAT", "MRK", "LUK", "JHN"].flatMap((code) => scene.refs[code as "MAT"] ?? []);
  return {
    miracles: [
      ...miracles.christ.map((m) => ({ title: m.title, refs: scenes.filter((s) => s.n === m.section).flatMap(refsOf) })),
      ...miracles.servants.flatMap((g) => g.items.map((item) => ({ title: g.who + ": " + item.title, refs: item.refs }))),
    ],
    prophecies: PROPHECY_PASSAGES,
    episodes: scenes.map((s) => ({ title: s.title, refs: refsOf(s) })),
    names: names.groups.flatMap((g) => g.names.map((n) => ({ title: g.label + ": " + n.name, refs: n.refs }))),
  };
}

export async function loadChartStudyMeasures() {
  const [harmony, miracles, names] = await Promise.all([loadHarmony(), loadMiracles(), loadNames()]);
  return buildStudyMeasures(harmony, miracles, names);
}

/** One entry per section, not one entry per reference or parallel account. */
export function entriesBySection(entries: PassageEntry[], books: BookInfo[]): Map<SectionId, PassageEntry[]> {
  const byNum = new Map(books.map((b) => [b.num, b.section]));
  const result = new Map<SectionId, PassageEntry[]>();
  for (const entry of entries) {
    const sections = new Set<SectionId>();
    for (const [start, end] of entry.refs) {
      for (let num = Math.floor(start / 1e6); num <= Math.floor(end / 1e6); num++) {
        const section = byNum.get(num);
        if (section && section !== "apocrypha") sections.add(section);
      }
    }
    for (const section of sections) { if (!result.has(section)) result.set(section, []); result.get(section)!.push(entry); }
  }
  return result;
}
