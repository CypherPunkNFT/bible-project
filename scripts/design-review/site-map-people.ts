// People: the person page, the ruler / apostle / prophet pages and the People & genealogies guide.
import { readdirSync } from "node:fs";
import { fewest, longestText, most, readJson, single, typical, variant, type TemplateDef } from "./model.ts";

interface Row { id: string; n: string; b: string; c: number; g?: number }
interface Detail { s: string; article: string; short: string; refs: number[]; pa: string[]; si: string[]; sp: string[]; ch: string[]; story?: { short: string; paragraphs: unknown[] }; storyBy?: string; same?: string }
interface Summary { id: string; name: string; title: string; tagline: string; group: string; kind?: string; realm?: string; era?: string; books?: string[]; sex?: string; dates?: unknown }
type Full = Record<string, unknown> & { id: string; name: string; title: string };
interface Index { rulers: Summary[]; apostles: Summary[]; prophets: Summary[] }

const filled = (value: unknown) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length) && !(typeof value === "object" && !Array.isArray(value) && !Object.keys(value as object).length);
const richness = (r: Full) => Object.values(r).filter(filled).length;
const count = (r: Full, key: string) => (Array.isArray(r[key]) ? (r[key] as unknown[]).length : 0);

function loadPeople() {
  const rows = readJson<Row[]>("data/study/people.json");
  const details = new Map<string, Detail>();
  for (const file of readdirSync(new URL("../../data/study/people/", import.meta.url))) {
    if (file.endsWith(".json")) details.set(file.slice(0, -5), readJson<Detail>(`data/study/people/${file}`));
  }
  const index = readJson<Index>("src/data/people-pages/index.json");
  const full = new Map<string, Full>();
  for (const file of readdirSync(new URL("../../src/data/people-pages/", import.meta.url))) {
    if (!file.endsWith(".json") || file === "index.json") continue;
    const group = readJson<{ rulers?: Full[]; apostles?: Full[]; prophets?: Full[] }>(`src/data/people-pages/${file}`);
    for (const r of [...(group.rulers ?? []), ...(group.apostles ?? []), ...(group.prophets ?? [])]) full.set(`${file.split("-")[0]}:${r.id}`, r);
  }
  return { rows, details, index, full };
}

interface Person { row: Row; d: Detail; family: number }

