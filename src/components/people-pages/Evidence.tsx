import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CitationProvider, CiteMarks, Refs } from "@/components/letters/LetterParts";
import type { Citation, Claim, Layer, Quote } from "@/data/people-pages/types";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import { studyRefLink } from "@/lib/study";

/**
 * Claims shown by their evidence (Research/People/METHODOLOGY.md §2): Scripture plain and solid; our own count "From
 * the text"; records outside the Bible with a sand-coloured edge; early church writers and later tradition with a
 * dashed edge naming who said it and when; scholars' reconstructions as a view card.
 */
const Sources = createContext<Map<string, Citation>>(new Map());

export function PeopleCitations({ citations, children }: { citations: Citation[]; children: ReactNode }) {
  const byId = useMemo(() => new Map(citations.map((c) => [c.id, c])), [citations]);
  return <CitationProvider citations={citations}><Sources.Provider value={byId}>{children}</Sources.Provider></CitationProvider>;
}

const LAYER_LABEL: Record<Layer, string> = {
  scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view",
};

/** "Eusebius, 325": the first source behind a claim, for the dashed tradition label. */
function useWho(claim: Claim & { who?: string; when?: string }): string {
  const sources = useContext(Sources);
  if (claim.who) return [claim.who, claim.when].filter(Boolean).join(", ");
  const first = claim.cites?.map((id) => sources.get(id)).find(Boolean);
  return first ? `${first.author}, ${first.year}` : "";
}

/** One claim with its evidence label (none for Scripture), its verses and its source marks. */
export function EvidenceClaim({ claim, as: As = "p", plain = false }: { claim?: Claim & { who?: string; when?: string }; as?: "p" | "li" | "div"; plain?: boolean }) {
  const who = useWho(claim ?? { text: "", layer: "text" });
  if (!claim?.text) return null;
  const layer = claim.layer ?? "scripture";
  const showWho = (layer === "early-church" || layer === "tradition") && who;
  return <As className="pp-claim" data-layer={plain ? undefined : layer}>
    {!plain && layer !== "scripture" && <span className="pp-layer">{LAYER_LABEL[layer]}{showWho ? ` · ${who}` : ""}</span>}
    {claim.text}<Refs refs={claim.refs} /><CiteMarks cites={claim.cites} />
  </As>;
}

export function ClaimList({ claims, empty }: { claims?: Claim[]; empty?: string }) {
  if (!claims?.length) return empty ? <p className="lg-muted">{empty}</p> : null;
  return <ul className="pp-claims">{claims.map((c, i) => <EvidenceClaim key={i} claim={c} as="li" />)}</ul>;
}

/** A word-for-word KJV quotation, linked into the reader. */
export function QuoteText({ quote, className }: { quote?: Quote; className?: string }) {
  const catalog = useCatalog();
  if (!quote?.text) return null;
  return <figure className={`pp-quote ${className ?? ""}`}>
    <blockquote>“{quote.text}”</blockquote>
    <figcaption><Link to={studyRefLink(catalog, quote.span)}>{formatRange(catalog, quote.span[0], quote.span[1])} (KJV) →</Link></figcaption>
  </figure>;
}

