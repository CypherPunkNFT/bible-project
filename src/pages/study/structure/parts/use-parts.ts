import { useMemo, type CSSProperties } from "react";
import type { SectionFilter } from "@/components/charts/SectionGuide";
import type { PassageEntry } from "@/data/chart-insights";
import { useCatalog } from "@/lib/catalog";
import { entriesBySection, loadChartStudyMeasures, STUDY_MEASURES, TEXT_MEASURES, type Measure, type StudyMeasure } from "@/lib/chart-measures";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { SectionId, Stats } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

export const MEASURES = [...TEXT_MEASURES, ...STUDY_MEASURES];
export interface Part { id: SectionId; name: string; span: string; value: number; share: string; bookCount: number; chapterCount: number; words: number }

/** The six parts of the Bible measured one way: the same numbers and sentence as the real Sections & measures chart
 *  (SectionDonut.tsx), as data for the variants to draw however they like. */
export function useParts(stats: Stats, measure: Measure, section: SectionFilter) {
  const catalog = useCatalog();
  const study = useAsync(loadChartStudyMeasures, "chart-study-measures");
  const isStudy = STUDY_MEASURES.some((m) => m.id === measure);
  const entries: PassageEntry[] | undefined = isStudy && study.status === "ready" ? study.value[measure as StudyMeasure] : undefined;
  const loading = isStudy && study.status === "loading";
  const grouped = useMemo(() => entriesBySection(entries ?? [], catalog.books), [entries, catalog.books]);
  const label = MEASURES.find((m) => m.id === measure)!.label;

  const rows = SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => {
    const books = stats.books.filter((b) => b.section === s.id);
    const value = entries ? grouped.get(s.id)?.length ?? 0 : isStudy ? 0 : measure === "books" ? books.length : books.reduce((sum, b) => sum + (measure === "chapters" ? b.chapters.length : measure === "red" ? b.red : measure === "verses" ? b.verses : b.words), 0);
    return { id: s.id, name: s.name, span: s.span, value, bookCount: books.length, chapterCount: books.reduce((n, b) => n + b.chapters.length, 0), words: books.reduce((n, b) => n + b.words, 0) };
  });
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const share = (n: number) => (total ? (n / total * 100).toFixed(1) : "0.0");
  const parts: Part[] = rows.map((r) => ({ ...r, share: share(r.value) }));
  const active = parts.find((p) => p.id === section);
  const subject = active ?? parts.reduce((a, b) => (a.value >= b.value ? a : b));
  const detail = entries ? (section ? grouped.get(section) ?? [] : entries) : [];
  const unit = entries ? "section entries" : label.toLowerCase();

  const insight = loading ? "Loading the study entries…" : !subject.value ? `This source selection has no entries in ${subject.name}. That does not mean the subject is absent from these books.`
    : entries ? `${subject.name} has ${subject.value} section entries (${subject.share}% of this selection). Open the passages below to move from the pattern to the texts behind it.`
    : measure === "words" ? `${subject.name} is ${(subject.bookCount / 66 * 100).toFixed(1)}% of the books but ${subject.share}% of the words. Book counts alone can hide how much space a section occupies.`
    : measure === "books" ? `${subject.name} brings together ${subject.bookCount} books, ${formatNumber(subject.chapterCount)} chapters and ${formatNumber(subject.words)} words. Change the measure to discover how differently those books are sized.`
    : measure === "chapters" ? `${subject.name} has ${formatNumber(subject.value)} chapters across ${subject.bookCount} books, about ${Math.round(subject.words / subject.chapterCount).toLocaleString("en-US")} words per chapter.`
    : measure === "verses" ? `${subject.name} averages ${(subject.value / subject.chapterCount).toFixed(1)} verses per chapter. Verses vary greatly in length; compare words before using verse counts to estimate reading time.`
    : `${(subject.value / subject.words * 100).toFixed(1)}% of the words in ${subject.name} are marked as Jesus speaking in this edition.`;
  const note = entries ? STUDY_MEASURES.find((m) => m.id === measure)?.note : undefined;
  return { parts, total, active, subject, insight, unit, label, detail, note, loading, isStudy };
}
export type PartsView = ReturnType<typeof useParts>;

/** Sets --tone to a part's colour, for the variants' own styles. */
export const toneStyle = (id: SectionId): CSSProperties => ({ "--tone": sectionColor(id) }) as CSSProperties;
