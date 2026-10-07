// CONTENT for the Site page "Sources & versions" (/sources and /versions show the same page): the source directory
// (SourceDirectory.tsx, CorpusDashboard.tsx) from public/content/sources/directory.json, the file the page itself
// fetches, then the versions half (site-versions.ts). 16,000+ bibliography records are summarised, not listed.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Directory, SourceEntry } from "../../src/components/sources/types";
import { blocks, link, loadCatalog, n, table, WEBSITE } from "./study-lib";
import { byTag, findAll, first, jsxRoots, type JsxNode } from "./study-source";
import { inlineTables, looseConstant, readableLines, readableText } from "./site-source";
import { versionsPart } from "./site-versions";
import type { PageContent } from "./types";

const FILE = "src/components/SourceDirectory.tsx";
const DASHBOARD = "src/components/sources/CorpusDashboard.tsx";
const DIRECTORY = "public/content/sources/directory.json";
const REPO = "https://github.com/CypherPunkNFT/bible-project/blob/main/";
const bullets = (lines: string[]) => lines.map((line) => `- ${line}`).join("\n");
const counted = (values: string[], top = Infinity) => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en")).slice(0, top);
};

async function readDirectory(): Promise<Directory | null> {
  try {
    return JSON.parse(await readFile(path.join(WEBSITE, ...DIRECTORY.split("/")), "utf8")) as Directory;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(`Site content: could not read ${DIRECTORY} (${(error as Error).message})`);
  }
}

/** The text of one <section id=…> of the directory, headings in bold, without lines the data tables replace. */
const sectionText = (roots: JsxNode[], id: string) => bullets(readableLines([first(roots, (node) => node.attrs.id === id)]).filter((line) => !/^…|^\*\*…/.test(line)));

function collections(directory: Directory): string {
  const rows = directory.collections.map((collection, i) => {
    const entries = directory.entries.filter((entry) => entry.categories.includes(collection.id));
    const authors = counted(entries.map((entry) => entry.author || "Author not recorded"));
    return [i < 8 ? `Collection ${String(i + 1).padStart(2, "0")}` : "Reconciliation queue", collection.label, collection.definition, n(entries.length), n(entries.filter((entry) => entry.held).length), n(authors.length),
      authors.slice(0, 5).map(([name, count]) => `${name} (${n(count)})`).join(" · ")];
  });
  return table(["Card", "Collection", "Definition", "Records", "Acquired files", "Author groups", "Largest author groups"], rows);
}

function corpus(directory: Directory): string {
  const c = directory.corpus;
  const percent = (part: number, whole: number) => `${((100 * part) / whole).toFixed(1)}%`;
  const sources = [...c.sources].sort((a, b) => b.bytes - a.bytes);
  return blocks(`Measured dates printed on the page: holdings ${c.measured_at}, bibliography ${c.bibliographyUpdatedAt} ("Dated snapshots, not live counters").`,
    table(["Figure", "Value", "Note"], [["Library files", n(c.files), "Original-source tree, including metadata"], ["Library storage", `${(c.bytes / 1e9).toFixed(2)} GB`, "Separate from Scripture and search storage"],
      ["Searchable passages", n(c.coverage.counts.chunks), "From the dated local search snapshot"], ["Acquired files verified", n(c.verifiedFiles), "Files matched to bibliography evidence"],
      ["Embedding coverage", percent(c.embedding.indexed, c.embedding.total), `${n(c.embedding.indexed)} / ${n(c.embedding.total)} passages; worker reported "${c.embedding.state}" at ${c.embedding.updated_at}`],
      ["Search coverage", `${n(c.coverage.counts.documents)} documents`, `${n(c.coverage.counts.verses)} verse records; ${c.coverage.editions} editions in ${c.coverage.languages} languages; snapshot built ${c.coverage.built_at}`],
      ["Incomplete attribution", n(c.incompleteIdentity), "Acquired records still missing a full title or author"]]),
    `**Source holdings** (share of library bytes; the page shows the top five, then "View all ${sources.length} source folders"):`,
    table(["Source folder", "Files", "MB", "Share"], sources.map((s) => [s.name, n(s.files), (s.bytes / 1e6).toFixed(1), percent(s.bytes, c.bytes)])),
    `**Formats & search coverage:** ${Object.entries(c.formats).sort((a, b) => b[1] - a[1]).map(([format, count]) => `${format.replace(/^\./, "").toUpperCase()} ${n(count)}`).join(" · ")}`);
}

