import type { Span } from "../lib/study";

export type TopicId = "god" | "jesus" | "bible" | "doubt" | "worldviews" | "faith";
export type SourceRole = "Reformed confession" | "Reformed exposition" | "Historic Christian witness" | "Catholic contribution · limited scope" | "Primary record · not a teaching authority";
export interface ApSource { id: string; title: string; author: string; kind: string; url: string; note: string; role: SourceRole }
export type ApCitation = { kind: "scripture"; span: Span } | { kind: "source"; source: string; locator: string };
export interface CitedText { text: string; citations: ApCitation[] }
export interface ApStudy {
  id: string; title: string; topic: TopicId; summary: string; answer: string;
  reasoning: string[]; conclusion: string; sections: { title: string; body: string }[];
  objection: string; reply: string; limit: string; prompt: string;
  refs: { span: Span; note: string }[]; sources: string[]; related: string[]; keywords: string[];
  support: { answer: ApCitation[]; reasoning: ApCitation[][]; conclusion: ApCitation[]; sections: ApCitation[][]; reply: ApCitation[]; limit: ApCitation[]; prompt: ApCitation[] };
}

export const bible = (start: number, end = start): ApCitation => ({ kind: "scripture", span: [start, end] });
export const source = (id: string, locator: string): ApCitation => ({ kind: "source", source: id, locator });
/** At least one citation is required when authoring any substantive block. */
export const paragraph = (text: string, first: ApCitation, ...rest: ApCitation[]): CitedText => ({ text, citations: [first, ...rest] });

type StudyDraft = Omit<ApStudy, "answer" | "reasoning" | "conclusion" | "sections" | "reply" | "limit" | "prompt" | "support" | "sources"> & {
  answer: CitedText; reasoning: CitedText[]; conclusion: CitedText;
  sections: { title: string; body: CitedText }[]; reply: CitedText; limit: CitedText; prompt: CitedText;
};
export function defineStudy(draft: StudyDraft): ApStudy {
  const support = {
    answer: draft.answer.citations, reasoning: draft.reasoning.map((item) => item.citations),
    conclusion: draft.conclusion.citations, sections: draft.sections.map((item) => item.body.citations),
    reply: draft.reply.citations, limit: draft.limit.citations, prompt: draft.prompt.citations,
  };
  const citations = [support.answer, ...support.reasoning, support.conclusion, ...support.sections, support.reply, support.limit, support.prompt].flat();
  return {
    ...draft, answer: draft.answer.text, reasoning: draft.reasoning.map((item) => item.text), conclusion: draft.conclusion.text,
    sections: draft.sections.map((item) => ({ title: item.title, body: item.body.text })), reply: draft.reply.text, limit: draft.limit.text, prompt: draft.prompt.text,
    support, sources: [...new Set(citations.flatMap((item) => item.kind === "source" ? [item.source] : []))],
  };
}
