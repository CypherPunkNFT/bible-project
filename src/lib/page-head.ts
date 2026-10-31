// What a search engine is told about each page: its title, description and one official address. Shared by the
// app (usePageHead, for crawlers that run the page) and the release step (scripts/seo/build.ts, which writes ready-made
// copies of the main pages for crawlers that do not). Pure strings in, strings out, so both sides give the same answer.

export const SITE_NAME = "Bible Guide";
export const SITE_ORIGIN = "https://bibleguide.io";
/** The title in index.html and the one pages put back when they close. */
export const DEFAULT_TITLE = SITE_NAME;
export const HOME_TITLE = "Bible Guide: Read the Whole Bible Free, with Studies, an Atlas and Topics";
export const HOME_DESCRIPTION =
  "Bible Guide is a free Bible website: read the whole Bible in 160 free versions and 140 languages, with study guides, an atlas of every Bible place, 5,603 topics, apologetics, hymns and teachers.";

// The main pages, named the way people search for them. Every other page is named from its own heading.
const ROUTE_TITLES: Record<string, string> = {
  "/bible": "The Bible: Read Every Free Version",
  "/read": "Read the Bible Online",
  "/listen": "Listen to the Bible",
  "/study": "Bible Study Guides",
  "/study/atlas": "Bible Atlas: Maps of Every Bible Place",
  "/study/atlas/map": "Bible Map",
  "/study/atlas/journeys": "Bible Journeys and Paul's Missionary Journeys",
  "/study/atlas/cities": "Ancient Cities of the Bible",
  "/study/atlas/gospels": "Gospel Events Map",
  "/study/atlas/early-church": "The Early Church Map",
  "/study/atlas/catholic-orthodox": "The Apostolic Churches Map",
  "/study/atlas/reformation": "The Reformation Map",
  "/study/atlas/missions": "Global Missions Map",
  "/study/people": "People of the Bible and Their Genealogies",
  "/study/rulers": "Kings and Rulers of the Bible",
  "/study/apostles": "The Apostles and the Early Church",
  "/study/prophets": "The Prophets of the Bible",
  "/study/gospels": "Jesus and the Gospels",
  "/study/harmony": "Harmony of the Gospels",
  "/study/miracles": "Miracles of the Bible",
  "/study/letters": "The New Testament Letters and Their Message",
  "/study/names": "Names and Descriptions of God",
  "/study/versions": "Bible Versions and Languages",
  "/study/structure": "The Shape of the Bible",
  "/study/connections": "Bible Cross-References",
  "/study/hymns": "Hymns: The Faith, Sung",
  "/study/creeds": "Christian Creeds and Confessions",
  "/study/manuscripts": "Bible Manuscripts",
  "/study/museum-archaeology": "Biblical Archaeology in the World's Museums",
  "/study/theology": "Christian Theology",
  "/study/questions": "Bible Quiz Questions",
  "/study/questions/children": "Bible Questions for Children",
  "/topics": "Bible Topics: Every Subject, Every Verse",
  "/apologetics": "Christian Apologetics: A Reason for the Hope",
  "/teachers": "Bible Teachers: Preachers, Authors and Scholars",
  "/teachers/preachers-and-authors": "Preachers and Christian Authors",
  "/teachers/scholars": "Bible Scholars",
  "/resources": "Free Bible Study Resources",
  "/testimonies": "Christian Testimonies",
  "/contact": "Contact",
  "/privacy": "Privacy Policy",
  "/support": "Support",
  "/search": "Search the Bible",
  "/search/meaning": "Search the Bible by Meaning",
  "/sources": "Sources and Bible Versions",
  "/versions": "Sources and Bible Versions",
  "/library": "Christian Library",
};

const SECTIONS: Record<string, string> = {
  study: "Study", people: "People", topics: "Topics", apologetics: "Apologetics", teachers: "Teachers",
  resources: "Resources", testimonies: "Testimonies", sources: "Sources", listen: "Listen", library: "Library",
};

// A person's ruler, prophet and apostle pages open with "<Name>. <one line>" as their first subheading.
const PERSON_ASPECTS: Record<string, string> = { rule: "the Reign", word: "the Prophet", mission: "the Mission" };

export interface PageHead { title: string; description: string; canonical: string }
export interface PageShown { heading?: string; subheading?: string; paragraph?: string }

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

/** Up to about 155 characters, cut at a word. */
export function shorten(text: string, limit = 155): string {
  const flat = clean(text);
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), limit / 2)).replace(/[\s,;:.–—-]+$/, "") + "…";
}

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * The head for a page, from its address and what it shows: `heading` is the page's main heading as read (line breaks
 * become spaces), `subheading` its first h2, `paragraph` its first real paragraph. A page that names itself
 * (document.title) keeps its own name; that choice is the caller's (isUnnamed).
 */
export function pageHead(pathname: string, shown: PageShown): PageHead {
  const path = normalizePath(pathname);
  const canonical = SITE_ORIGIN + (path === "/" ? "/" : path);
  if (path === "/") return { title: HOME_TITLE, description: HOME_DESCRIPTION, canonical };
  const heading = clean(shown.heading ?? "");
  const paragraph = clean(shown.paragraph ?? "");
  const segments = path.split("/").filter(Boolean);
  let name = ROUTE_TITLES[path];
  const aspect = segments[0] === "people" && segments.length === 3 ? PERSON_ASPECTS[segments[2]] : undefined;
  const person = clean(shown.subheading ?? "").split(". ")[0].replace(/\.$/, "");
  if (!name && aspect && person) name = `${person}: ${aspect}`;
  if (!name && segments[0] === "read" && segments.length === 4 && heading) name = `${heading} (${segments[1].toUpperCase()})`;
  if (!name && heading) {
    const section = SECTIONS[segments[0]];
    name = section && segments.length > 1 && !heading.includes(section) ? `${heading} · ${section}` : heading;
  }
  const title = name ? `${name} · ${SITE_NAME}` : DEFAULT_TITLE;
  const description = aspect && person ? shorten(clean(shown.subheading ?? "")) : paragraph ? shorten(paragraph) : name ? shorten(`${name}, on ${SITE_NAME}: the whole Bible free, with studies, an atlas and topics.`) : HOME_DESCRIPTION;
  return { title, description, canonical };
}

/** Titles a page may be showing when nothing has named it yet. */
export const isUnnamed = (title: string) => title === DEFAULT_TITLE || title === HOME_TITLE || title === "";
