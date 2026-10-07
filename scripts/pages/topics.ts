// Topics area of the Pages/ documentation (scripts/export-pages.ts): one CONTENT.md for the Topics home, one per section
// and one per family card, generated from data/topics/index.json and TOPIC_SECTIONS, the same data the pages read.
// Card logic adapted from scripts/export-catalog.ts (the superlist extractor); deterministic, no timestamps.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatRange } from "../../src/lib/refs";
import { FAMILY_EYEBROW, FAMILY_STUDY, TOPIC_SECTIONS } from "../../src/lib/topic-style";
import { categoryUrl, pointsAndPassages, topicCount, topicUrl } from "../../src/lib/topics";
import type { TopicCategory, TopicIndex, TopicSubcategory } from "../../src/lib/topics";
import type { Catalog } from "../../src/lib/types";
import { slugify, type Extractor, type PageContent } from "./types";

const SITE = "https://bibleproject.io";
/** Groups with more topics than this list them A to Z on the site (LARGE_GROUP in src/pages/TopicCategoryPage.tsx). */
const LARGE_GROUP = 48;
const SOURCE_NAMES: Record<string, string> = { t: "Torrey", n: "Nave's", e: "Easton's" };

const website = path.resolve(import.meta.dirname, "..", "..");
const readJson = async <T>(relative: string): Promise<T> => JSON.parse(await readFile(path.join(website, relative), "utf8")) as T;

interface Section { id: string; title: string; description: string; categories: string[] }
interface Placed { section: Section; family: TopicCategory; number: number }
interface Context { index: TopicIndex; catalog: Catalog; placed: Placed[]; popular: string[] }

const number = (n: number) => n.toLocaleString("en-US");
const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const link = (address: string) => `[${address}](${SITE}${address})`;
const sortKey = (title: string) => title.replace(/^The /, "").toLowerCase();
const plural = (n: number, word: string) => `${number(n)} ${n === 1 ? word : `${word}s`}`;

function passagesOf(index: TopicIndex, topics: string[]): number {
  return topics.reduce((n, id) => n + (index.topics[id]?.refs ?? 0), 0);
}

function sourcesOf(code: string): string {
  const names = [...code].map((letter) => SOURCE_NAMES[letter]).filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : "none (no points, passages or article)";
}

/** The order the site lists a group's topics in: most-cited first, or A to Z past LARGE_GROUP topics. */
function orderedTopics(index: TopicIndex, group: TopicSubcategory): string[] {
  const title = (id: string) => index.topics[id]?.title ?? id;
  return group.topics.length > LARGE_GROUP
    ? [...group.topics].sort((a, b) => sortKey(title(a)).localeCompare(sortKey(title(b))))
    : [...group.topics].sort((a, b) => (index.topics[b]?.refs ?? 0) - (index.topics[a]?.refs ?? 0));
}

const sectionDir = (section: Section) => `Topics/${slugify(section.title)}`;
const cardDir = ({ section, family }: Placed) => `${sectionDir(section)}/${slugify(family.title)}`;

/** Families in section order, numbered as the Topics home numbers its cards. */
function placeFamilies(index: TopicIndex): Placed[] {
  const byId = new Map(index.categories.map((family) => [family.id, family]));
  const placed: Placed[] = [];
  for (const section of TOPIC_SECTIONS) {
    for (const id of section.categories) {
      const family = byId.get(id);
      if (!family) throw new Error(`Topics: section "${section.title}" names card "${id}", which data/topics/index.json does not have`);
      placed.push({ section, family, number: placed.length + 1 });
    }
  }
  const loose = index.categories.filter((family) => !placed.some((p) => p.family.id === family.id)).map((family) => family.id);
  if (loose.length) throw new Error(`Topics: cards in no section (they would show under "More topics"): ${loose.join(", ")}`);
  return placed;
}

