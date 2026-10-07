// One generated CONTENT.md per major page, under the project's Pages/ folder (see Pages/README.md).
// Each area module (study.ts, atlas.ts, topics.ts, apologetics.ts) exports `extract()` returning these.

export interface PageContent {
  /** Folder under Pages/, e.g. "Study/letters-and-their-message" or "Topics/god-and-his-word/who-god-is". */
  dir: string;
  /** The page's title as the site shows it. */
  title: string;
  /** Every piece of content the page shows, as Markdown (no top-level heading; the runner adds it). */
  markdown: string;
}

export type Extractor = () => Promise<PageContent[]>;

/** Turn a site title into a folder name: "Letters & their message" -> "letters-and-their-message". */
export const slugify = (title: string) =>
  title.toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
