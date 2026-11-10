// Everything a screen needs from the game's three data files, built once when they load.
import { searchIndex, type SearchEntry } from "./answer-match";
import { createDaily, type Daily } from "./daily";
import type { DailySchedule, EmojiFile, EmojiInfo, Story, StoryFile } from "./types";

export interface GameData {
  stories: Story[];
  byId: ReadonlyMap<string, Story>;
  known: ReadonlySet<string>;
  emoji: Record<string, EmojiInfo>;
  index: SearchEntry[];
  daily: Daily;
}

export function gameData(storyFile: StoryFile, emojiFile: EmojiFile, schedule: DailySchedule): GameData {
  const stories = storyFile.stories;
  return {
    stories,
    byId: new Map(stories.map((story) => [story.id, story])),
    known: new Set(stories.map((story) => story.id)),
    emoji: emojiFile.emoji,
    index: searchIndex(stories),
    daily: createDaily(schedule, stories),
  };
}
