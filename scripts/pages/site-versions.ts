// The lower half of the Sources & versions page (/sources, /versions): "37 scriptures, all free to read", the table
// of every version, the seven colours and the sources and credits. Read from VersionsPage.tsx and data/catalog.json.
import { groupVersions, VERSION_GROUPS } from "../../src/lib/languages";
import { NUMBERING_LABEL } from "../../src/lib/numbering";
import { SECTIONS } from "../../src/lib/sections";
import { blocks, link, loadCatalog, n, table } from "./study-lib";
import { byTag, findAll, first, jsxRoots } from "./study-source";
import { fill, readableLines } from "./site-source";
import { testaments } from "./site-home";

const FILE = "src/pages/VersionsPage.tsx";

export async function versionsPart(): Promise<string> {
  const catalog = await loadCatalog();
  const roots = await jsxRoots(FILE, "VersionsPage");
  const header = first(roots, (node) => node.tag === "header" && node.attrs.id === "scriptures");
  const grouped = groupVersions(catalog.translations);
  const filters = [`All ${catalog.translations.length}`, ...VERSION_GROUPS.map((group) => `${group.title} ${grouped.find((g) => g.group.id === group.id)?.count ?? 0}`)];
  const rows = grouped.flatMap(({ group, sections }) => sections.flatMap((section) => section.versions.map((version) => {
    const books = testaments(catalog, version);
    const first = Object.keys(version.books)[0];
    return [group.title + (section.label ? ` · ${section.label}` : ""), version.abbr, version.name, version.year, `${books.ot} · ${books.nt} · ${books.apocrypha}`, n(version.verses), NUMBERING_LABEL[version.numbering], link(`/read/${version.slug}/${first}/${version.books[first][0]}`)];
  })));
  const columns = findAll(roots, byTag("th")).filter((th) => th.attrs.scope === "col").map((th) => th.text || "Read");
  const credits = first(roots, (node) => node.tag === "div" && node.children.some((child) => child.tag === "h2" && child.text === "Sources and credits"));
  const creditLines = credits ? readableLines([credits]).filter((line) => !line.startsWith("**")) : [];
  const licensed = catalog.translations.filter((version) => version.credit).map((version) => `${version.name} — ${version.credit?.text} (${version.credit?.licence}). ${version.credit?.changes}`);
  return blocks(`## ${fill(first([header], byTag("h2")).text, catalog.translations.length)} (#scriptures)`,
    readableLines([header]).filter((line) => !line.startsWith("**")).map((line) => `- ${line}`).join("\n"),
    `Filter buttons: ${filters.join(" · ")}. Within each group, one heading per language.`,
    table(["Group", ...columns.map((column) => column.replace(/^Read$/, "Opens"))], rows),
    "## The seven colours",
    "Everything on this site is coloured by the sections of a Bible reading chart.",
    table(["Section", "Books"], SECTIONS.map((section) => [section.name, section.span])),
    "## Sources and credits",
    [...creditLines.slice(0, 1), ...licensed, ...creditLines.slice(1)].map((line) => `- ${line}`).join("\n"));
}
