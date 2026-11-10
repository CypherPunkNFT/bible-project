// Bible Jeopardy's shapes (docs/features/bible-jeopardy/design.md): settings, the board, teams. Pure types and
// defaults only; the board is made in generate.ts and played through the reducer in rules.ts.
import type { QuizQuestion } from "@/lib/live-quiz/protocol";

export type Level = "easy" | "medium" | "hard";
export type Difficulty = "gentle" | "standard" | "challenging";
export type Testament = "" | "OT" | "NT";
export type Answering = "turns" | "buzz";

export const COLUMN_COUNTS = [3, 4, 5, 6] as const;
export const TIMERS = [0, 15, 20, 30] as const;
export const VALUES = [100, 200, 300, 400, 500] as const;
export const TOP_VALUE = 500;
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;
export const FINAL_SECONDS = 30;

/** What shapes the board (3.1–3.6): a board link carries these. */
export interface BoardSettings {
  columns: number;
  difficulty: Difficulty;
  choices: boolean;
  children: boolean;
  catechism: boolean;
  testament: Testament;
  dailyDouble: boolean;
  final: boolean;
}

/** How the night is played (5.5, 6). */
export interface RuleSettings {
  answering: Answering;
  penalty: boolean;
  /** Seconds a clue's timer runs; 0 is off. */
  timer: number;
}

export interface Settings extends BoardSettings, RuleSettings {
  teamNames: string[];
  randomStart: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  columns: 5, difficulty: "standard", choices: false, children: false, catechism: false, testament: "",
  dailyDouble: true, final: true, answering: "turns", penalty: false, timer: 0,
  teamNames: ["Team 1", "Team 2", "Team 3"], randomStart: false,
};

/** Each column climbs: the level of each row, then the Final's (3.3). */
export const LADDERS: Record<Difficulty, { rows: Level[]; final: Level }> = {
  gentle: { rows: ["easy", "easy", "easy", "medium", "medium"], final: "medium" },
  standard: { rows: ["easy", "easy", "medium", "medium", "hard"], final: "hard" },
  challenging: { rows: ["medium", "medium", "hard", "hard", "hard"], final: "hard" },
};

/** For children the ladder is always Gentle (3.3). */
export const ladderOf = (settings: Pick<BoardSettings, "difficulty" | "children">) => LADDERS[settings.children ? "gentle" : settings.difficulty];

export interface Tile { q: QuizQuestion; level: Level; value: number }

export interface Column { category: string; title: string; line: string; tiles: Tile[] }

export interface FinalClue { category: string; title: string; line: string; q: QuizQuestion; level: Level }

export interface Spot { col: number; row: number }

export interface Board {
  settings: BoardSettings;
  columns: Column[];
  dailyDouble: Spot | null;
  final: FinalClue | null;
  /** One-line notices for the preview: dropped categories, levels that fell back, replaced link questions. */
  notices: string[];
}

export interface Team { name: string; score: number }

/** Six team colours from the site's book palette, each team also shown with its number (4). */
export const TEAM_TONES = ["history", "poetry", "prophets", "gospels", "acts", "epistles"] as const;
