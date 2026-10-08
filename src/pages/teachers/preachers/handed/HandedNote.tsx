// 06 · Who passed it to whom: the notes beside the chart. For a chain, its links numbered in order (the numbers match
// the badges on the curves); for "All links", a summary and the links that reach across years when neither was alive.
import type { Person } from "@/data/teachers/pages-types";
import { plural } from "../lives/common";
import { gapOf, overlap, type Chain, type Link } from "./model";

interface Props { chain: Chain; list: Link[]; all: Link[]; hot: number | null; onOpen: (id: string, origin: Element) => void }

function Pair({ link, onOpen }: { link: Link; onOpen: Props["onOpen"] }) {
  const who = (p: Person) => <button type="button" onClick={(e) => onOpen(p.id, e.currentTarget)}>{p.short}</button>;
  return <div className="hand-pair">{who(link.a)} <span>→</span> {who(link.b)}</div>;
}

export function HandedNote({ chain, list, all, hot, onOpen }: Props) {
  if (chain.ids) {
    return <>
      <h3>{chain.label}</h3>
      <ol key={chain.key} className="hand-steps">{list.map((l, i) => {
        const gap = gapOf(l), { s, e } = overlap(l);
        return <li key={l.k} className={hot === l.k ? "hot" : undefined} style={{ animationDelay: `${i * 0.08}s` }}>
          <span className="hand-n">{i + 1}</span><Pair link={l} onOpen={onOpen} /><p>{l.note}</p>
          <span className="hand-gap">{gap > 0 ? `${plural(gap, "year")} between one life and the next` : `Lives overlapped ${plural(e - s, "year")}`}</span>
        </li>;
      })}</ol>
    </>;
  }
  const across = all.filter((l) => gapOf(l) > 0).sort((m, n) => gapOf(n) - gapOf(m)), longest = across[0];
  const people = new Set(all.flatMap((l) => [l.from, l.to]));
  return <>
    <h3>All {all.length} links</h3>
    <p>{all.length} documented links join {people.size} of the teachers here. {across.length} of them reach across years when neither was alive
      {longest ? <>; the longest, {longest.a.short} to {longest.b.short}, spans {plural(gapOf(longest), "year")}.</> : "."}</p>
    <ol key="all" className="hand-steps plain">{across.map((l) => <li key={l.k} className={hot === l.k ? "hot" : undefined}>
      <Pair link={l} onOpen={onOpen} /><p>{l.note}</p><span className="hand-gap">{plural(gapOf(l), "year")} apart</span>
    </li>)}</ol>
  </>;
}
