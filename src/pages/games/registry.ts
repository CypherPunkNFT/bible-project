// Every game on /games, one entry each. The hub draws its cards from this list and GamesPage gives each live game its
// own address (/games/<slug>), so adding a game never touches the page layout. How to add one: README.md beside this file.
// The fourteen coming-soon games are the owner's approved list (BibleProject/APPROVED-IDEAS.md, 2026-11-07).
import type { ComponentType } from "react";
import { GAME_ART, type GameArt } from "./art";

export type Audience = "solo" | "family" | "youth-group" | "church-night";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  solo: "Solo",
  family: "Family",
  "youth-group": "Youth group",
  "church-night": "Church night",
};

/** The hub's four shelves, in page order: each game sits on one. */
export type Shelf = "daily" | "family" | "groups" | "solo";

export const SHELVES: readonly { key: Shelf; title: string; text: string }[] = [
  { key: "daily", title: "Daily puzzles", text: "Quick puzzles to come back to, some with a new one every day and a score to share." },
  { key: "family", title: "Family and party", text: "For the living room: acting, guessing and matching, for every age at the table." },
  { key: "groups", title: "Youth group and church night", text: "For a room full of people and one screen, led from the front." },
  { key: "solo", title: "Solo", text: "To play on your own, at your own pace." },
];

interface GameBase {
  /** The game's address under /games: lower case, words joined by hyphens. */
  slug: string;
  title: string;
  /** One line, shown on the card. */
  description: string;
  audiences: readonly Audience[];
  /** Which shelf of the hub it sits on. Without one, the shelf of its first audience. */
  shelf?: Shelf;
  /** Its picture on the hub, from art/ (README.md: how to draw one). Without one, a bare arched window. */
  art?: GameArt;
}

/** A game still being made: a card that says "Coming soon" and no address. */
export interface ComingSoonGame extends GameBase { status: "coming-soon" }

/** A playable game: `load` imports its page file, shown at /games/<slug>. */
export interface LiveGame extends GameBase { status: "live"; load: () => Promise<{ default: ComponentType }> }

export type GameEntry = ComingSoonGame | LiveGame;

export const GAMES: readonly GameEntry[] = [
  {
    slug: "quiz", status: "live", load: () => import("./quiz/QuizGame"),
    title: "How well do you know the Bible?",
    description: "Twelve questions with pictures, the same quiz as on the home page: start anywhere, see the verse behind each answer.",
    audiences: ["solo", "family"],
    shelf: "solo", art: GAME_ART.quiz,
  },
  {
    slug: "live-quiz", status: "live", load: () => import("./live-quiz/LiveQuizGame"),
    title: "Live youth-group quiz",
    description: "The leader puts the game on a screen and everyone answers on their phones, from thousands of questions.",
    audiences: ["youth-group", "church-night"],
    shelf: "groups", art: GAME_ART.liveQuiz,
  },
  {
    slug: "wordle", status: "coming-soon", title: "Bible Wordle",
    description: "A daily word puzzle with a Bible word, and a score to share.",
    audiences: ["solo", "family"],
    shelf: "daily", art: GAME_ART.wordle,
  },
  {
    slug: "timeline", status: "coming-soon", title: "Timeline sort",
    description: "Drag Bible events, from the Flood to the Exodus to David's reign, into the right order.",
    audiences: ["solo", "family"],
    shelf: "daily", art: GAME_ART.timeline,
  },
  {
    slug: "verse-completion", status: "coming-soon", title: "Verse completion",
    description: "See the start of a verse and finish it: a game that doubles as memorisation.",
    audiences: ["solo"],
    shelf: "solo", art: GAME_ART.verseCompletion,
  },
  {
    slug: "jeopardy", status: "coming-soon", title: "Bible Jeopardy",
    description: "Category boards built from the question bank, ready for the projector.",
    audiences: ["church-night", "youth-group"],
    shelf: "groups", art: GAME_ART.jeopardy,
  },
  {
    slug: "twenty-questions", status: "coming-soon", title: "Bible twenty questions",
    description: "Think of a Bible character and answer yes or no: the site asks questions until it guesses who.",
    audiences: ["solo", "family"],
    shelf: "solo", art: GAME_ART.twentyQuestions,
  },
  {
    slug: "map-quest", status: "coming-soon", title: "Map quest",
    description: "Drop a pin where Jericho or Corinth stood: the closer the pin, the more points.",
    audiences: ["solo"],
    shelf: "daily", art: GAME_ART.mapQuest,
  },
  {
    slug: "whos-older", status: "coming-soon", title: "Who's older?",
    description: "Two Bible characters appear: tap the one who lived first.",
    audiences: ["solo", "family"],
    shelf: "family", art: GAME_ART.whosOlder,
  },
  {
    slug: "charades", status: "coming-soon", title: "Family charades",
    description: "Hold the phone to your forehead, act out the scene on it, and let everyone else guess.",
    audiences: ["family", "youth-group"],
    shelf: "family", art: GAME_ART.charades,
  },
  {
    slug: "two-truths", status: "coming-soon", title: "Two truths and a lie",
    description: "Three statements about a Bible character: spot the one that was made up.",
    audiences: ["solo", "youth-group"],
    shelf: "groups", art: GAME_ART.twoTruths,
  },
  {
    slug: "emoji-stories", status: "coming-soon", title: "Emoji stories",
    description: "A Bible story told in emoji (boat, rain, rainbow): guess which one it is.",
    audiences: ["solo", "family", "youth-group"],
    shelf: "family", art: GAME_ART.emojiStories,
  },
  {
    slug: "hot-seat", status: "coming-soon", title: "Hot seat",
    description: "One player answers rapid-fire questions for sixty seconds while the group reads them off a phone.",
    audiences: ["youth-group", "family"],
    shelf: "groups", art: GAME_ART.hotSeat,
  },
  {
    slug: "odd-one-out", status: "live", load: () => import("./odd-one-out/OddOneOutGame"),
    title: "Odd one out",
    description: "Four names or things, one that does not belong: find it and see why.",
    audiences: ["solo", "family"],
    shelf: "daily", art: GAME_ART.oddOneOut,
  },
  {
    slug: "memory-match", status: "coming-soon", title: "Memory card match",
    description: "Flip cards to pair each character with their story, like Daniel and the lions' den.",
    audiences: ["solo", "family"],
    shelf: "family", art: GAME_ART.memoryMatch,
  },
];

export const isLive = (game: GameEntry): game is LiveGame => game.status === "live";

export const gamePath = (game: GameEntry) => `/games/${game.slug}`;

const AUDIENCE_SHELF: Record<Audience, Shelf> = { solo: "solo", family: "family", "youth-group": "groups", "church-night": "groups" };

/** The shelf a game sits on: its own, or its first audience's. */
export const shelfOf = (game: GameEntry): Shelf => game.shelf ?? AUDIENCE_SHELF[game.audiences[0]];

/** Live games first, each group in list order: what the hub shows. */
export const gamesForHub = (games: readonly GameEntry[] = GAMES) => [...games.filter(isLive), ...games.filter((game) => !isLive(game))];
