// Every public page address, from the same inventory the design review board uses (scripts/design-review/site-map-*.ts),
// so a new page type added there reaches the sitemap by itself. Addresses are paths without their query: a query is a
// view of a page (a place on the map, a group on a card), and the page's official address is its path.
import { readJson, type TemplateDef } from "../design-review/model.ts";
import { atlasTemplates } from "../design-review/site-map-atlas.ts";
import { peopleTemplates } from "../design-review/site-map-people.ts";
import { restTemplates } from "../design-review/site-map-rest.ts";
import { teacherReadingTemplates } from "../design-review/site-map-teachers.ts";

/** Local-only pages: never in the sitemap (robots.txt also keeps crawlers out of most of them). */
const PRIVATE = [/^\/review(\/|$)/, /^\/mockups?(\/|$)/, /^\/mock\//, /_mockup\d*$/, /^\/study2$/, /^\/apologetics2(\/|$)/, /^\/testimonies\/(access|design)$/, /^\/banner-emblems$/];
/** Page types too many to list one by one: 142,732 library reading pages, and the page-not-found page. */
const LEFT_OUT = new Set(["teacher-reading", "not-found"]);
/** Page types with too many pages to ship a ready-made copy of each (Cloudflare's 20,000-file cap): the sitemap only. */
const SITEMAP_ONLY = new Set(["person", "topic", "reader", "atlas-map", "teacher-reading"]);
const SAFE_PATH = /^\/([A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]*$/;
/** Real routes (src/App.tsx and the section routers) the inventory does not list yet. The capture skips any that shows
 *  "page not found" on the live site, so a local-only page listed here is never published by mistake. */
const NOT_IN_INVENTORY = [
  "/listen", "/listen/asv", "/contact", "/analysis", "/teachers", "/resources", "/resources/learning", "/resources/fellowships", "/resources/life",
  "/study/rulers", "/study/apostles", "/study/harmony", "/study/hymns", "/study/manuscripts", "/study/theology-articles", "/study/questions",
  "/study/dead-sea-scrolls", "/study/circles", "/study/long-memory", "/study/cities-through-their-layers", "/study/cyrus-restoration-and-return",
  "/study/discoveries-biblical-record", "/study/from-discovery-to-history", "/study/from-manuscript-to-printed-bible", "/study/how-the-canon-took-shape",
  "/study/israel-among-the-empires", "/study/lachish-under-siege", "/study/mesha-and-the-world-of-moab", "/study/passage-through-manuscripts",
  "/study/surviving-witnesses", "/study/world-of-jesus-and-apostles",
];

export interface SitePage { path: string; template: string; prerender: boolean }

export async function sitePages(): Promise<SitePage[]> {
  const defs: TemplateDef[] = [
    ...peopleTemplates().templates,
    ...(await atlasTemplates()).templates,
    ...(await restTemplates()).templates,
    ...teacherReadingTemplates().templates,
  ];
  // A person with a readable address (/people/peter) is moved there by the app, and so is an apostle's mission page
  // (the readable page is the mission page): list that address, with a ready-made copy, since these are the main people.
  const readable = new Map(Object.entries(readJson<{ slugs: Record<string, string> }>("src/data/people-slugs.json").slugs).map(([slug, id]) => [id, slug]));
  const pages = new Map<string, SitePage>();
  for (const def of defs) {
    if (LEFT_OUT.has(def.id)) continue;
    for (const variant of def.variants) {
      const url = variant.url as (record: unknown) => string;
      for (const record of variant.records as unknown[]) {
        let path = new URL(url(record), "https://bibleguide.io").pathname.replace(/\/+$/, "") || "/";
        const segments = path.split("/");
        const person = def.id === "person" || def.id === "apostle" ? readable.get(segments[2]) : undefined;
        if (person) path = `/people/${person}`;
        if (!SAFE_PATH.test(path) || PRIVATE.some((rule) => rule.test(path)) || pages.has(path)) continue;
        pages.set(path, { path, template: def.id, prerender: Boolean(person) || !SITEMAP_ONLY.has(def.id) });
      }
    }
  }
  for (const path of NOT_IN_INVENTORY) if (!pages.has(path)) pages.set(path, { path, template: "hub", prerender: true });
  return [...pages.values()].sort((a, b) => (a.path < b.path ? -1 : 1));
}
