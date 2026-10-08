// Topics, the Bible reader, Letters, Apologetics, Study, Testimonies and the site's own pages.
import { readdirSync } from "node:fs";
import { registerSiteModules } from "../pages/study-lib.ts";
import { fewest, firstOf, longestText, most, readJson, single, typical, variant, type SampleRule, type TemplateDef } from "./model.ts";

interface TopicEntry { title: string; points: number; refs: number; s: string; parts?: number }
interface TopicIndex { categories: { id: string; title: string; subcategories: { id: string; title: string; topics: string[] }[] }[]; topics: Record<string, TopicEntry>; aliases: Record<string, string> }
interface TopicBody { book?: string; parent?: string; dictionary?: unknown[]; nave?: unknown[]; points?: unknown[] }

function topicTemplates(): { templates: TemplateDef[]; valid: { topics: string[]; aliases: string[]; categories: string[] } } {
  const index = readJson<TopicIndex>("data/topics/index.json");
  const bodies = new Map<string, TopicBody>();
  for (const file of readdirSync(new URL("../../data/topics/t/", import.meta.url))) {
    if (file.endsWith(".json")) for (const [id, body] of Object.entries(readJson<Record<string, TopicBody>>(`data/topics/t/${file}`))) bodies.set(id, body);
  }
  type Topic = { id: string; t: TopicEntry; body: TopicBody };
  const topics: Topic[] = Object.entries(index.topics).map(([id, t]) => ({ id, t, body: bodies.get(id) ?? {} }));
  const title = (x: Topic) => x.t.title;
  const url = (x: Topic) => `/topics/${x.id}`;
  const samples: SampleRule<Topic>[] = [
    typical<Topic>((x) => x.t.refs, title, "how many verses it lists"),
    longestText<Topic>("longest-title", "Longest title", title, "title"),
    most<Topic>("most", "Most verses", (x) => x.t.refs, title, "verses"),
    fewest<Topic>("fewest", "Fewest verses", (x) => x.t.refs + x.t.points, title, "verses and points"),
  ];
  const has = (x: Topic, letter: string) => x.t.s.includes(letter);
  const topic: TemplateDef = {
    id: "topic", area: "topics", name: "Topic page", address: "/topics/<topic>", instances: topics.length,
    what: "One topic: Torrey's points, Nave's verses and Easton's article, key verses, and where it sits in the cards.",
    entries: ["src/pages/TopicPage.tsx"], scopes: ["src/pages/TopicPage.tsx", "src/pages/topics/"],
    variants: [
      variant({ id: "both", name: "Two topical Bibles side by side", what: "Torrey's points beside Nave's verses.", records: topics.filter((x) => has(x, "t") && has(x, "n")), url, samples }),
      variant({ id: "nave", name: "Nave's verses only", what: "The most common page: Nave's list.", records: topics.filter((x) => x.t.s === "n"), url, samples }),
      variant({ id: "nave-easton", name: "Nave's verses and Easton's article", what: "The list with the dictionary article.", records: topics.filter((x) => has(x, "n") && has(x, "e") && !has(x, "t")), url, samples }),
      variant({ id: "torrey", name: "Torrey's points only", what: "Torrey's numbered points, no Nave list.", records: topics.filter((x) => has(x, "t") && !has(x, "n")), url, samples }),
      variant({ id: "easton", name: "Easton's article only", what: "A dictionary article with no verse list.", records: topics.filter((x) => x.t.s === "e"), url, samples }),
      variant({ id: "contents", name: "A contents topic", what: "A topic made of parts (\"Contents: N topics\").", records: topics.filter((x) => x.t.parts), url, samples: [samples[0], longestText<Topic>("longest-title", "Longest title", title, "title"), most<Topic>("most-parts", "Most parts", (x) => x.t.parts ?? 0, title, "parts")] }),
      variant({ id: "book", name: "A book of the Bible", what: "The topic for one book, with a \"Read\" button.", records: topics.filter((x) => x.body.book), url, samples: samples.slice(0, 3) }),
    ],
  };
  type Family = TopicIndex["categories"][number];
  type Group = { family: Family; group: Family["subcategories"][number] };
  const groups: Group[] = index.categories.flatMap((family) => family.subcategories.map((group) => ({ family, group })));
  const groupUrl = (g: Group) => `/topics/c/${g.family.id}?group=${g.group.id}`;
  const familyTopics = (f: Family) => f.subcategories.reduce((n, g) => n + g.topics.length, 0);
  const category: TemplateDef = {
    id: "topic-card", area: "topics", name: "Topic card (category page)", address: "/topics/c/<card>?group=<group>",
    what: "One of the 55 cards on the Topics home: its groups, each opening its topics.",
    entries: ["src/pages/TopicCategoryPage.tsx"], scopes: ["src/pages/TopicCategoryPage.tsx", "src/pages/topics/"],
    variants: [
      variant({ id: "card", name: "A card", what: "The card's groups, closed.", records: index.categories, url: (f: Family) => `/topics/c/${f.id}`, samples: [
        typical<Family>(familyTopics, (f) => f.title, "how many topics it holds"), most<Family>("most", "Most topics", familyTopics, (f) => f.title, "topics"),
        fewest<Family>("fewest", "Fewest topics", familyTopics, (f) => f.title, "topics"), longestText<Family>("longest-title", "Longest title", (f) => f.title, "title"),
      ] }),
      variant({ id: "group", name: "A group opened", what: "One group's topics shown.", records: groups.filter((g) => g.group.topics.length <= 48), url: groupUrl, samples: [
        typical<Group>((g) => g.group.topics.length, (g) => g.group.title, "how many topics it holds"), fewest<Group>("fewest", "Fewest topics", (g) => g.group.topics.length, (g) => g.group.title, "topics"),
      ] }),
      variant({ id: "long-group", name: "A long group (A–Z list)", what: "Groups of more than 48 topics switch to an A–Z list with a filter.", records: groups.filter((g) => g.group.topics.length > 48), url: groupUrl, samples: [
        typical<Group>((g) => g.group.topics.length, (g) => g.group.title, "how many topics it holds"), most<Group>("most", "Most topics", (g) => g.group.topics.length, (g) => g.group.title, "topics"),
      ] }),
    ],
  };
  const home: TemplateDef = {
    id: "topics-home", area: "topics", name: "Topics home", address: "/topics", what: "Seven sections of cards and the great passages.",
    entries: ["src/pages/topics/TopicsHome.tsx"], scopes: ["src/pages/topics/"], variants: [single("home", "Topics home", "The front page.", "/topics")],
  };
  return { templates: [home, category, topic], valid: { topics: Object.keys(index.topics), aliases: Object.keys(index.aliases), categories: index.categories.map((c) => c.id) } };
}

