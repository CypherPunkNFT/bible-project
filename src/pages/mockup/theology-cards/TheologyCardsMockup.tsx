import type { ReactNode } from "react";
import { StudyMiniature } from "@/components/study/StudyArtwork";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { Resource } from "@/pages/study/StudyResourceCards";
import { ArcArt, BeginningsArt, OpenBooksArt, StackArt } from "./VersionsCardArt";
import "@/pages/study/hub/hub.css";
import "./theology-cards.css";

/** /study/theology_cards_mockup: two of the Scripture & Theology page's cards, four ways each, as the real card in the
 *  real two-column grid (owner, 2026-10-29). "The shape of the Bible" keeps its tile drawing and tries four titles and
 *  lines that say what the page is, its parts and books measured; "Versions & languages" keeps its words and tries
 *  four drawings, two of books and two of languages. */
export default function TheologyCardsMockup() {
  return <div className="study-experience tc-page mx-auto max-w-7xl px-4 sm:px-6">
    <div className="chart-collection-breadcrumb"><StudyBackLink /><strong>Scripture & Theology · two cards, four ways</strong></div>
    <Grid n="01" title={<>The shape of the Bible: <em>four titles</em></>} lead="The tile drawing stays. Each card tries its own title, line and caption for what the page holds: the six parts and the books, measured.">
      {STRUCTURE.map((option) => <Resource key={option.title} to="/study/structure" title={option.title} description={option.description} source={option.source} number="06" category={option.category} color="history">
        <div className="study-art study-chart-art"><StudyMiniature kind="structure" /><span className="study-art-note">{option.note}</span></div>
      </Resource>)}
    </Grid>
    <Grid n="02" title={<>Versions & languages: <em>four drawings</em></>} lead="The words stay. Top row, books; bottom row, languages. Every phrase is the opening of Genesis 1:1 as the library's own edition prints it.">
      {[<StackArt key="stack" />, <OpenBooksArt key="open" />, <BeginningsArt key="beginnings" />, <ArcArt key="arc" />].map((art) => <Resource key={art.key} to="/study/versions" title="Versions & languages" description="Which edition are you reading? Place the library's versions in time, compare their actual book collections, and choose one to read." source="Edition timeline · Book coverage · Library" number="10" category="Editions & contents" color="acts" className="study-wide">{art}</Resource>)}
    </Grid>
  </div>;
}

function Grid({ n, title, lead, children }: { n: string; title: ReactNode; lead: string; children: ReactNode }) {
  return <section className="tc-section">
    <header className="tc-head"><span>{n}</span><div><h2>{title}</h2><p>{lead}</p></div></header>
    <ul className="study-resource-grid theology-original-cards">{children}</ul>
  </section>;
}

const STRUCTURE: { title: string; description: string; category: string; source: string; note: string }[] = [
  {
    title: "The Bible by the numbers", category: "Measures & proportions", note: "Six parts. 66 books. 1,189 chapters.",
    description: "How much of Scripture is history, poetry, prophecy or letter? Weigh the six parts nine ways, from words and verses to miracles and the words of Jesus, then line up all 66 books by length.",
    source: "Parts & measures · Book lengths · Chapters",
  },
  {
    title: "Measuring Scripture", category: "Counts & comparisons", note: "Nine ways to count.",
    description: "Count the Bible nine ways: books, chapters, verses, words, the words of Jesus, miracles, prophecies, Gospel episodes and names of God. See how much each part holds, and which books are longest.",
    source: "Nine measures · Six parts · 66 books",
  },
  {
    title: "The Bible in proportion", category: "Parts & proportions", note: "A quarter of the books. Almost half the words.",
    description: "History is a quarter of the books but almost half the words. See how much of the Bible each part really holds, measured nine ways, and compare all 66 books by length.",
    source: "Parts & measures · Book lengths · Chapters",
  },
  {
    title: "How long is each book?", category: "Sizes & lengths", note: "The longest, the shortest, and all between.",
    description: "Compare all 66 books by words, verses and chapters, see how much of the whole each of the six parts takes up, and open any book to walk through its chapters.",
    source: "Book lengths · Parts & measures · Chapters",
  },
];
