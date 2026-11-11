// Show a room (design §8.3): one screen for a family or a youth group. The emoji arrive one at a time, very large, on
// tiles whose empty places show how many clues are to come; the leader opens hints, puts four lettered cards up,
// reveals the answer (the right card lights, the others fade) and moves on. Redesigned from the visual audit with a
// team tally the leader keeps by tapping "Got it" after each reveal; it lives in the page only and is never stored.
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { formatNumber } from "@/lib/site-format";
import { AnswerCard, TeamChips } from "../kit";
import type { GameData } from "./data";
import { EmojiRow, Hints } from "./Puzzle";
import { Reveal } from "./Reveal";
import { MAX_TEAMS, ROOM_TONES, roomRows, teamName, type RoomTeam } from "./rules";
import type { Round } from "./storage";

const LETTERS = ["A", "B", "C", "D"];

/** The tally as the kit's chips, each name in its own isolating element so a right-to-left name cannot flip the row. */
export function RoomChips({ teams }: { teams: readonly RoomTeam[] }) {
  return <TeamChips teams={roomRows(teams).map((row) => ({ ...row, name: <bdi>{row.name}</bdi> }))} tones={ROOM_TONES} label="Teams" className="es-room-chips" />;
}

export function RoomPlay({ data, round, teams, onChange, onTeams }: {
  data: GameData;
  round: Round;
  teams: readonly RoomTeam[];
  onChange: (round: Round) => void;
  onTeams: (teams: RoomTeam[]) => void;
}) {
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
  const award = (team: RoomTeam) => onTeams(teams.map((other) => other.id !== team.id ? other
    : { ...other, got: other.got.includes(puzzle.id) ? other.got.filter((id) => id !== puzzle.id) : [...other.got, puzzle.id] }));
  const addTeam = () => onTeams([...teams, { id: `t${teams.length}`, name: "", got: [] }]);
  const rename = (team: RoomTeam, name: string) => onTeams(teams.map((other) => (other.id === team.id ? { ...other, name } : other)));
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
  const canFullscreen = typeof document !== "undefined" && !!document.fullscreenEnabled;
  return (
    <section ref={section} className="es-room" aria-labelledby="es-room-title" tabIndex={-1}>
      <div className="es-room-top">
        <h2 id="es-room-title" className="es-progress">{`Story ${round.at + 1} of ${round.puzzles.length}`}</h2>
        {teams.length > 0 && <RoomChips teams={teams} />}
      </div>
      <EmojiRow key={puzzle.id} story={story} emoji={data.emoji} shown={puzzle.revealed ? story.emoji.length : Math.max(1, puzzle.clues)} large
        words={puzzle.hints >= 2 || puzzle.revealed} />
      <Hints story={story} opened={puzzle.hints} />
      {puzzle.choicesShown && (
        <ol className={`es-room-choices${puzzle.revealed ? " is-revealed" : ""}`} aria-label="Choices">
          {puzzle.choices.map((id, index) => (
            <li key={id}>
              <AnswerCard interactive={false} index={index} state={puzzle.revealed ? (id === story.id ? "right" : "faded") : "idle"} className="es-choice es-room-card">
                <span className="es-choice-key" aria-hidden="true">{LETTERS[index]}</span>
                <span className="es-choice-title">{data.byId.get(id)?.title}</span>
              </AnswerCard>
            </li>
          ))}
        </ol>
      )}
      {puzzle.revealed && (
        <Reveal story={story} verdict="shown" words={false}>
          {teams.length > 0 && (
            <div className="es-award" role="group" aria-label="Who got it">
              {teams.map((team, index) => (
                <button key={team.id} type="button" className="es-award-button" aria-pressed={team.got.includes(puzzle.id)}
                  style={{ "--_team": ROOM_TONES[index % ROOM_TONES.length] } as CSSProperties} onClick={press(() => award(team))}>
                  <span className="es-award-name"><bdi>{teamName(team, index)}</bdi></span>
                  <span className="es-award-word">Got it</span>
                </button>
              ))}
            </div>
          )}
        </Reveal>
      )}
      <div className="es-room-controls" role="toolbar" aria-label="Leader's controls">
        {!puzzle.revealed && <button type="button" onClick={press(actions.clue)} disabled={puzzle.clues >= story.emoji.length}>Next clue</button>}
        {!puzzle.revealed && <button type="button" onClick={press(actions.hint)} disabled={puzzle.hints >= 3}>Hint</button>}
        {!puzzle.revealed && <button type="button" onClick={press(actions.choices)} disabled={puzzle.choicesShown}>Show choices</button>}
        {!puzzle.revealed && <button type="button" className="es-primary" onClick={press(actions.reveal)}>Reveal</button>}
        {puzzle.revealed && <button type="button" className="es-primary" onClick={press(actions.next)}>{round.at + 1 < round.puzzles.length ? "Next story" : "Finish"}</button>}
        {canFullscreen && <button type="button" onClick={() => void section.current?.requestFullscreen?.().catch(() => undefined)}>Full screen</button>}
      </div>
      <details className="es-teams">
        <summary>Teams</summary>
        <p className="es-muted">Keep the score here if you like: after each answer, tap the team that got it.</p>
        <ul className="es-team-list">
          {teams.map((team, index) => (
            <li key={team.id}>
              <label>
                <span className="es-sr">{`Team ${formatNumber(index + 1)} name`}</span>
                <input type="text" maxLength={24} value={team.name} placeholder={`Team ${formatNumber(index + 1)}`} onChange={(event) => rename(team, event.target.value)} />
              </label>
            </li>
          ))}
        </ul>
        {teams.length < MAX_TEAMS && <button type="button" className="es-secondary" onClick={addTeam}>Add a team</button>}
      </details>
      <p className="es-muted es-keys">Keys: → or Space next clue, H hint, C choices, Enter reveal.</p>
    </section>
  );
}
