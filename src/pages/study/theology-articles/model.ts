// The Theology section (/study/theology-articles): long-form articles on Christian doctrine, in the
// shape the creeds and hymns sections use — a landing that counts what is here, and one page per
// article. The prose lives in the article modules under articles/, never in the components, so the
// same words can be checked by theology.test.ts and read by an editor without opening React.
//
// Why the address is not /study/theology: that address is already the "Scripture & Theology" branch
// hub (src/pages/study/hub/StudyBranch.tsx). This section sits inside that branch's "God & Christian
// Faith" subject and keeps the branch page untouched. The card id in StudyResourceCards matches the
// slug, which is the convention src/pages/study/hub/collections.test.ts checks.
import { ARTICLES } from "./articles";

/** A section tone token from src/index.css (--history, --poetry, --prophets, --gospels, --acts, --epistles, --revelation). */
export type Tone = "history" | "poetry" | "prophets" | "gospels" | "acts" | "epistles" | "revelation";

/** Where the wording of a quotation was checked.
 *  `corpus`  — against this project's own copy of the edition named below;
 *  `edition` — against the published edition at the recorded address;
 *  `none`    — the work is still in copyright, so it is described and cited, never reproduced. */
export type Checked = "corpus" | "edition" | "none";

export interface Source {
  id: string;
  /** The work itself, as its author named it. */
  work: string;
  author: string;
  /** The translation or edition these words were read in. */
  edition: string;
  /** Where a reader can open it. */
  url: string;
  licence: string;
  checked: Checked;
  /** A page on this site that holds the text, where one exists. */
  onSite?: string;
}

/** One paragraph, heading or set piece of an article. */
export type Body =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  /** Scripture in the Berean Standard Bible. `book` is a USFM code in data/plain/bsb/, `chapter` the
   *  bare chapter number and `verses` consecutive verse numbers; theology.test.ts rebuilds `text`
   *  from that data, so a drifted quotation fails the suite instead of reaching a reader. */
  | { kind: "scripture"; book: string; chapter: number; verses: number[]; reference: string; text: string; note?: string }
  /** A source's own words. Only a source whose `checked` is not `none` may be quoted. */
  | { kind: "quote"; source: string; locator: string; text: string; speaker?: string }
  /** A source still in copyright: its argument in our words, with the place to read it. */
  | { kind: "summary"; source: string; locator: string; text: string }
  | { kind: "list"; label: string; items: { term: string; text: string }[] }
  /** What an analogy cannot do, said next to the analogy itself. */
  | { kind: "caution"; title: string; text: string };

export interface ArticleSection {
  id: string;
  kicker: string;
  title: string;
  lede: string;
  body: Body[];
}

export interface Article {
  id: string;
  title: string;
  /** The italic line under the title, as the hymns and creeds pages use. */
  kicker: string;
  /** The question the article sets out to answer. */
  question: string;
  summary: string;
  tone: Tone;
  minutes: number;
  sections: ArticleSection[];
  sourceIds: string[];
  related: { to: string; label: string; note: string }[];
}

export const SECTION_BASE = "/study/theology-articles";
export const articleHref = (id: string) => `${SECTION_BASE}/${id}`;

/** A Map, not an object: an address like /study/theology-articles/constructor must read as missing
 *  rather than as a member of Object's prototype. */
const byId = new Map(ARTICLES.map((article) => [article.id, article]));
export const findArticle = (id: string): Article | undefined => byId.get(id);

export { ARTICLES };

/** The reader, opened at the quoted words in the Berean Standard Bible.
 *  This deliberately does not use studyRefLink (src/lib/study.ts), which opens whichever version the
 *  reader last had open and falls back to the KJV: these articles quote the Berean text, and a link
 *  that lands on different wording than the page shows would be worse than no link. `hl` takes verse
 *  numbers only (src/lib/refs.ts), so the chapter is in the path and never in the highlight. */
export function readerHref(book: string, chapter: number, verses: number[]): string {
  const first = verses[0];
  const last = verses[verses.length - 1];
  return `/read/bsb/${book}/${chapter}?hl=${first}${last > first ? `-${last}` : ""}`;
}

