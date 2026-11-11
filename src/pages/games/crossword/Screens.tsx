// Bible crossword: the start screen (pick a passage or theme, a level and a size) and the can't-load screen (design §1).
import { LEVELS, SIZES, SIZE_GRID, THEMES, isOffered, type Level, type Size } from "./themes";
import { offeredBooks, sameSource, fitSpec, type CluesFile, type Spec } from "./game";

// Under `label:`, where the translation collector reads one-word names.
const LEVEL_LABELS: Record<Level, { label: string }> = { easy: { label: "Easy" }, medium: { label: "Medium" }, hard: { label: "Hard" } };
const SIZE_LABELS: Record<Size, { label: string }> = { small: { label: "Small" }, medium: { label: "Medium" }, large: { label: "Large" } };

interface StartProps { data: CluesFile; spec: Spec; solved: number; englishNote: boolean; failed: boolean; onSpec: (spec: Spec) => void; onPlay: () => void }

export function StartScreen({ data, spec, solved, englishNote, failed, onSpec, onPlay }: StartProps) {
  const choose = (next: Spec) => onSpec(fitSpec(data, next));
  const books = offeredBooks(data);
  const offered = isOffered(data.entries, spec.source, spec.level, spec.size);
  const { max, target } = SIZE_GRID[spec.size];
  return <div className="cw-start">
    <h1>Bible crossword</h1>
    <p className="cw-lede">Pick a passage or a theme and solve a crossword made from the site's own people, places, verses and quiz questions.</p>
    {englishNote && <p className="cw-note">The clues and answers are in English.</p>}
    <fieldset className="cw-chips">
      <legend>Theme</legend>
      {THEMES.map((theme) => <button key={theme.id} type="button" aria-pressed={sameSource(spec.source, { theme: theme.id })}
        onClick={() => choose({ ...spec, source: { theme: theme.id } })}>{theme.title}</button>)}
    </fieldset>
    <label className="cw-book">
      <span>Or one book of the Bible</span>
      <select value={"book" in spec.source ? String(spec.source.book) : ""}
        onChange={(event) => choose({ ...spec, source: event.target.value ? { book: Number(event.target.value) } : { theme: "whole" } })}>
        <option value="">Choose a book</option>
        {books.map((book) => <option key={book.num} value={book.num}>{book.name}</option>)}
      </select>
    </label>
    <fieldset className="cw-chips">
      <legend>How hard</legend>
      {LEVELS.map((level) => {
        const open = SIZES.some((size) => isOffered(data.entries, spec.source, level, size));
        return <button key={level} type="button" aria-pressed={level === spec.level} disabled={!open}
          onClick={() => choose({ ...spec, level })}>{LEVEL_LABELS[level].label}</button>;
      })}
    </fieldset>
    <fieldset className="cw-chips">
      <legend>Size</legend>
      {SIZES.map((size) => {
        const open = isOffered(data.entries, spec.source, spec.level, size);
        return <button key={size} type="button" aria-pressed={size === spec.size} disabled={!open}
          title={open ? undefined : "Not enough clues for this size at this level"} onClick={() => choose({ ...spec, size })}>{SIZE_LABELS[size].label}</button>;
      })}
    </fieldset>
    <p className="cw-note">{`About ${target} words, on a grid of up to ${max} by ${max} squares.`}</p>
    {failed && <p className="cw-note" role="alert">No puzzle of this size could be made from these clues just now. Try again, or pick a smaller size.</p>}
    <div className="cw-start-foot">
      <button type="button" className="cw-primary" disabled={!offered} onClick={onPlay}>Make my crossword</button>
      {solved > 0 && <span className="cw-best">{`Crosswords solved on this device: ${solved}`}</span>}
    </div>
  </div>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="cw-start" role="alert">
    <h1>Bible crossword</h1>
    <p className="cw-lede">The clues didn't load.</p>
    <button type="button" className="cw-primary" onClick={onRetry}>Try again</button>
  </div>;
}