export function peopleTemplates(): { templates: TemplateDef[]; valid: { people: string[]; special: Record<string, string[]> } } {
  const { rows, details, index, full } = loadPeople();
  const people: Person[] = rows.map((row) => {
    const d = details.get(row.id);
    if (!d) throw new Error(`design review: data/study/people/${row.id}.json missing for a row in people.json`);
    return { row, d, family: (d.pa?.length ?? 0) + (d.si?.length ?? 0) + (d.sp?.length ?? 0) + (d.ch?.length ?? 0) };
  });
  const special = { rule: new Set(index.rulers.map((r) => r.id)), mission: new Set(index.apostles.map((a) => a.id)), word: new Set(index.prophets.map((p) => p.id)) };
  const hasSpecial = (id: string) => special.rule.has(id) || special.mission.has(id) || special.word.has(id);
  const real = people.filter((p) => !p.d.same);
  const name = (p: Person) => p.row.n;
  const personUrl = (p: Person) => `/people/${p.row.id}`;
  const personSamples = (storyWord: string) => [
    typical<Person>((p) => p.row.c, name, "how often they are named"),
    longestText<Person>("longest-name", "Longest name", name, "name"),
    longestText<Person>("longest-line", "Longest description", (p) => p.row.b, "one-line description"),
    most<Person>("most-family", "Biggest family", (p) => p.family, name, "family links (parents, siblings, spouses, children)"),
    fewest<Person>("fewest", "Least said", (p) => (p.d.story ? JSON.stringify(p.d.story).length : p.d.article.length), name, `characters of ${storyWord}`),
  ];
  const withAspect = (aspect: keyof typeof special) => real.filter((p) => special[aspect].has(p.row.id));

  const person: TemplateDef = {
    id: "person", area: "people", name: "Person page",
    what: "One page for every person in the Bible: who they were, their family, where they are named, and their story.",
    address: "/people/<person>", instances: rows.length,
    entries: ["src/pages/PersonPage.tsx", "src/components/study/PersonProfile.tsx"], scopes: ["src/components/study/PersonProfile.tsx", "src/components/people-pages/PersonEntry.tsx"],
    variants: [
      variant({ id: "sourced-story", name: "With the site's own sourced story", what: "The story is written from Scripture by this site, every paragraph linked to its verses.", records: real.filter((p) => p.d.storyBy === "site"), url: personUrl, samples: personSamples("story") }),
      variant({ id: "step-text", name: "With STEP Bible's text", what: "No story of our own yet: STEP Bible's summary and article, which STEP says were adapted from AI output.", records: real.filter((p) => p.d.storyBy !== "site" && !hasSpecial(p.row.id) && !p.row.g), url: personUrl, samples: personSamples("article") }),
      variant({ id: "with-ruler", name: "With a ruler page", what: "Also has a ruler page: the switch between the pages and the entry card.", records: withAspect("rule"), url: personUrl, samples: personSamples("story").slice(0, 3) }),
      variant({ id: "with-apostle", name: "With an apostle or early-church page", what: "Also has a mission page: the switch and the entry card.", records: withAspect("mission"), url: personUrl, samples: personSamples("story").slice(0, 3) }),
      variant({ id: "with-prophet", name: "With a prophet page", what: "Also has a prophet page (\"the word\"); three people also have a ruler page.", records: withAspect("word"), url: personUrl, samples: [...personSamples("story").slice(0, 2), most<Person>("most-pages", "Most special pages", (p) => [special.rule, special.mission, special.word].filter((s) => s.has(p.row.id)).length, name, "special pages")] }),
      variant({ id: "tribe", name: "A tribe or clan", what: "A people group recorded as a person (hidden from the people list, but the page exists).", records: real.filter((p) => p.row.g), url: personUrl, samples: personSamples("article").slice(0, 3) }),
      variant({ id: "duplicate", name: "A second record of the same person", what: "Opens the main record's page instead.", records: people.filter((p) => p.d.same), url: personUrl, samples: [{ id: "page", label: "The redirect", pick: (rs) => rs[0], why: (p) => `the only duplicate record: ${p.row.id} opens ${p.d.same}` }] }),
    ],
  };

  const rulerFull = (r: Summary) => full.get(`rulers:${r.id}`) ?? ({ id: r.id, name: r.name, title: r.title } as Full);
  const rulerName = (r: Summary) => r.name;
  const isConsort = (r: Summary) => r.kind === "queen" && /wife of/i.test(r.title);
  const rulerSamples = [
    typical<Summary>((r) => richness(rulerFull(r)), rulerName, "how many sections the page has"),
    longestText<Summary>("longest-name", "Longest name", rulerName, "name"),
    longestText<Summary>("longest-title", "Longest title", (r) => r.title, "title"),
    most<Summary>("most-events", "Most events", (r) => count(rulerFull(r), "events"), rulerName, "events in the reign"),
    fewest<Summary>("fewest", "Fewest sections", (r) => richness(rulerFull(r)), rulerName, "sections"),
  ];
  const rulersBy = (test: (r: Summary) => boolean) => index.rulers.filter(test);
  const rulerUrl = (r: Summary) => `/people/${r.id}/rule`;
  const rulerVariant = (id: string, name: string, what: string, test: (r: Summary) => boolean) => variant({ id, name, what, records: rulersBy(test), url: rulerUrl, samples: rulerSamples });
  const ruler: TemplateDef = {
    id: "ruler", area: "people", name: "Ruler page", address: "/people/<person>/rule", instances: index.rulers.length,
    what: "A ruler's reign: the succession strip, dates, what Scripture says of the reign, the world around it.",
    entries: ["src/components/people-pages/RulerPage.tsx"], scopes: ["src/components/people-pages/", "src/components/StableTip.tsx", "src/components/stable-tip.css"],
    signature: { selector: ".pp-strip-frame", label: "The succession strip" },
    variants: [
      rulerVariant("king-judah", "King of Judah", "The southern kingdom's kings, on Judah's lane.", (r) => r.kind === "king" && r.realm === "judah"),
      rulerVariant("king-israel", "King of Israel", "The northern kingdom's kings, on Israel's lane.", (r) => r.kind === "king" && r.realm === "israel"),
      rulerVariant("king-united", "King of the united kingdom", "Saul, David, Solomon (and Ish-bosheth).", (r) => r.kind === "king" && r.realm === "united"),
      rulerVariant("judge", "Judge", "The cycle ring (sin, oppression, cry, deliverer) and no dates.", (r) => r.kind === "judge"),
      rulerVariant("leader", "Leader before the judges", "Moses and Joshua: the cycle-first order.", (r) => r.kind === "leader"),
      rulerVariant("queen-reigning", "Reigning queen", "A queen who ruled in her own right.", (r) => r.kind === "queen" && !isConsort(r)),
      rulerVariant("queen-consort", "Queen consort", "A king's wife: \"As queen\" instead of a reign.", isConsort),
      rulerVariant("foreign-dated", "Foreign king with dates", "Egypt, Aram, Assyria, Babylon, Persia: the world-first order.", (r) => r.kind === "foreign" && Boolean(r.dates)),
      rulerVariant("foreign-undated", "Foreign king without dates", "Unnamed Pharaohs and kings Scripture does not date.", (r) => r.kind === "foreign" && !r.dates),
      rulerVariant("governor", "Governor", "The chain of authority above him.", (r) => r.kind === "governor"),
      rulerVariant("herod", "Herod", "The Herod family strip.", (r) => r.kind === "herod"),
      rulerVariant("roman", "Roman official", "Emperors, governors and procurators: the chain of authority.", (r) => r.kind === "roman"),
    ],
  };

  const apostleFull = (a: Summary) => full.get(`apostles:${a.id}`) ?? full.get(`church:${a.id}`) ?? ({ id: a.id, name: a.name, title: a.title } as Full);
  const apostleSamples = [
    typical<Summary>((a) => richness(apostleFull(a)), (a) => a.name, "how many sections the page has"),
    longestText<Summary>("longest-name", "Longest name", (a) => a.name, "name"),
    most<Summary>("most-moments", "Most moments", (a) => count(apostleFull(a), "moments") + count(apostleFull(a), "acts"), (a) => a.name, "moments and acts"),
    fewest<Summary>("fewest", "Fewest sections", (a) => richness(apostleFull(a)), (a) => a.name, "sections"),
  ];
  const apostleUrl = (a: Summary) => `/people/${a.id}/mission`;
  const apostleVariant = (id: string, name: string, what: string, test: (a: Summary) => boolean) => variant({ id, name, what, records: index.apostles.filter(test), url: apostleUrl, samples: apostleSamples });
  const apostle: TemplateDef = {
    id: "apostle", area: "people", name: "Apostle and early-church page", address: "/people/<person>/mission", instances: index.apostles.length,
    what: "An apostle's or early Christian's life and mission: calling, moments, places, companions, writings, ending.",
    entries: ["src/components/people-pages/ApostlePage.tsx"], scopes: ["src/components/people-pages/", "src/components/StableTip.tsx", "src/components/stable-tip.css"],
    signature: { selector: ".pp-hero", label: "The opening card" },
    variants: [
      apostleVariant("twelve", "One of the Twelve (and Matthias, Paul)", "With their place in the lists of the Twelve.", (a) => a.group.startsWith("apostles-")),
      apostleVariant("jerusalem", "The Jerusalem church", "James, Stephen, Barnabas and others.", (a) => a.group === "church-jerusalem"),
      apostleVariant("pauls-circle", "Paul's companions", "Timothy, Titus, Luke and others.", (a) => a.group === "church-pauls-circle"),
      apostleVariant("couple", "A couple", "Priscilla and Aquila, one page for two people.", (a) => a.sex === "G"),
    ],
  };

  const prophetFull = (p: Summary) => full.get(`prophets:${p.id}`) ?? ({ id: p.id, name: p.name, title: p.title } as Full);
  const prophetSamples = [
    typical<Summary>((p) => richness(prophetFull(p)), (p) => p.name, "how many sections the page has"),
    longestText<Summary>("longest-name", "Longest name", (p) => p.name, "name"),
    most<Summary>("most-words", "Most words", (p) => count(prophetFull(p), "words"), (p) => p.name, "recorded words"),
    fewest<Summary>("fewest", "Fewest sections", (p) => richness(prophetFull(p)), (p) => p.name, "sections"),
  ];
  const prophetUrl = (p: Summary) => `/people/${p.id}/word`;
  const prophetVariant = (id: string, name: string, what: string, test: (p: Summary) => boolean) => variant({ id, name, what, records: index.prophets.filter(test), url: prophetUrl, samples: prophetSamples });
  const prophet: TemplateDef = {
    id: "prophet", area: "people", name: "Prophet page (\"the word\")", address: "/people/<person>/word", instances: index.prophets.length,
    what: "A prophet's call, message, words, signs and fulfilment, with the kings of their time.",
    entries: ["src/components/people-pages/ProphetPage.tsx"], scopes: ["src/components/people-pages/", "src/components/StableTip.tsx", "src/components/stable-tip.css"],
    signature: { selector: ".pp-hero", label: "The opening card" },
    variants: [
      prophetVariant("writing", "A prophet with a book", "The writing prophets: their book's outline is on the page.", (p) => Boolean(p.books?.length)),
      prophetVariant("prophet", "A prophet without a book", "Prophets, seers and singers known from the histories.", (p) => !p.books?.length && ["prophet", "seer", "singer"].includes(p.kind ?? "") && p.era !== "nt"),
      prophetVariant("prophetess", "A prophetess", "Miriam, Deborah, Huldah and others.", (p) => p.kind === "prophetess"),
      prophetVariant("false", "A false prophet", "Prophets Scripture says the LORD did not send.", (p) => p.kind === "false"),
      prophetVariant("new-testament", "A New Testament prophet", "From Zacharias and Anna to Agabus.", (p) => p.kind === "nt" || p.era === "nt"),
    ],
  };

  const guide: TemplateDef = {
    id: "people-guide", area: "people", name: "People & genealogies guide", address: "/study/people?view=<view>",
    what: "The people study: everyone, families, prophets through time, the rulers and the apostles guides.",
    entries: ["src/pages/study/PeoplePage.tsx", "src/pages/study/ProphetsPage.tsx"], scopes: ["src/pages/study/PeoplePage.tsx", "src/pages/study/ProphetsPage.tsx", "src/components/study/PeopleCatalog.tsx", "src/components/study/people-catalog.css", "src/components/study/GenealogyExplorer.tsx", "src/components/study/genealogy.css", "src/components/study/ProphetsRiver.tsx", "src/components/study/prophets-river.css", "src/components/people-pages/RulersGuide.tsx", "src/components/people-pages/ApostlesGuide.tsx"],
    variants: [
      single("everyone", "Everyone", "The most-named people and the whole catalogue.", "/study/people"),
      single("families", "Families", "The genealogy explorer.", "/study/people?view=families"),
      single("prophets", "Prophets through time", "The prophets river inside the guide.", "/study/people?view=prophets"),
      single("rulers", "The rulers", "Every ruler, lane by lane.", "/study/people?view=rulers"),
      single("apostles", "The apostles", "The Twelve and the early church.", "/study/people?view=apostles"),
      single("prophets-page", "Prophets through time (its own page)", "The same river on its own address.", "/study/prophets"),
    ],
  };

  return {
    templates: [person, ruler, apostle, prophet, guide],
    valid: { people: rows.map((r) => r.id), peopleSlugs: readJson<{ slugs: Record<string, string> }>("src/data/people-slugs.json").slugs, special: { rule: [...special.rule], mission: [...special.mission], word: [...special.word] } },
  };
}
