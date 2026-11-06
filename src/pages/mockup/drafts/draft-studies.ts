// The Scripture & Theology studies whose text is written and whose page is not built: the 40 numbered drafts in
// content/studies/progress.json, placed in the hub subject their folder belongs to. Read straight from the progress
// file, so a new or retitled draft shows without editing this list.
import progress from "../../../../content/studies/progress.json";

export interface DraftStudy {
  number: number;
  title: string;
  purpose: string;
  slug: string;
  /** Folder under content/studies, e.g. "jesus-christ". */
  category: string;
  /** Hub subject id on /study/theology, e.g. "jesus". */
  areaId: string;
  /** Address of its design mock-up in the gallery, when one has been built. */
  mockupUrl?: string;
}

interface ProgressItem {
  number: number;
  category: string;
  title: string;
  purpose: string;
  contentPath: string;
  mockupPath?: string;
}

const AREA_FOR_CATEGORY: Record<string, string> = {
  "explore-the-bible": "books",
  "jesus-christ": "jesus",
  "god-and-christian-faith": "doctrine",
  "christian-life": "life",
  "people-of-scripture": "people",
};

/** Draft 37 "Long Memory" is a rewrite of the live /study/long-memory page, not a study still waiting for one. */
const REWRITES_OF_LIVE_PAGES = new Set([37]);

/** Drafts the 2026-11-05 redundancy review took off the shelf (Pages/Topics/REDUNDANCY_REVIEW.md): merged into another
 *  draft (7, 8, 10, 12, 17, 25, 34), cut as duplicates of built pages (13, 15, 20, 22, 27, 32, 36, 40), or folded into a
 *  built page (14, 18, 33) or an Academic study (35). Their files stay in content/studies. */
const RETIRED_BY_REVIEW = new Set([7, 8, 10, 12, 13, 14, 15, 17, 18, 20, 22, 25, 27, 32, 33, 34, 35, 36, 40]);

function toDraft(item: ProgressItem): DraftStudy {
  const areaId = AREA_FOR_CATEGORY[item.category];
  if (!areaId) throw new Error(`Draft ${item.number} "${item.title}": category "${item.category}" has no Study hub subject; expected one of ${Object.keys(AREA_FOR_CATEGORY).join(", ")}`);
  const slug = item.contentPath.split("/")[1];
  const mockupFolder = item.mockupPath?.match(/design\/([^/]+)\/?$/)?.[1];
  return { number: item.number, title: item.title, purpose: item.purpose, slug, category: item.category, areaId, mockupUrl: mockupFolder ? `/mockups/${mockupFolder}/` : undefined };
}

export const DRAFT_STUDIES: DraftStudy[] = (progress.items as ProgressItem[])
  .filter(item => !REWRITES_OF_LIVE_PAGES.has(item.number) && !RETIRED_BY_REVIEW.has(item.number))
  .map(toDraft);

export const draftsForArea = (areaId: string) => DRAFT_STUDIES.filter(draft => draft.areaId === areaId);
export const draftBySlug = (slug: string | undefined) => DRAFT_STUDIES.find(draft => draft.slug === slug);
