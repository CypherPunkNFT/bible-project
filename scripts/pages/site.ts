// The Site area's CONTENT.md files (run by scripts/export-pages.ts): the parts every page shares (header and menu,
// theme switch, footer, the "page not found" page) and six pages: home, the Bible and reader, search, sources and
// versions, testimonies, and the library. Each page's extractor lives in a site-*.ts file here.
import { blocks, link, table, readJson } from "./study-lib";
import { homePages } from "./site-home";
import { readerPage } from "./site-reader";
import { searchPage } from "./site-search";
import { sourcesPage } from "./site-sources";
import { testimoniesPage } from "./site-testimonies";
import { looseConstant, readableText } from "./site-source";
import type { Extractor, PageContent } from "./types";
import writings from "../../content/teachers/writings/william-lane-craig.json";
import scholars from "../../content/teachers/scholars.json";
import type { FieldLibrary } from "../../src/pages/teachers/scholars/field-library";
import type { Field, ScholarsData } from "../../src/data/teachers/pages-types";
import type { AcquiredCatalogue } from "../../src/pages/teachers/shared/acquired";
import { mergeLibrary } from "../../src/pages/teachers/scholars/catalogue/library";

const LAYOUT = "src/components/Layout.tsx";
const FOOTER = "src/components/SiteFooter.tsx";

interface MenuItem { to: string; label: string }

async function area(): Promise<PageContent> {
  const menu = await looseConstant<MenuItem[]>(LAYOUT, "NAV");
  const community = await looseConstant<MenuItem>(LAYOUT, "COMMUNITY");
  const columns = await looseConstant<{ title: string; links: string[][] }[]>(FOOTER, "paths");
  const footer = (await readableText(FOOTER, "SiteFooter")).filter((line) => !columns.some((column) => column.links.some(([label]) => line === label)));
  const notFound = await readableText("src/pages/NotFoundPage.tsx");
  return { dir: "Site", title: "Site: shared parts", markdown: blocks(
    "Every page except the three genealogy mock-ups (/mock/…) is drawn inside the same frame: the header with the main menu at the top, and the footer at the bottom.",
    "## Header",
    `A thin strip in the reading chart's colours, then the "Bible Project" name and logo (opens ${link("/")}), the main menu, a divider, ${community.label}, and at the right a search button (opens ${link("/search")}) and the light/dark switch. A hidden "Skip to content" link comes first for keyboard users. On narrow screens the menu shows icons only.`,
    table(["Menu item", "Opens", "Also highlighted on"], [...menu.map((item) => [item.label, link(item.to), item.to === "/bible" ? "/read/… and /library" : item.to === "/study" ? "every /study page except the atlas" : ""]), [community.label, link(community.to), "(after the divider, in the accent colour)"]]),
    "The theme switch: a sun or moon in a sliding switch, with the tooltip \"Switch to dark theme\" or \"Switch to light theme\"; the choice is remembered in this browser.",
    "## Footer",
    footer.map((line) => `- ${line}`).join("\n"),
    table(["Column", "Links"], columns.map((column) => [column.title, column.links.map(([label, to]) => `${label} (${link(to)})`).join(" · ")])),
    `"Sources & references" opens ${link("/sources")}; "Download the code." opens https://github.com/CypherPunkNFT/bible-project.`,
    "## Page not found",
    `Any address the site does not know (e.g. ${link("/no-such-page")}): ${notFound.map((line) => `"${line}"`).join(" · ")} (→ ${link("/library")}).`,
    "## The pages in this area",
    table(["Page", "Addresses", "Content"], [
      ["Home", link("/"), "[home/CONTENT.md](home/CONTENT.md)"],
      ["The Bible and the reader", `${link("/bible")}, ${link("/read")}`, "[bible-reader/CONTENT.md](bible-reader/CONTENT.md)"],
      ["Search", `${link("/search")}, ${link("/search/meaning")}`, "[search/CONTENT.md](search/CONTENT.md)"],
      ["Sources & versions", `${link("/sources")}, ${link("/versions")}`, "[sources-and-versions/CONTENT.md](sources-and-versions/CONTENT.md)"],
      ["Testimonies", link("/testimonies"), "[testimonies/CONTENT.md](testimonies/CONTENT.md)"],
      ["The library", link("/library"), "[library/CONTENT.md](library/CONTENT.md)"],
    ]),
  ) };
}

