import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, FileText, Landmark } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { RefLink } from "@/components/study/StudyParts";
import { researchUrl, type CitationRef, type Related, type ResearchBundle, type ResearchSource } from "./model";

export function ResearchArt({ kind }: { kind: "historical" | "manuscript" | "study" }) {
  return <svg className={"rs-art rs-art-" + kind} viewBox="0 0 460 320" fill="none" aria-hidden="true">
    <circle cx="245" cy="153" r="122" stroke="currentColor" opacity=".13" />
    <circle cx="245" cy="153" r="96" stroke="currentColor" opacity=".1" strokeDasharray="2 8" />
    {kind === "historical" ? <>
      <path d="M185 67 273 44 324 93 316 251 231 275 180 229Z" fill="var(--rs-art-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M185 67 236 111 324 93M236 111 231 275" stroke="currentColor" opacity=".65" />
      {Array.from({ length: 11 }, (_, i) => <g key={i} opacity={.5 - i * .016}>
        <path d={`M194 ${91 + i * 12}l30 26m24 ${-4 - i * .8} 63 -17`} stroke="currentColor" strokeWidth="2" strokeDasharray="4 3 2 5" />
      </g>)}
      <path d="M89 236H158M326 68H382M97 97l42 0" stroke="currentColor" opacity=".4" />
      <text x="83" y="263">ROYAL ANNALS</text><text x="320" y="51">JUDAH</text>
    </> : kind === "manuscript" ? <>
      <path d="M132 62Q240 46 350 72L337 268Q228 245 120 260Z" fill="var(--rs-art-fill)" stroke="currentColor" strokeWidth="1.5" />
      {[0, 1, 2, 3].map(c => <g key={c} opacity=".38">{Array.from({ length: c === 1 ? 7 : 17 }, (_, i) => <path key={i} d={`M${146 + c * 46} ${85 + i * 8}l32 1`} stroke="currentColor" strokeWidth="2" strokeDasharray="5 2 3 2" />)}</g>)}
      <path d="M189 151h39" stroke="currentColor" strokeWidth="2" /><circle cx="207" cy="151" r="27" stroke="currentColor" />
      <path d="M231 145 382 110" stroke="currentColor" opacity=".5" /><text x="316" y="96">MARK 16:8</text>
    </> : <>
      <path d="M87 100Q158 61 232 99Q298 62 374 100L366 258Q298 228 232 262Q154 230 92 258Z" fill="var(--rs-art-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M232 99V262" stroke="currentColor" /><path d="M240 103v155" stroke="currentColor" opacity=".25" />
      {Array.from({ length: 9 }, (_, i) => <g key={i} opacity=".3"><path d={`M113 ${128+i*11}q43 -15 97 0M253 ${128+i*11}q43 -15 95 0`} stroke="currentColor" /></g>)}
      <path d="M162 41v29M289 31v29M224 17v44" stroke="currentColor" opacity=".5" /><text x="143" y="299">READ · UNDERSTAND · RESPOND</text>
    </>}
  </svg>;
}

export function ResearchHero({ eyebrow, title, lead, kind, meta }: { eyebrow: string; title: string; lead: string; kind?: "historical" | "manuscript" | "study"; meta?: string }) {
  return <header className={"rs-hero" + (kind ? " rs-hero-art" : "") }>
    <div><p className="rs-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="rs-lead">{lead}</p>{meta && <p className="rs-meta">{meta}</p>}</div>
    {kind && <ResearchArt kind={kind} />}
  </header>;
}

export function RelatedLinks({ links, title = "Keep following the question" }: { links: Related[]; title?: string }) {
  return <section className="rs-related"><p className="rs-eyebrow">{title}</p><div>{links.map(link => <Link key={link.to} to={researchUrl(link.to)}><span><strong>{link.label}</strong><small>{link.note}</small></span><ArrowRight size={20} aria-hidden /></Link>)}</div></section>;
}