interface Translation { slug: string; name: string; lang: string; dir: string; books: Record<string, string[]> }
interface Catalog { books: { code: string; name: string }[]; translations: Translation[] }

function readerTemplates(): { templates: TemplateDef[]; valid: { reader: Record<string, Record<string, number>> } } {
  const catalog = readJson<Catalog>("data/catalog.json");
  const stats = readJson<{ books: { code: string; name: string; chapters: number[][] }[] }>("data/stats.json");
  type Chapter = { v: Translation; book: string; name: string; chapter: number; words: number };
  const chaptersOf = (v: Translation): Chapter[] => Object.entries(v.books).flatMap(([book, list]) => list.map((c) => ({ v, book, name: catalog.books.find((b) => b.code === book)?.name ?? book, chapter: Number(c), words: 0 })));
  const kjvWords = new Map(stats.books.flatMap((b) => b.chapters.map((c, i) => [`${b.code} ${i + 1}`, c[1]] as const)));
  const kjv = catalog.translations.find((t) => t.slug === "kjv")!;
  const ltr = catalog.translations.filter((t) => t.dir !== "rtl"), rtl = catalog.translations.filter((t) => t.dir === "rtl");
  const all = (list: Translation[]) => list.flatMap(chaptersOf);
  const kjvChapters = chaptersOf(kjv).map((c) => ({ ...c, words: kjvWords.get(`${c.book} ${c.chapter}`) ?? 0 }));
  const url = (c: Chapter) => `/read/${c.v.slug}/${c.book}/${c.chapter}`;
  const name = (c: Chapter) => `${c.name} ${c.chapter} (${c.v.slug.toUpperCase()})`;
  const firstChapters = (list: Translation[]) => list.map((v) => chaptersOf(v)[0]).filter(Boolean);
  const pick = (slug: string, book: string, chapter: number, label: string, why: string): SampleRule<Chapter> => ({ id: `${slug}-${book}-${chapter}`.toLowerCase(), label, pick: (rs) => rs.find((c) => c.v.slug === slug && c.book === book && c.chapter === chapter), why: () => why });
  const missing = catalog.translations.flatMap((v) => catalog.books.filter((b) => !v.books[b.code] && kjv.books[b.code]).map((b) => ({ v, book: b.code, name: b.name, chapter: 1, words: 0 })));
  const ltrAll = all(ltr);
  const reader: TemplateDef = {
    id: "reader", area: "reader", name: "Bible reader chapter", address: "/read/<version>/<book>/<chapter>", instances: all(catalog.translations).length,
    what: `One chapter in one of ${catalog.translations.length} versions, with verse numbers, cross-references and the chapter's topics.`,
    entries: ["src/pages/ReaderPage.tsx"], scopes: ["src/pages/ReaderPage.tsx", "src/components/reader/"],
    variants: [
      variant({ id: "chapter", name: "A chapter (left to right)", what: "Every version written left to right.", records: ltrAll, url, samples: [
        { ...typical<Chapter>((c) => c.words, name, "length in words"), pick: () => kjvChapters.sort((a, b) => a.words - b.words)[Math.floor(kjvChapters.length / 2)] },
        { ...most<Chapter>("longest", "Longest chapter", (c) => c.words, name, "words"), pick: () => [...kjvChapters].sort((a, b) => b.words - a.words)[0] },
        { ...fewest<Chapter>("shortest", "Shortest chapter", (c) => c.words, name, "words"), pick: () => [...kjvChapters].sort((a, b) => a.words - b.words)[0] },
        pick("cuv", "JHN", 3, "Chinese script", "a non-Latin script: John 3 in the Chinese Union Version"),
      ], checkRecords: [...kjvChapters, ...firstChapters(ltr)], coverage: "every KJV chapter, and the first chapter of every version" }),
      variant({ id: "rtl", name: "A right-to-left version", what: "Hebrew, Arabic and Persian: the page runs right to left.", records: all(rtl), url, samples: [
        pick("wlc", "GEN", 1, "Hebrew", "Genesis 1 in the Hebrew text"), pick("svd", "PSA", 119, "Longest, Arabic", "the longest chapter (Psalm 119) in Arabic"),
      ], checkRecords: firstChapters(rtl), coverage: "the first chapter of each right-to-left version" }),
      variant({ id: "parallel", name: "Versions side by side", what: "Two or more versions in columns (?with=).", records: kjvChapters.map((c) => ({ ...c, with: "bsb,wlc" })), url: (c: Chapter & { with: string }) => `${url(c)}?with=${c.with}`, samples: [
        pick("kjv", "GEN", 1, "Three columns", "Genesis 1 in the KJV, the BSB and the Hebrew side by side (mixed directions)") as unknown as SampleRule<Chapter & { with: string }>,
      ], checkRecords: [], coverage: "not checked page by page (any chapter, any versions)" }),
      variant({ id: "not-in-version", name: "A book this version does not have", what: "For example Genesis in a New Testament–only version.", records: missing, url, samples: [firstOf<Chapter>(name, "case")], checkRecords: catalog.translations.map((v) => missing.find((m) => m.v === v)).filter((m): m is Chapter => Boolean(m)) }),
    ],
  };
  const valid = Object.fromEntries(catalog.translations.map((v) => [v.slug, Object.fromEntries(Object.entries(v.books).map(([b, list]) => [b, list.length]))]));
  const others: TemplateDef = {
    id: "bible-home", area: "reader", name: "The Bible (choose a book)", address: "/bible", what: "Every book, to open in the reader.",
    entries: ["src/pages/BiblePage.tsx"], scopes: ["src/pages/BiblePage.tsx"], variants: [single("page", "The Bible", "The book chooser.", "/bible")],
  };
  return { templates: [others, reader], valid: { reader: valid } };
}

