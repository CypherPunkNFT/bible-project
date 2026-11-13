// Map quest as a team game (docs/features/team-play/design.md, section 5 and Review 13-16): the big screen names a
// place, each team drops a pin on its own phone, and every pin is revealed at once. The round is plain data, saved in
// this tab after every change, so a reload of the big screen loses nothing (Review 13). Scoring is the game's own
// (scorePin), with no hints and no points off for time: the countdown only ends the place.
import type { TeamStatus } from "@/lib/team-room/protocol";
import { TEAM_TONES, placeTeams } from "../kit";
import type { HostRoom } from "../team-play/host";
import { PLACE_BY_ID, PLACES } from "./data";
import { questionFromPlace, scorePin, type Question } from "./game";
import type { LonLat } from "./geo";
import { ERA_VIEWS, ERAS, LEVELS, pickRound, practicePool, type Era, type Level } from "./pools";

export const PLACE_SECONDS = 60;

export type TeamPhase = "lobby" | "place" | "reveal" | "done";

export interface TeamRound {
  room: HostRoom;
  level: Level;
  era: Era;
  /** The places' ids, in order: the questions are rebuilt from them (they can carry large river shapes). */
  ids: string[];
  phase: TeamPhase;
  /** The place being asked or shown (0-based). */
  index: number;
  /** Each place's pins, by team id. */
  pins: Record<string, LonLat>[];
  /** When the current place's countdown ends (this device's clock, ms). */
  deadline: number;
  /** The teams that held a phone when the place started: the place reveals early only when all of them have pinned. */
  expected: string[];
}

export interface TeamScore { id: string; name: string; index: number; score: number }
export interface PlaceResult { id: string; name: string; index: number; pin: LonLat | null; km: number | null; points: number; site: LonLat | null }

export const questionsOf = (round: TeamRound): Question[] => round.ids.map((id) => questionFromPlace(PLACE_BY_ID.get(id)!));

export function newTeamRound(room: HostRoom, level: Level, era: Era, random: () => number = Math.random): TeamRound {
  const { pool } = practicePool(PLACES, level, era);
  const ids = pickRound(pool, random).map((place) => place.id);
  return { room, level, era, ids, phase: "lobby", index: 0, pins: ids.map(() => ({})), deadline: 0, expected: [] };
}

/** Starts place `index`: its countdown, and the teams expected to pin (those with a phone now). */
export function startPlace(round: TeamRound, index: number, teams: readonly TeamStatus[], now: number): TeamRound {
  return { ...round, phase: "place", index, deadline: now + PLACE_SECONDS * 1000, expected: teams.filter((t) => t.state === "held").map((t) => t.id) };
}

const isLonLat = (value: unknown): value is LonLat =>
  Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === "number" && Number.isFinite(n))
  && Math.abs(value[0] as number) <= 180 && Math.abs(value[1] as number) <= 90;

/** A phone's pin, if it is one: where, and which place it was dropped for. */
export function readPin(data: unknown): { pin: LonLat; place: number } | null {
  if (typeof data !== "object" || data === null) return null;
  const { pin, place } = data as Record<string, unknown>;
  return isLonLat(pin) && Number.isInteger(place) ? { pin: [pin[0], pin[1]], place: place as number } : null;
}

/** Takes a team's pin for the place being asked; a pin for another place, or after the reveal, changes nothing (Review 3). */
export function addPin(round: TeamRound, team: string, place: number, pin: LonLat): TeamRound {
  if (round.phase !== "place" || place !== round.index || !round.room.teams.some((t) => t.id === team)) return round;
  const pins = round.pins.map((placePins, n) => (n === place ? { ...placePins, [team]: pin } : placePins));
  return { ...round, pins };
}

/** Time is up, or every team expected has pinned (Review 14). With nobody expected, only the clock or the leader reveals. */
export function readyToReveal(round: TeamRound, now: number): boolean {
  if (round.phase !== "place") return false;
  if (now >= round.deadline) return true;
  const pinned = round.pins[round.index] ?? {};
  return round.expected.length > 0 && round.expected.every((team) => team in pinned);
}

export const reveal = (round: TeamRound): TeamRound => (round.phase === "place" ? { ...round, phase: "reveal" } : round);

export function nextPlace(round: TeamRound, teams: readonly TeamStatus[], now: number): TeamRound {
  if (round.phase !== "reveal") return round;
  return round.index + 1 < round.ids.length ? startPlace(round, round.index + 1, teams, now) : { ...round, phase: "done" };
}

