import { BookA, BookOpenText, ChartGantt, CircleQuestionMark, FileText, Lightbulb, Scale, ScrollText, SearchCheck, ShieldQuestion, UserRound, type LucideIcon } from "lucide-react";
import type { ApStudy, ApStudyFormat } from "@/data/apologetics-types";

/** One article type on a field page: the card's eyebrow label, its group's heading and line, and its faded icon
 * (Plans/APOLOGETICS-FIELDS-CARD.md §5; mirrored in the app at App/src/lib/apologetics/article-kinds.ts). */
export interface ArticleKind { label: string; heading: string; line: string; icon: LucideIcon }

export const ARTICLE_KINDS: Record<ApStudyFormat, ArticleKind> = {
  "short-answer": { label: "Short answer", heading: "Short answers", icon: Lightbulb, line: "One question, answered plainly, with the strongest objections met." },
  essay: { label: "Long-form essay", heading: "Long-form essays", icon: ScrollText, line: "A longer argument, read one part at a time." },
  objections: { label: "Objections & replies", heading: "Objections & replies", icon: ShieldQuestion, line: "The strongest objections in their holders' own words, each answered." },
  "debate-guide": { label: "Views compared", heading: "Views compared", icon: Scale, line: "Positions side by side, with what all of them affirm." },
  figure: { label: "Key figure", heading: "Key figures", icon: UserRound, line: "One thinker: life, argument and reply." },
  reading: { label: "Primary-source reading", heading: "Primary-source readings", icon: BookOpenText, line: "An old text read slowly, with a guided note beside it." },
  timeline: { label: "Timeline", heading: "Timelines", icon: ChartGantt, line: "Dated events, each with how sure the date is." },
  glossary: { label: "Glossary", heading: "Glossaries", icon: BookA, line: "The field's words, defined and cross-linked." },
  faq: { label: "Questions answered", heading: "Questions answered", icon: CircleQuestionMark, line: "Quick, common questions with short answers." },
  "case-study": { label: "Case study", heading: "Case studies", icon: SearchCheck, line: "One worked instance: what survives, and what is inferred." },
};
/** A format this table does not know yet (the card plan's "anything unknown"). */
export const UNKNOWN_KIND: ArticleKind = { label: "Article", heading: "Articles", icon: FileText, line: "" };

/** The order of the groups on a field page (the mock-up's order). */
export const FORMAT_ORDER: readonly ApStudyFormat[] = ["short-answer", "essay", "objections", "debate-guide", "figure", "reading", "timeline", "glossary", "faq", "case-study"];

/** A study's format. Today's articles declare none: they are the short answer the plan deepens (§3), so they show as one. */
export const articleFormat = (study: ApStudy): string => study.format ?? "short-answer";
export const articleKind = (format: string): ArticleKind => ARTICLE_KINDS[format as ApStudyFormat] ?? UNKNOWN_KIND;

/** Whether a field lists a study: its own topic, or another field it names in `alsoIn` (plan job 5.2). */
export const inField = (study: ApStudy, topicId: string): boolean => study.topic === topicId || (study.alsoIn ?? []).includes(topicId);
