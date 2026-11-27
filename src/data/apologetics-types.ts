import type { Span } from "../lib/study";

/** Topic membership is checked against the source documents by the content compiler. */
export type TopicId = string;
export type SourceRole = "Baptist confession" | "Baptist exposition" | "Reformed confession" | "Reformed exposition" | "Historic Christian witness" | "Catholic contribution · limited scope" | "Scholarship · described, not quoted" | "Primary record · not a teaching authority";
/** The roles that count as teaching sources: a published study needs one of them beside Scripture (Baptist Faith and Message 2000 footing, plan APOLOGETICS-FIELDS step 1). */
export const TEACHING_ROLES: readonly SourceRole[] = ["Baptist confession", "Baptist exposition", "Reformed confession", "Reformed exposition"];
export interface ApSource { id: string; title: string; author: string; kind: string; url: string; note: string; role: SourceRole }
export type ApCitation = { kind: "scripture"; span: Span } | { kind: "source"; source: string; locator: string };
export interface CitedText { id?: string; text: string; citations: ApCitation[] }
export interface ApTopic { id: string; title: string; short: string; color: string; description: string; question: string }
export interface ApPath { id: string; title: string; label: string; description: string; studies: string[] }
export interface ApReadingPlan { introduction: string; stages: { title: string; aim: string; readings: { source: string; title: string; context: CitedText; purpose: CitedText; examine: CitedText; connection: CitedText; christian: CitedText }[] }[] }
export interface ApWorldview { readingPlan?: ApReadingPlan; otherLabel: string; id: string; title: string; subtitle: string; description: string; studies: string[]; sources: string[]; rows: { id: string; question: string; christian: string; other: string; study: string; christianBasis: ApCitation[]; otherBasis: ApCitation[] }[] }
export interface ApDebate { recording?: { url: string; label: string; credit: string; duration: string; note: string }; transcriptCoverage?: string; id: string; title: string; speakers: string; setting: string; source: string; lens: string; description: string; claim: string; basis: ApCitation[]; hinge: string; prompts: string[]; studies: string[] }
export interface ApPractice { label: string; id: string; title: string; context: string; question: string; options: string[]; best: number; explanation: string; basis: ApCitation[]; study: string; prompt: string }
export interface ApConversationStep { title: string; line: string; detail: string; prompt: string; span: Span }
export interface ApEditorial {
  foundations: string[]; guideNote: string; debateNote: string; debateIndexNote: string; sourceRoomIntro: string; sourceRoomNote: string; footerTitle: string; footerText: string; practiceNote: string;
  policy: { eyebrow: string; title: string; introduction: CitedText; sections: (CitedText & { id: string; title: string })[] };
}
/** The ten forms an article can take (plan APOLOGETICS-FIELDS §3; scripts/content/formats.ts). Absent on today's articles. */
export type ApStudyFormat = "short-answer" | "essay" | "objections" | "figure" | "reading" | "timeline" | "debate-guide" | "glossary" | "faq" | "case-study";
export interface ApRef { span: Span; note: string }
export interface ApObjectionPair { id: string; heldBy: string[]; objection: string; reply: CitedText }
export interface ApEssayPart { id: string; title: string; blocks: CitedText[]; passages: ApRef[] }
export interface ApFigure { name: string; dates: string; tradition: string; roles: string[]; citations: ApCitation[] }
export interface ApFigureWork { title: string; date: string; url?: string; note: string }
/** Public-domain text from the named edition: shown as quoted English, never translated. */
export interface ApExtract { id: string; source: string; locator: string; edition: string; translator: string; text: string; note: CitedText }
export interface ApTimelineEvent extends CitedText { id: string; title: string; date: string; certainty: "exact" | "circa" | "debated" | "estimate"; dateNote?: string }
export interface ApView { id: string; label: string; heldBy: string[]; texts: ApRef[]; case: CitedText; reply: CitedText }
export interface ApTerm extends CitedText { id: string; term: string; seeAlso: string[]; siteDefinition?: boolean }
export interface ApQuestion extends CitedText { id: string; question: string; study?: string }
/** A declared format's own fields. Today's fields stay present on every study (empty where a format lacks them). */
export interface ApStudyFormatFields {
  format?: ApStudyFormat; spine?: "academic" | "scripture-theology"; alsoIn?: TopicId[]; debates?: string[];
  /** Words of all its text; set for a declared format, whose reading time counts everything. */
  words?: number;
  objections?: ApObjectionPair[]; parts?: ApEssayPart[]; figure?: ApFigure; works?: ApFigureWork[]; extracts?: ApExtract[];
  events?: ApTimelineEvent[]; views?: ApView[]; common?: CitedText; terms?: ApTerm[]; questions?: ApQuestion[];
}
export interface ApStudy extends ApStudyFormatFields {
  id: string; title: string; topic: TopicId; summary: string; answer: string;
  reasoning: string[]; conclusion: string; sections: { title: string; body: string }[];
  objection: string; reply: string; limit: string; prompt: string;
  refs: { span: Span; note: string }[]; sources: string[]; related: string[]; keywords: string[];
  support: { answer: ApCitation[]; reasoning: ApCitation[][]; conclusion: ApCitation[]; sections: ApCitation[][]; reply: ApCitation[]; limit: ApCitation[]; prompt: ApCitation[] };
}