interface PageDef { slug: string; title: string; sections: { id: string; title: string; picker?: boolean }[] }

async function letterTemplates(): Promise<{ templates: TemplateDef[]; valid: { letters: Record<string, string[]> } }> {
  registerSiteModules();
  const keys = ["paul", "hebrews", "general", "john"] as const;
  const files = { paul: "paul-letters", hebrews: "hebrews", general: "general-letters", john: "john-letters" };
  const groups = Object.fromEntries(keys.map((k) => [k, readJson<{ letters: { code: string; name?: string }[] }>(`src/data/letters/${files[k]}.json`)])) as Record<string, { letters: { code: string; name?: string }[] }>;
  const letters = keys.flatMap((k) => groups[k].letters);
  const byCode = new Map(letters.map((l) => [l.code, l]));
  const keyOf = new Map(keys.flatMap((k) => groups[k].letters.map((l) => [l.code, k] as const)));
  const data = { groups, overview: readJson("src/data/letters/overview.json"), browse: readJson("src/data/letters/browse.json"), letters, letter: (c: string) => byCode.get(c) ?? letters[0], groupOf: (c: string) => keyOf.get(c) ?? "paul" };
  const first = { paul: "ROM", hebrews: "HEB", general: "JAS", john: "1JN" };
  const chosen = Object.fromEntries(keys.map((k) => [k, [data.letter(first[k]), () => undefined]]));
  const { collectionPages } = (await import("../../src/components/letters/browse/pages-collections")) as { collectionPages: (d: never, c: never) => Record<string, PageDef> };
  const { wayPages } = (await import("../../src/components/letters/browse/pages-ways")) as { wayPages: (d: never, r: never) => Record<string, PageDef> };
  const collections = Object.values(collectionPages(data as never, chosen as never));
  const ways = Object.values(wayPages(data as never, (() => "") as never));
  type Section = { page: PageDef; id: string; title: string; picker?: boolean };
  const sections = (pages: PageDef[]): Section[] => pages.flatMap((page) => page.sections.map((s) => ({ page, ...s })));
  const url = (s: Section) => `/study/letters/${s.page.slug}/${s.id}`;
  const name = (s: Section) => `${s.page.title}: ${s.title}`;
  const sectionSamples = [firstOf<Section>(name, "section"), longestText<Section>("longest-title", "Longest title", (s) => s.title, "section title"), { id: "last", label: "Last", pick: (rs: Section[]) => rs.at(-1), why: (s: Section) => `the last section: ${name(s)}` }];
  const lettered = sections(collections).filter((s) => s.picker).flatMap((s) => letters.filter((l) => {
    const owner = collections.find((p) => p === s.page);
    return owner && groups[keyOf.get(l.code) ?? ""] && collections.indexOf(owner) === keys.indexOf(keyOf.get(l.code) ?? "paul") && groups[keyOf.get(l.code)!].letters.length > 1;
  }).map((l) => ({ ...s, code: l.code })));
  type Lettered = Section & { code: string };
  const section: TemplateDef = {
    id: "letters-section", area: "letters", name: "Letters section page", address: "/study/letters/<page>/<section>",
    what: "Each Letters page has three sections of four cards; each card opens its part (a chart, a map, a list).",
    entries: ["src/components/letters/browse/LettersBrowse.tsx"], scopes: ["src/components/letters/"],
    variants: [
      variant({ id: "collection", name: "A collection of letters", what: "Paul's letters, Hebrews, James–Peter–Jude, the letters of John.", records: sections(collections), url, samples: sectionSamples }),
      variant({ id: "way", name: "A way in across all the letters", what: "Christ in the letters, how they came to be, what runs through them, look closer.", records: sections(ways), url, samples: sectionSamples }),
      variant({ id: "one-letter", name: "One letter chosen", what: "The letter bar picks one letter (?letter=).", records: lettered, url: (s: Lettered) => `${url(s)}?letter=${s.code}`, samples: [firstOf<Lettered>((s) => s.code, "letter"), { id: "last", label: "Last", pick: (rs: Lettered[]) => rs.at(-1), why: (s: Lettered) => `the last: ${s.code}` }] }),
    ],
  };
  const home: TemplateDef = {
    id: "letters-home", area: "letters", name: "Letters home", address: "/study/letters", what: "Four collections and four ways in.",
    entries: ["src/components/letters/browse/LettersBrowse.tsx"], scopes: ["src/components/letters/browse/"], variants: [single("home", "Letters home", "The front page.", "/study/letters")],
  };
  const valid = Object.fromEntries([...collections, ...ways].map((p) => [p.slug, p.sections.map((s) => s.id)]));
  return { templates: [home, section], valid: { letters: valid } };
}

