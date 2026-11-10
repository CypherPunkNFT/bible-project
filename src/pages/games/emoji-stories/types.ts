// Emoji stories' data shapes (design §4). stories.json is hand-kept; emoji.json and daily.json are written by
// scripts/build-emoji-stories.ts. Kept free of imports so the build script can load it with plain Node.

export type Tier = 1 | 2 | 3;
export type Testament = "old" | "new";

export interface Person {
  id: string;
  name: string;
}

export interface Story {
  id: string;
  /** The answer, as shown on choice buttons, in suggestions and on the reveal. */
  title: string;
  /** The passage, e.g. "GEN 18:9-15; GEN 21:1-7". Every clue word is inside it. */
  ref: string;
  /** One to three verses inside `ref`, quoted on the reveal. */
  key: string;
  tier: Tier;
  testament: Testament;
  /** Hint 3: the main people, or "A story Jesus told". */
  who: string;
  people: Person[];
  aliases: string[];
  /** Three to six [emoji, the BSB passage word it stands for], in the order the story tells them. */
  emoji: [string, string][];
  /** Stories never offered beside this one as a wrong choice. */
  confusable: string[];
  /** Never dealt or scheduled again, kept for past Daily puzzles. */
  retired?: boolean;
}

export interface StoryFile {
  about: string;
  version: number;
  stories: Story[];
}

export interface EmojiInfo {
  /** Unicode's name, e.g. "basket". */
  name: string;
  /** The Emoji version it arrived in, e.g. 13. */
  version: number;
  /** Unicode's subgroup in emoji-test.txt, e.g. "face-smiling" or "household". */
  subgroup: string;
}

export interface EmojiFile {
  about: string;
  unicode: string;
  emoji: Record<string, EmojiInfo>;
}

export interface DailySchedule {
  /** Puzzle #1's local date, YYYY-MM-DD. */
  epoch: string;
  /** Days up to this puzzle number are kept as they are by every rebuild. */
  frozenThrough: number;
  /** days[n - 1] is puzzle n's story id. */
  days: string[];
}

/** A face is any emoji in one of Unicode's face-… subgroups (design §5.2.4): extra colour, never a deciding clue. */
export const isFace = (info: EmojiInfo | undefined): boolean => !!info && info.subgroup.startsWith("face-");
