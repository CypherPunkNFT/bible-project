// The Academic studies whose research file is written and whose page is not built: the entries marked "draft" in
// content/academic-research/index.json, placed in the Academic hub subject their category belongs to. Read straight
// from the index, so a new draft shows without editing this list.
import index from "../../../../content/academic-research/index.json";

export interface AcademicDraft {
  order: number;
  title: string;
  slug: string;
  /** Research file name in content/academic-research, e.g. "37-cyrus-restoration-and-return.json". */
  file: string;
  /** Hub subject id on /study/academic, e.g. "history". */
  areaId: string;
  /** The research file's own one-paragraph premise, shown on its card. */
  premise?: string;
  note?: string;
}

interface IndexEntry {
  order: number;
  category: string;
  title: string;
  status: string;
  file?: string;
  note?: string;
}

/** The index's categories → the Academic hub's five subjects. "interpretation" studies (Why translations differ)
 *  sit with Languages & translation; "church-history" with Christian thought & church history. */
const AREA_FOR_CATEGORY: Record<string, string> = {
  history: "history",
  "bible-formation": "texts",
  interpretation: "languages",
  languages: "languages",
  culture: "culture",
  church: "church",
  "church-history": "church",
  thought: "church",
};

export const areaForCategory = (category: string): string | undefined => AREA_FOR_CATEGORY[category];

/** Only each research file's `premise` is bundled here (a named JSON import), not the whole file. A named import
 *  fails the build for a file without that key, so the pattern starts at 10: files 01-09 are the older research
 *  records and design files, which have no premise; every research file from 10 on has one. */
const PREMISES = import.meta.glob<string | undefined>("/content/academic-research/[1-9][0-9]-*.json", { eager: true, import: "premise" });

const drafts = (index.studies as IndexEntry[]).filter(entry => entry.status === "draft");

/** A draft whose category has no hub subject, or whose entry names no file, is left off the shelf here and caught by
 *  academic-drafts.test.ts, so one bad entry cannot blank the whole page. */
export const ACADEMIC_DRAFTS: AcademicDraft[] = drafts.flatMap(entry => {
  const areaId = areaForCategory(entry.category);
  if (!areaId || !entry.file) return [];
  const slug = entry.file.replace(/^\d+-/, "").replace(/\.json$/, "");
  return [{ order: entry.order, title: entry.title, slug, file: entry.file, areaId, premise: PREMISES[`/content/academic-research/${entry.file}`], note: entry.note }];
});

export const UNPLACED_DRAFTS = drafts.filter(entry => !areaForCategory(entry.category) || !entry.file);

export const academicDraftsForArea = (areaId: string) => ACADEMIC_DRAFTS.filter(draft => draft.areaId === areaId);
export const academicDraftBySlug = (slug: string | undefined) => ACADEMIC_DRAFTS.find(draft => draft.slug === slug);

/** A research file's key as words: "confusedWords" → "Confused words". */
export const humanise = (key: string) => {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
