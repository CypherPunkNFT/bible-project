// What a search engine is told about each page: its title, description and one official address. Shared by the
// app (usePageHead, for crawlers that run the page) and the release step (scripts/seo/build.ts, which writes ready-made
// copies of the main pages for crawlers that do not). Pure strings in, strings out, so both sides give the same answer.
// In a translated language every fixed text below goes through the language's phrase list (translate), the same list
// the page translator swaps the page body from; the parts read off the page are already in that language.

export const SITE_NAME = "Bible Guide";
export const SITE_ORIGIN = "https://bibleguide.io";
/** The title in index.html and the one pages put back when they close. */
export const DEFAULT_TITLE = SITE_NAME;
export const HOME_TITLE = "Bible Guide: Read the Whole Bible Free, with Studies, an Atlas and Topics";
export const HOME_DESCRIPTION =
  "Bible Guide is a free Bible website: read the whole Bible in 160 free versions and 140 languages, with study guides, an atlas of every Bible place, 5,603 topics, apologetics, hymns and teachers.";

// The main pages, named the way people search for them. Every other page is named from its own heading.
export const ROUTE_TITLES: Record<string, string> = {
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
  "/life-events": "Bible Verses for Weddings, Babies, Baptisms and Graduations",
  "/sympathy": "Bible Verses for Sympathy Cards and Funerals",
  "/baby-names": "Biblical Baby Names: Meanings and Bible Stories",
  "/baby-names/boys": "Biblical Boy Names: Meanings and Bible Stories",
  "/baby-names/girls": "Biblical Girl Names: Meanings and Bible Stories",
  "/countdowns": "Advent and Lent Devotionals: Daily Bible Reading Plans",
  "/holy-days": "Holy Days Calendar: Easter, Lent, Advent, Pentecost and the Biblical Feasts",
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

export const SECTIONS: Record<string, string> = {
  study: "Study", people: "People", topics: "Topics", apologetics: "Apologetics", teachers: "Teachers",
  resources: "Resources", testimonies: "Testimonies", sources: "Sources", listen: "Listen", library: "Library",
};

// A person's ruler, prophet and apostle pages open with "<Name>. <one line>" as their first subheading ("大卫。…",
// "दाऊद। …" once translated). Each name is one whole line, "{n}" the person, so a language can put the name where it goes.
export const PERSON_ASPECTS: Record<string, string> = { rule: "{n}: the Reign", word: "{n}: the Prophet", mission: "{n}: the Mission" };
const SENTENCE_END = /\.\s|[。।۔]/;
// The description of a page with a name but nothing longer to quote.
const NAMED_DESCRIPTION = "{n}, on Bible Guide: the whole Bible free, with studies, an atlas and topics.";

export interface PageHead { title: string; description: string; canonical: string }
export interface PageShown { heading?: string; subheading?: string; paragraph?: string }
/** A language's wording for an English text of this file, or null when its phrase list has none. */
export type Translate = (english: string) => string | null;

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
// split and join, not replace: a name holding "$&" must come through as written.
const fill = (template: string, value: string) => template.split("{n}").join(value);

/** Up to about 155 characters, cut at a word. */
export function shorten(text: string, limit = 155): string {
  const flat = clean(text);
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit - 1);
  // Chinese has no spaces between words: it is cut at the limit.
  const space = cut.lastIndexOf(" ");
  return cut.slice(0, space < 0 ? cut.length : Math.max(space, limit / 2)).replace(/[\s,;:.–—\-，。、،।]+$/, "") + "…";
}

export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * The head for a page, from its address and what it shows: `heading` is the page's main heading as read (line breaks
 * become spaces), `subheading` its first h2, `paragraph` its first real paragraph. A page that names itself
 * (document.title) keeps its own name; that choice is the caller's (isUnnamed). `translate` is given in a translated
 * language: the fixed texts are looked up in it, and one it lacks stays English (a main page's name gives way to the
 * page's own heading instead, which is already in the language). Without it the head is English, as written here.
 */
export function pageHead(pathname: string, shown: PageShown, translate?: Translate): PageHead {
  const say = (english: string) => translate?.(english) ?? english;
  // A line with "{n}" in it: the language's wording only if it kept the place for the value.
  const sayLine = (english: string) => (translate?.(english) ?? "").includes("{n}") ? translate!(english)! : english;
  const path = normalizePath(pathname);
  const canonical = SITE_ORIGIN + (path === "/" ? "/" : path);
  if (path === "/") return { title: say(HOME_TITLE), description: say(HOME_DESCRIPTION), canonical };
  const heading = clean(shown.heading ?? "");
  const paragraph = clean(shown.paragraph ?? "");
  const segments = path.split("/").filter(Boolean);
  const route = ROUTE_TITLES[path];
  let name = route && (translate ? translate(route) ?? (heading || route) : route);
  const aspect = segments[0] === "people" && segments.length === 3 ? PERSON_ASPECTS[segments[2]] : undefined;
  const person = clean(shown.subheading ?? "").split(SENTENCE_END)[0].replace(/\.$/, "").trim();
  if (!name && aspect && person) {
    const line = sayLine(aspect);
    // Until the whole line is translated, the language's own words for "the Reign" follow the name.
    name = line === aspect && translate ? `${person}: ${say(aspect.replace("{n}: ", ""))}` : fill(line, person);
  }
  if (!name && segments[0] === "read" && segments.length === 4 && heading) name = `${heading} (${segments[1].toUpperCase()})`;
  if (!name && heading) {
    const section = SECTIONS[segments[0]] && say(SECTIONS[segments[0]]);
    name = section && segments.length > 1 && !heading.includes(section) ? `${heading} · ${section}` : heading;
  }
  const title = name ? `${name} · ${say(SITE_NAME)}` : say(DEFAULT_TITLE);
  // A language with no wording yet for the named line gets the site's own description in that language, not English.
  const named = name && !(translate && sayLine(NAMED_DESCRIPTION) === NAMED_DESCRIPTION) ? shorten(fill(sayLine(NAMED_DESCRIPTION), name)) : null;
  const description = aspect && person ? shorten(clean(shown.subheading ?? "")) : paragraph ? shorten(paragraph) : named ?? say(HOME_DESCRIPTION);
  return { title, description, canonical };
}

/** Titles a page may be showing when nothing has named it yet. */
export const isUnnamed = (title: string) => title === DEFAULT_TITLE || title === HOME_TITLE || title === "";
