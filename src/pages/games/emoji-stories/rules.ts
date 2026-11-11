// The redesign's small rules, kept apart from the components so each screen file exports components only: a card's
// settled state, the verdict words, the room's team names and colours, and the round's rank titles.
import { formatNumber } from "@/lib/site-format";
import { TEAM_TONES, type AnswerState, type Rank } from "../kit";
import type { Verdict } from "./share";

/** A card's settled state once the puzzle is answered: the answer lights green, the picked wrong card red, the rest fade. */
export function choiceState(id: string, answer: string, pick: string | null, revealed: boolean, tried: readonly string[]): AnswerState {
  if (revealed) return id === answer ? "right" : id === pick ? "wrong" : "faded";
  return tried.includes(id) ? "wrong" : "idle";
}

export const VERDICT_TEXT: Record<Verdict | "shown", string> = {
  right: "Right!",
  close: "Not this time",
  wrong: "Not this time",
  shown: "The answer",
};

export interface RoomTeam {
  id: string;
  name: string;
  /** The stories this team got, by puzzle id (one point each, and a tap undoes it). */
  got: string[];
}

export const MAX_TEAMS = 6;
/** The site's book colours without the game's own, so a team chip never looks like the game's buttons. */
export const ROOM_TONES = TEAM_TONES.filter((tone) => tone !== "var(--acts)");

/** A team's name as typed, or "Team 1", "Team 2" by its place when the leader left it blank. */
export const teamName = (team: RoomTeam, index: number): string => team.name.trim() || `Team ${formatNumber(index + 1)}`;

/** The tally rows for the kit's chips: id, name and score. */
export const roomRows = (teams: readonly RoomTeam[]) =>
  teams.map((team, index) => ({ id: team.id, name: teamName(team, index), score: team.got.length }));

/** The round's rank by its share of 30, in the game's own words. */
export const RANKS: readonly Rank[] = [
  { from: 0, title: "A first look at the pictures" },
  { from: 0.34, title: "Getting the picture" },
  { from: 0.67, title: "Well told" },
  { from: 0.9, title: "Storyteller" },
  { from: 1, title: "Every picture known" },
];
