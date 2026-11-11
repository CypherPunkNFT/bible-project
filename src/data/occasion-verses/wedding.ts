// The wedding, by part of the service (design 4). The wedding pack's own passages and notes (../life-events/love.ts) are
// kept as they are and placed in a part by their key; the passages below are added to the parts they suit. Baptist
// weddings have no fixed order, so the parts are a suggestion only.
import { passageKey } from "../sympathy/card-keys";
import { sp } from "../sympathy/types";
import type { LifeEvent } from "../life-events/types";
import type { OccasionPassage, OccasionSection } from "./types";

const SONG_CONTEXT = "Shown as the love of husband and wife, as the Song of Songs itself presents it.";

export const WEDDING_ORDER_NOTE = "Only a suggestion: the couple and the pastor shape the service, and any passage can go anywhere.";

interface WeddingPart { id: string; title: string; what: string; extra: OccasionPassage[] }

export const WEDDING_PARTS: WeddingPart[] = [
  {
    id: "opening", title: "Welcome and opening words", what: "Spoken as the service begins.",
    extra: [
      sp("PSA 118:24", "reading", "A glad call to worship: this is the day the Lord has made."),
      sp("PSA 34:3", "reading", "An invitation to everyone gathered to praise the Lord together."),
      sp("PSA 100:1-5", "reading", "A psalm of joyful thanks, for a service that begins in praise."),
    ],
  },
  {
    id: "readings", title: "Scripture readings", what: "Read by family or friends, or by the pastor.",
    extra: [
      sp("GEN 1:26-28", "reading", "God makes man and woman in his image and blesses them: where marriage begins."),
      sp("PSA 127:1", "reading", "Unless the Lord builds the house: a home built on him."),
      sp("PSA 128:1-4", "reading", "The blessing on a home that fears the Lord: a fruitful vine, and children around the table."),
      sp("ROM 12:9-18", "reading", "Sincere love in practice: honour, patience, hospitality and peace in a shared life."),
      sp("JHN 2:1-11", "reading", "Jesus at the wedding in Cana, where he first revealed his glory."),
      sp("JHN 15:9-12", "reading", "Remain in my love: Jesus' command to love one another as he has loved us."),
    ],
  },
  {
    id: "message", title: "The message to the couple", what: "Passages a pastor often preaches from at a wedding.",
    extra: [
      sp("MRK 10:6-9", "reading", "Jesus takes marriage back to creation: the two become one flesh, joined by God."),
      sp("MAT 7:24-27", "reading", "The house built on the rock: a marriage founded on hearing and doing Christ's words."),
      sp("PHP 2:1-4", "reading", "Humility that puts the other first, the daily shape of a Christian marriage."),
    ],
  },
  {
    id: "vows", title: "Vows and rings", what: "Before or as the couple make their promises and exchange rings.",
    extra: [
      sp("SNG 8:6", "card", "Set me as a seal over your heart: a ring's promise in poetry.", { context: SONG_CONTEXT }),
      sp("SNG 6:3", "card", "I belong to my beloved and he belongs to me: often engraved inside a ring.", { context: SONG_CONTEXT }),
      sp("PRO 3:3-4", "card", "Never let loving devotion or faithfulness leave you: what vows promise to keep."),
    ],
  },
  {
    id: "prayer", title: "Prayer over the couple", what: "Prayed by the pastor, family or the church.",
    extra: [
      sp("PHP 1:9-11", "blessing", "Paul's prayer that love may abound more and more, to pray over a new marriage."),
      sp("ROM 15:5-6", "blessing", "A prayer for harmony, so that with one mind and one voice they glorify God."),
      sp("1TH 3:12-13", "blessing", "That the Lord would make their love increase and overflow."),
      sp("EPH 3:16-19", "blessing", "That Christ would dwell in their hearts and they would know his love that surpasses knowledge."),
    ],
  },
  {
    id: "benediction", title: "Pronouncement and benediction", what: "Spoken over the couple and everyone as the service ends.",
    extra: [
      sp("ROM 15:13", "blessing", "May the God of hope fill you with all joy and peace."),
      sp("2CO 13:14", "blessing", "The grace, love and fellowship of Father, Son and Spirit, a classic closing blessing."),
      sp("HEB 13:20-21", "blessing", "The God of peace equip you with every good thing to do his will."),
      sp("JUD 1:24-25", "blessing", "To him who is able to keep you from stumbling: a doxology to send everyone out."),
    ],
  },
  {
    id: "programs", title: "Programs, invitations and cards", what: "Short verses to print or write.",
    extra: [
      sp("1CO 16:14", "card", "Four words for a program or a cake table: do everything in love."),
    ],
  },
];

/** Where each of the wedding pack's own passages goes, by key. Readings not named here go to "Scripture readings". */
const PACK_PLACES: Record<string, string> = {
  "mark-10-9": "vows",
  "colossians-3-14": "message",
  "1-john-4-19": "message",
  "ecclesiastes-4-12b": "programs",
  "1-corinthians-13-7": "programs",
  "proverbs-18-22": "programs",
  "numbers-6-24-26": "benediction",
};

/** The part a wedding-pack passage is placed in. */
export function weddingPartOf(passage: OccasionPassage): string | undefined {
  const named = PACK_PLACES[passageKey(passage)];
  if (named) return named;
  return passage.role === "reading" ? "readings" : undefined;
}

/** The wedding pack's passages and the extra ones, by part, in the parts' order; the pack's own come first in each. */
export function weddingSections(pack: LifeEvent): OccasionSection[] {
  const unplaced = pack.passages.filter((passage) => !weddingPartOf(passage));
  if (unplaced.length) throw new Error(`occasion-verses: the wedding pack has ${unplaced.length} passage(s) with no part of the service (expected every one placed)`);
  return WEDDING_PARTS.map((part) => ({
    id: part.id,
    title: part.title,
    what: part.what,
    passages: [...pack.passages.filter((passage) => weddingPartOf(passage) === part.id), ...part.extra],
  }));
}
