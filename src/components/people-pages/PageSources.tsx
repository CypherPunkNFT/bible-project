import { Link } from "react-router-dom";
import { OpenQuestions, SourcesList } from "@/components/letters/LetterBlocks";
import { CiteMarks, Section } from "@/components/letters/LetterParts";
import { OutsideScroll } from "@/components/OutsideScroll";
import type { Citation, Claim, OpenQuestion, ReignDates, Span } from "@/data/people-pages/types";
import { useCatalog } from "@/lib/catalog";
import { formatYears } from "@/lib/eras";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { studyRefLink } from "@/lib/study";
import { ClaimList } from "./Evidence";
import { asLetterQuestions } from "./kinds";

/** "Dates differ": every dating system side by side, then the open questions as views with who holds them. */
export function DatingSection({ dates, questions, reignText }: { dates: ReignDates[]; questions: OpenQuestion[]; reignText: string }) {
  const systems = dates.filter((d) => d.from !== undefined || d.note);
  if (!systems.length && !questions.length) return null;
  return <Section id="pp-dating" kicker="Dates differ" title="When was it?" lead={<>Scripture counts the reign as “{reignText}”. Scholars turn that into years in different ways; each system is shown with who holds it, and the page does not choose between them.</>}>
    {systems.length > 0 && <div className="pp-cards">{systems.map((d) => <article key={d.system + d.label} className="pp-card">
      <p className="lg-kicker">{d.label}</p>
      <h4>{d.from !== undefined ? formatYears(d.from, d.to ?? d.from, d.approx) : "No years given"}<CiteMarks cites={d.cites} /></h4>
      {d.coregency && <p>Shared rule with {d.coregency.with}, {formatYears(d.coregency.from, d.coregency.to)}</p>}
      {d.note && <p>{d.note}</p>}
    </article>)}</div>}
    {questions.length > 0 && <div style={{ marginTop: systems.length ? "1.25rem" : 0 }}><OpenQuestions questions={asLetterQuestions(questions)} /></div>}
  </Section>;
}

/** Open questions on an apostle's page (who he was, where he went), each view with who holds it. */
export function QuestionsSection({ questions }: { questions: OpenQuestion[] }) {
  if (!questions.length) return null;
  return <Section id="pp-questions" kicker="Open questions" title="Where readers have differed" lead="Each answer is shown with the people who hold it. This page does not choose between them.">
    <OpenQuestions questions={asLetterQuestions(questions)} />
  </Section>;
}

/** "1 Kings 15", "2 Chronicles 14": the chapters a set of passages touches, in order. */
function useChapters(passages: Span[]) {
  const catalog = useCatalog();
  const seen = new Map<string, Span>();
  for (const [start, end] of passages) {
    const a = splitId(start), b = splitId(end);
    for (let chapter = a.chapter; chapter <= (a.num === b.num ? b.chapter : a.chapter); chapter++) {
      const book = bookByNum(catalog, a.num);
      const id = a.num * 1_000_000 + chapter * 1_000 + 1;
      if (book && !seen.has(`${a.num}:${chapter}`)) seen.set(`${a.num}:${chapter}`, [id, id]);
    }
  }
  return [...seen.values()];
}

/** Every passage about the reign or the mission (chapters, then each passage), what Scripture does not say, and the
 *  identifications the page relies on. */
export function PassagesSection({ passages, notSaid, identifications }: { passages: Span[]; notSaid: string[]; identifications?: Claim[] }) {
  const catalog = useCatalog();
  const chapters = useChapters(passages);
  if (!passages.length && !notSaid.length && !identifications?.length) return null;
  const chapterLabel = (span: Span) => { const { num, chapter } = splitId(span[0]); return `${bookByNum(catalog, num)?.name ?? ""} ${chapter}`; };
  return <Section id="pp-passages" kicker="In Scripture" title="Every passage" lead="The chapters first, then each passage. Each opens in the reader.">
    {passages.length > 0 && <OutsideScroll label="Every passage" frameClassName="pp-passages">
      <p className="pp-label">Chapters · {chapters.length}</p>
      <p className="pp-passages-list">{chapters.map((span) => <Link key={span[0]} to={studyRefLink(catalog, span)}>{chapterLabel(span)}</Link>)}</p>
      <p className="pp-label" style={{ marginTop: ".9rem" }}>Passages · {passages.length}</p>
      <p className="pp-passages-list">{passages.map((span) => <Link key={span.join("-")} to={studyRefLink(catalog, span)}>{formatRange(catalog, span[0], span[1])}</Link>)}</p>
    </OutsideScroll>}
    {notSaid.length > 0 && <div style={{ marginTop: "1.2rem" }}><p className="pp-label">What Scripture does not say</p><ul className="pp-claims">{notSaid.map((line) => <li key={line}>{line}</li>)}</ul></div>}
    {identifications?.length ? <div style={{ marginTop: "1.2rem" }}><p className="pp-label">Identifications this page relies on</p><ClaimList claims={identifications} /></div> : null}
  </Section>;
}

export function SourcesSection({ citations }: { citations: Citation[] }) {
  return <Section id="pp-sources" kicker="Sources" title="Where this page comes from" lead="The biblical text itself and public-domain works; modern works are cited for facts only. Numbers in the text point here.">
    {citations.length ? <SourcesList citations={citations} /> : <p className="lg-muted">Scripture only.</p>}
  </Section>;
}
