import type { CSSProperties } from "react";
import { wordColor, type MarkedPart } from "@/lib/search-words";
import { formatNumber } from "@/lib/utils";
import "./search-words.css";

/** Text with the search words picked out, each in its own colour, so a result shows why it is there. `underline`: a coloured underline only, no highlight. */
export function Marked({ parts, underline = false }: { parts: MarkedPart[]; underline?: boolean }) {
  return <>{parts.map((part, i) => part.word === null
    ? <span key={i}>{part.text}</span>
    : <mark key={i} className={underline ? "search-word-underline" : "search-word-mark"} style={{ "--word": wordColor(part.word) } as CSSProperties}>{part.text}</mark>)}</>;
}

/**
 * "Your words": the search broken into the words it runs on, one tab each with its verse count, plus "All words";
 * picking one runs every section on that word alone. Common words the search skips are shown, struck through.
 */
export function WordTabs({ words, skipped, counts, focus, onFocus }: {
  words: string[]; skipped: string[]; counts: Map<string, number> | null; focus: string; onFocus: (word: string) => void;
}) {
  return (
    <nav aria-label="Your words" className="search-words mt-6 rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <p className="text-xs text-muted">Your words · each one finds its own results</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={!focus} onClick={() => onFocus("")} className="search-word-tab" style={{ "--word": "var(--ink)", animationDelay: "0ms" } as CSSProperties}>
          All words<small>{words.length}</small>
        </button>
        {words.map((word, i) => (
          <button key={word} type="button" aria-pressed={focus === word} onClick={() => onFocus(focus === word ? "" : word)} className="search-word-tab" style={{ "--word": wordColor(i), animationDelay: `${(i + 1) * 70}ms` } as CSSProperties}>
            <span className="search-word-dot" aria-hidden />{word}
            <small>{counts ? `${formatNumber(counts.get(word) ?? 0)} verses` : "…"}</small>
          </button>
        ))}
        {skipped.length > 0 && (
          <span className="search-word-skipped" style={{ animationDelay: `${(words.length + 1) * 70}ms` }}>
            <span className="sr-only">Skipped as too common:</span>{skipped.map((word) => <s key={word}>{word}</s>)}
          </span>
        )}
      </div>
    </nav>
  );
}
