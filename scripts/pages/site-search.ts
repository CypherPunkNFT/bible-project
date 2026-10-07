// CONTENT for the Site page "Search": /search (one box for studies, verses, places, topics and exact words) and
// /search/meaning (what meaning search is, and turning it on). The meaning pack's manifest is read from ../MeaningPack/site.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { studyById, STUDIES } from "../../src/data/apologetics-library";
import { AP_BASE } from "../../src/lib/apologetics-links";
import { searchStudies } from "../../src/lib/apologetics-search";
import { TOPIC_SECTIONS } from "../../src/lib/topic-style";
import { categoryUrl, topicCount, type TopicIndex } from "../../src/lib/topics";
import { blocks, link, loadCatalog, n, readJson, table, WEBSITE } from "./study-lib";
import { fill, inlineTables, looseConstant, readableText, wordingList } from "./site-source";
import type { PageContent } from "./types";

const PAGE = "src/pages/SearchPage.tsx";
const LANDING = "src/components/search/SearchLanding.tsx";
const MEANING = "src/pages/MeaningSearchPage.tsx";
const PACK = path.resolve(WEBSITE, "..", "MeaningPack", "site", "meaning.json");

interface Pack { version: string; bytes: number; model: string; dimensions: number; counts: { studies: number; bibleVerses: number }; demo: { question: string; studies: string[] }[] }
interface Kind { title: string; text: string; to: string }
const MB = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;
const bullets = (lines: string[]) => lines.map((line) => `- ${line}`).join("\n");

async function readPack(): Promise<Pack | null> {
  try {
    return JSON.parse(await readFile(PACK, "utf8")) as Pack;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(`Site content: could not read the meaning pack manifest ${PACK} (${(error as Error).message})`);
  }
}

function topicBrowser(index: TopicIndex): string {
  const byId = new Map(index.categories.map((category) => [category.id, category]));
  const placed = new Set(TOPIC_SECTIONS.flatMap((section) => section.categories));
  const rows = [...TOPIC_SECTIONS.map((section) => ({ title: section.title, ids: section.categories })), { title: "More topics", ids: index.categories.filter((c) => !placed.has(c.id)).map((c) => c.id) }]
    .filter((row) => row.ids.some((id) => byId.has(id)));
  return blocks(`**Or browse by topic** · "${n(Object.keys(index.topics).length)} topics in ${index.categories.length} families, each with the passages that speak to it." The Topics page's own section rows, card for card:`,
    table(["Section", "Families (topics in each)"], rows.map((row) => [row.title, row.ids.flatMap((id) => byId.get(id) ?? []).map((c) => `[${c.title}](https://bibleproject.io${categoryUrl(c.id)}) (${topicCount(c)})`).join(" · ")])));
}

async function landing(versions: number, pack: Pack | null, index: TopicIndex): Promise<string> {
  const examples = await looseConstant<string[]>(LANDING, "EXAMPLES");
  const kinds = await looseConstant<Kind[]>(LANDING, "kinds", "SearchLanding");
  const card = (await readableText(LANDING, "MeaningCard")).map((line) => (line.startsWith("Update / Turn on") ? `Button: "Turn on · ${pack ? MB(pack.bytes) : "…"} once" ("Update" when a newer pack is ready)` : line));
  return blocks("## Before a search",
    `**Try asking** (each runs at a click): ${examples.map((example) => `"${example}"`).join(" · ")}`,
    `**Meaning search card** (hidden on devices that cannot run it; its wording changes as it is turned on, downloads and is ready):\n\n${bullets(card)}`,
    "**What you can search**",
    table(["Kind", "Text", "Opens"], kinds.map((kind) => [kind.title, fill(kind.text, versions), link(kind.to.replace(/^…/, AP_BASE))])),
    topicBrowser(index));
}

async function results(): Promise<string> {
  const files: [string, string][] = [["src/components/search/WordTabs.tsx", "Your words (a search of several words)"], ["src/components/search/SearchSections.tsx", "Topics, Studies, Verses about this, Places"], ["src/components/search/WordDistribution.tsx", "Exact words: the chart"]];
  const parts = await Promise.all(files.map(async ([file, title]) => blocks(`### ${title}`, await wordingList(file))));
  return blocks("## After a search",
    "Results come in this order: \"Your words\" tabs (one per word that counts, plus all words), Topics, Studies (by meaning for questions of three words or more when meaning search is on, otherwise by words), \"Verses about this\" (by meaning, World English Bible), Places on the atlas, then Exact words in the chosen version: a chart of where the verses fall, book by book, and the verses 100 at a time. Shared links keep the search: ?q= the words, in= the version, whole= whole words, w= one picked word.",
    ...parts);
}

async function meaningPage(pack: Pack | null): Promise<string> {
  const [steps, questions] = await inlineTables(MEANING, "MeaningSearchPage");
  const status = await readableText(MEANING, "Status");
  const demo = (pack?.demo ?? []).map((row) => [row.question, searchStudies(STUDIES, row.question).hits[0]?.study.title ?? "No study uses those words.", studyById(row.studies[0])?.title ?? row.studies[0]]);
  const page = (await readableText(MEANING, "MeaningSearchPage")).filter((line) => !questions?.some((q) => line.includes(q[0])) && !steps?.some((s) => line.includes(s[0])));
  return blocks(`## Meaning search (${link("/search/meaning")})`,
    pack ? `The pack this page offers: version ${pack.version}, ${MB(pack.bytes)}, model ${pack.model} (${pack.dimensions} numbers per fingerprint), covering ${pack.counts.studies} studies and ${n(pack.counts.bibleVerses)} verses of the World English Bible.` : "The meaning pack manifest (../MeaningPack/site/meaning.json) was not found, so its size and demo are not listed.",
    bullets(page.map((line) => {
      if (!pack) return line;
      if (line === "… / About 85 MB, once. Wi-Fi recommended.") return `${MB(pack.bytes)}, once. Wi-Fi recommended.`;
      return line.startsWith("Now:") ? line.replace("the … studies", `the ${pack.counts.studies} studies`).replace("all … / 31,098", `all ${n(pack.counts.bibleVerses)}`) : line;
    })),
    "**See the difference** (worked out in advance; nothing to download)",
    table(["Question", "By words", "By meaning"], demo),
    "**How it works**",
    table(["Step", "Text"], steps ?? []),
    "**Questions**",
    table(["Question", "Answer"], (questions ?? []).map(([q, a]) => [q, pack ? fill(a, MB(pack.bytes)) : a])),
    `**The box at the top** changes with the device: ${status.map((line) => `"${line}"`).join(" · ")}`);
}

export async function searchPage(): Promise<PageContent> {
  const [catalog, pack, index] = await Promise.all([loadCatalog(), readPack(), readJson<TopicIndex>("data/topics/index.json")]);
  const form = await readableText(PAGE, "SearchPage");
  return { dir: "Site/search", title: "Search", markdown: blocks(
    `**Addresses:** ${link("/search")} (the magnifying glass at the right of the header) · ${link("/search/meaning")}`,
    "## Heading and the search box",
    bullets(form.filter((line) => !line.startsWith("Reading…") && !line.startsWith("in …") && !line.startsWith("Show more"))),
    `The version list holds all ${catalog.translations.length} versions ("KJV — King James Version" and so on); it starts on the version this browser last read, else the KJV.`,
    await landing(catalog.translations.length, pack, index),
    await results(),
    await meaningPage(pack),
  ) };
}
