import { STUDY_FORMATS, type Block, type ContentDocument, type StudyContent, type StudyFormat } from "./model.ts";

/** One complete draft study of each format, for the tests. They cite published documents of the live collection
 * (the 1689 confession, Romans 3, the morality study, the Craig–Ehrman debate) so a published copy validates too.
 * Each carries a marker word, fixturemark<format>, inside its format's own items and nowhere in its title or summary,
 * so a test can find it in the generated file, the Markdown and search only if the format's text was carried. */
const CITES = () => [{ kind: "scripture" as const, reference: "Romans 3:10-12" }, { kind: "source" as const, source: "lbcf", locator: "16.5" }];
const block = (id: string, text: string): Block => ({ id, text, citations: CITES() });
const times = <T>(count: number, make: (n: number) => T) => Array.from({ length: count }, (_, i) => make(i + 1));
/** The public-domain record the reading fixture's extract needs on the 1689 confession; tests add it to their copy. */
export const PUBLIC_DOMAIN = { edition: "1677/1689 text as this project holds it", basis: "Published 1677 and 1689; test fixture record." };
export const marker = (format: StudyFormat) => "fixturemark" + format.replace(/-/g, "");

function extras(format: StudyFormat, mark: string): Partial<StudyContent> {
  const pair = (n: number) => ({ id: `objection-${n}`, heldBy: ["David Hume"], objection: `Objection ${n} in its holder's terms. ${mark}`, reply: block(`objection-${n}-reply`, `Reply ${n}. ${mark}`) });
  switch (format) {
    case "short-answer": return { reasoning: [block("reason-1", "First reason."), block("reason-2", "Second reason.")], conclusion: block("conclusion", "Conclusion."),
      sections: [{ ...block("section-1", "Section text."), title: "A section" }], objection: "The original objection.", reply: block("reply", "The original reply."),
      limit: block("limit", "Where this stops."), prompt: block("conversation", "A question to ask."), objections: [pair(1), pair(2)] };
    case "essay": return { spine: "academic", parts: times(3, (n) => ({ id: `part-${n}`, title: `Part ${n}`, blocks: [block(`part-${n}-text`, `Part ${n} argument. ${mark}`)], passages: [{ reference: "Romans 3:23", note: "Read it." }] })),
      limit: block("limit", "Where the evidence stops.") };
    case "objections": return { objections: times(5, pair) };
    case "figure": return { figure: { name: "Andrew Fuller", dates: "1754–1815", tradition: "Particular Baptist", roles: ["pastor", `theologian ${mark}`], citations: CITES() },
      sections: ["Life", "What he argued", "Legacy"].map((title, i) => ({ ...block(`section-${i + 1}`, `${title} text. ${mark}`), title })),
      works: [{ title: "The Gospel Worthy of All Acceptation", date: "1785", url: "https://archive.org/", note: `Public-domain copy. ${mark}` }] };
    case "reading": return { extracts: [{ id: "extract-1", source: "lbcf", locator: "16.5", edition: PUBLIC_DOMAIN.edition, translator: "Written in English",
      text: `The extract text. ${mark}`, note: block("extract-1-note", `The guided note. ${mark}`) }] };
    case "timeline": return { events: times(12, (n) => ({ ...block(`event-${n}`, `Event ${n}. ${mark}`), title: `Event ${n}`, date: `${100 + n}`,
      certainty: n === 1 ? "debated" as const : "circa" as const, ...(n === 1 ? { dateNote: "Scholars date it 30 or 33." } : {}) })) };
    case "debate-guide": return { common: block("common", `What all affirm. ${mark}`), views: times(2, (n) => ({ id: `view-${n}`, label: `View ${n}`, heldBy: [`Tradition ${n}`],
      texts: [{ reference: "Romans 3:23", note: "A text." }], case: block(`view-${n}-case`, `The case for view ${n}. ${mark}`), reply: block(`view-${n}-reply`, `A reply to view ${n}.`) })) };
    case "glossary": return { terms: times(25, (n) => ({ ...block(`term-${n}`, `Definition ${n}. ${mark}`), term: `Term ${n}`, seeAlso: [`term-${n === 25 ? 1 : n + 1}`],
      ...(n === 25 ? { citations: [], siteDefinition: true } : {}) })) };
    case "faq": return { questions: times(8, (n) => ({ ...block(`question-${n}`, `Answer ${n}. ${mark}`), question: `Question ${n}?`, ...(n === 1 ? { study: "morality" } : {}) })) };
    case "case-study": return { spine: "academic", sections: ["Setting", "The claim", "The evidence", "What survives"].map((title, i) => ({ ...block(`section-${i + 1}`, `${title}. ${mark}`), title })),
      limit: block("limit", "What survives, and what am I inferring.") };
  }
}

export function formatFixture(format: StudyFormat): ContentDocument<"study"> {
  const content: StudyContent = { title: `A ${format} fixture?`, topic: "jesus", summary: "A test fixture.", format, answer: block("answer", "The lede."),
    passages: [{ reference: "Romans 3:10-12", note: "Read it." }], related: ["morality"], keywords: ["fixture"], alsoIn: ["doubt"], debates: ["craig-ehrman"], ...extras(format, marker(format)) };
  return { $schema: "../schema.json", schemaVersion: 1, kind: "study", id: `fixture-${format}`, order: 9000 + STUDY_FORMATS.indexOf(format), publication: "draft", content, reviews: [] };
}