/** The popular-topic links on the Topics home, read from the page's own source so this file cannot drift from it. */
async function popularTopics(index: TopicIndex): Promise<string[]> {
  const source = await readFile(path.join(website, "src/pages/topics/TopicsHome.tsx"), "utf8");
  const match = /const POPULAR = \[([^\]]*)\]/.exec(source);
  if (!match) throw new Error("Topics: could not find the POPULAR list in src/pages/topics/TopicsHome.tsx (expected `const POPULAR = [...]`)");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((id) => index.topics[id]);
}

function cardRow(ctx: Context, placed: Placed, relative: string): string {
  const { family, number: n } = placed;
  const topics = family.subcategories.flatMap((group) => group.topics);
  return `| ${String(n).padStart(2, "0")} | [${cell(family.title)}](${relative}) | ${cell(FAMILY_EYEBROW[family.id] ?? "Topics")} | ${family.subcategories.length} | ${number(topics.length)} | ${number(passagesOf(ctx.index, topics))} | ${link(categoryUrl(family.id))} |`;
}

const CARD_TABLE_HEAD = ["| No. | Card | Line above its name | Groups | Topics | Passages | Address |", "|---:|---|---|---:|---:|---:|---|"];

function homePage(ctx: Context): PageContent {
  const { index, catalog, placed } = ctx;
  const topics = Object.values(index.topics);
  const groups = index.categories.reduce((n, family) => n + family.subcategories.length, 0);
  const lines = [
    `Address: ${link("/topics")}. Kicker "Scripture, subject by subject", heading "Every subject. Every verse."`,
    "",
    `${number(topics.length)} topics in ${index.categories.length} families and ${groups} groups, each with the passages that speak to it.`,
    "",
    "## Headline figures",
    "",
    "| Topics | Passages cited | Families (cards) | Groups | Sections |",
    "|---:|---:|---:|---:|---:|",
    `| ${number(topics.length)} | ${number(topics.reduce((n, t) => n + t.refs, 0))} | ${index.categories.length} | ${groups} | ${TOPIC_SECTIONS.length} |`,
    "",
    "Where the topics come from (letters in data/topics/index.json: t = Torrey, n = Nave's, e = Easton's):",
    "",
    "| Sources | Topics |",
    "|---|---:|",
    ...Object.entries(topics.reduce<Record<string, number>>((counts, t) => ({ ...counts, [t.s]: (counts[t.s] ?? 0) + 1 }), {}))
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([code, count]) => `| ${sourcesOf(code)} | ${number(count)} |`),
    "",
    "## Popular topics (links under the finder)",
    "",
    ...ctx.popular.map((id) => `- ${cell(index.topics[id].title)}: ${link(topicUrl(id))}`),
    "",
    "## Sections",
    "",
  ];
  TOPIC_SECTIONS.forEach((section, s) => {
    const cards = placed.filter((p) => p.section.id === section.id);
    const total = cards.reduce((n, p) => n + topicCount(p.family), 0);
    lines.push(
      `### ${String(s + 1).padStart(2, "0")} ${section.title}`,
      "",
      `${section.description} ${cards.length} cards, ${number(total)} topics. Jump link: ${link(`/topics#section-${section.id}`)}. Notes: [${slugify(section.title)}/](${slugify(section.title)}/README.md).`,
      "",
      ...CARD_TABLE_HEAD,
      ...cards.map((p) => cardRow(ctx, p, `${slugify(section.title)}/${slugify(p.family.title)}/CONTENT.md`)),
      "",
    );
  });
  if (index.readings?.length) {
    lines.push("## Great passages", "", `${index.readings.length} readings chosen by Orville J. Nave ("Select readings" in Nave's Topical Bible). The page shows each reading's first three passages.`, "");
    index.readings.forEach((reading, i) => {
      const spans = reading.refs.map(([start, end]) => formatRange(catalog, start, end)).join("; ");
      lines.push(`${i + 1}. **${reading.title}**: ${spans}`);
    });
    lines.push("");
  }
  lines.push("## Credit line at the foot of the page", "", `Source line in the data: ${index.source}.`);
  return { dir: "Topics", title: "Topics", markdown: lines.join("\n") };
}

