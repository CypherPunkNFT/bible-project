import { sourceById } from "@/data/apologetics-library";
import type { ApCitation, ApStudy, CitedText } from "@/data/apologetics-types";
import { studyUrl } from "@/lib/apologetics-links";

/** The format pages' plain helpers (src/components/apologetics/StudyFormats.tsx and StudyFormatParts.tsx),
 * kept apart so those files export components only. */

export const pad = (n: number) => String(n).padStart(2, "0");
export const cited = (text: string, citations: ApCitation[]): CitedText => ({ text, citations });

export const glossaryLetters = (study: ApStudy) => [...new Set((study.terms ?? []).map((term) => term.term.charAt(0).toUpperCase()))];
/** Formats drawn here; a short answer, declared or not, keeps today's article (plus MoreObjections). */
export const hasFormatPage = (study: ApStudy) => study.format !== undefined && study.format !== "short-answer";
/** Part 1 of an essay is the study's own address; each later part has its own (/apologetics/study/:id/part/:n). */
export const essayPartUrl = (id: string, part: number) => part <= 1 ? studyUrl(id) : `${studyUrl(id)}/part/${part}`;
/** The nearest part the essay has to the one an address asks for (StudyPage forwards a wrong number to it). */
export function essayPart(study: ApStudy, requested?: string): number {
  const count = study.parts?.length ?? 0, n = Number.parseInt(requested ?? "1", 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : 1, 1), Math.max(count, 1));
}

/** One entry of the companion's "In this article": a place on this page (#hash) or another part's address. */
export interface FormatPlace { label: string; hash?: string; to?: string; current?: boolean }
const opening = (text: string, count = 7) => { const words = text.split(/\s+/); return words.slice(0, count).join(" ") + (words.length > count ? "…" : ""); };
export function formatPlaces(study: ApStudy, part: number): FormatPlace[] {
  switch (study.format) {
    case "essay": return (study.parts ?? []).map((item, i) => ({ label: `${i + 1}. ${item.title}`, to: essayPartUrl(study.id, i + 1), current: i + 1 === part }));
    case "objections": return (study.objections ?? []).map((item, i) => ({ label: `${i + 1}. ${opening(item.objection)}`, hash: "o-" + item.id }));
    case "debate-guide": return [{ label: "What all affirm", hash: "common" }, ...(study.views ?? []).map((view) => ({ label: view.label, hash: "v-" + view.id }))];
    case "timeline": return (study.events ?? []).map((event) => ({ label: `${event.date} · ${event.title}`, hash: "e-" + event.id }));
    case "figure": return [...study.sections.map((section, i) => ({ label: section.title, hash: "s-" + i })), ...(study.works?.length ? [{ label: "Works to read", hash: "works" }] : [])];
    case "reading": return (study.extracts ?? []).map((extract, i) => ({ label: `${i + 1}. ${sourceById(extract.source)?.title ?? extract.source}, ${extract.locator}`, hash: "x-" + extract.id }));
    case "glossary": return glossaryLetters(study).map((letter) => ({ label: letter, hash: "l-" + letter }));
    case "faq": return (study.questions ?? []).map((item, i) => ({ label: `${i + 1}. ${item.question}`, hash: "q-" + item.id }));
    case "case-study": return study.sections.map((section, i) => ({ label: section.title, hash: "s-" + i }));
    default: return [];
  }
}
