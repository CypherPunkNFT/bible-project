// CONTENT for Letters & their message (/study/letters/*, layout 2): the home (four collections, four ways in), the
// eight pages of 3 × 4 cards, and the part each card opens. The page definitions are the site's own (collectionPages,
// wayPages); they are called here with the same data files, and each part's chart is named from its component.
import type { ReactElement, ReactNode } from "react";
import type { Letter, LetterGroup, LettersOverview } from "../../src/data/letters/types";
import { browseDetail, groupDetail, letterDetail, overviewDetail, type BrowseData } from "./study-letters-data";
import { blocks, link, loadCatalog, n, readJson, ref, registerSiteModules, table, type Span } from "./study-lib";
import { attributeLiteral, byTag, findAll, first, jsxRoots, literalConstant } from "./study-source";
import type { PageContent } from "./types";

const BASE = "/study/letters";
const KEYS = ["paul", "hebrews", "general", "john"] as const;
type Key = (typeof KEYS)[number];
const FILES: Record<Key, string> = { paul: "paul-letters", hebrews: "hebrews", general: "general-letters", john: "john-letters" };
const FIRST: Record<Key, string> = { paul: "ROM", hebrews: "HEB", general: "JAS", john: "1JN" };

interface CardDef { eyebrow: string; title: string; text: string; foot: string; cta: string }
interface PartDef { id: string; card: CardDef; lead: string; body: ReactNode }
interface SectionDef { id: string; title: string; lead: string; picker?: boolean; parts: PartDef[] }
interface PageDef { slug: string; title: string; crumb: string; right: string; kicker: string; h1: string; em: string; intro: string; caption: string; bar: ReactNode; sections: SectionDef[]; citations: unknown[]; about?: { text: string }[]; writers?: { id: string; name: string; intro?: { text: string }[] }[] }
interface Data { groups: Record<Key, LetterGroup>; overview: LettersOverview; browse: BrowseData; letters: Letter[]; letter: (code: string) => Letter; groupOf: (code: string) => Key }

type Props = Record<string, unknown>;
const titled = (value: unknown) => (value as { title?: string } | undefined)?.title ?? "";
const titles = (value: unknown) => ((value as { title: string }[] | undefined) ?? []).map((item) => item.title).join(" · ");

/** What a part's chart is, named from its component and the data it is given. */
function describeBody(body: ReactNode, data: Data): string {
  const element = body as ReactElement<Props>;
  const type = element.type, p = element.props;
  const name = typeof type === "string" ? type : (type as { name?: string }).name ?? "?";
  const parallel = (value: unknown) => { const x = value as { title: string; pairs: unknown[] }; return `${x.title} (${x.pairs.length} pairs)`; };
  switch (name) {
    case "LetterMap": return `Map "${p.title}": ${titles(p.layers)}`;
    case "TimelineStrip": return `Timeline "${titled(p.timeline)}" (${(p.timeline as { events: unknown[] }).events.length} entries)`;
    case "ParallelRibbon": return `Side-by-side ribbons: ${parallel(p.parallel)}`;
    case "RibbonChooser": return `Choice of ribbons: ${(p.parallels as unknown[]).map(parallel).join(" · ")}`;
    case "PeopleCards": return `Person cards "${titled(p.network)}" with a person panel`;
    case "NetworkChooser": return `Person cards, choice of: ${titles(p.networks)}`;
    case "OpenQuestions": return `${(p.questions as unknown[]).length} open questions, each view with who held it`;
    case "CanonLanes": return `Reception lanes: ${(p.events as unknown[]).length} witnesses`;
    case "BetterLadder": return `Ladder "${titled(p.ladder)}"`;
    case "FlowChart": return `Flow chart "${titled(p.flow)}"`;
    case "TopicList": { const s = data.browse.christ[p.subcategory as string]; return `Torrey topics "${s?.title}": ${s?.topics.map((t) => `${t.title} (${t.n})`).join(" · ")}`; }
    case "ThemeDetail": return `The shared thread "${p.title}" with its letters`;
    case "FactsList": return `Each letter: ${p.heading}`;
    case "Hands": return `Named hands: ${(p.roles as string[]).join(", ")}`;
    case "ClaimChooser": return `A chooser of ${(p.items as unknown[]).length} items`;
    case "WordConstellation": return `Word stars in ${(p.letters as Letter[]).map((l) => l.name).join(" · ")}`;
    case "LetterBars": return `One bar per letter: ${p.hint}`;
    case "CompareLetters": return `Compare any two letters (opens on ${(p.initial as string[]).join(" and ")}); ${(p.curated as unknown[]).length} curated pairings`;
    case "LetterShape": return "All twenty-one as bars cut into their section headings";
    case "Glance": case "OutlineBar": case "LetterWords": case "OtList": case "PeoplePlaces": return `${name} for ${(p.letter as Letter).name} (see the letter below)`;
    case "div": return `The collection story: ${data.overview.collection.length} paragraphs`;
    default: return name;
  }
}

