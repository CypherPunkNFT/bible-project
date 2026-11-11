// Family charades: the recap after a round (design §7.4, redesigned from the visual audit), back in the site's layout.
// The score counts up from zero beside a bar against this device's best, with a ribbon and one gold burst for a new
// best; then every scene in the order played, its mark, its passage and a link to read it. Tapping a mark fixes a
// mis-tilt until Next or Play again (§6.3). Play again sits with the score, so a phone never scrolls to find it.
import { BookOpen, RotateCcw, Settings2, Users } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { bookByCode, formatRange } from "@/lib/refs";
import { formatNumber, plural } from "@/lib/site-format";
import { Confetti, NewBestRibbon, ScoreCountUp } from "../kit";
import { parseRef, readHref, type Scene } from "./deck";
import { bestShares } from "./display";
import { passesOf, scoreOf, type EndReason, type Mark, type Row } from "./game";

interface Props {
  scenes: ReadonlyMap<string, Scene>;
  rows: Row[];
  ended: EndReason;
  leftMs: number;
  newBest: boolean;
  /** The best on this device before the round, for the bar the score is measured against. */
  bestBefore: number;
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

export function Recap({ scenes, rows, ended, leftMs, newBest, bestBefore, teamName, nextLabel, onFix, onNext, onChangeDeck }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const score = scoreOf(rows);
  const shares = bestShares(score, bestBefore);
  return <section className="ch-recap" aria-labelledby="ch-recap-title">
    {teamName && <p className="ch-team-turn"><span className="ch-ready-team">{teamName}</span></p>}
    <div className="ch-result">
      <h1 id="ch-recap-title" ref={heading} tabIndex={-1} className="ch-result-score">
        <ScoreCountUp value={score} ms={600} label={`${score} correct`} className="ch-count" />
        <span aria-hidden="true">correct</span>
      </h1>
      <p className="ch-recap-sub">
        <span>{`${passesOf(rows)} passed`}</span>
        <NewBestRibbon when={newBest} className="ch-new-best" />
      </p>
      <div className="ch-best-bar" style={{ "--ch-score-share": shares.score, "--ch-best-share": shares.best } as CSSProperties} aria-hidden="true">
        <span className="ch-best-fill" />
        {bestBefore > 0 && <span className="ch-best-mark"><span className="ch-best-label">Best</span><span>{formatNumber(bestBefore)}</span></span>}
      </div>
      <Confetti when={newBest} count={30} reach={140} />
    </div>
    {ended === "deck" && <p className="ch-recap-note">{plural(Math.ceil(leftMs / 1000), "You got through the whole deck with {n} second left!",
      "You got through the whole deck with {n} seconds left!")}</p>}
    <div className="ch-recap-actions">
      <button type="button" className="ch-primary" onClick={onNext} autoFocus={false}>
        {nextLabel ? <><Users size={16} aria-hidden="true" />{nextLabel}</> : <><RotateCcw size={16} aria-hidden="true" />Play again</>}
      </button>
      <button type="button" className="ch-secondary" onClick={onChangeDeck}><Settings2 size={16} aria-hidden="true" />Change deck</button>
    </div>
    {rows.length > 0 ? <>
      <p className="ch-recap-hint">Tap a mark to fix it.</p>
      <ol className="ch-recap-list">{rows.map((row, i) => <RecapRow key={row.id} row={row} index={i} scene={scenes.get(row.id)} onFix={onFix} />)}</ol>
    </> : <p className="ch-recap-note">No scenes were played this round.</p>}
  </section>;
}

function RecapRow({ row, index, scene, onFix }: { row: Row; index: number; scene: Scene | undefined; onFix: (id: string) => void }) {
  const catalog = useCatalog();
  if (!scene) return null;
  const passages = parseRef(scene.ref, (code) => bookByCode(catalog, code)?.num);
  const reference = passages.map((p) => formatRange(catalog, p.start, p.end)).join("; ");
  const mark = MARKS[row.mark];
  return <li className={`ch-recap-row is-${row.mark}`} style={{ "--ch-i": index } as CSSProperties}>
    <button type="button" className="ch-mark" onClick={() => onFix(row.id)} aria-label={`${mark.label}: ${scene.title}. Tap to change.`}>
      <span key={row.mark} className="ch-mark-face" aria-hidden="true">{mark.symbol}</span>
    </button>
    <div className="ch-recap-text">
      <strong>{scene.title}</strong>
      <span className="ch-ref">{reference}</span>
    </div>
    <Link className="ch-read" to={readHref(passages[0])}><BookOpen size={14} aria-hidden="true" />Read the story</Link>
  </li>;
}
