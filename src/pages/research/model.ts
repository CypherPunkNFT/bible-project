import type { Span } from "@/lib/study";

export const RESEARCH_BASE = "/review/research";
export const researchUrl = (part = "") => RESEARCH_BASE + (part ? "/" + part : "");
export const isLocalResearchHost = (host: string) => ["127.0.0.1", "localhost", "[::1]", "::1"].includes(host);

export type CitationRef = { kind: "source"; source: string; locator: string } | { kind: "scripture"; reference: string; span: Span };
export interface ResearchBlock { id: string; title: string; text: string; citations: CitationRef[] }
export interface Related { to: string; label: string; note: string }
export interface ResearchCase {
  id: string; kind: "historical" | "manuscript"; title: string; question: string; lead: string; eyebrow: string;
  minutes: number; evidenceId: string; sourceIds: string[]; answer: string; sections: ResearchBlock[];
  conclusion: string; limits: string[]; related: Related[];
}
export interface ResearchLesson {
  id: string; title: string; eyebrow: string; lead: string; minutes: number; passage: { reference: string; span: Span };
  aim: string; sourceIds: string[]; sections: ResearchBlock[]; questions: string[]; conclusion: string; related: Related[];
}
export interface SharedCitation {
  id: string; claimId: string; sourceId: string; editionId: string; locator: string; quote: string | null;
  sourceUrl: string; sourceRole: string; claimKind: string; claim: string; limits: string[];
  review: { kind: string; state: string; scope: string };
}
export interface ResearchSource {
  id: string; workId: string; editionId: string; title: string; subtitle: string; edition: string; language: string;
  genre: string; period: string; sourceRole: string; description: string; contributors: string[]; url: string;
  references: { label: string; url: string }[];
  locator: string; rights: string; rightsUrl: string; limitations: string[]; citation: SharedCitation;
}
export interface Contributor {
  id: string; name: string; role: string; kind: "person" | "institution"; description: string;
  works: string[]; url: string; sourceLocator: string; scope: string;
}
export interface ResearchBundle {
  schemaVersion: 1; scope: "local-design-review"; title: string; sources: ResearchSource[];
  contributors: Contributor[]; cases: ResearchCase[]; lessons: ResearchLesson[];
}

export function sourceUses(data: ResearchBundle, sourceId: string) {
  return [
    ...data.cases.filter(p => p.sourceIds.includes(sourceId)).map(p => ({ to: "cases/" + p.id, label: p.title, note: "Apologetics · " + p.question })),
    ...data.lessons.filter(p => p.sourceIds.includes(sourceId)).map(p => ({ to: "study/" + p.id, label: p.title, note: "Studies · " + p.passage.reference })),
  ];
}

export function filterSources(sources: ResearchSource[], query: string, contributors: Contributor[] = []) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return sources.filter(s => words.every(w => [s.title, s.subtitle, s.edition, s.description, s.language, s.genre, ...contributors.filter(c => s.contributors.includes(c.id)).map(c => c.name)].join(" ").toLocaleLowerCase().includes(w)));
}
