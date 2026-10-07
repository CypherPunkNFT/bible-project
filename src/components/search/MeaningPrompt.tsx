import { ArrowRight, Download, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { enableMeaning, useMeaning } from "@/lib/meaning/store";

const MB = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;

/**
 * Meaning search, offered under every search box that looks for studies or information (not name look-ups):
 * the invitation and "Turn on" while it is off, progress while it downloads, and once it is on either `active`
 * (what this page does with it) or a link that asks the same words by meaning on the Search page.
 */
export function MeaningPrompt({ query, active, className = "" }: { query: string; active?: ReactNode; className?: string }) {
  const meaning = useMeaning();
  if (meaning.phase === "checking" || meaning.phase === "unsupported" || meaning.phase === "error") return null;
  const askByMeaning = `/search?q=${encodeURIComponent(query.trim())}`;
  // The star sits inside the first words, so it stays on their line however the text wraps.
  const star = <Sparkles size={14} className="mr-1.5 inline align-[-2px] text-accent" aria-hidden />;
  let body: ReactNode;
  if (meaning.phase === "ready") {
    body = active ?? (query.trim()
      ? <Link to={askByMeaning} className="font-semibold text-accent hover:underline">{star}Ask “{query.trim()}” by meaning: studies and verses <ArrowRight size={13} className="inline align-[-2px]" aria-hidden /></Link>
      : <span className="text-muted">{star}Meaning search is on: ask in your own words on the Search page.</span>);
  } else if (meaning.phase === "downloading") {
    body = <span className="flex flex-1 items-center gap-3 text-muted"><span>{star}Setting up meaning search… {Math.round(meaning.progress * 100)}%</span><span className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-accent" style={{ width: `${meaning.progress * 100}%` }} /></span></span>;
  } else {
    body = <>
      <span className="text-muted">{star}Semantic search: a small model on your device, free and private.</span>
      <button type="button" onClick={() => void enableMeaning()} className="inline-flex items-center gap-1.5 rounded-full border border-accent/60 px-3 py-1 font-semibold text-accent hover:bg-accent/10"><Download size={13} aria-hidden />{meaning.phase === "update" ? "Update" : "Turn on"}{meaning.manifest ? ` · ${MB(meaning.manifest.bytes)} once` : ""}</button>
      <Link to="/search/meaning" className="text-accent hover:underline">How it works</Link>
    </>;
  }
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] ${className}`} aria-live="polite">
      {active && meaning.phase === "ready" ? <span>{star}{body}</span> : body}
    </p>
  );
}
