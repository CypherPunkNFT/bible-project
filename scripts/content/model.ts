export type DocumentKind = "study" | "source" | "topic" | "path" | "worldview" | "debate" | "practice" | "editorial";
export const FOLDERS: Record<DocumentKind, string> = { study: "studies", source: "sources", topic: "topics", path: "paths", worldview: "worldviews", debate: "debates", practice: "practice", editorial: "editorial" };
export type Citation = { kind: "scripture"; reference: string } | { kind: "source"; source: string; locator: string };
export interface Block { id: string; text: string; citations: Citation[] }
export interface Section extends Block { title: string }
export interface Review { date: string; reviewer: string; kind: "ai-assisted" | "human"; scope: string; contentHash: string; basisHash: string; note: string }
export interface StudyContent {
  title: string; topic: string; summary: string; answer: Block; reasoning: Block[]; conclusion: Block;
  sections: Section[]; objection: string; reply: Block; limit: Block; prompt: Block;
  passages: { reference: string; note: string }[]; related: string[]; keywords: string[];
}
export interface SourceContent { title: string; author: string; kind: string; url: string; role: string; note: string }
export interface TopicContent { title: string; short: string; color: string; description: string; question: string }
export interface PathContent { title: string; label: string; description: string; studies: string[] }
export interface ReadingPlan { introduction: string; stages: { title: string; aim: string; readings: { source: string; title: string; context: Block; purpose: Block; examine: Block; connection: Block; christian: Block }[] }[] }
export interface WorldviewContent {
  readingPlan?: ReadingPlan;
  title: string; otherLabel: string; subtitle: string; description: string; studies: string[]; sources: string[];
  rows: { id: string; question: string; christian: Block; other: Block; study: string }[];
}
export interface DebateContent { title: string; speakers: string; setting: string; source: string; lens: string; description: string; claim: Block; hinge: string; prompts: string[]; studies: string[] }
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
