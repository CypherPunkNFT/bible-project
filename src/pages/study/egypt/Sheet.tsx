// The record sheet: one proposed match. It opens from the right, the same way as on every study, sets the Egyptian beside the Berean, keeps
// the three parts of a record apart, and closes on Escape.
import { useEffect } from "react";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { JUDGE_WORD, type Parallel } from "./model";
import { Cite, OldText, Quote, ThreeParts } from "./parts";

function Record({ p }: { p: Parallel }) {
  return <>
    <p className="eg-kicker eg-sheet-when">{p.where}</p>
    <h2>{p.prov}</h2>
    <p className="eg-sheet-line">Counted by: {p.judges.map((id) => JUDGE_WORD.get(id)).join(", ")}.</p>
    <OldText who="Amenemope, in Griffith's translation of 1926" where={p.griffithRef}>{p.griffith}</OldText>
    {p.verses.map((label) => <Quote key={label} label={label} />)}
    {p.behind && <dl className="eg-behind">
      <p className="eg-kicker">Who stands behind the saying</p>
      <div><dt>In Amenemope</dt><dd>{p.behind.egypt}</dd></div>
      <div><dt>In Proverbs</dt><dd>{p.behind.israel}</dd></div>
    </dl>}
    <ThreeParts evidence={p.evidence} inference={p.inference} limit={p.limit} />
    <Cite ids={["griffith", "ruffle"]} />
  </>;
}

export function EgyptSheet({ parallel, onClose }: { parallel: Parallel | null; onClose: () => void }) {
  useEffect(() => {
    if (!parallel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parallel, onClose]);
  return <SlidePanel open={Boolean(parallel)} onClose={onClose} label={parallel?.prov ?? "Record"} closeLabel="Close this record">
    {parallel && <Record p={parallel} />}
  </SlidePanel>;
}
