import { Section } from "@/components/letters/LetterParts";
import { ParallelRibbon } from "@/components/letters/ParallelRibbon";
import type { Parallel, Span } from "@/data/letters/types";
import type { RegnalRecord, Ruler } from "@/data/people-pages/types";
import { rulerHref, rulersOfRealm } from "@/lib/people-pages-index";
import { ClaimList, EvidenceClaim, QuoteText } from "./Evidence";
import { REALM_LABEL, VERDICT } from "./kinds";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";

const BOOK_NAME: Record<RegnalRecord["book"], string> = { kings: "Kings", chronicles: "Chronicles", samuel: "Samuel", other: "Scripture" };

/**
 * Scripture's verdict, word for word, with its exceptions and Chronicles' additions, and this ruler among all the
 * rulers of the line. For rulers the Bible gives no formula to, "What Scripture says": quoted, with no judgement added.
 */
export function VerdictCard({ ruler, possessive }: { ruler: Ruler; possessive: string }) {
  const primary = ruler.records.find((r) => r.book === "kings" && r.verdict) ?? ruler.records.find((r) => r.verdict);
  const chronicles = ruler.records.find((r) => r.book === "chronicles" && r.verdict && r !== primary);
  if (!primary) {
    if (!ruler.scriptureSays?.length) return null;
    return <Section id="pp-verdict" kicker="What Scripture says" title={`What Scripture says of ${possessive === "her" ? "her" : "him"}`} lead="Scripture gives no regnal verdict here. These are its own words about this ruler; the page adds no judgement.">
      <ClaimList claims={ruler.scriptureSays} />
      {ruler.verdictNotes?.length ? <><div className="pp-divider" /><ClaimList claims={ruler.verdictNotes} /></> : null}
    </Section>;
  }
  return <Section id="pp-verdict" kicker="The verdict" title="How Scripture judges the reign" lead="Quoted word for word from the King James text. The page states the Bible's verdict and adds none of its own.">
    <QuoteText quote={primary.verdict} />
    {primary.comparison && <QuoteText quote={primary.comparison} className="pp-quote-small" />}
    {(ruler.verdictNotes?.length || chronicles) && <div className="pp-divider" />}
    {ruler.verdictNotes?.length ? <><p className="pp-label">But also</p><ClaimList claims={ruler.verdictNotes} /></> : null}
    {chronicles && <div style={{ marginTop: "1rem" }}><p className="pp-label">{BOOK_NAME[chronicles.book]} gives it as</p><QuoteText quote={chronicles.verdict} className="pp-quote-small" /></div>}
    <div className="pp-divider" />
    <VerdictRow ruler={ruler} />
  </Section>;
}

/** Every ruler of the realm as a dot shaped by their verdict (✓ ✕ ◐ ●), this one lit; each opens that reign. */
function VerdictRow({ ruler }: { ruler: Ruler }) {
  const carried = useCarried();
  const line = rulersOfRealm(ruler.realm);
  if (line.length < 2) return null;
  return <div>
    <p className="pp-label">{REALM_LABEL[ruler.realm]}: {line.length} rulers</p>
    <nav className="pp-verdict-row" aria-label={`Verdicts on the rulers of ${REALM_LABEL[ruler.realm]}`}>
      {line.map((r) => <SlideLink key={r.id} to={rulerHref(r.id)} state={carried} data-tone={r.verdictTone} aria-current={r.id === ruler.id ? "page" : undefined}
        aria-label={`${r.name}: ${VERDICT[r.verdictTone].spoken}`} title={`${r.name} · ${VERDICT[r.verdictTone].label}`}>{VERDICT[r.verdictTone].symbol}</SlideLink>)}
    </nav>
    <p className="pp-legend">{(["right", "evil", "mixed", "none"] as const).map((t) => <span key={t}>{VERDICT[t].symbol} {VERDICT[t].label}</span>)}</p>
  </div>;
}

/** The books' spans of Kings (or Samuel) and of Chronicles among the passages, for the parallel ribbon's two rails. */
function railOf(passages: Span[], books: number[]): Span | undefined {
  const inBooks = passages.filter((s) => books.includes(Math.floor(s[0] / 1_000_000)));
  return inBooks.length ? [Math.min(...inBooks.map((s) => s[0])), Math.max(...inBooks.map((s) => s[1]))] : undefined;
}

/** Where Kings (or Samuel) and Chronicles tell the reign differently: side by side, never merged. */
export function TwoAccounts({ ruler }: { ruler: Ruler }) {
  if (!ruler.twoAccounts.length) return null;
  const left = railOf(ruler.passages, [9, 10, 11, 12]), right = railOf(ruler.passages, [13, 14]);
  const pairs = ruler.twoAccounts.flatMap((t) => (t.first.refs?.[0] && t.second.refs?.[0] ? [{ left: t.first.refs[0], right: t.second.refs[0], note: t.topic }] : []))
    .filter((p) => left && right && p.left[0] >= left[0] && p.left[1] <= left[1] && p.right[0] >= right[0] && p.right[1] <= right[1]);
  const parallel: Parallel | undefined = left && right && pairs.length ? {
    id: `${ruler.id}-accounts`, title: "Kings and Chronicles", left: { label: "Samuel–Kings", span: left }, right: { label: "Chronicles", span: right }, pairs,
    claim: { text: "Each ribbon joins the two accounts of one matter, passage to passage." },
  } : undefined;
  return <Section id="pp-accounts" kicker="Two accounts" title="Where Kings and Chronicles differ" lead="The two histories are shown side by side and never blended. Neither is corrected by the other.">
    {parallel && <ParallelRibbon parallel={parallel} weightLabel="" />}
    <div style={{ display: "grid", gap: "1rem", marginTop: parallel ? "1rem" : 0 }}>
      {ruler.twoAccounts.map((t) => <article key={t.topic}>
        <h4 className="lg-title" style={{ fontSize: "1.1rem" }}>{t.topic}</h4>
        <div className="pp-two" style={{ marginTop: ".6rem" }}>
          <div className="pp-card"><p className="pp-label">First account</p><EvidenceClaim claim={t.first} as="div" /></div>
          <div className="pp-card"><p className="pp-label">Second account</p><EvidenceClaim claim={t.second} as="div" /></div>
        </div>
      </article>)}
    </div>
  </Section>;
}