/** The figures bar under a page's heading, in words. */
function describeBar(bar: ReactNode, data: Data): string {
  const element = bar as ReactElement<Props>;
  const name = (element.type as { name?: string }).name;
  const p = element.props;
  if (name === "FiguresBar") return (p.items as unknown[][]).map((item) => item.map((x) => String(x)).join(" / ")).join(" · ");
  const group = data.groups[p.group as Key];
  const dates = (l: Letter) => (l.date.from ? `AD ${l.date.from}${l.date.to && l.date.to !== l.date.from ? `–${l.date.to}` : ""}` : "Not dated");
  if (name === "GroupsBar") return (group.groupings ?? []).map((g) => { const ls = group.letters.filter((l) => g.letters.includes(l.code));
    return `${g.label}: ${ls.length} letters · ${n(ls.reduce((s, l) => s + l.verses, 0))} verses · AD ${Math.min(...ls.map((l) => l.date.from ?? Infinity))}–${Math.max(...ls.map((l) => l.date.to ?? -Infinity))} (${ls.map((l) => l.name).join(", ")}; ⓘ explains the group)`; }).join(" · ");
  if (name === "LettersBar") return group.letters.map((l) => `${l.name}: ${l.verses} verses · ${dates(l)} · "Inside ${l.name}"`).join(" · ");
  return name ?? "";
}

function pageMarkdown(page: PageDef, data: Data): string {
  const sections = page.sections.map((s, i) => blocks(`#### Section ${String(i + 1).padStart(2, "0")}: ${s.title} (${link(`${BASE}/${page.slug}/${s.id}`)})`,
    `${s.lead}${s.picker ? " The figures bar above the parts is the letter picker; these four parts follow the chosen letter (shown here for the first)." : ""}`,
    table(["#", "Card: eyebrow · title", "Card text", "Card foot", "Button", "Part lead (on the section page)", "Shows", "Address"],
      s.parts.map((part, j) => [String(i * 4 + j + 1).padStart(2, "0"), `${part.card.eyebrow} · ${part.card.title}`, part.card.text, part.card.foot, part.card.cta, part.lead, describeBody(part.body, data), `${s.id}/${part.id}`]))));
  return blocks(`### ${page.title} (${link(`${BASE}/${page.slug}`)})`,
    `- Top line: "Letters / ${page.crumb}" · ${page.right}\n- Kicker: ${page.kicker}\n- Title: **${page.h1}** *${page.em}*\n- Intro: ${page.intro}\n- Emblem caption: ${page.caption}${page.about?.length ? `\n- Introduction under the title (${page.about.length} paragraphs):${page.about.map((claim) => `\n  - ${claim.text}`).join("")}` : ""}${page.writers?.length ? `\n- Writers, each linked to their own page:${page.writers.map((w) => `\n  - **${w.name}** (${link(`/people/${w.id}`)})${(w.intro ?? []).map((claim) => `\n    - ${claim.text}`).join("")}`).join("")}` : ""}\n- Figures bar: ${describeBar(page.bar, data)}\n- Foot: "Where this page comes from", ${page.citations.length} works`,
    ...sections);
}

async function loadData(): Promise<Data> {
  const files = await Promise.all([...KEYS.map((k) => readJson<LetterGroup>(`src/data/letters/${FILES[k]}.json`)), readJson<LettersOverview>("src/data/letters/overview.json"), readJson<BrowseData>("src/data/letters/browse.json")]);
  const groups = Object.fromEntries(KEYS.map((k, i) => [k, files[i]])) as Record<Key, LetterGroup>;
  const letters = KEYS.flatMap((k) => groups[k].letters);
  const byCode = new Map(letters.map((l) => [l.code, l]));
  const keyOf = new Map(KEYS.flatMap((k) => groups[k].letters.map((l) => [l.code, k] as const)));
  return { groups, overview: files[4] as LettersOverview, browse: files[5] as BrowseData, letters, letter: (code) => byCode.get(code) ?? letters[0], groupOf: (code) => keyOf.get(code) ?? "paul" };
}