interface ApItem { id: string; title: string; topic?: string; sections?: unknown[]; studies?: string[] }

async function apologeticsTemplates(): Promise<{ templates: TemplateDef[]; valid: { apologetics: Record<string, string[]> } }> {
  const ap = (await import("../../src/generated/apologetics.ts")) as unknown as Record<string, ApItem[]>;
  const entries = ["src/pages/ApologeticsPage.tsx"], scopes = ["src/pages/ApologeticsPage.tsx", "src/pages/apologetics.css", "src/components/ApologeticsParts.tsx"];
  const t = (id: string, name: string, address: string, what: string, list: ApItem[], base: string, samples: SampleRule<ApItem>[]): TemplateDef => ({
    id, area: "apologetics", name, address, what, entries, scopes,
    variants: [variant({ id: "page", name, what, records: list, url: (x: ApItem) => `/apologetics/${base}/${x.id}`, samples })],
  });
  const size = (x: ApItem) => JSON.stringify(x).length;
  const study = t("ap-study", "Apologetics study", "/apologetics/study/<study>", "One question answered: the answer, the reasoning, the passages, related studies.", ap.STUDIES, "study", [
    typical<ApItem>(size, (x) => x.title, "length"), longestText<ApItem>("longest-title", "Longest title", (x) => x.title, "title"),
    most<ApItem>("most", "Most sections", (x) => x.sections?.length ?? 0, (x) => x.title, "sections"), fewest<ApItem>("fewest", "Shortest", size, (x) => x.title, "characters"),
  ]);
  const topic: TemplateDef = {
    id: "ap-topic", area: "apologetics", name: "Apologetics topic", address: "/apologetics/topics/<topic>", what: "The questions on one topic.", entries, scopes,
    variants: [
      variant({ id: "topic", name: "A topic", what: "The question library for one topic.", records: ap.TOPICS.filter((x) => x.id !== "reformed"), url: (x: ApItem) => `/apologetics/topics/${x.id}`, samples: [firstOf<ApItem>((x) => x.title, "topic"), longestText<ApItem>("longest-title", "Longest title", (x) => x.title, "title")] }),
      single("reformed", "Reformed theology", "The same, with the door into the Reformed texts.", "/apologetics/topics/reformed"),
    ],
  };
  const path = t("ap-path", "Learning path", "/apologetics/paths/<path>", "A guided order of studies, with progress kept on the device.", ap.PATHS, "paths", [
    most<ApItem>("most", "Most studies", (x) => x.studies?.length ?? 0, (x) => x.title, "studies"), fewest<ApItem>("fewest", "Fewest studies", (x) => x.studies?.length ?? 0, (x) => x.title, "studies"),
  ]);
  const worldview = t("ap-worldview", "Worldview", "/apologetics/worldviews/<worldview>", "The Christian starting point beside another belief, question by question.", ap.WORLDVIEWS, "worldviews", [firstOf<ApItem>((x) => x.title, "worldview"), { id: "last", label: "Last", pick: (rs) => rs.at(-1), why: (x) => `the other one: ${x.title}` }]);
  const debate = t("ap-debate", "Debate study", "/apologetics/debates/<debate>", "A recorded debate to study, with the questions underneath.", ap.DEBATES, "debates", [firstOf<ApItem>((x) => x.title, "debate"), longestText<ApItem>("longest-title", "Longest title", (x) => x.title, "title")]);
  const practice: TemplateDef = {
    id: "ap-practice", area: "apologetics", name: "Practice conversation", address: "/apologetics/practice?scenario=<scenario>", what: "Practise a conversation, step by step.", entries, scopes,
    variants: [variant({ id: "scenario", name: "A scenario", what: "One practice conversation.", records: ap.PRACTICE, url: (x: ApItem) => `/apologetics/practice?scenario=${x.id}`, samples: [firstOf<ApItem>((x) => x.title ?? x.id, "scenario"), longestText<ApItem>("longest-title", "Longest title", (x) => x.title ?? x.id, "title")] })],
  };
  const sectionPages: TemplateDef = {
    id: "ap-pages", area: "apologetics", name: "Apologetics section pages", address: "/apologetics/…", what: "The section's own one-off pages.", entries, scopes: [...scopes, "src/pages/ReformedLibraryPage.tsx"],
    variants: [
      single("hub", "Explore (the hub)", "The section's front page.", "/apologetics"),
      single("questions", "Questions", "Every question, with a filter.", "/apologetics/questions"),
      single("paths", "Learning paths", "Every path.", "/apologetics/paths"),
      single("worldviews", "Worldviews", "Every worldview.", "/apologetics/worldviews"),
      single("debates", "Debates", "Every debate.", "/apologetics/debates"),
      single("texts", "Historic texts", "The Reformed library.", "/apologetics/texts"),
      single("sources", "The source room", "Every source the section cites.", "/apologetics/sources"),
      single("saved", "My study", "What this device has saved.", "/apologetics/saved"),
    ],
  };
  const valid = { topics: ap.TOPICS.map((x) => x.id), study: ap.STUDIES.map((x) => x.id), paths: ap.PATHS.map((x) => x.id), worldviews: ap.WORLDVIEWS.map((x) => x.id), debates: ap.DEBATES.map((x) => x.id) };
  return { templates: [sectionPages, topic, study, path, worldview, debate, practice], valid: { apologetics: valid } };
}

