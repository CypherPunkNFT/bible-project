// Bible Jeopardy's rules (design 5.5, 6): one pure reducer that turns the game and one host action into the next game.
// It is the only place points change. Every accepted action keeps the play state before it, so Undo can step back one
// action at a time to the start; a refused action returns the same game object unchanged.
import { MAX_TEAMS, MIN_TEAMS, TOP_VALUE, type Board, type FinalClue, type Settings, type Spot, type Team } from "./model";

export type Screen = "board" | "daily-double" | "clue" | "answer" | "final-category" | "final-clue" | "final-answer" | "results" | "tie-clue" | "tie-answer";
export type Mark = "right" | "wrong" | null;

export interface FinalMark { bet: number; right: boolean }
export interface TieBreak { clue: FinalClue; teams: number[]; marks: Mark[]; winner: number | null }

/** Everything that changes during play: what Undo restores. */
export interface Play {
  screen: Screen;
  teams: Team[];
  chooser: number;
  /** [column][row]: true once the tile has been played. */
  played: boolean[][];
  open: Spot | null;
  /** Each team's mark on the open clue. */
  marks: Mark[];
  /** The Daily Double's bet, once made. */
  bet: number | null;
  /** The Final's marking order (lowest score first, fixed when its answer is shown) and each team's bet and mark. */
  finalOrder: number[];
  finalMarks: (FinalMark | null)[];
  tie: TieBreak | null;
  /** The last change of score, for the scoreboard and the screen-reader announcement. */
  last: { team: number; delta: number } | null;
}

export interface Game {
  v: 1;
  id: string;
  settings: Settings;
  board: Board;
  play: Play;
  history: Play[];
}

export type Action =
  | { type: "open"; spot: Spot }
  | { type: "bet"; amount: number }
  | { type: "mark"; team: number; right: boolean }
  | { type: "reveal" }
  | { type: "back" }
  | { type: "choose"; team: number }
  | { type: "adjust"; team: number; delta: number }
  | { type: "set-score"; team: number; score: number }
  | { type: "rename"; team: number; name: string }
  | { type: "replay"; spot: Spot }
  | { type: "end" }
  | { type: "final-clue" }
  | { type: "final-reveal" }
  | { type: "final-mark"; team: number; bet: number; right: boolean }
  | { type: "tie-break"; clue: FinalClue }
  | { type: "undo" };

export const HISTORY_LIMIT = 600;
export const SCORE_LIMIT = 1_000_000;

/** The highest Daily Double bet: the team's score or the board's top value, whichever is larger (6.3). */
export const dailyDoubleMax = (score: number) => Math.max(score, TOP_VALUE);
/** The highest Final bet: the team's score; a team at or below zero bets 0 (6.4). */
export const finalMax = (score: number) => Math.max(0, score);
/** Half the highest allowed bet, rounded down to a multiple of 50. */
export const halfBet = (max: number) => Math.floor(max / 2 / 50) * 50;

const isWhole = (value: number, low: number, high: number) => Number.isInteger(value) && value >= low && value <= high;

export function newGame(id: string, settings: Settings, board: Board, random: () => number = Math.random): Game {
  const count = Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, settings.teamNames.length));
  const teams = settings.teamNames.slice(0, count).map((name) => ({ name, score: 0 }));
  return {
    v: 1, id, settings, board, history: [],
    play: {
      screen: "board", teams, chooser: settings.randomStart ? Math.min(count - 1, Math.floor(random() * count)) : 0,
      played: board.columns.map((column) => column.tiles.map(() => false)), open: null, marks: teams.map(() => null), bet: null,
      finalOrder: [], finalMarks: teams.map(() => null), tie: null, last: null,
    },
  };
}

export const isDailyDouble = (board: Board, spot: Spot | null) => Boolean(spot && board.dailyDouble && board.dailyDouble.col === spot.col && board.dailyDouble.row === spot.row);
export const tileAt = (board: Board, spot: Spot) => board.columns[spot.col]?.tiles[spot.row] ?? null;
export const allPlayed = (play: Play) => play.played.every((column) => column.every(Boolean));
const scoreChange = (play: Play, team: number, delta: number): Pick<Play, "teams" | "last"> => ({
  teams: play.teams.map((entry, index) => (index === team ? { ...entry, score: Math.max(-SCORE_LIMIT, Math.min(SCORE_LIMIT, entry.score + delta)) } : entry)),
  last: delta === 0 ? play.last : { team, delta },
});

/** Whether the host may mark this team on the open clue now (6.1, 6.3). */
export function canMark(game: Game, team: number): boolean {
  const { play } = game;
  if (!isWhole(team, 0, play.teams.length - 1)) return false;
  if (play.screen === "tie-clue" || play.screen === "tie-answer") {
    return Boolean(play.tie && play.tie.winner === null && play.tie.teams.includes(team) && play.tie.marks[team] === null);
  }
  if (play.screen !== "clue" && play.screen !== "answer") return false;
  if (play.marks[team] !== null || play.marks.includes("right")) return false;
  if (isDailyDouble(game.board, play.open)) return team === play.chooser && play.bet !== null;
  return true;
}