export const SOURCES: Source[] = [
  {
    id: "bsb",
    work: "The Holy Bible, Berean Standard Bible",
    author: "Bible Hub",
    edition: "Berean Standard Bible, 2023",
    url: "https://berean.bible/",
    licence: "Public domain, dedicated 2023",
    checked: "corpus",
    onSite: "/read/bsb/JHN/1",
  },
  {
    id: "athanasian-creed",
    work: "The Athanasian Creed (Quicunque vult)",
    author: "Anonymous, Latin, 5th–6th century",
    edition: "The received English text, as this site holds it",
    url: "https://www.ccel.org/ccel/schaff/creeds1",
    licence: "Public domain",
    checked: "corpus",
    onSite: "/study/creeds/athanasian-creed-800",
  },
  {
    id: "nicene-creed",
    work: "The Niceno-Constantinopolitan Creed, 381",
    author: "The Second Ecumenical Council, Constantinople",
    edition: "The received English text, as this site holds it",
    url: "https://www.ccel.org/ccel/schaff/creeds2",
    licence: "Public domain",
    checked: "corpus",
    onSite: "/study/creeds/nicene-creed-381",
  },
  {
    id: "schaff-creeds",
    work: "The Creeds of Christendom, with a History and Critical Notes",
    author: "Philip Schaff, 1877",
    edition: "Volumes 1 and 2, as this site holds them beside the creeds themselves",
    url: "https://www.ccel.org/ccel/schaff/creeds2",
    licence: "Public domain",
    checked: "corpus",
    onSite: "/study/creeds/nicene-creed-381-schaff",
  },
  {
    id: "augustine-trinity",
    work: "On the Trinity (De Trinitate)",
    author: "Augustine of Hippo, c. 400–428",
    edition: "Translated by Arthur West Haddan, Nicene and Post-Nicene Fathers, first series, volume 3",
    url: "https://www.ccel.org/ccel/schaff/npnf103",
    licence: "Public domain",
    checked: "corpus",
  },
  {
    id: "aquinas-summa",
    work: "Summa Theologiae, First Part",
    author: "Thomas Aquinas, 1265–1274",
    edition: "Translated by the Fathers of the English Dominican Province, 1920, second edition",
    url: "https://www.newadvent.org/summa/1027.htm",
    licence: "Public domain",
    checked: "edition",
  },
  {
    id: "basil-spirit",
    work: "On the Holy Spirit (De Spiritu Sancto), and Letter 236",
    author: "Basil of Caesarea, c. 375",
    edition: "Translated by Blomfield Jackson, Nicene and Post-Nicene Fathers, second series, volume 8",
    url: "https://www.ccel.org/ccel/schaff/npnf208",
    licence: "Public domain",
    checked: "corpus",
  },
  {
    id: "nyssa-ablabius",
    work: "On “Not Three Gods”, to Ablabius",
    author: "Gregory of Nyssa, c. 380",
    edition: "Translated by H. A. Wilson, Nicene and Post-Nicene Fathers, second series, volume 5",
    url: "https://www.ccel.org/ccel/schaff/npnf205",
    licence: "Public domain",
    checked: "corpus",
  },
  {
    id: "nazianzus-oration-31",
    work: "Oration 31, the Fifth Theological Oration: On the Holy Spirit",
    author: "Gregory of Nazianzus, 380",
    edition: "Translated by Charles Gordon Browne and James Edward Swallow, Nicene and Post-Nicene Fathers, second series, volume 7",
    url: "https://www.ccel.org/ccel/schaff/npnf207",
    licence: "Public domain",
    checked: "corpus",
  },
  {
    id: "socrates-history",
    work: "The Ecclesiastical History",
    author: "Socrates Scholasticus, c. 440",
    edition: "Nicene and Post-Nicene Fathers, second series, volume 2",
    url: "https://www.ccel.org/ccel/schaff/npnf202",
    licence: "Public domain",
    checked: "corpus",
  },
  {
    id: "lewis-mere-christianity",
    work: "Mere Christianity",
    author: "C. S. Lewis, 1952 — chiefly Book IV, “Beyond Personality”",
    edition: "Not reproduced here: the book is still in copyright, so it is described and cited",
    url: "https://www.harpercollins.com/products/mere-christianity-c-s-lewis",
    licence: "In copyright — described, never quoted",
    checked: "none",
  },
];

const sourcesById = new Map(SOURCES.map((source) => [source.id, source]));
export const findSource = (id: string): Source | undefined => sourcesById.get(id);

/** The landing's figures, counted from the articles themselves rather than written by hand. */
export function sectionFigures(articles: readonly Article[]) {
  const blocks = articles.flatMap((article) => article.sections.flatMap((section) => section.body));
  return {
    articles: articles.length,
    parts: articles.reduce((total, article) => total + article.sections.length, 0),
    scripture: blocks.filter((block) => block.kind === "scripture").length,
    sources: new Set(articles.flatMap((article) => article.sourceIds)).size,
    minutes: articles.reduce((total, article) => total + article.minutes, 0),
  };
}
