// Bible crossword: the start screen (pick a passage or theme, a level and a size) and the can't-load screen (design §1).
// The redesign (docs/visual-audits/crossword-redesign.md, audit item 7): the themes are a shelf of cards with a small
// grid drawing each, the sizes are drawn as grids, the chosen combination shows the shape of the puzzle it will make
// before "Make my crossword", and the hub's engraving sits beside the title.
import { Clock, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import { LEVELS, SIZES, SIZE_GRID, THEMES, isOffered, type Level, type Size } from "./themes";
import { clock, fitSpec, freshSeed, makeLayout, offeredBooks, sameSource, toPuzzle, type CluesFile, type Layout, type Spec } from "./game";
import type { BestTimes } from "./storage";

// Under `label:`, where the translation collector reads one-word names.
const LEVEL_LABELS: Record<Level, { label: string }> = { easy: { label: "Easy" }, medium: { label: "Medium" }, hard: { label: "Hard" } };
const SIZE_LABELS: Record<Size, { label: string }> = { small: { label: "Small" }, medium: { label: "Medium" }, large: { label: "Large" } };
const SIZE_CELLS: Record<Size, number> = { small: 3, medium: 4, large: 5 };

/** A small five-by-five grid drawing, its blocks placed from a seed so every theme card looks a little different. */
function ThemeThumb({ seed }: { seed: number }) {
  const cells = Array.from({ length: 25 }, (_, i) => ((seed * 7 + i * 13 + Math.floor(i / 5) * 3) % 5 === 0));
  return <svg className="cw-thumb" viewBox="0 0 25 25" aria-hidden="true" focusable="false">
    {cells.map((block, i) => <rect key={i} x={(i % 5) * 5} y={Math.floor(i / 5) * 5} width="5" height="5" className={block ? "is-block" : undefined} />)}
  </svg>;
}

/** A size drawn as a grid of three, four or five squares across. */
function SizeIcon({ size }: { size: Size }) {
  const n = SIZE_CELLS[size];
  return <svg className="cw-size-icon" viewBox={`0 0 ${n * 5} ${n * 5}`} aria-hidden="true" focusable="false" style={{ width: `${n * 0.42}rem`, height: `${n * 0.42}rem` }}>
    {Array.from({ length: n * n }, (_, i) => <rect key={i} x={(i % n) * 5} y={Math.floor(i / n) * 5} width="5" height="5" className={(i + Math.floor(i / n)) % 3 === 2 ? "is-block" : undefined} />)}
  </svg>;
}

/** The shape the chosen puzzle will have: its squares and blocks, drawn small. */
function Shape({ layout, data }: { layout: Layout; data: CluesFile }) {
  const puzzle = toPuzzle(data, layout);
  if (!puzzle) return null;
  return <svg className="cw-shape" viewBox={`0 0 ${puzzle.width * 6} ${puzzle.height * 6}`} aria-hidden="true" focusable="false"
    style={{ width: `${Math.min(14, puzzle.width * 0.8)}rem` }}>
    {puzzle.cells.map((answer, i) => <rect key={i} x={(i % puzzle.width) * 6 + 0.4} y={Math.floor(i / puzzle.width) * 6 + 0.4} width="5.2" height="5.2"
      className={answer === null ? "is-block" : undefined} />)}
  </svg>;
}

/** The puzzle the choices will make, laid out a moment after the choice (so the tap lands first) and kept per choice
 *  while this screen is open. The seed is fresh each time the screen opens, so the next visit makes another puzzle. */
function usePreview(data: CluesFile, spec: Spec, offered: boolean): { layout: Layout | null; ready: boolean } {
  const key = JSON.stringify(spec);
  const seed = useRef(freshSeed());
  const cache = useRef(new Map<string, Layout | null>());
  const [, bump] = useState(0);
  useEffect(() => {
    if (!offered || cache.current.has(key)) return;
    const timer = setTimeout(() => { cache.current.set(key, makeLayout(data, spec, seed.current)); bump((n) => n + 1); }, 30);
    return () => clearTimeout(timer);
  }, [data, spec, key, offered]);
  return { layout: cache.current.get(key) ?? null, ready: cache.current.has(key) };
}

interface StartProps {
  data: CluesFile; spec: Spec; solved: number; best: BestTimes; englishNote: boolean; failed: boolean;
  onSpec: (spec: Spec) => void; onPlay: (layout: Layout | null) => void;
}

export function StartScreen({ data, spec, solved, best, englishNote, failed, onSpec, onPlay }: StartProps) {
  const choose = (next: Spec) => onSpec(fitSpec(data, next));
  const books = offeredBooks(data);
  const offered = isOffered(data.entries, spec.source, spec.level, spec.size);
  const { max, target } = SIZE_GRID[spec.size];
  const preview = usePreview(data, spec, offered);
  const bestTime = best[spec.size];
  return <div className="cw-start">
    <div className="cw-start-head">
      <GameArtImage art={GAME_ART.crossword} className="cw-art" />
      <div>
        <h1>Bible crossword</h1>
        <p className="cw-lede">Pick a passage or a theme and solve a crossword made from the site's own people, places, verses and quiz questions.</p>
        {englishNote && <p className="cw-note">The clues and answers are in English.</p>}
      </div>
    </div>
    <fieldset className="cw-shelf">
      <legend>Theme</legend>
      {THEMES.map((theme, i) => <button key={theme.id} type="button" className="cw-theme" aria-pressed={sameSource(spec.source, { theme: theme.id })}
        onClick={() => choose({ ...spec, source: { theme: theme.id } })}><ThemeThumb seed={i + 1} /><span>{theme.title}</span></button>)}
      <label className={`cw-theme cw-book${"book" in spec.source ? " is-chosen" : ""}`}>
        <ThemeThumb seed={23} />
        <span>Or one book</span>
        <select value={"book" in spec.source ? String(spec.source.book) : ""}
          onChange={(event) => choose({ ...spec, source: event.target.value ? { book: Number(event.target.value) } : { theme: "whole" } })}>
          <option value="">Choose a book</option>
          {books.map((book) => <option key={book.num} value={book.num}>{book.name}</option>)}
        </select>
      </label>
    </fieldset>
    <div className="cw-start-row">
      <fieldset className="cw-chips">
        <legend>How hard</legend>
        {LEVELS.map((level) => {
          const open = SIZES.some((size) => isOffered(data.entries, spec.source, level, size));
          return <button key={level} type="button" aria-pressed={level === spec.level} disabled={!open} aria-describedby={open ? undefined : "cw-not-offered"}
            onClick={() => choose({ ...spec, level })}>{LEVEL_LABELS[level].label}</button>;
        })}
      </fieldset>
      <fieldset className="cw-chips cw-sizes">
        <legend>Size</legend>
        {SIZES.map((size) => {
          const open = isOffered(data.entries, spec.source, spec.level, size);
          return <button key={size} type="button" aria-pressed={size === spec.size} disabled={!open} aria-describedby={open ? undefined : "cw-not-offered"}
            onClick={() => choose({ ...spec, size })}><SizeIcon size={size} />{SIZE_LABELS[size].label}</button>;
        })}
      </fieldset>
    </div>
    <p className="cw-note"><span>{`About ${target} words, on a grid of up to ${max} by ${max} squares.`}</span>{" "}<span id="cw-not-offered">A greyed-out choice has too few clues at this level.</span></p>
    <div className="cw-preview">
      {preview.ready && preview.layout ? <Shape layout={preview.layout} data={data} /> : <div className="cw-shape cw-shape-wait" aria-hidden="true" />}
      <div className="cw-preview-words">
        {preview.ready && preview.layout && <p className="cw-note">{plural(preview.layout.words.length, "{n} word, laid out and waiting.", "{n} words, laid out and waiting.")}</p>}
        {failed && <p className="cw-note" role="alert">No puzzle of this size could be made from these clues just now. Try again, or pick a smaller size.</p>}
        <button type="button" className="cw-primary" disabled={!offered} onClick={() => onPlay(preview.ready ? preview.layout : null)}>Make my crossword</button>
      </div>
    </div>
    {(solved > 0 || bestTime) && <dl className="cw-record">
      {solved > 0 && <div><dt><Trophy size={14} aria-hidden="true" />Solved</dt><dd>{formatNumber(solved)}</dd></div>}
      {bestTime && <div><dt><Clock size={14} aria-hidden="true" />Best time</dt><dd translate="no">{clock(bestTime)}</dd></div>}
    </dl>}
  </div>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="cw-start" role="alert">
    <h1>Bible crossword</h1>
    <p className="cw-lede">The clues didn't load.</p>
    <button type="button" className="cw-primary" onClick={onRetry}>Try again</button>
  </div>;
}