function sectionPage(ctx: Context, section: Section, s: number): PageContent {
  const cards = ctx.placed.filter((p) => p.section.id === section.id);
  const topics = cards.flatMap((p) => p.family.subcategories.flatMap((group) => group.topics));
  const markdown = [
    `Section ${s + 1} of ${TOPIC_SECTIONS.length} on the Topics home (a row of cards there, not a page of its own): ${link(`/topics#section-${section.id}`)}.`,
    "",
    section.description,
    "",
    `${cards.length} cards · ${number(topics.length)} topics · ${number(passagesOf(ctx.index, topics))} passages.`,
    "",
    ...CARD_TABLE_HEAD,
    ...cards.map((p) => cardRow(ctx, p, `${slugify(p.family.title)}/CONTENT.md`)),
  ].join("\n");
  return { dir: sectionDir(section), title: section.title, markdown };
}

function groupBlock(ctx: Context, family: TopicCategory, group: TopicSubcategory): string[] {
  const { index } = ctx;
  const large = group.topics.length > LARGE_GROUP;
  return [
    `### ${group.title}`,
    "",
    `${group.description}`,
    "",
    `${plural(group.topics.length, "topic")} · ${plural(passagesOf(index, group.topics), "passage")} · ${link(categoryUrl(family.id, group.id))} · listed ${large ? `A to Z with a filter and a letter bar (over ${LARGE_GROUP} topics)` : "most-cited first"}.`,
    "",
    "| Topic | Points and passages | Sources | Address |",
    "|---|---|---|---|",
    ...orderedTopics(index, group).map((id) => {
      const topic = index.topics[id];
      if (!topic) return `| ${cell(id)} | missing from the index | none | ${link(topicUrl(id))} |`;
      return `| ${cell(topic.title)} | ${pointsAndPassages(topic.points, topic.refs)} | ${sourcesOf(topic.s)} | ${link(topicUrl(id))} |`;
    }),
    "",
  ];
}

function cardPage(ctx: Context, placed: Placed): PageContent {
  const { family, section, number: n } = placed;
  const topics = family.subcategories.flatMap((group) => group.topics);
  const study = FAMILY_STUDY[family.id] ?? [];
  const lines = [
    `Card ${String(n).padStart(2, "0")} of ${ctx.placed.length}, in the section "${section.title}". Address: ${link(categoryUrl(family.id))}.`,
    "",
    `Line above its name: "${FAMILY_EYEBROW[family.id] ?? "Topics"}".`,
    "",
    `${family.description}`,
    "",
    `${plural(family.subcategories.length, "group")} · ${plural(topics.length, "topic")} · ${plural(passagesOf(ctx.index, topics), "passage")}.`,
    "",
    "## Studied in depth (links on the card's page)",
    "",
    ...(study.length ? study.map((s) => `- ${s.label}: ${link(s.to)}`) : ["None."]),
    "",
    "## Groups",
    "",
    "| Group | Line | Topics | Passages |",
    "|---|---|---:|---:|",
    ...family.subcategories.map((group) => `| ${cell(group.title)} | ${cell(group.description)} | ${number(group.topics.length)} | ${number(passagesOf(ctx.index, group.topics))} |`),
    "",
    "## Every topic, group by group",
    "",
    ...family.subcategories.flatMap((group) => groupBlock(ctx, family, group)),
  ];
  return { dir: cardDir(placed), title: family.title, markdown: lines.join("\n") };
}

export const extract: Extractor = async () => {
  const index = await readJson<TopicIndex>("data/topics/index.json");
  const catalog = await readJson<Catalog>("data/catalog.json");
  const placed = placeFamilies(index);
  const ctx: Context = { index, catalog, placed, popular: await popularTopics(index) };
  return [
    homePage(ctx),
    ...TOPIC_SECTIONS.map((section, s) => sectionPage(ctx, section, s)),
    ...placed.map((p) => cardPage(ctx, p)),
  ];
};
