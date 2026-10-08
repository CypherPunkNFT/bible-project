import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useCatalog } from "@/lib/catalog";
import { loadCrossRefs, loadStats } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import type { Parallel, Span } from "@/data/letters/types";
import { ALL_LETTERS, LETTER_TONE } from "./letter-hooks";
import { ParallelRibbon, type RibbonReveal } from "./ParallelRibbon";

const SHOWN = 60; // strongest links drawn; the rest would only be noise at this size
const GROW_MS = 750; // ribbons growing out from both rails to meet
const RETRACT_MS = 650; // ribbons shrinking back into the rail that is still chosen
const NONE: RibbonReveal = { top: 0, bottom: 0 };
const WHOLE: RibbonReveal = { top: 0.5, bottom: 0.5 };

type Link = { left: Span; right: Span; votes: number };
type Slots = [string | null, string | null];

/** One book the reader can pick: a letter by default; a collection can offer its own few (and a Gospel). */
export interface CompareChoice { code: string; label?: string; tone?: string }

/**
 * Any two letters side by side, joined wherever the site's cross-references link a verse in one to a verse in the
 * other (OpenBible.info, weighted by readers' votes), plus any scholar-paired passages the guides already hold.
 * Each chosen letter keeps its rail (top or bottom). Choosing the second grows the ribbons out from both rails; letting
 * one go shrinks them back into the rail still chosen, and the empty rail turns grey.
 */
export function CompareLetters({ initial, curated = [], choices }: { initial: [string, string]; curated?: Parallel[]; choices?: CompareChoice[] }) {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  const [slots, setSlots] = useState<Slots>(initial);
  const [left, right] = slots;
  // Clicking a chosen letter frees its rail; a new letter fills an empty rail, or replaces the bottom one.
  const toggle = (code: string) => setSlots(([top, bottom]) =>
    top === code ? [null, bottom] : bottom === code ? [top, null] : top === null ? [code, bottom] : [top, code]);
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
  const name = (code: string) => choices?.find((c) => c.code === code)?.label ?? books.get(code)?.name ?? code;
  // A scholar-paired parallel between the same two books (in either order) is shown too.
  const pairKey = (a?: number, b?: number) => [a, b].sort().join();
  const scholar = left && right ? curated.find((p) => pairKey(Math.floor(p.left.span[0] / 1_000_000), Math.floor(p.right.span[0] / 1_000_000)) === pairKey(books.get(left)?.num, books.get(right)?.num)) : undefined;
  const ready = left && right && links !== null ? `${left}-${right}` : null;
  const pair: Parallel | null = ready && left && right ? {
    id: `compare-${left}-${right}`, title: `${name(left)} and ${name(right)}`,
    left: { label: name(left), span: span(left) }, right: { label: name(right), span: span(right) },
    pairs: links!.slice(0, SHOWN).map((l) => ({ left: l.left, right: l.right, weight: l.votes })),
    claim: { text: `${links!.length} cross-reference links join these letters; the ${Math.min(SHOWN, links!.length)} with the most reader votes are drawn. Cross references from OpenBible.info (CC BY).` },
  } : null;

  // The ribbons on screen (they may belong to the pair just broken, while they shrink away) and how much of them shows.
  const [shown, setShown] = useState<Parallel | null>(null);
  const [reveal, setReveal] = useState<RibbonReveal>(NONE);
  const frame = useRef(0);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const tween = useCallback((from: RibbonReveal, to: RibbonReveal, ms: number, done?: () => void) => {
    cancelAnimationFrame(frame.current);
    if (reduced) { setReveal(to); done?.(); return; }
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms), e = 1 - (1 - k) ** 3;
      setReveal({ top: from.top + (to.top - from.top) * e, bottom: from.bottom + (to.bottom - from.bottom) * e });
      if (k < 1) frame.current = requestAnimationFrame(step); else done?.();
    };
    frame.current = requestAnimationFrame(step);
  }, [reduced]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // A rail let go (or changed): the ribbons shrink back into the rail that is still chosen, or into both if neither is.
  const before = useRef<Slots>(slots);
  useEffect(() => {
    const [wasTop, wasBottom] = before.current;
    before.current = slots;
    if (!shown) return;
    const keepTop = left !== null && left === wasTop, keepBottom = right !== null && right === wasBottom;
    if (keepTop && keepBottom) return;
    const clear = () => setShown(null);
    if (keepTop) tween({ top: 1, bottom: 0 }, NONE, RETRACT_MS, clear);
    else if (keepBottom) tween({ top: 0, bottom: 1 }, NONE, RETRACT_MS, clear);
    else tween(reveal, NONE, RETRACT_MS, clear);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on a change of the chosen letters only
  }, [left, right]);

  // A new pair's links have arrived: its ribbons grow out from both rails and meet in the middle.
  useEffect(() => {
    if (!pair) return;
    setShown(pair);
    tween(NONE, WHOLE, GROW_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once per pair, when its links are ready
  }, [ready]);

  const railLabel = (code: string | null) => (code ? name(code) : "Choose a letter");
  const base: Parallel = shown ?? {
    id: `compare-${left ?? "none"}-${right ?? "none"}`, title: "",
    left: { label: "", span: span(left ?? right ?? "ROM") }, right: { label: "", span: span(right ?? left ?? "ROM") }, pairs: [],
    claim: { text: "Cross references from OpenBible.info (CC BY)." },
  };
  // The rails always name the current choice, even while the last pair's ribbons are still shrinking away.
  const drawn: Parallel = { ...base, left: { ...base.left, label: railLabel(left) }, right: { ...base.right, label: railLabel(right) } };
  const settled = pair !== null && shown?.id === pair.id;
  const hint = settled ? undefined
    : left && right ? "Reading the cross-references…"
    : left || right ? `${name((left ?? right)!)} chosen. Choose one more to compare it with.` : "Choose two to compare.";

  return <div>
    <div className="lg-compare-bar">
      <div className="lg-compare-letters" role="group" aria-label="Letters to compare">{(choices ?? ALL_LETTERS.map((code): CompareChoice => ({ code }))).map((c) => <button key={c.code} type="button" aria-pressed={slots.includes(c.code)}
        className="lg-compare-letter" style={{ "--tone": `var(--${c.tone ?? LETTER_TONE(c.code)})` } as CSSProperties} onClick={() => toggle(c.code)}>{c.label ?? name(c.code)}</button>)}</div>
      {left && right && <button type="button" className="lg-tab lg-compare-swap" onClick={() => setSlots([right, left])}>⇅ Swap top and bottom</button>}
    </div>
    <div style={{ marginTop: "1rem" }}>
      <ParallelRibbon parallel={drawn} weightLabel="reader votes" reveal={reveal} empty={{ top: !left, bottom: !right }} hint={hint} />
    </div>
    {scholar && <div style={{ marginTop: "1.5rem" }}><p className="lg-subhead">Paired by scholars: {scholar.title}</p><ParallelRibbon parallel={scholar} /></div>}
  </div>;
}