function studyAndSiteTemplates(): TemplateDef[] {
  const one = (id: string, area: string, name: string, address: string, what: string, entries: string[], scopes: string[], variants = [single("page", name, what, address)]): TemplateDef => ({ id, area, name, address, what, entries, scopes, variants });
  return [
    one("study-hub", "study", "Study hub", "/study", "The ten study collections.", ["src/pages/study/StudyCollection.tsx"], ["src/pages/study/StudyCollection.tsx", "src/pages/study/study.css"]),
    one("study-charts", "study", "Study chart pages", "/study/<study>", "The four chart studies: connections, the shape of the Bible, Jesus & the Gospels, versions.", ["src/pages/ChartsPage.tsx"], ["src/pages/ChartsPage.tsx", "src/components/charts/"], [
      single("references", "Connections in Scripture", "Cross-reference arcs and the matrix.", "/study/references"),
      single("structure", "The shape of the Bible", "Sections, sizes and chapters.", "/study/structure"),
      single("gospels", "Jesus & the Gospels", "Portraits, words of Jesus, the harmony.", "/study/gospels"),
      single("versions", "Versions & languages", "The timeline and coverage.", "/study/versions"),
    ]),
    one("study-miracles", "study", "Miracles & encounters", "/study/miracles", "Every miracle, by who did it.", ["src/pages/study/MiraclesPage.tsx"], ["src/pages/study/MiraclesPage.tsx"]),
    one("study-names", "study", "Names & descriptions of God", "/study/names", "302 names of the Father, the Son and the Spirit.", ["src/pages/study/NamesPage.tsx"], ["src/pages/study/NamesPage.tsx"]),
    one("testimonies", "testimonies", "Testimonies", "/testimonies", "Testimonies on the family tree: explore, write one, or open with a key.", ["src/pages/TestimoniesPage.tsx"], ["src/pages/TestimoniesPage.tsx", "src/components/testimonies/"], [
      single("explore", "Explore", "The testimony tree.", "/testimonies"),
      single("join", "Write a testimony", "Without an invitation code.", "/testimonies/join"),
      single("access", "Open with a key", "Without a key.", "/testimonies/access"),
    ]),
    one("home", "site", "Home", "/", "The front page.", ["src/pages/HomePage.tsx"], ["src/pages/HomePage.tsx", "src/components/home/"]),
    one("search", "site", "Search", "/search?q=<words>", "Keyword search across the Bible.", ["src/pages/SearchPage.tsx"], ["src/pages/SearchPage.tsx", "src/components/search/"], [
      single("results", "With results", "A common word.", "/search?q=grace"),
      single("none", "No results", "A word that is not in the Bible.", "/search?q=zzzzqx"),
      single("empty", "Nothing searched yet", "The empty search page.", "/search"),
    ]),
    one("meaning-search", "site", "Search by meaning", "/search/meaning", "Meaning search that runs on the visitor's device.", ["src/pages/MeaningSearchPage.tsx"], ["src/pages/MeaningSearchPage.tsx", "src/lib/meaning/"]),
    one("sources", "site", "Sources & versions", "/sources", "Every source and version, with the corpus dashboard.", ["src/pages/VersionsPage.tsx"], ["src/pages/VersionsPage.tsx", "src/components/SourceDirectory.tsx", "src/components/sources/"]),
    one("library", "site", "The library", "/library", "The library of Bible versions.", ["src/pages/LibraryPage.tsx"], ["src/pages/LibraryPage.tsx"]),
    one("not-found", "site", "Page not found", "/<any wrong address>", "What a wrong address shows.", ["src/pages/NotFoundPage.tsx"], ["src/pages/NotFoundPage.tsx"], [single("page", "Page not found", "A wrong address.", "/this-page-does-not-exist")]),
    one("topic-superlist", "site", "Topic superlist (hidden)", "/topics/superlist", "The hidden list of every topic group, for review.", ["src/pages/topics/TopicSuperlist.tsx"], ["src/pages/topics/TopicSuperlist.tsx", "src/pages/topics/topic-superlist.css"], [single("page", "Topic superlist", "Not linked from the site.", "/topics/superlist")]),
  ];
}

export async function restTemplates() {
  const topics = topicTemplates(), reader = readerTemplates(), letters = await letterTemplates(), apologetics = await apologeticsTemplates();
  return {
    templates: [...studyAndSiteTemplates(), ...topics.templates, ...reader.templates, ...letters.templates, ...apologetics.templates],
    valid: { ...topics.valid, ...reader.valid, ...letters.valid, ...apologetics.valid },
  };
}
