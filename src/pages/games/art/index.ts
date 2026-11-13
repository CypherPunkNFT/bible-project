// Every game's picture, by name. A registry entry points at one with `art: GAME_ART.<name>` (README.md beside
// registry.ts explains how to draw a new one). `satisfies` makes a mistyped name fail the typecheck.
import type { GameArt } from "./draw";
import { BlankScene } from "./parts";
import { CharadesScene, EmojiStoriesScene, MemoryMatchScene, WhosOlderScene } from "./scenes-family";
import { HotSeatScene, JeopardyScene, LiveQuizScene, TwoTruthsScene } from "./scenes-groups";
import { CrosswordScene, MapQuestScene, OddOneOutScene, TimelineScene, WordleScene } from "./scenes-puzzles";
import { QuizScene, TwentyQuestionsScene, VerseCompletionScene } from "./scenes-solo";

export type { GameArt, Tone } from "./draw";
export { GameArtImage } from "./parts";

export const GAME_ART = {
  quiz: { Scene: QuizScene, tone: "revelation", alt: "An open Bible with a question mark rising from its pages" },
  liveQuiz: { Scene: LiveQuizScene, tone: "gospels", alt: "A question on a big screen with four answers, and phones held up to vote" },
  wordle: { Scene: WordleScene, tone: "epistles", alt: "Letter tiles: the guess BREAD, then the answer GRACE" },
  timeline: { Scene: TimelineScene, tone: "history", alt: "Cards on a timeline: Noah's ark, the parted sea being placed, and a crown" },
  verseCompletion: { Scene: VerseCompletionScene, tone: "gospels", alt: "A scroll with one line left blank and a quill writing it in" },
  jeopardy: { Scene: JeopardyScene, tone: "prophets", alt: "A board of category tiles worth 100 to 400 on an easel" },
  twentyQuestions: { Scene: TwentyQuestionsScene, tone: "poetry", alt: "A head in profile thinking in question marks, with Yes and No buttons" },
  mapQuest: { Scene: MapQuestScene, tone: "poetry", alt: "A map of the Holy Land coast with a dashed route and a pin" },
  whatCameFirst: { Scene: WhosOlderScene, tone: "epistles", alt: "Two portraits, an old patriarch and a young king, with an hourglass between: which came first?" },
  charades: { Scene: CharadesScene, tone: "revelation", alt: "A player miming with a phone on their forehead while others guess" },
  twoTruths: { Scene: TwoTruthsScene, tone: "acts", alt: "Three cards: two ticked true, and one hiding a mask" },
  emojiStories: { Scene: EmojiStoriesScene, tone: "acts", alt: "Three round pictures, an ark, rain and a rainbow, and a blank answer" },
  hotSeat: { Scene: HotSeatScene, tone: "history", alt: "An empty chair under a lamp beside a sixty-second stopwatch" },
  oddOneOut: { Scene: OddOneOutScene, tone: "prophets", alt: "Three sheep and a goat on a hillside, the goat circled" },
  crossword: { Scene: CrosswordScene, tone: "gospels", alt: "A crossword sheet half filled in with MOSES and MANNA, and a pencil writing in it" },
  memoryMatch: { Scene: MemoryMatchScene, tone: "poetry", alt: "Face-down cards, with Daniel and a lion turned up as a pair" },
} as const satisfies Record<string, GameArt>;

/** What the hub shows for a game whose entry has no `art` yet: the bare arched window. */
export const BLANK_ART: GameArt = { Scene: BlankScene, tone: "history", alt: "An empty arched window: this game's picture is still to be drawn" };
