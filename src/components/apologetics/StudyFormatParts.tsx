import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApCitations } from "@/components/ApologeticsParts";
import { RefLink } from "@/components/study/StudyParts";
import { studyById } from "@/data/apologetics-library";
import type { ApRef, ApStudy, CitedText } from "@/data/apologetics-types";
import { glossaryLetters, pad } from "@/lib/apologetics-formats";
import { studyUrl } from "@/lib/apologetics-links";
import { useSiteLanguage } from "@/lib/language";

/** The pieces the format pages share (StudyFormats.tsx), and the three reference formats: timeline, glossary and
 * questions answered. Every text block shows its citations; a verse is a reference the reader opens, never stored text. */

/** A block's paragraphs (a blank line between them in the content), then its basis. */
export function Cited({ block, label }: { block: CitedText; label?: string }) {
  return <>{block.text.split(/\n\n+/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}{block.citations.length > 0 && <ApCitations citations={block.citations} label={label} />}</>;
}
export function Refs({ refs }: { refs: ApRef[] }) {
  return <ul className="fx-refs">{refs.map((ref, i) => <li key={i}><RefLink span={ref.span} />{ref.note && <span>{ref.note}</span>}</li>)}</ul>;
}

/** How sure a timeline date is; an exact date says nothing. */
const CERTAINTY: Record<string, string> = { exact: "", circa: "about", debated: "date debated", estimate: "an estimate" };
export function Timeline({ study }: { study: ApStudy }) {
  return <ol className="fx-events">{(study.events ?? []).map((event) => <li key={event.id} id={"e-" + event.id}>
    <p className="fx-date">{event.date}{CERTAINTY[event.certainty] && <span>{CERTAINTY[event.certainty]}</span>}</p>
    <div><h3>{event.title}</h3><Cited block={event} />{event.dateNote && <p className="fx-date-note">{event.dateNote}</p>}</div></li>)}</ol>;
}

/** The finder and the letter index read the English terms, so they show only on the English page: the page translator
 * swaps the words on screen in the other languages, where the full list stays in view. */
export function Glossary({ study }: { study: ApStudy }) {
  const english = useSiteLanguage() === "en", [query, setQuery] = useState(""), terms = study.terms ?? [], q = english ? query.trim().toLowerCase() : "";
  const names = new Map(terms.map((term) => [term.id, term.term]));
  const shown = terms.filter((term) => !q || term.term.toLowerCase().includes(q) || term.text.toLowerCase().includes(q));
  return <>
    {english && <div className="fx-gloss-tools"><label className="fx-find"><Search size={15} /><span className="sr-only">Find a term</span><input type="search" placeholder="Find a term…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <nav aria-label="Letters">{glossaryLetters(study).map((letter) => <a key={letter} href={"#l-" + letter}>{letter}</a>)}</nav></div>}
    {shown.length ? <dl className="fx-terms">{shown.map((term, i) => {
      const letter = term.term.charAt(0).toUpperCase(), first = i === 0 || shown[i - 1].term.charAt(0).toUpperCase() !== letter;
      return <div key={term.id} id={"term-" + term.id}>{first && <span id={"l-" + letter} className="fx-anchor" />}<dt>{term.term}</dt><dd>
        <Cited block={term} />{term.siteDefinition && <p className="fx-see">The site's own definition.</p>}
        {term.seeAlso.length > 0 && <p className="fx-see"><span>See also</span>{term.seeAlso.map((id) => <a key={id} href={"#term-" + id} onClick={() => setQuery("")}>{names.get(id) ?? id}</a>)}</p>}</dd></div>;
    })}</dl> : <p className="fx-muted" role="status">{`No term matches “${query}”.`}</p>}</>;
}

/** The first two answers open, and any the address points at (#q-<id>). */
export function Questions({ study }: { study: ApStudy }) {
  const { hash } = useLocation();
  return <div className="fx-faq">{(study.questions ?? []).map((item, i) => {
    const full = item.study ? studyById(item.study) : undefined;
    return <details key={item.id} id={"q-" + item.id} open={i < 2 || hash === "#q-" + item.id}>
      <summary><span className="fx-n">{pad(i + 1)}</span>{item.question}</summary>
      <div><Cited block={item} />{full && <Link to={studyUrl(full.id)}>{`Read the full article: ${full.title}`}<ArrowRight size={13} /></Link>}</div></details>;
  })}</div>;
}