function bibliography(entries: SourceEntry[]): string {
  return blocks(`${n(entries.length)} records in all: ${counted(entries.map((e) => e.status)).map(([status, count]) => `${status} ${n(count)}`).join(" · ")}. Twelve per page; each record shows its kind, status, title, author, role and where it was acquired or listed.`,
    `Most common kinds: ${counted(entries.map((e) => e.kind), 12).map(([kind, count]) => `${kind} ${n(count)}`).join(" · ")}.`,
    `Records with no author recorded: ${n(entries.filter((e) => !e.author).length)}. Records with no acquisition link: ${n(entries.filter((e) => !e.links.length).length)}.`);
}

async function directoryPart(directory: Directory | null): Promise<string> {
  const roots = await jsxRoots(FILE, "SourceDirectory");
  const header = first(roots, byTag("header"));
  const [nav] = await inlineTables(FILE, "SourceDirectory");
  const foundations = await looseConstant<string[][]>(FILE, "foundational");
  const library = await looseConstant<string[][]>(FILE, "referenceLibrary");
  const research = await looseConstant<string[][]>(FILE, "research");
  const figures = findAll([header], byTag("a")).map((a) => a.text);
  const versions = (await loadCatalog()).translations.length;
  return blocks("## Heading",
    bullets(readableLines([header]).filter((line) => !figures.includes(line))),
    `Figures (links to the parts below): ${directory ? figures.map((text) => text.replace("…", text.includes("scriptures") ? String(versions) : n(directory.entries.length))).join(" · ") : figures.join(" · ")}`,
    `Menu: ${(nav ?? []).map(([id, label]) => `${label} (#${id})`).join(" · ")}`,
    `## ${((await readableText(DASHBOARD, "CorpusDashboard"))[1] ?? "The library behind the reading.").replace(/\*\*/g, "")} (#collections)`,
    bullets((await readableText(DASHBOARD, "CorpusDashboard")).filter((line) => !line.includes("…") && !line.startsWith("**…"))),
    directory ? blocks(collections(directory), "Each card opens to its authors (search, and a filter: All records · Acquired files · Catalogue & citations); each author opens to their works with links to where each was acquired.", corpus(directory)) : `${DIRECTORY} is missing (it is built with the site's content), so the collections and figures are not listed.`,
    "## Behind the reader, study tables & atlas. (#foundations)",
    table(["Name", "Kind", "What it gives", "Link"], foundations),
    sectionText(roots, "foundations").split("\n").filter((line) => line.includes("editorial work")).join("\n"),
    "## The reference library. (#reference-library)",
    sectionText(roots, "reference-library").split("\n").filter((line) => !line.includes("**")).join("\n"),
    table(["Author or publisher", "Work", "Planned use", "Licence", "Link"], library),
    "## The bibliography. (#bibliography)",
    sectionText(roots, "bibliography"),
    directory ? bibliography(directory.entries) : "",
    `Collection filter buttons: All collections · ${directory?.collections.map((c) => c.label).join(" · ") ?? "…"}`,
    "## Follow the research. (#research)",
    sectionText(roots, "research").split("\n").filter((line) => !line.includes("**") && !research.some(([label]) => line.endsWith(label))).join("\n"),
    table(["Guide", "Report"], research.map(([label, folder]) => [label, `${REPO}content/library/reports/${folder}/REPORT.md`])),
    "## Libraries, archives & ministries. (#repositories)",
    sectionText(roots, "repositories").split("\n").filter((line) => !line.includes("**")).join("\n"),
    directory ? directory.sources.map((s) => `${s.name} (${s.role.replace(/-/g, " ")})`).join(" · ") : "",
    "## An open reference desk, an honest record.",
    readableLines(findAll(roots, byTag("aside"))).filter((line) => !line.startsWith("**")).join("\n"));
}

export async function sourcesPage(): Promise<PageContent> {
  const directory = await readDirectory();
  return { dir: "Site/sources-and-versions", title: "Sources & versions", markdown: blocks(
    `**Addresses:** ${link("/sources")} and ${link("/versions")} (the same page; the footer's "A library with a paper trail." card opens /sources, the Home and Library pages link /versions). #scriptures jumps to the versions table.`,
    `The source directory below is read from ${DIRECTORY}, the file the page downloads (built from content/library and content/apologetics; not in git).`,
    await directoryPart(directory),
    await versionsPart(),
  ) };
}
