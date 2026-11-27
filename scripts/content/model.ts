export type DocumentKind = "study" | "source" | "topic" | "path" | "worldview" | "debate" | "practice" | "editorial";
export const FOLDERS: Record<DocumentKind, string> = { study: "studies", source: "sources", topic: "topics", path: "paths", worldview: "worldviews", debate: "debates", practice: "practice", editorial: "editorial" };
export type Citation = { kind: "scripture"; reference: string } | { kind: "source"; source: string; locator: string };
export interface Block { id: string; text: string; citations: Citation[] }
export interface Section extends Block { title: string }
export interface Review { date: string; reviewer: string; kind: "ai-assisted" | "human"; scope: string; contentHash: string; basisHash: string; note: string }
/** The ten forms one study can take (plan APOLOGETICS-FIELDS §3). A study without `format` is today's short answer and
 * keeps today's rules; declaring a format applies that format's rules (scripts/content/formats.ts). */
export const STUDY_FORMATS = ["short-answer", "essay", "objections", "figure", "reading", "timeline", "debate-guide", "glossary", "faq", "case-study"] as const;
export type StudyFormat = typeof STUDY_FORMATS[number];
/** The study standard's two spines (Pages/Study/STUDY-STANDARD.md): weighing evidence, or formation. */
export type StudySpine = "academic" | "scripture-theology";
export interface Passage { reference: string; note: string }
export interface ObjectionPair { id: string; heldBy: string[]; objection: string; reply: Block }
export interface EssayPart { id: string; title: string; blocks: Block[]; passages: Passage[] }
export interface Figure { name: string; dates: string; tradition: string; roles: string[]; citations: Citation[] }
export interface FigureWork { title: string; date: string; url?: string; note: string }
/** Public-domain text only: the build refuses an extract whose source has not been checked against a copy or a named edition. */
export interface Extract { id: string; source: string; locator: string; edition: string; translator: string; text: string; note: Block }
export interface TimelineEvent extends Block { title: string; date: string; certainty: "exact" | "circa" | "debated" | "estimate"; dateNote?: string }
export interface View { id: string; label: string; heldBy: string[]; texts: Passage[]; case: Block; reply: Block }
export interface Term extends Block { term: string; seeAlso: string[]; siteDefinition?: boolean }
export interface Question extends Block { question: string; study?: string }
export interface StudyContent {
  title: string; topic: string; summary: string; answer: Block; passages: Passage[]; related: string[]; keywords: string[];
  format?: StudyFormat; spine?: StudySpine; alsoIn?: string[]; debates?: string[];
  reasoning?: Block[]; conclusion?: Block; sections?: Section[]; objection?: string; reply?: Block; limit?: Block; prompt?: Block;
  objections?: ObjectionPair[]; parts?: EssayPart[]; figure?: Figure; works?: FigureWork[]; extracts?: Extract[];
  events?: TimelineEvent[]; views?: View[]; common?: Block; terms?: Term[]; questions?: Question[];
}
/** read and checked are the register's own record of what was read and how; they are kept out of the site data. */
export interface SourceContent { title: string; author: string; kind: string; url: string; role: string; note: string; read: string; checked: "corpus" | "edition" | "none"; publicDomain?: PublicDomainRecord }
/** The edition or translation of a source verified to be public domain, and on what basis; only such a source may be
 * quoted in an extract, and only from that edition (owner decision 3, 2026-11-27). Kept out of the site data. */
export interface PublicDomainRecord { edition: string; basis: string }
export interface TopicContent { title: string; short: string; color: string; description: string; question: string }
export interface PathContent { title: string; label: string; description: string; studies: string[] }
export interface ReadingPlan { introduction: string; stages: { title: string; aim: string; readings: { source: string; title: string; context: Block; purpose: Block; examine: Block; connection: Block; christian: Block }[] }[] }
export interface WorldviewContent {
  readingPlan?: ReadingPlan;
  title: string; otherLabel: string; subtitle: string; description: string; studies: string[]; sources: string[];
  rows: { id: string; question: string; christian: Block; other: Block; study: string }[];
}
export interface DebateContent { recording?: { url: string; label: string; credit: string; duration: string; note: string }; transcriptCoverage?: string; title: string; speakers: string; setting: string; source: string; lens: string; description: string; claim: Block; hinge: string; prompts: string[]; studies: string[] }
export interface PracticeContent { label: string; title: string; context: string; question: string; options: string[]; best: number; explanation: Block; study: string; prompt: string }
export interface EditorialContent {
  title: string; anchor: string; foundations: string[]; islamStudyQuestions: string[];
  conversationSteps: { id: string; title: string; line: string; detail: string; prompt: string; reference: string }[];
  policy: { eyebrow: string; title: string; introduction: Block; sections: Section[] };
  copy: { guideNote: string; debateNote: string; debateIndexNote: string; sourceRoomIntro: string; sourceRoomNote: string; footerTitle: string; footerText: string; practiceNote: string };
}
interface Contents { study: StudyContent; source: SourceContent; topic: TopicContent; path: PathContent; worldview: WorldviewContent; debate: DebateContent; practice: PracticeContent; editorial: EditorialContent }
export type ContentDocument<K extends DocumentKind = DocumentKind> = { [P in K]: {
  $schema: string; schemaVersion: 1; kind: P; id: string; order: number; publication: "draft" | "published";
  content: Contents[P]; reviews: Review[];
} }[K];
export interface LoadedDocument { file: string; document: ContentDocument }
export interface Issue { severity: "error" | "warning"; file: string; pointer: string; message: string }
export interface ScriptureBook { name: string; code: string; num: number; chapters: number[] }
export interface ScriptureIndex { schemaVersion: 1; translation: "kjv"; books: ScriptureBook[] }
export const documentKey = (document: ContentDocument) => `${document.kind}/${document.id}`;

export function walk(value: unknown, visit: (value: Record<string, unknown>, pointer: string) => void, pointer = "") {
  if (Array.isArray(value)) value.forEach((entry, i) => walk(entry, visit, `${pointer}/${i}`));
  else if (value && typeof value === "object") {
    visit(value as Record<string, unknown>, pointer);
    for (const [key, entry] of Object.entries(value)) walk(entry, visit, `${pointer}/${key}`);
  }
}
export function citationsIn(value: unknown): Citation[] {
  const citations: Citation[] = [];
  walk(value, (entry) => { if (entry.kind === "scripture" || entry.kind === "source") citations.push(entry as unknown as Citation); });
  return citations;
}
