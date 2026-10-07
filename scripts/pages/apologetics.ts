// Apologetics area: one CONTENT.md per page of the section's own menu (ApologeticsPage.tsx `destinations`),
// plus an area-level inventory. Split across apologetics-*.ts to keep each file small.
import { BASE, find, lines, stateLine, studyLink, loadApologetics, type ApologeticsData } from "./apologetics-data";
import { debatesPage, explorePage, pathsPage, practicePage, worldviewsPage } from "./apologetics-sections";
import { questionsPage, reformedPage } from "./apologetics-studies";
import { historicTextsPage } from "./apologetics-texts";
import type { Extractor, PageContent } from "./types";

const PAGES: { folder: string; title: string; render: (data: ApologeticsData) => string }[] = [
  { folder: "explore", title: "Apologetics: Explore", render: explorePage },
  { folder: "questions", title: "Apologetics: Questions", render: questionsPage },
  { folder: "reformed-theology", title: "Apologetics: Reformed theology", render: reformedPage },
  { folder: "historic-texts", title: "Apologetics: Historic texts", render: historicTextsPage },
  { folder: "learning-paths", title: "Apologetics: Learning paths", render: pathsPage },
  { folder: "worldviews", title: "Apologetics: Worldviews", render: worldviewsPage },
  { folder: "debates", title: "Apologetics: Debates", render: debatesPage },
  { folder: "practice", title: "Apologetics: Practice", render: practicePage },
];

function areaPage(data: ApologeticsData): string {
  const e = data.editorial.content;
  const counts = ["study", "source", "topic", "path", "worldview", "debate", "practice", "editorial"]
    .map((kind) => `${data.documents.filter((d) => d.kind === kind).length} ${kind}`).join(" · ");
  const drafts = data.documents.filter((d) => d.publication !== "published").length;
  const lastReviews = data.documents.map((d) => d.reviews.at(-1)?.kind ?? "none");
  const reviewKinds = [...new Set(lastReviews)].sort().map((kind) => `${lastReviews.filter((k) => k === kind).length} ${kind}`).join(", ");
  const byKind = [...data.documents].sort((a, b) => a.kind.localeCompare(b.kind, "en") || a.order - b.order || a.id.localeCompare(b.id, "en"));
  return lines(
    `Address: [bibleproject.io/apologetics](${BASE}). The pages' own content is in the eight folders beside this file.`,
    "",
    `**Documents in content/apologetics:** ${data.documents.length} (${counts}); ${drafts} draft(s), which the site leaves out. **Historic reading library:** ${data.library.works.length} works by ${data.library.authors.length} authors, ${data.libraryReview}.`,
    "",
    `**Editorial basis:** ${e.title}. Starting passage: ${e.anchor}.`,
    "",
    `**The six foundation studies** named by the editorial document (not shown on any page today; kept for a Bible-reference test and older code): ${e.foundations.map((id) => studyLink(find(data.studies, id, "study"))).join(" · ")}`,
    "",
    "## Every document and its publication state",
    "",
    `"Review current" means the last recorded review still matches the document, its cited sources and the editorial policy; "stale" means one of those changed afterwards. Latest review per document, by kind: ${reviewKinds} ("ai-assisted" is an AI check against the cited texts, not a human theological review).`,
    "",
    "| Document | Title | State |",
    "|---|---|---|",
    ...byKind.map((doc) => `| ${doc.kind}/${doc.id} | ${doc.content.title.replace(/\|/g, "/")} | ${stateLine(doc, data)} |`),
  );
}

export const extract: Extractor = async () => {
  const data = loadApologetics();
  const pages: PageContent[] = [{ dir: "Apologetics", title: "Apologetics", markdown: areaPage(data) }];
  for (const page of PAGES) pages.push({ dir: `Apologetics/${page.folder}`, title: page.title, markdown: page.render(data) });
  return pages;
};
