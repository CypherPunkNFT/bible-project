import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCatalog } from "@/lib/catalog";
import { loadCrossRefs, loadStats } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import type { Parallel, Span } from "@/data/letters/types";
import { ALL_LETTERS, LETTER_TONE } from "./letter-hooks";
import { ParallelRibbon } from "./ParallelRibbon";

const SHOWN = 60; // strongest links drawn; the rest would only be noise at this size

type Link = { left: Span; right: Span; votes: number };

/**
 * Any two letters side by side, joined wherever the site's cross-references link a verse in one to a verse in the
 * other (OpenBible.info, weighted by readers' votes), plus any scholar-paired passages the guides already hold.
 */
/** One book the reader can pick: a letter by default; a collection can offer its own few (and a Gospel). */
export interface CompareChoice { code: string; label?: string; tone?: string }

export function CompareLetters({ initial, curated = [], choices }: { initial: [string, string]; curated?: Parallel[]; choices?: CompareChoice[] }) {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  // One row of letters: the first chosen is the top rail, the second the bottom. Clicking a chosen letter unchooses
  // it; with two chosen, a third replaces the second.
  const [chosen, setChosen] = useState<string[]>(initial);
  const [left = "", right = ""] = chosen;
  const toggle = (code: string) => setChosen((c) => (c.includes(code) ? c.filter((x) => x !== code) : c.length < 2 ? [...c, code] : [c[0], code]));
  const [links, setLinks] = useState<Link[] | null>(null);
  const books = useMemo(() => new Map(catalog.books.map((b) => [b.code, b])), [catalog]);
  const chapters = (code: string) => (stats.status === "ready" ? stats.value.books.find((b) => b.code === code)?.chapters.length ?? 0 : 0);

  useEffect(() => {
    if (stats.status !== "ready" || !left || !right) { setLinks([]); return; }
    let live = true;
    setLinks(null);
    const num = (code: string) => books.get(code)!.num;
    const pull = async (from: string, to: string, flip: boolean) => {
      const found: Link[] = [];
      const files = await Promise.all(Array.from({ length: chapters(from) }, (_, i) => loadCrossRefs(from, String(i + 1)).catch(() => ({}))));
      files.forEach((file, i) => {
        for (const [key, targets] of Object.entries(file)) {
          const verse = Number(key.split(":")[1]);
          const here = num(from) * 1_000_000 + (i + 1) * 1_000 + verse;
          for (const [start, end, votes] of targets) {
            if (Math.floor(start / 1_000_000) !== num(to)) continue;
            const there: Span = [start, end || start];
            found.push(flip ? { left: there, right: [here, here], votes } : { left: [here, here], right: there, votes });
          }
        }
      });
      return found;
    };
    void Promise.all([pull(left, right, false), pull(right, left, true)]).then(([a, b]) => {
      if (!live) return;
      // The same link listed from both ends counts once, with the higher vote.
      const merged = new Map<string, Link>();
      for (const l of [...a, ...b]) { const k = `${l.left[0]}-${l.right[0]}`; const prev = merged.get(k); if (!prev || prev.votes < l.votes) merged.set(k, l); }
      setLinks([...merged.values()].sort((x, y) => y.votes - x.votes));
    });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chapters() reads stats, already a dependency
  }, [left, right, stats.status, books]);

  const span = (code: string): Span => {
    const n = books.get(code)?.num ?? 0, last = stats.status === "ready" ? stats.value.books.find((b) => b.code === code)?.chapters : undefined;
    return [n * 1_000_000 + 1_001, n * 1_000_000 + (last?.length ?? 1) * 1_000 + (last?.[last.length - 1]?.[0] ?? 1)];
  };
  const name = (code: string) => books.get(code)?.name ?? code;
  // A scholar-paired parallel between the same two books (in either order) is shown too.
  const pairKey = (a?: number, b?: number) => [a, b].sort().join();
  const scholar = curated.find((p) => pairKey(Math.floor(p.left.span[0] / 1_000_000), Math.floor(p.right.span[0] / 1_000_000)) === pairKey(books.get(left)?.num, books.get(right)?.num));
  const shown = (links ?? []).slice(0, SHOWN);
  const parallel: Parallel = {
    id: `compare-${left}-${right}`, title: `${name(left)} and ${name(right)}`,
    left: { label: name(left), span: span(left) }, right: { label: name(right), span: span(right) },
    pairs: shown.map((l) => ({ left: l.left, right: l.right, weight: l.votes })),
    claim: { text: links === null ? "Reading the cross-references…" : `${links.length} cross-reference links join these letters; the ${Math.min(SHOWN, links.length)} with the most reader votes are drawn. Cross references from OpenBible.info (CC BY).` },
  };
  return <div>
    <div className="lg-compare-bar">
      <div className="lg-compare-letters" role="group" aria-label="Letters to compare">{(choices ?? ALL_LETTERS.map((code): CompareChoice => ({ code }))).map((c) => <button key={c.code} type="button" aria-pressed={chosen.includes(c.code)}
        className="lg-compare-letter" style={{ "--tone": `var(--${c.tone ?? LETTER_TONE(c.code)})` } as CSSProperties} onClick={() => toggle(c.code)}>{c.label ?? name(c.code)}</button>)}</div>
      {chosen.length === 2 && <button type="button" className="lg-tab lg-compare-swap" onClick={() => setChosen([right, left])}>⇅ Swap top and bottom</button>}
    </div>
    {chosen.length < 2 ? <p className="lg-muted" style={{ marginTop: "1rem" }}>{chosen.length ? `${name(left)} chosen. Choose one more letter to compare it with.` : "Choose two letters to compare."}</p>
      : <div style={{ marginTop: "1rem" }}><ParallelRibbon parallel={parallel} weightLabel="reader votes" /></div>}
    {scholar && <div style={{ marginTop: "1.5rem" }}><p className="lg-subhead">Paired by scholars: {scholar.title}</p><ParallelRibbon parallel={scholar} /></div>}
  </div>;
}