/** Each team's distance and points for one place; a team with no pin scores 0. */
export function placeResults(round: TeamRound, place: number, question: Question = questionsOf(round)[place]): PlaceResult[] {
  return round.room.teams.map((team, index) => {
    const pin = round.pins[place]?.[team.id] ?? null;
    if (!pin) return { id: team.id, name: team.name, index, pin: null, km: null, points: 0, site: null };
    const result = scorePin(question, pin);
    return { id: team.id, name: team.name, index, pin, km: result.km, points: result.points, site: result.site };
  });
}

/** Totals over the places revealed so far, best first; equal totals share a place. */
export function standings(round: TeamRound): ReturnType<typeof placeTeams<TeamScore>> {
  const questions = questionsOf(round);
  const played = round.phase === "place" ? round.index : round.phase === "lobby" ? 0 : round.index + 1;
  const totals = round.room.teams.map((team, index) => ({ id: team.id, name: team.name, index, score: 0 }));
  for (let place = 0; place < played; place++) {
    placeResults(round, place, questions[place]).forEach((result, n) => { totals[n].score += result.points; });
  }
  return placeTeams(totals);
}

// ---- What a phone sees --------------------------------------------------------------------------------------------

export interface MapTeamView {
  game: "map-quest";
  phase: TeamPhase;
  place: number;
  places: number;
  /** The place's name and id (null in the lobby); Beginner's water names leave the asked place out. */
  name: string | null;
  id: string | null;
  era: Era;
  beginner: boolean;
  /** Milliseconds left when this view was sent (the phone counts down from when it arrives; clocks differ). */
  msLeft: number;
  /** This team's pin for the current place, as the big screen has it. */
  pin: LonLat | null;
  /** After a reveal: this team's result for the place. */
  result: { km: number | null; points: number } | null;
  /** This team's place in the standings, of how many, and its total. */
  standing: { place: number; of: number; score: number } | null;
}

export function teamView(round: TeamRound, team: string, now: number): MapTeamView {
  const questions = questionsOf(round);
  const question = round.phase === "lobby" ? null : questions[round.index];
  const mine = round.room.teams.findIndex((t) => t.id === team);
  const result = round.phase === "reveal" && question ? placeResults(round, round.index, question)[mine] : null;
  const table = standings(round);
  const row = table.find((entry) => entry.id === team);
  return {
    game: "map-quest", phase: round.phase, place: round.index, places: round.ids.length, name: question?.name ?? null, id: question?.id ?? null,
    era: round.era, beginner: round.level === "beginner", msLeft: round.phase === "place" ? Math.max(0, round.deadline - now) : 0,
    pin: round.pins[round.index]?.[team] ?? null,
    result: result ? { km: result.km, points: result.points } : null,
    standing: row && round.phase !== "lobby" && round.phase !== "place" ? { place: row.place, of: table.length, score: row.score } : null,
  };
}

/** A team's colour for the map, which cannot read CSS variables (Review 15). */
export function resolvedTeamColor(index: number): string {
  const FALLBACK = ["#8a5a2b", "#2f7a76", "#6b4ea0", "#b5562d", "#2f6fa8", "#7a8a2f", "#a83a5a"];
  const tone = TEAM_TONES[index % TEAM_TONES.length];
  const name = /var\((--[\w-]+)\)/.exec(tone)?.[1];
  const value = name && typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : "";
  return value || FALLBACK[index % FALLBACK.length];
}

// ---- Saved in this tab (Review 13) --------------------------------------------------------------------------------

const ROUND_KEY = "map-quest:team-round";

export function readTeamRound(): TeamRound | null {
  try {
    const raw = window.sessionStorage.getItem(ROUND_KEY);
    const round = raw ? (JSON.parse(raw) as TeamRound) : null;
    if (!round?.room?.code || !Array.isArray(round.ids) || !round.ids.every((id) => PLACE_BY_ID.has(id))) return null;
    if (!LEVELS.includes(round.level) || !ERAS.includes(round.era) || !ERA_VIEWS[round.era]) return null;
    return round;
  } catch (error) {
    console.warn("Map quest: the saved team game could not be read", error);
    return null;
  }
}

export function saveTeamRound(round: TeamRound | null): void {
  try {
    if (round) window.sessionStorage.setItem(ROUND_KEY, JSON.stringify(round));
    else window.sessionStorage.removeItem(ROUND_KEY);
  } catch (error) {
    console.warn("Map quest: the team game could not be saved", error);
  }
}
