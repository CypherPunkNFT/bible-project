import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Loading } from "@/components/charts/ChartCard";
import { PassageText, RefLink } from "@/components/study/StudyParts";
import { loadBookLinks } from "@/lib/data";
import type { BookInfo } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

const PAGE = 20;

/** One cross-reference: a verse of the "from" book, the passage it points to, and its OpenBible reader votes. */
interface VerseLink { from: number; to: [number, number]; votes: number }

/** Every cross-reference from one book into another, strongest first, from the "from" book's one prepared file. */
async function loadVerseLinks(from: BookInfo, to: BookInfo): Promise<VerseLink[]> {
  const rows = (await loadBookLinks(from.code))[to.code] ?? [];
  return rows.map(([verse, target, end, votes]) => {
    const start = to.num * 1_000_000 + target;
    return { from: from.num * 1_000_000 + verse, to: [start, end || start], votes };
  });
}

/** The specific cross-references behind one square of the grid (`pair` = [from, to]), each with both passages. The
 *  direction buttons ask the parent to choose the opposite square; it keys this by the square, so each starts afresh. */
export function VerseLinks({ pair, counts, onReverse, onBack, backLabel }: { pair: [BookInfo, BookInfo]; counts: [number, number]; onReverse: () => void; onBack: () => void; backLabel: string }) {
  const [shown, setShown] = useState(PAGE);
  const [from, to] = pair;
  // Both directions, always in Bible order, so the buttons keep their places when the direction changes.
  const ways = [[from, to, counts[0]] as const, [to, from, counts[1]] as const].sort((a, b) => a[0].num - b[0].num);
  const links = useAsync(() => loadVerseLinks(from, to), `verse-links:${from.code}:${to.code}`);
  const total = links.status === "ready" ? links.value.length : 0;

  return <div className="cx-verses">
    <button type="button" className="cx-verses-back" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" />{backLabel}</button>
    <h3>{from.name} <ArrowRight size={18} aria-hidden="true" /> {to.name}</h3>
    {pair[0].code !== pair[1].code && <div className="cx-direction" role="group" aria-label="Direction">
      {ways.map(([a, b, n]) => <button key={a.code} type="button" aria-pressed={a === from} onClick={() => { if (a !== from) onReverse(); }}>
        <span>{a.name} → {b.name}</span><strong>{formatNumber(n)}</strong>
      </button>)}
    </div>}
    {links.status === "loading" && <Loading />}
    {links.status === "error" && <p className="cx-verses-note" role="alert">These cross-references could not be loaded. <button type="button" onClick={() => window.location.reload()}>Try again</button></p>}
    {links.status === "ready" && <>
      <p className="cx-verses-note">{formatNumber(total)} cross-references, the ones OpenBible.info readers voted most helpful first.</p>
      <ol className="cx-verses-list">
        {links.value.slice(0, shown).map((link) => <li key={link.from + "-" + link.to[0]}>
          <p className="cx-verses-refs"><RefLink span={[link.from, link.from]} className="cx-ref" /><ArrowRight size={13} aria-hidden="true" /><RefLink span={link.to} className="cx-ref" /></p>
          <div className="cx-verses-texts"><PassageText span={[link.from, link.from]} max={1} /><PassageText span={link.to} max={3} /></div>
        </li>)}
      </ol>
      {shown < total && <button type="button" className="cx-verses-more" onClick={() => setShown((n) => n + PAGE)}>Show {formatNumber(Math.min(PAGE, total - shown))} more · {formatNumber(total - shown)} left</button>}
    </>}
  </div>;
}