export const extract: Extractor = async () => {
  const fieldShelves = await readJson<FieldLibrary>("content/teachers/field-shelves.json");
  const fieldFeatured = await readJson<Record<Field, [string, string][]>>("content/teachers/field-featured.json");
  const complete = mergeLibrary(fieldShelves, await readJson<AcquiredCatalogue>("public/content/teacher-library/catalogue.json"), await readJson<ScholarsData>("src/data/teachers/scholars.json"));
  const [shared, [home, library], reader, search, sources, testimonies] = await Promise.all([area(), homePages(), readerPage(), searchPage(), sourcesPage(), testimoniesPage()]);
  return [shared, home, reader, search, sources, testimonies, library, {
    dir: "Site/scholar-catalogue", title: "Scholars: full contributor catalogue", markdown: blocks(
      link("/teachers/scholars#catalogue"),
      `${complete.length.toLocaleString()} catalogue entries cover every acquired contributor credit, including unclassified names, verified aliases, documented profiles and constituent authors in collected volumes. One catalogue replaces the separate Fields and acquired-contributor browsers. Search, collection/role/profile/field/era/faith filters, five sort orders and 48 cards per page keep the full list accessible inside its own scroll area. Unknown biographical information is not inferred.`,
      table(["Contributor", "Profile", "Recorded roles", "Held records", "Collections"], complete.map(p => [p.name, p.scholar ? "Documented scholar profile" : "Library entry", p.roles.join(", "), String(p.records), p.collections.join(", ")])),
    ),
  }, {
    dir: "Site/scholar-fields", title: "Scholars: saved five-field design", markdown: blocks(
      link("/mockups/scholars-fields-archive/"),
      "Archived design, saved on 2026-10-11. The live contributor list is now in section 01; this independent interactive mockup preserves the former section 04 for later review.",
      `${fieldShelves.entries.length} author/contributor names from ${fieldShelves.coverage.scannedRecords} packaged records, including ${scholars.scholars.length} documented profiles. Five overlapping subject fields; search, collection filters, contributor pagination and full held-work shelves. Fields describe works, not personal faith or scholarly qualifications. ${fieldShelves.coverage.withoutSubjectMatch} remaining source names are accessible in the full acquired catalogue without a guessed field.`,
      ...Object.entries(scholars.fields).flatMap(([key, label]) => [
        `## ${label}`,
        `Featured introductions (shown first by default): ${fieldFeatured[key as Field].map(([id]) => fieldShelves.entries.find(p => p.id === id)?.name).filter(Boolean).join("; ")}. Closed cards show enlarged, named badges and a Browse all total; the selection does not limit the full field.`,
        table(["Profile", "Key works"], scholars.scholars.filter(s => s.field === key).map(s => [s.name, s.works.map(w => w[0]).join("; ")])),
        table(["Contributor", "Recorded roles", "Supporting work"], fieldShelves.entries.filter(s => s.fields[key as Field]).map(s => { const w = s.fields[key as Field]?.example; return [s.name, s.roles.join(", "), w ? `[${w.title}](/teachers/works/${w.id})` : "Documented profile"]; })),
      ]),
    ),
  }, {
    dir: "Site/scholar-writings", title: `${writings.name}: writings`, markdown: blocks(
      link(writings.path),
      `Listed in Scholars and linked from Apologetics materials. Subjects: ${writings.tags.join(", ")}.`,
      `${writings.documents} original PDFs, ${writings.pages} pages, ${writings.categories.length} source categories. Search titles and subjects, filter by category, or open the original PDF and source article.`,
      table(["Title", "Categories", "Pages", "PDF"], writings.writings.map(w => [w.title, w.categories.join(", "), String(w.pages), `[Original PDF](${w.pdfUrl})`])),
    ),
  }];
};
