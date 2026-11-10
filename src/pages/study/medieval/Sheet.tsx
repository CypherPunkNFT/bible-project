// The record sheet: one pair. It opens from the right, the same way as on every study, keeps the three parts of a record apart, and closes on Escape.
import { useEffect } from "react";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { fieldById, type Pair } from "./model";
import { Cite, OldText, ThreeParts } from "./parts";

function Record({ pair }: { pair: Pair }) {
  return <>
    <p className="mv-kicker mv-sheet-when">{fieldById.get(pair.field)?.name} · {pair.link === "same" ? "the same quarrel or rule" : "only set side by side by this study"}</p>
    <h2>{pair.head}</h2>
    <p className="mv-sidehead">{`Decreed · ${pair.declared.when}`}</p>
    {pair.declared.quote ? <OldText who={pair.declared.who}>“{pair.declared.quote}”</OldText> : <p className="mv-para">{pair.declared.who}.</p>}
    <p className="mv-sidehead">{`Set beside it · ${pair.followed.when}`}</p>
    {pair.followed.quote ? <OldText who={pair.followed.who}>“{pair.followed.quote}”</OldText> : <p className="mv-para">{pair.followed.who}.</p>}
    <ThreeParts evidence={pair.evidence} inference={pair.inference} limit={pair.limit} />
    <Cite ids={pair.sources} />
  </>;
}

export function PairSheet({ pair, onClose }: { pair: Pair | null; onClose: () => void }) {
  useEffect(() => {
    if (!pair) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pair, onClose]);
  return <SlidePanel open={Boolean(pair)} onClose={onClose} label={pair?.head ?? "Record"} closeLabel="Close this record">
    {pair && <Record pair={pair} />}
  </SlidePanel>;
}
