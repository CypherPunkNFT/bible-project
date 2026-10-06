import { useEffect, useState } from "react";
import { searchByMeaning, useMeaning, type MeaningResults } from "./store";

/** Runs the meaning search for one submitted query (when switched on). */
export function useMeaningResults(query: string): { status: "off" | "loading" | "done" | "error"; results: MeaningResults | null } {
  const meaning = useMeaning();
  const [result, setResult] = useState<{ query: string; results: MeaningResults | null; failed: boolean }>({ query: "", results: null, failed: false });
  useEffect(() => {
    if (meaning.phase !== "ready" || !query.trim()) return;
    let current = true;
    searchByMeaning(query).then(
      (results) => { if (current) setResult({ query, results, failed: false }); },
      (error: unknown) => { console.error("meaning search failed", error); if (current) setResult({ query, results: null, failed: true }); },
    );
    return () => { current = false; };
  }, [meaning.phase, query]);
  if (meaning.phase !== "ready" || !query.trim()) return { status: "off", results: null };
  if (result.query !== query) return { status: "loading", results: null };
  return { status: result.failed ? "error" : "done", results: result.results };
}

