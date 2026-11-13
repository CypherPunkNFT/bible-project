// Bible crossword: the start screen (pick a passage or theme, a level and a size) and the can't-load screen (design §1).
// The redesign (docs/visual-audits/crossword-redesign.md, audit item 7): the themes are a shelf of cards, the sizes
// are drawn as grids, the chosen combination shows the shape of the puzzle it will make before "Make my crossword",
// and the hub's engraving sits beside the title. Owner, 2026-11-12: each theme card carries its own line drawing,
// "Or one book" opens a window of every book (BookPicker.tsx), and unfinished puzzles wait under "Carry on".
import { Clock, Trophy } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import { LEVELS, SIZES, SIZE_GRID, THEMES, isOffered, type Level, type Size } from "./themes";
import { allBooks, clock, fitSpec, freshSeed, makeLayout, sameSource, toPuzzle, type CluesFile, type Layout, type Spec } from "./game";
import type { BestTimes, PlayState } from "./storage";
import { BookPicker } from "./BookPicker";
import { ThemeIcon } from "./ThemeIcons";
import { TILE_TONES, ThemeTileArt } from "./ThemeTileArt";

/** A theme tile's book colour, as the --cw-tone its drawing and pressed edge use. */
const tone = (id: string) => ({ "--cw-tone": `var(--${TILE_TONES[id]})` }) as CSSProperties;

// Under `label:`, where the translation collector reads one-word names.
const LEVEL_LABELS: Record<Level, { label: string }> = { easy: { label: "Easy" }, medium: { label: "Medium" }, hard: { label: "Hard" } };
const SIZE_LABELS: Record<Size, { label: string }> = { small: { label: "Small" }, medium: { label: "Medium" }, large: { label: "Large" } };
const SIZE_CELLS: Record<Size, number> = { small: 3, medium: 4, large: 5 };

/** Unfinished puzzles put aside, newest first: what each was made from, its level and size, and how far it got. */
function CarryOn({ data, shelf, onResume }: { data: CluesFile; shelf: readonly PlayState[]; onResume: (index: number) => void }) {
  if (shelf.length === 0) return null;
  return <fieldset className="cw-shelf cw-carry">
    <legend>Carry on</legend>
    {shelf.map((game, index) => {
      const puzzle = toPuzzle(data, game.layout);
      if (!puzzle) return null;
      const squares = puzzle.cells.filter((cell) => cell !== null).length;
      const filled = game.letters.filter((letter) => letter !== "").length;
      const source = game.spec.source;
      const title = "book" in source ? data.books[source.book - 1]?.[1] ?? "" : THEMES.find((theme) => theme.id === source.theme)?.title ?? "";
      return <button key={JSON.stringify(game.layout)} type="button" className="cw-theme cw-carry-card" onClick={() => onResume(index)}>
        <ThemeIcon id={"book" in source ? "book" : source.theme} />
        <span>
          <span className="cw-carry-title">{title}</span>
          <small><span>{LEVEL_LABELS[game.spec.level].label}</span>{" · "}<span>{SIZE_LABELS[game.spec.size].label}</span>{" · "}<span>{`${filled} of ${squares} squares filled`}</span></small>
        </span>
      </button>;
    })}
  </fieldset>;
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
  data: CluesFile; spec: Spec; shelf: readonly PlayState[]; solved: number; best: BestTimes; englishNote: boolean; failed: boolean;
  onSpec: (spec: Spec) => void; onPlay: (layout: Layout | null) => void; onResume: (index: number) => void;
}

export function StartScreen({ data, spec, shelf, solved, best, englishNote, failed, onSpec, onPlay, onResume }: StartProps) {
  const choose = (next: Spec) => onSpec(fitSpec(data, next));
  const [picking, setPicking] = useState(false);
  const books = allBooks(data);
  const chosenBook = "book" in spec.source ? spec.source.book : null;
  const savedBooks = new Set(shelf.flatMap((game) => ("book" in game.spec.source ? [game.spec.source.book] : [])));
  const hasSaved = (themeId: string) => shelf.some((game) => sameSource(game.spec.source, { theme: themeId }));
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
    <CarryOn data={data} shelf={shelf} onResume={onResume} />
    <fieldset className="cw-shelf cw-tiles">
      <legend>Theme</legend>
      {THEMES.map((theme) => <button key={theme.id} type="button" className="cw-tile" style={tone(theme.id)} aria-pressed={sameSource(spec.source, { theme: theme.id })}
        onClick={() => choose({ ...spec, source: { theme: theme.id } })}><ThemeTileArt id={theme.id} /><span className="cw-tile-name">{theme.title}</span>
        <span className="cw-tile-note" aria-hidden="true">{theme.note}</span>
        {hasSaved(theme.id) && <span className="cw-saved-dot" aria-hidden="true" />}</button>)}
      <button type="button" className="cw-tile cw-book" style={tone("book")} aria-pressed={chosenBook !== null} aria-haspopup="dialog" onClick={() => setPicking(true)}>
        <ThemeTileArt id="book" />
        <span className="cw-tile-name">Or one book</span>
        <span className="cw-tile-note">{chosenBook !== null ? books[chosenBook - 1]?.name : "Any one of the 66"}</span>
        {savedBooks.size > 0 && <span className="cw-saved-dot" aria-hidden="true" />}
      </button>
    </fieldset>
    <BookPicker open={picking} books={books} chosen={chosenBook} saved={savedBooks} onClose={() => setPicking(false)}
      onPick={(book) => { setPicking(false); choose({ ...spec, source: { book } }); }} />
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
