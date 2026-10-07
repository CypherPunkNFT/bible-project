// The Site area's CONTENT.md files (run by scripts/export-pages.ts): the parts every page shares (header and menu,
// theme switch, footer, the "page not found" page) and six pages: home, the Bible and reader, search, sources and
// versions, testimonies, and the library. Each page's extractor lives in a site-*.ts file here.
import { blocks, link, table } from "./study-lib";
import { homePages } from "./site-home";
import { readerPage } from "./site-reader";
import { searchPage } from "./site-search";
import { sourcesPage } from "./site-sources";
import { testimoniesPage } from "./site-testimonies";
import { looseConstant, readableText } from "./site-source";
import type { Extractor, PageContent } from "./types";

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
  const [shared, [home, library], reader, search, sources, testimonies] = await Promise.all([area(), homePages(), readerPage(), searchPage(), sourcesPage(), testimoniesPage()]);
  return [shared, home, reader, search, sources, testimonies, library];
};