export function CitationInspector({ source, locator, compact = false }: { source: ResearchSource; locator?: string; compact?: boolean }) {
  const label = useId();
  return <details className={"rs-citation" + (compact ? " rs-citation-compact" : "")} data-citation-id={source.citation.id}>
    <summary id={label}><FileText size={15} aria-hidden /><span>{compact ? source.title + " · " + (locator ?? source.locator) : "Inspect the source and citation"}</span><ChevronDown size={15} aria-hidden /></summary>
    <div className="rs-citation-body" aria-labelledby={label}>
      <p className="rs-eyebrow">{source.sourceRole}</p><h3>{source.edition}</h3><p><strong>Location:</strong> {locator ?? source.locator}</p>
      {source.citation.quote && <blockquote>{source.citation.quote}</blockquote>}
      <p>{source.citation.limits.join(" ")}</p>
      <div className="rs-source-actions"><Link to={researchUrl("works/" + source.id)}>Edition & contributors <ArrowRight size={14} aria-hidden /></Link></div>

      <p className="rs-credit">{source.rights} Original references and licence details are recorded with the edition.</p>
      <p className="rs-credit">{source.citation.review.scope}</p>
    </div>
  </details>;
}

export function BlockCitations({ citations, data }: { citations: CitationRef[]; data: ResearchBundle }) {
  return <div className="rs-block-citations">{citations.map((citation, i) => citation.kind === "scripture" ?
    <RefLink key={i} span={citation.span} label={citation.reference} className="rs-scripture-link" /> :
    <CitationInspector key={i} source={data.sources.find(s => s.id === citation.source)!} locator={citation.locator} compact />)}</div>;
}

export function SourceTile({ source }: { source: ResearchSource }) {
  return <Link className="rs-source-tile" to={researchUrl("works/" + source.id)}><span className="rs-source-mark"><Landmark size={27} strokeWidth={1.2} aria-hidden /></span><span><small>{source.genre}</small><strong>{source.title}</strong><span>{source.edition}</span></span><ArrowUpRight size={19} aria-hidden /></Link>;
}

export function ReadingContents({ sections }: { sections: { id: string; title: string }[] }) {
  return <aside className="rs-contents"><p className="rs-eyebrow">In this reading</p><nav aria-label="On this page">{sections.map((s, i) => <a key={s.id} href={"#" + s.id}><span>{String(i+1).padStart(2,"0")}</span>{s.title}</a>)}</nav><Link to={researchUrl("works")} className="rs-contents-source"><BookOpen size={17} aria-hidden /> Follow the sources</Link></aside>;
}

export function WitnessComparison() {
  return <figure className="rs-witness" aria-labelledby="witness-caption"><figcaption id="witness-caption"><span className="rs-eyebrow">One witness · one comparison edition</span><h2>The boundary at Mark 16:8</h2></figcaption>
    <div className="rs-witness-columns"><div><span className="rs-witness-tag">Greek manuscript</span><h3>Codex Sinaiticus</h3><p>Mark 16:1–8</p><div className="rs-verse-track" aria-hidden>{Array.from({length:8},(_,i)=><span key={i}>{i+1}</span>)}</div><strong className="rs-ending">Closing title after verse 8</strong><small>Q.77 · f.5 recto</small></div>
    <div><span className="rs-witness-tag">English comparison</span><h3>King James Version</h3><p>Mark 16:1–20</p><div className="rs-verse-track" aria-hidden>{Array.from({length:8},(_,i)=><span key={i}>{i+1}</span>)}</div><strong className="rs-ending rs-ending-continued">Continues with verses 9–20</strong><RefLink span={[41016009,41016020]} label="Read the longer ending in context" /></div></div>
    <p className="rs-credit">This shows a coverage difference. The KJV is not an ancient manuscript or a translation of Sinaiticus. No manuscript image is reproduced.</p>
  </figure>;
}