/** Who chooses after a tile (5.5): the next team in Take turns; in Buzz in the team that was right, else the same. */
function nextChooser(game: Game): number {
  const { play } = game;
  if (game.settings.answering === "turns") return (play.chooser + 1) % play.teams.length;
  const right = play.marks.indexOf("right");
  return right >= 0 ? right : play.chooser;
}

const hasFinal = (game: Game) => Boolean(game.settings.final && game.board.final);
const finalStarted = (play: Play) => play.finalOrder.length > 0 || play.screen.startsWith("final");
const afterBoard = (game: Game): Play["screen"] => (hasFinal(game) && !finalStarted(game.play) ? "final-category" : "results");

function closeTile(game: Game, playIt: boolean): Play {
  const { play } = game;
  const clear = { open: null, marks: play.teams.map(() => null), bet: null };
  if (!playIt || !play.open) return { ...play, ...clear, screen: "board" };
  const { col, row } = play.open;
  const played = play.played.map((column, c) => column.map((done, r) => done || (c === col && r === row)));
  const next = { ...play, ...clear, played, chooser: nextChooser(game) };
  return { ...next, screen: allPlayed(next) ? afterBoard(game) : "board" };
}

function mark(game: Game, team: number, right: boolean): Play | null {
  if (!canMark(game, team)) return null;
  const { play } = game;
  if (play.tie) {
    const marks = play.tie.marks.map((value, index) => (index === team ? (right ? "right" : "wrong") : value));
    const winner = right ? team : null;
    const done = right || play.tie.teams.every((index) => marks[index] !== null);
    return { ...play, tie: { ...play.tie, marks, winner }, screen: done ? "tie-answer" : play.screen };
  }
  const tile = play.open && tileAt(game.board, play.open);
  if (!tile) return null;
  const dailyDouble = isDailyDouble(game.board, play.open);
  const stake = dailyDouble ? play.bet ?? 0 : tile.value;
  const delta = right ? stake : dailyDouble || game.settings.penalty ? -stake : 0;
  const marks = play.marks.map((value, index) => (index === team ? (right ? "right" : "wrong") : value));
  const nobodyLeft = dailyDouble || marks.every((value) => value !== null);
  const screen = right || nobodyLeft ? "answer" : play.screen;
  return { ...play, ...scoreChange(play, team, delta), marks, screen, last: { team, delta } };
}

function finalMark(game: Game, team: number, bet: number, right: boolean): Play | null {
  const { play } = game;
  if (play.screen !== "final-answer") return null;
  const next = play.finalOrder.find((index) => play.finalMarks[index] === null);
  if (next === undefined || next !== team || !isWhole(bet, 0, finalMax(play.teams[team].score))) return null;
  const finalMarks = play.finalMarks.map((value, index) => (index === team ? { bet, right } : value));
  const changed = { ...play, ...scoreChange(play, team, right ? bet : -bet), finalMarks, last: { team, delta: right ? bet : -bet } };
  return { ...changed, screen: play.finalOrder.every((index) => finalMarks[index] !== null) ? "results" : "final-answer" };
}

/** Teams tied for first on the results screen, when there is a tie and no tie-breaker has settled it. */
export function tiedForFirst(play: Play): number[] {
  if (play.teams.length === 0) return [];
  const top = Math.max(...play.teams.map((team) => team.score));
  const tied = play.teams.flatMap((team, index) => (team.score === top ? [index] : []));
  return tied.length > 1 && !(play.tie && play.tie.winner !== null) ? tied : [];
}

