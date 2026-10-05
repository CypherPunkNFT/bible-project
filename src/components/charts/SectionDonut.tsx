import { arc, pie } from "d3-shape";
import { useMemo, useState } from "react";
import { OutsideScroll } from "@/components/OutsideScroll";
import { RefLink } from "@/components/study/StudyParts";
import { type PassageEntry } from "@/data/chart-insights";
import { useCatalog } from "@/lib/catalog";
import { entriesBySection, loadChartStudyMeasures, TEXT_MEASURES, STUDY_MEASURES, type Measure, type StudyMeasure } from "@/lib/chart-measures";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import type { SectionFilter } from "./SectionGuide";

interface Props { stats: Stats; section: SectionFilter; onSection: (section: SectionFilter) => void }
export function SectionDonut(props: Props) {
  const [measure, setMeasure] = useState<Measure>("words");
  const study = STUDY_MEASURES.find((m) => m.id === measure);
  return <div>
    <div className="measure-picker" role="group" aria-label="Measure the sections">
      <span>Measure by</span>{[...TEXT_MEASURES, ...STUDY_MEASURES].map((m) => <button key={m.id} type="button" aria-pressed={measure === m.id} onClick={() => setMeasure(m.id)}>{m.label}</button>)}
    </div>
    {study ? <StudyChart key={measure} {...props} measure={study.id} /> : <SectionChart {...props} measure={measure} />}
  </div>;
}

function StudyChart(props: Props & { measure: StudyMeasure }) {
  const state = useAsync(loadChartStudyMeasures, "chart-study-measures");
  if (state.status === "loading") return <p role="status" className="chart-measure-note">Loading the study entries…</p>;
  if (state.status === "error") return <p role="alert">The study entries could not be loaded. <button type="button" onClick={() => window.location.reload()}>Try again</button></p>;
  return <SectionChart {...props} entries={state.value[props.measure]} />;
}

function SectionChart({ stats, section, onSection, measure, entries }: Props & { measure: Measure; entries?: PassageEntry[] }) {
  const catalog = useCatalog();
  const grouped = useMemo(() => entriesBySection(entries ?? [], catalog.books), [entries, catalog.books]);
  const label = [...TEXT_MEASURES, ...STUDY_MEASURES].find((m) => m.id === measure)!.label;
  const rows = SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => {
    const books = stats.books.filter((b) => b.section === s.id);
    const value = entries ? grouped.get(s.id)?.length ?? 0 : measure === "books" ? books.length : books.reduce((sum, b) => sum + (measure === "chapters" ? b.chapters.length : measure === "red" ? b.red : measure === "verses" ? b.verses : b.words), 0);
    return { ...s, value, bookCount: books.length, chapterCount: books.reduce((n, b) => n + b.chapters.length, 0), words: books.reduce((n, b) => n + b.words, 0) };
  });
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const active = rows.find((r) => r.id === section);
  const largest = rows.reduce((a, b) => a.value >= b.value ? a : b);
  const slices = pie<(typeof rows)[number]>().value((r) => r.value).sort(null).padAngle(.012)(rows);
  const shape = arc<(typeof slices)[number]>().innerRadius(66).outerRadius(100).cornerRadius(3);
  const detail = entries ? (section ? grouped.get(section) ?? [] : entries) : [];
  const share = (n: number) => total ? (n / total * 100).toFixed(1) : "0.0";
  const subject = active ?? largest;
  const insight = !subject.value ? "This source selection has no entries in " + subject.name + ". That does not mean the subject is absent from these books."
    : entries ? subject.name + " has " + subject.value + " section entries (" + share(subject.value) + "% of this selection). Open the passages below to move from the pattern to the texts behind it."
    : measure === "words" ? subject.name + " is " + (subject.bookCount / 66 * 100).toFixed(1) + "% of the books but " + share(subject.value) + "% of the words. Book counts alone can hide how much space a section occupies."
    : measure === "books" ? subject.name + " brings together " + subject.bookCount + " books, " + formatNumber(subject.chapterCount) + " chapters and " + formatNumber(subject.words) + " words. Change the measure to discover how differently those books are sized."
    : measure === "chapters" ? subject.name + " has " + formatNumber(subject.value) + " chapters across " + subject.bookCount + " books — about " + Math.round(subject.words / subject.chapterCount).toLocaleString("en-US") + " words per chapter. Open the atlas to see the variation."
    : measure === "verses" ? subject.name + " averages " + (subject.value / subject.chapterCount).toFixed(1) + " verses per chapter. Verses vary greatly in length; compare words before using verse counts to estimate reading time."
    : (subject.value / subject.words * 100).toFixed(1) + "% of the words in " + subject.name + " are marked as Jesus speaking in this edition. Explore Words of Jesus to compare the teaching and its narrative setting.";
  return <>
    <div className="measure-insight" aria-live="polite">
      <div><span>{active?.name ?? "The whole Bible"}</span><strong>{formatNumber(active?.value ?? total)}</strong><small>{entries ? "section entries" : label.toLowerCase()}</small></div>
      <p>{insight}</p>
    </div>
    <div className="section-overview">
      <svg viewBox="-110 -110 220 220" role="img" aria-label={"Distribution of " + label.toLowerCase() + " by section"}>
        {slices.filter((s) => s.value > 0).map((slice) => <path key={slice.data.id} d={shape(slice) ?? ""} fill={sectionColor(slice.data.id)} opacity={section && section !== slice.data.id ? .25 : 1} onClick={() => onSection(section === slice.data.id ? "" : slice.data.id)} />)}
        <text textAnchor="middle" y={-4} className="fill-ink font-serif" fontSize={22}>{active ? share(active.value) + "%" : formatNumber(total)}</text>
        <text textAnchor="middle" y={14} className="fill-muted" fontSize={8}>{entries ? "section entries" : label.toLowerCase()}</text>
      </svg>
      <ul className="section-breakdown">{rows.map((r) => <li key={r.id}><button type="button" aria-pressed={section === r.id} onClick={() => onSection(section === r.id ? "" : r.id)}>
        <span className="h-3 w-3 rounded-full" style={{ background: sectionColor(r.id) }} /><span><strong>{r.name}</strong><small>{formatNumber(r.value)} {entries ? r.value === 1 ? "entry" : "entries" : label.toLowerCase()}</small><span className="section-mini-bar"><i style={{ width: share(r.value) + "%", background: sectionColor(r.id) }} /></span></span><span className="section-share" style={{ color: sectionColor(r.id) }}>{share(r.value)}%</span>
      </button></li>)}</ul>
    </div>
    <p className="chart-measure-note">{entries ? <>{STUDY_MEASURES.find((m) => m.id === measure)?.note} Each entry counts once in every section cited; percentages compare those section placements. Open the source passages below.</> : measure === "red" ? "Words marked as Jesus speaking in this KJV edition. Editorial red-letter boundaries may differ between editions." : "Counts from the KJV text, excluding the Apocrypha. Chapter and verse divisions are reading aids, not measures of importance."}</p>
    {entries && <details className="measure-evidence" open={!!section}><summary>Explore the passages · {detail.length} {section ? "entries here" : "source entries"}</summary><OutsideScroll label="Source passages for the selected measure" className="measure-evidence-scroll" resetKey={`${measure}:${section}`}><ol>{detail.map((entry, i) => <li key={i}><strong>{entry.title}</strong><div>{entry.refs.map((ref, j) => <RefLink key={j} span={ref} />)}</div></li>)}</ol></OutsideScroll>{detail.length === 0 && <p>No entries in this selection. Try another section or measure.</p>}</details>}
  </>;
}