export async function lettersPage(): Promise<PageContent> {
  const catalog = await loadCatalog();
  const data = await loadData();
  registerSiteModules();
  const { collectionPages } = await import("../../src/components/letters/browse/pages-collections");
  const { wayPages } = await import("../../src/components/letters/browse/pages-ways");
  const noop = () => undefined;
  const chosen = Object.fromEntries(KEYS.map((k) => [k, [data.letter(FIRST[k]), noop]]));
  const collections = Object.values(collectionPages(data as never, chosen as never)) as unknown as PageDef[];
  const ways = Object.values(wayPages(data as never, (span: Span) => ref(catalog, span))) as unknown as PageDef[];
  const browse = "src/components/letters/browse/LettersBrowse.tsx", frame = "src/components/letters/browse/frame.tsx";
  const collectionCards = await literalConstant<[string, CardDef][]>(browse, "COLLECTION_CARDS");
  const wayCards = await literalConstant<[string, string, string, string][]>(browse, "WAY_CARDS");
  const figures = await attributeLiteral<string[][]>(browse, "Browse", "LettersHome", "figures");
  const rows = await literalConstant<{ title: string; lead: string }[]>(frame, "rows", { insideFunction: "LettersHome", loose: true });
  const home = await jsxRoots(frame, "LettersHome");
  const intro = first(home, (node) => node.tag === "header");
  const verses = n(data.letters.reduce((sum, l) => sum + l.verses, 0));
  const homeCards = blocks(`### ${rows[0].title}: ${rows[0].lead}`,
    table(["#", "Eyebrow", "Title", "Text", "Foot", "Button", "Opens"], collectionCards.map(([slug, c], i) => [String(i + 1).padStart(2, "0"), c.eyebrow, c.title, c.text, c.foot, c.cta, link(`${BASE}/${slug}`)])),
    `### ${rows[1].title}: ${rows[1].lead}`,
    table(["#", "Eyebrow", "Title", "Text", "Foot (its three sections)", "Button", "Opens"], wayCards.map(([slug, , eyebrow, text], i) => { const way = ways.find((w) => w.slug === slug)!;
      return [String(i + 5).padStart(2, "0"), eyebrow, way.title, text, way.sections.map((s) => s.title).join(" · "), `Open ${way.title}`, link(`${BASE}/${slug}`)]; })));
  const parts = [...collections, ...ways].reduce((sum, page) => sum + page.sections.reduce((m, s) => m + s.parts.length, 0), 0);
  return { dir: "Study/letters-and-their-message", title: "Letters & their message", markdown: blocks(
    `**Addresses:** ${link(BASE)} (home) · ${BASE}/<page> (8 pages of 3 × 4 cards) · ${BASE}/<page>/<section>/<part> (each card opens its section page scrolled to its part; ${parts} parts in all). Old addresses ${BASE}#paul-letters, #hebrews, #general-letters and #john-letters open the matching collection.`,
    `## Home (${link(BASE)})\n\n- Top line: "Back to Study" · LETTERS\n- ${findAll([intro], byTag("p")).map((p) => p.text).join("\n- ")}\n- Title: **${first([intro], byTag("h1")).text}**\n- Figures: ${figures.map(([label, value]) => `${label} ${value === "…" ? verses : value}`).join(" · ")}\n- Foot: "${findAll(home, byTag("p")).at(-1)?.text}"`,
    homeCards,
    "## The four collections", ...collections.map((page) => pageMarkdown(page, data)),
    "## Across all twenty-one (the four ways in)", ...ways.map((page) => pageMarkdown(page, data)),
    "## The material behind the cards",
    `### The 21 letters\n\nWhat each letter's "Inside" cards show (At a glance, How it is built, The words it leans on, The Old Testament behind it; Hebrews also People and places). Claims are shown in the site's own words with their verses and numbered source marks (the marks are not listed here).`,
    ...data.letters.map((l) => letterDetail(catalog, l)),
    ...KEYS.map((k) => groupDetail(catalog, data.groups[k])),
    overviewDetail(catalog, data.overview), browseDetail(data.browse, data.letters)) };
}
