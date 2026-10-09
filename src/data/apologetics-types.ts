import type { Span } from "../lib/study";

/** Topic membership is checked against the source documents by the content compiler. */
export type TopicId = string;
export type SourceRole = "Reformed confession" | "Reformed exposition" | "Historic Christian witness" | "Catholic contribution · limited scope" | "Primary record · not a teaching authority";
export interface ApSource { id: string; title: string; author: string; kind: string; url: string; note: string; role: SourceRole }
export type ApCitation = { kind: "scripture"; span: Span } | { kind: "source"; source: string; locator: string };
export interface CitedText { id?: string; text: string; citations: ApCitation[] }
export interface ApTopic { id: string; title: string; short: string; color: string; description: string; question: string }
export interface ApPath { id: string; title: string; label: string; description: string; studies: string[] }
export interface ApReadingPlan { introduction: string; stages: { title: string; aim: string; readings: { source: string; title: string; context: CitedText; purpose: CitedText; examine: CitedText; connection: CitedText; christian: CitedText }[] }[] }
export interface ApWorldview { readingPlan?: ApReadingPlan; otherLabel: string; id: string; title: string; subtitle: string; description: string; studies: string[]; sources: string[]; rows: { id: string; question: string; christian: string; other: string; study: string; christianBasis: ApCitation[]; otherBasis: ApCitation[] }[] }
export interface ApDebate { id: string; title: string; speakers: string; setting: string; source: string; lens: string; description: string; claim: string; basis: ApCitation[]; hinge: string; prompts: string[]; studies: string[] }
export interface ApPractice { label: string; id: string; title: string; context: string; question: string; options: string[]; best: number; explanation: string; basis: ApCitation[]; study: string; prompt: string }
export interface ApConversationStep { title: string; line: string; detail: string; prompt: string; span: Span }
export interface ApEditorial {
  foundations: string[]; guideNote: string; debateNote: string; debateIndexNote: string; sourceRoomIntro: string; sourceRoomNote: string; footerTitle: string; footerText: string; practiceNote: string;
  policy: { eyebrow: string; title: string; introduction: CitedText; sections: (CitedText & { id: string; title: string })[] };
}
export interface ApStudy {
  id: string; title: string; topic: TopicId; summary: string; answer: string;
  reasoning: string[]; conclusion: string; sections: { title: string; body: string }[];
  objection: string; reply: string; limit: string; prompt: string;
  refs: { span: Span; note: string }[]; sources: string[]; related: string[]; keywords: string[];
  support: { answer: ApCitation[]; reasoning: ApCitation[][]; conclusion: ApCitation[]; sections: ApCitation[][]; reply: ApCitation[]; limit: ApCitation[]; prompt: ApCitation[] };
}
