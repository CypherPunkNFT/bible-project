// Family charades: the recap after a round (design §7.4), back in the site's layout. Every scene in the order played,
// its mark, its passage and a link to read it. Tapping a mark fixes a mis-tilt until Next or Play again (§6.3).
import { BookOpen, RotateCcw, Settings2, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { bookByCode, formatRange } from "@/lib/refs";
import { plural } from "@/lib/site-format";
import { parseRef, readHref, type Scene } from "./deck";
import { passesOf, scoreOf, type EndReason, type Mark, type Row } from "./game";

interface Props {
  scenes: ReadonlyMap<string, Scene>;
  rows: Row[];
  ended: EndReason;
  leftMs: number;
  newBest: boolean;
  teamName: string | null;
  /** Teams: the label of the button that moves on ("Next team" or "Final standings"); null in quick play. */
  nextLabel: string | null;
  onFix: (id: string) => void;
  onNext: () => void;
  onChangeDeck: () => void;
}

const MARKS: Record<Mark, { symbol: string; label: string }> = {
  correct: { symbol: "✓", label: "Correct" },
  pass: { symbol: "↷", label: "Passed" },
  unplayed: { symbol: "–", label: "Not played" },
};

export function Recap({ scenes, rows, ended, leftMs, newBest, teamName, nextLabel, onFix, onNext, onChangeDeck }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const score = scoreOf(rows);
  return <section className="ch-recap" aria-labelledby="ch-recap-title">
    {teamName && <p className="ch-team-turn">{teamName}</p>}
    <h1 id="ch-recap-title" ref={heading} tabIndex={-1}>{`${score} correct`}</h1>
    <p className="ch-recap-sub">
      <span>{`${passesOf(rows)} passed`}</span>
      {newBest && <strong className="ch-new-best">New best!</strong>}
    </p>
    {ended === "deck" && <p className="ch-recap-note">{plural(Math.ceil(leftMs / 1000), "You got through the whole deck with {n} second left!",
      "You got through the whole deck with {n} seconds left!")}</p>}
    {rows.length > 0 ? <>
      <p className="ch-recap-hint">Tap a mark to fix it.</p>
      <ol className="ch-recap-list">{rows.map((row) => <RecapRow key={row.id} row={row} scene={scenes.get(row.id)} onFix={onFix} />)}</ol>
    </> : <p className="ch-recap-note">No scenes were played this round.</p>}
    <div className="ch-recap-actions">
      <button type="button" className="ch-primary" onClick={onNext} autoFocus={false}>
        {nextLabel ? <><Users size={16} aria-hidden="true" />{nextLabel}</> : <><RotateCcw size={16} aria-hidden="true" />Play again</>}
      </button>
      <button type="button" className="ch-secondary" onClick={onChangeDeck}><Settings2 size={16} aria-hidden="true" />Change deck</button>
    </div>
  </section>;
}

function RecapRow({ row, scene, onFix }: { row: Row; scene: Scene | undefined; onFix: (id: string) => void }) {
  const catalog = useCatalog();
  if (!scene) return null;
  const passages = parseRef(scene.ref, (code) => bookByCode(catalog, code)?.num);
  const reference = passages.map((p) => formatRange(catalog, p.start, p.end)).join("; ");
  const mark = MARKS[row.mark];
  return <li className={`ch-recap-row is-${row.mark}`}>
    <button type="button" className="ch-mark" onClick={() => onFix(row.id)} aria-label={`${mark.label}: ${scene.title}. Tap to change.`}>
      <span aria-hidden="true">{mark.symbol}</span>
    </button>
    <div className="ch-recap-text">
      <strong>{scene.title}</strong>
      <span className="ch-ref">{reference}</span>
    </div>
    <Link className="ch-read" to={readHref(passages[0])}><BookOpen size={14} aria-hidden="true" />Read the story</Link>
  </li>;
}
