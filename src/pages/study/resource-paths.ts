// The address each study resource card opens. One list, read by the cards themselves (StudyResourceCards) and by the
// way back from a study (hub/way-back.ts), so the two can never disagree.
export const RESOURCE_PATHS = {
  topics: "/topics",
  names: "/study/names",
  gospels: "/study/gospels",
  parables: "/study/gospels?guide=parables",
  miracles: "/study/miracles",
  references: "/study/connections",
  structure: "/study/structure",
  people: "/study/people",
  memory: "/study/long-memory",
  letters: "/study/letters",
  atlas: "/study/atlas",
  creeds: "/study/creeds",
  "theology-articles": "/study/theology-articles",
  hymns: "/study/hymns",
  versions: "/study/versions",
} as const;
