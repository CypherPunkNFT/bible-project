import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSpanLabel } from "../letter-hooks";
import { useChosenLetter, useLettersData, type LettersData } from "./data";
import { BASE, CollectionPage, LettersHome, SectionPage, type CardDef } from "./frame";
import { collectionPages } from "./pages-collections";
import { wayPages } from "./pages-ways";
import "../letters.css";
import "./browse.css";

/** Old addresses (#paul-letters …, from the long page's group cards) open the matching collection. */
const OLD_HASH: Record<string, string> = { "#paul-letters": "paul", "#hebrews": "hebrews", "#general-letters": "james-peter-and-jude", "#john-letters": "the-letters-of-john" };

const COLLECTION_CARDS: [string, CardDef][] = [
  ["paul", { art: "paul", tone: "epistles", icon: "route", eyebrow: "Thirteen letters", title: "Paul's letters", text: "Letters to young churches and friends, written on the road and from prison.", foot: "Early · Major · Prison · Pastoral", cta: "Open 13 letters" }],
  ["hebrews", { art: "hebrews", tone: "gospels", icon: "tent", eyebrow: "One long sermon", title: "Hebrews", text: "A sermon-letter by an unnamed writer, on Christ and the old covenant.", foot: "Better than… · The hall of faith · Melchizedek", cta: "Open the letter" }],
  ["james-peter-and-jude", { art: "general", tone: "acts", icon: "globe", eyebrow: "Scattered abroad", title: "James, Peter & Jude", text: "Four short letters to believers far from home: faith at work, suffering and false teaching.", foot: "James · 1 Peter · 2 Peter · Jude", cta: "Open 4 letters" }],
  ["the-letters-of-john", { art: "john", tone: "revelation", icon: "lamp", eyebrow: "Light and love", title: "The letters of John", text: "Three letters on love, truth and fellowship, from a single voice.", foot: "1 John · 2 John · 3 John", cta: "Open 3 letters" }],
];
const WAY_CARDS: [string, string, string, string][] = [
  ["christ-in-the-letters", "christ", "The heart of it", "Who the letters say he is, what they remember of him, and life in him."],
  ["how-the-letters-came-to-be", "form", "Origins", "When and where they were written, who carried them, and how a letter was built."],
  ["what-runs-through-them", "themes", "Shared", "The Old Testament they quote, the words they lean on, and the threads between them."],
  ["look-closer", "compare", "Side by side", "Any two letters side by side, the shape of each, and how the church read them."],
];

/**
 * The Letters study: the home (four collections, four ways in), each collection or way in (a figures bar and three
 * rows of cards), and each section page (four parts, one under another). /study/letters/<page>/<section>/<part>.
 */
export function LettersBrowse() {
  const data = useLettersData();
  if (!data) return <div className="lb" style={{ minHeight: 600 }} aria-busy="true" />;
  return <Browse data={data} />;
}

function Browse({ data }: { data: LettersData }) {
  const { "*": rest = "" } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const label = useSpanLabel();
  const chosen = { paul: useChosenLetter(data, "paul"), hebrews: useChosenLetter(data, "hebrews"), general: useChosenLetter(data, "general"), john: useChosenLetter(data, "john") };
  const pages = { ...collectionPages(data, chosen), ...wayPages(data, label) };
  const bySlug = new Map(Object.values(pages).map((p) => [p.slug, p]));
  const [slug, section, part] = rest.split("/").filter(Boolean);

  useEffect(() => { if (!slug && OLD_HASH[hash]) navigate(`${BASE}/${OLD_HASH[hash]}`, { replace: true }); }, [slug, hash, navigate]);
  // After the Layout's own scroll-to-top on a new address, bring the chosen part into view.
  useEffect(() => {
    if (!part) return;
    const timer = window.setTimeout(() => document.getElementById(`part-${part}`)?.scrollIntoView(), 80);
    return () => window.clearTimeout(timer);
  }, [slug, section, part]);

  const page = slug ? bySlug.get(slug) : undefined;
  if (page && section) return <SectionPage page={page} sectionId={section} />;
  if (page) return <CollectionPage page={page} />;
  const way = (slugOf: string, art: string, eyebrow: string, text: string) => { const p = bySlug.get(slugOf)!;
    return { card: { art, tone: p.tone, icon: p.emblem, eyebrow, title: p.title, text, foot: p.sections.map((s) => s.title).join(" · "), cta: `Open ${p.title}` }, to: `${BASE}/${slugOf}` }; };
  return <LettersHome collections={COLLECTION_CARDS.map(([s, card]) => ({ card, to: `${BASE}/${s}` }))} ways={WAY_CARDS.map((w) => way(...w))}
    figures={[["Letters", "21"], ["Verses", data.letters.reduce((n, l) => n + l.verses, 0).toLocaleString("en-US")], ["Collections", "4"], ["Written", "AD 40–180"]]} />;
}