function step(game: Game, action: Exclude<Action, { type: "undo" }>): Play | null {
  const { play, board } = game;
  switch (action.type) {
    case "open": {
      const { col, row } = action.spot;
      if (play.screen !== "board" || !tileAt(board, action.spot) || play.played[col][row]) return null;
      return { ...play, open: { col, row }, marks: play.teams.map(() => null), bet: null, screen: isDailyDouble(board, action.spot) ? "daily-double" : "clue" };
    }
    case "bet":
      if (play.screen !== "daily-double" || !isWhole(action.amount, 0, dailyDoubleMax(play.teams[play.chooser].score))) return null;
      return { ...play, bet: action.amount, screen: "clue" };
    case "mark": return mark(game, action.team, action.right);
    case "reveal":
      if (play.screen === "clue") return { ...play, screen: "answer" };
      if (play.screen === "tie-clue") return { ...play, screen: "tie-answer" };
      return null;
    case "back":
      if (play.screen === "daily-double") return closeTile(game, false);
      if (play.screen === "clue") return closeTile(game, play.marks.some((value) => value !== null));
      if (play.screen === "answer") return closeTile(game, true);
      if (play.screen === "tie-clue" || play.screen === "tie-answer") return { ...play, screen: "results" };
      return null;
    case "choose":
      if (play.screen !== "board" || !isWhole(action.team, 0, play.teams.length - 1) || action.team === play.chooser) return null;
      return { ...play, chooser: action.team };
    case "adjust":
      if (!isWhole(action.team, 0, play.teams.length - 1) || !isWhole(action.delta, -SCORE_LIMIT, SCORE_LIMIT) || action.delta === 0) return null;
      return { ...play, ...scoreChange(play, action.team, action.delta) };
    case "set-score":
      if (!isWhole(action.team, 0, play.teams.length - 1) || !isWhole(action.score, -SCORE_LIMIT, SCORE_LIMIT)) return null;
      if (action.score === play.teams[action.team].score) return null;
      return { ...play, ...scoreChange(play, action.team, action.score - play.teams[action.team].score) };
    case "rename": {
      const name = action.name.trim();
      if (!isWhole(action.team, 0, play.teams.length - 1) || name.length < 1 || Array.from(name).length > 16 || name === play.teams[action.team].name) return null;
      return { ...play, teams: play.teams.map((team, index) => (index === action.team ? { ...team, name } : team)) };
    }
    case "replay": {
      const { col, row } = action.spot;
      if (play.screen !== "board" || !tileAt(board, action.spot) || !play.played[col][row]) return null;
      return { ...play, played: play.played.map((column, c) => column.map((done, r) => done && !(c === col && r === row))) };
    }
    case "end": {
      if (play.screen === "results" || play.screen.startsWith("final") || play.screen.startsWith("tie")) return null;
      return { ...play, open: null, marks: play.teams.map(() => null), bet: null, screen: afterBoard(game) };
    }
    case "final-clue": return play.screen === "final-category" ? { ...play, screen: "final-clue" } : null;
    case "final-reveal": {
      if (play.screen !== "final-clue") return null;
      const finalOrder = play.teams.map((team, index) => ({ index, score: team.score })).sort((a, b) => a.score - b.score || a.index - b.index).map((entry) => entry.index);
      return { ...play, finalOrder, finalMarks: play.teams.map(() => null), screen: "final-answer" };
    }
    case "final-mark": return finalMark(game, action.team, action.bet, action.right);
    case "tie-break": {
      const teams = tiedForFirst(play);
      if (play.screen !== "results" || teams.length < 2) return null;
      return { ...play, tie: { clue: action.clue, teams, marks: play.teams.map(() => null), winner: null }, screen: "tie-clue" };
    }
  }
}

/** The game after one host action; the same object when the action is refused. */
export function reduce(game: Game, action: Action): Game {
  if (action.type === "undo") {
    if (game.history.length === 0) return game;
    return { ...game, play: game.history[game.history.length - 1], history: game.history.slice(0, -1) };
  }
  const play = step(game, action);
  if (!play) return game;
  return { ...game, play, history: [...game.history, game.play].slice(-HISTORY_LIMIT) };
}

export interface Place { place: number; teams: number[]; score: number }

/** Teams in rank order; equal scores share a place (1st, 1st, 3rd), unless a tie-breaker settled first place (6.6). */
export function ranking(play: Play): Place[] {
  const order = play.teams.map((team, index) => ({ index, score: team.score })).sort((a, b) => b.score - a.score || a.index - b.index);
  const places: Place[] = [];
  let position = 1;
  for (const entry of order) {
    const lastPlace = places[places.length - 1];
    if (lastPlace && lastPlace.score === entry.score) lastPlace.teams.push(entry.index);
    else places.push({ place: position, teams: [entry.index], score: entry.score });
    position++;
  }
  const winner = play.tie?.winner;
  if (winner !== null && winner !== undefined && places[0]?.teams.includes(winner) && places[0].teams.length > 1) {
    const rest = places[0].teams.filter((index) => index !== winner);
    places.splice(0, 1, { place: 1, teams: [winner], score: places[0].score }, { place: 2, teams: rest, score: places[0].score });
  }
  return places;
}

/** The ids of every clue the room actually saw: played tiles, the Final once shown, a tie-breaker (8). */
export function seenIds(game: Game): string[] {
  const { play, board } = game;
  const out = board.columns.flatMap((column, c) => column.tiles.flatMap((tile, r) => (play.played[c]?.[r] ? [tile.q.id] : [])));
  const finalShown = play.finalOrder.length > 0 || play.screen === "final-clue";
  if (board.final && finalShown) out.push(board.final.q.id);
  if (play.tie) out.push(play.tie.clue.q.id);
  return out;
}
