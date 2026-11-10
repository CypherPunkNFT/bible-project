// Show a room (design §8.3): one screen for a family or a youth group. The emoji arrive one at a time, very large;
// the leader opens hints, puts four titles up, reveals the answer and moves on. The room keeps its own score.
import { useEffect, useRef, type MouseEvent } from "react";
import type { GameData } from "./data";
import { EmojiRow, Hints } from "./Puzzle";
import { Reveal } from "./Reveal";
import type { Round } from "./storage";

export function RoomPlay({ data, round, onChange }: { data: GameData; round: Round; onChange: (round: Round) => void }) {
  const section = useRef<HTMLElement>(null);
  const puzzle = round.puzzles[round.at];
  const story = data.byId.get(puzzle.id)!;
  const update = (changes: Partial<typeof puzzle>) =>
    onChange({ ...round, puzzles: round.puzzles.map((item, index) => (index === round.at ? { ...item, ...changes } : item)) });
  const actions = {
    clue: () => puzzle.clues < story.emoji.length && update({ clues: puzzle.clues + 1 }),
    hint: () => puzzle.hints < 3 && update({ hints: puzzle.hints + 1 }),
    choices: () => update({ choicesShown: true }),
    reveal: () => update({ revealed: true, clues: story.emoji.length }),
    next: () => onChange(round.at + 1 < round.puzzles.length ? { ...round, at: round.at + 1 } : { ...round, over: true }),
  };
  // A button clicked with a mouse or a finger hands focus back to the room, so → / Space / Enter keep driving the round
  // instead of pressing that button again. A button pressed from the keyboard keeps its focus.
  const press = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    action();
    const pointer = (event.nativeEvent as PointerEvent).pointerType;
    if (pointer ? pointer !== "" : event.detail > 0) section.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select")) return;
      const onControl = !!target?.closest("a, button");
      const key = event.key.toLowerCase();
      if (key === "arrowright" || (key === " " && !onControl)) actions.clue();
      else if (key === "h") actions.hint();
      else if (key === "c") actions.choices();
      else if (key === "enter" && !onControl) (puzzle.revealed ? actions.next : actions.reveal)();
      else if (key === "n" && puzzle.revealed) actions.next();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <section ref={section} className="es-room" aria-labelledby="es-room-title" tabIndex={-1}>
      <h2 id="es-room-title" className="es-progress">{`Story ${round.at + 1} of ${round.puzzles.length}`}</h2>
      <EmojiRow key={puzzle.id} story={story} emoji={data.emoji} shown={puzzle.revealed ? story.emoji.length : Math.max(1, puzzle.clues)} large />
      <Hints story={story} opened={puzzle.hints} />
      {puzzle.choicesShown && !puzzle.revealed && (
        <ol className="es-room-choices">
          {puzzle.choices.map((id) => <li key={id}>{data.byId.get(id)?.title}</li>)}
        </ol>
      )}
      {puzzle.revealed && <Reveal story={story} verdict="shown" />}
      <div className="es-room-controls" role="toolbar" aria-label="Leader's controls">
        {!puzzle.revealed && <button type="button" onClick={press(actions.clue)} disabled={puzzle.clues >= story.emoji.length}>Next clue</button>}
        {!puzzle.revealed && <button type="button" onClick={press(actions.hint)} disabled={puzzle.hints >= 3}>Hint</button>}
        {!puzzle.revealed && <button type="button" onClick={press(actions.choices)} disabled={puzzle.choicesShown}>Show choices</button>}
        {!puzzle.revealed && <button type="button" className="es-primary" onClick={press(actions.reveal)}>Reveal</button>}
        {puzzle.revealed && <button type="button" className="es-primary" onClick={press(actions.next)}>{round.at + 1 < round.puzzles.length ? "Next story" : "Finish"}</button>}
        <button type="button" onClick={() => void section.current?.requestFullscreen?.().catch(() => undefined)}>Full screen</button>
      </div>
      <p className="es-muted es-keys">Keys: → or Space next clue, H hint, C choices, Enter reveal.</p>
    </section>
  );
}
