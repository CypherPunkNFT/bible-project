// The countdowns (docs/features/countdowns/design.md): the occasions in hub order, their introductions, the hymn titles
// they link to, and the addresses for the sitemap. A later occasion (Pentecost, a wedding) is one more entry here and one
// data file of days; nothing else changes.
import { ADVENT_DAYS, ADVENT_PANELS } from "./advent";
import { LENT_DAYS_1 } from "./lent-1";
import { LENT_DAYS_2 } from "./lent-2";
import type { Occasion } from "./types";

export type { BorrowedDays, CountdownDay, DateRule, DayAt, DayPanel, Occasion, StartRule } from "./types";
export { KEPT_KEYS, KEY_ALIASES } from "./keys";

export const COUNTDOWNS_HEADING = "Countdowns: Daily Bible Readings to Christmas and Easter";
export const COUNTDOWNS_INTRO =
  "Countdowns are daily Bible readings that lead up to Christmas, Easter and other days worth preparing for, with a card for each day to share. Each day has one short reading from the Berean Standard Bible, a few lines on what it means, a prayer and a question to talk over. The dates work themselves out every year, your ticks stay on your own device, and churches can share one link with everyone. Free, with nothing to sign up for.";

const ADVENT: Occasion = {
  slug: "advent",
  name: "Advent",
  heading: "Advent Reading Plan: A Daily Devotional to Christmas",
  summary: "One reading a day from the start of Advent to Christmas Day, from God's first promise to the manger.",
  intro:
    "Advent is the season of waiting before Christmas, when Christians remember Israel's long wait for the promised Messiah and look ahead to his return. This Advent reading plan gives one short Bible reading a day, about five minutes, with a few lines of reflection, a prayer and a question to talk over at the table. It runs by date from December 1 to Christmas Day, with a few extra first days in years when Advent begins in late November. The readings follow God's promises from Genesis through the prophets to their fulfillment in Luke and Matthew. Advent is not commanded in Scripture; many Christians, Baptists among them, keep it freely to prepare their hearts for Christmas. Miss a day and simply pick up where you are.",
  targetName: "Christmas",
  target: { kind: "fixed", month: 12, day: 25 },
  start: { kind: "sunday-on-or-after", month: 11, day: 27 },
  alwaysFrom: "12-01",
  afterDays: 11,
  days: ADVENT_DAYS,
  panels: ADVENT_PANELS,
  calendar: "doors",
  style: "advent",
  note: "Churches light the Advent candles in different orders; this plan uses hope, peace, joy and love, and the daily readings do not depend on them.",
  closing: "Christmas has come. The plan stays open through the twelve days of Christmas for anyone still reading.",
  topics: [
    { slug: "birth-of-christ", title: "The Birth of Christ" },
    { slug: "incarnation-of-christ", title: "The Incarnation of Christ" },
    { slug: "prophecies-concerning-the-coming-of-christ", title: "The Prophecies Concerning the Coming of Christ" },
    { slug: "christ-the-messiah", title: "Christ the Messiah" },
    { slug: "second-coming-of-christ", title: "The Second Coming of Christ" },
    { slug: "waiting-upon-god", title: "Waiting Upon God" },
    { slug: "hope", title: "Hope" },
    { slug: "joy", title: "Joy" },
    { slug: "peace", title: "Peace" },
  ],
  hymns: ["gutenberg-watts-psalms-98-2-joy-to-the-world-the-lord-is-come", "gutenberg-watts-hymns-1-3-behold-the-grace-appears", "ccel-watts-psalms-hymns-i-4-1-shepherds-rejoice-lift-up-your-eyes"],
  related: ["lent", "holy-week"],
};

const LENT: Occasion = {
  slug: "lent",
  name: "Lent",
  heading: "Lent Reading Plan: 40 Days of Scripture to Easter",
  summary: "One reading a day from Ash Wednesday to Easter Day, through repentance and grace to the cross and the empty tomb.",
  intro:
    "Lent is the forty days before Easter, not counting Sundays, a season many Christians set apart to turn back to God and prepare to remember the death and resurrection of Jesus. This Lent reading plan has one short Bible reading for each day from Ash Wednesday to Easter Day, with a reflection, a prayer and a question for families or groups. It moves through repentance, temptation and grace to the cross and the empty tomb, and each Sunday carries a reading on the resurrection. Lent is not commanded in Scripture. Many Christians, Baptists among them, keep it freely. Some set something aside to make room for prayer. That earns nothing from God: it is a way to turn toward him.",
  targetName: "Easter",
  target: { kind: "easter", offset: 0 },
  start: { kind: "before", days: 46 },
  afterDays: 7,
  days: [...LENT_DAYS_1, ...LENT_DAYS_2],
  numberedOf: 40,
  calendar: "weeks",
  style: "lent",
  note: "Dates follow the Western calendar used by most Protestant and Catholic churches; Orthodox churches usually keep Easter later. Sundays are not counted in the forty days: each one is a little Easter.",
  closing: "He is risen. The readings stay open through Easter week for anyone catching up.",
  topics: [
    { slug: "repentance", title: "Repentance" },
    { slug: "confession-of-sin", title: "Confession of Sin" },
    { slug: "fasting", title: "Fasting" },
    { slug: "self-denial", title: "Self-Denial" },
    { slug: "crucifixion", title: "Crucifixion" },
    { slug: "atonement-by-christ", title: "Atonement by Christ" },
    { slug: "resurrection-of-christ", title: "The Resurrection of Christ" },
  ],
  hymns: ["gutenberg-watts-hymns-3-7-when-i-survey-the-wondrous-cross", "gutenberg-watts-hymns-2-9-alas-and-did-my-saviour-bleed", "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound"],
  related: ["holy-week", "advent"],
};

const HOLY_WEEK: Occasion = {
  slug: "holy-week",
  name: "Holy Week",
  heading: "Holy Week Readings: Palm Sunday to Easter",
  summary: "The last eight days of Lent, Palm Sunday to Easter Day, following Jesus day by day through the Gospels.",
  intro:
    "Holy Week is the eight days from Palm Sunday to Easter Day, when the Gospels slow down to follow Jesus day by day: his entry into Jerusalem, his last teaching in the temple, the Last Supper, his arrest and crucifixion, the quiet of the sealed tomb, and the morning he rose. These Holy Week readings give one passage for each day, with a reflection and a prayer. They are the last eight days of the Lent reading plan, so anyone reading through Lent is already on the way, and a day ticked here is ticked there too. Holy Week is not commanded in Scripture; it is a way many Christians choose to walk with Jesus toward the cross and the empty tomb.",
  targetName: "Easter",
  target: { kind: "easter", offset: 0 },
  start: { kind: "before", days: 7 },
  afterDays: 7,
  days: { borrow: "lent", fromKey: "sunday-6" },
  numberedOf: 40,
  calendar: "weeks",
  style: "lent",
  note: "Dates follow the Western calendar used by most Protestant and Catholic churches; Orthodox churches usually keep Easter later.",
  closing: "He is risen. The readings stay open through Easter week.",
  topics: [
    { slug: "crucifixion", title: "Crucifixion" },
    { slug: "atonement-by-christ", title: "Atonement by Christ" },
    { slug: "resurrection-of-christ", title: "The Resurrection of Christ" },
  ],
  hymns: ["gutenberg-watts-hymns-2-76-hosanna-to-the-prince-of-light", "gutenberg-watts-hymns-3-7-when-i-survey-the-wondrous-cross", "gutenberg-watts-hymns-2-72-bless-d-morning-whose-young-dawning-rays"],
  related: ["lent", "advent"],
};

/** Every occasion, in hub order. */
export const OCCASIONS: Occasion[] = [ADVENT, LENT, HOLY_WEEK];

export const occasionBySlug = (slug: string): Occasion | undefined => OCCASIONS.find((occasion) => occasion.slug === slug);

/** Display titles for every hymn the countdowns link to (pages at /study/hymns/<id>); a test checks each id exists. */
export const HYMN_TITLES: Record<string, string> = {
  "gutenberg-watts-psalms-98-2-joy-to-the-world-the-lord-is-come": "Joy to the World",
  "gutenberg-watts-hymns-1-3-behold-the-grace-appears": "Behold, the Grace Appears",
  "ccel-watts-psalms-hymns-i-4-1-shepherds-rejoice-lift-up-your-eyes": "Shepherds, Rejoice, Lift Up Your Eyes",
  "gutenberg-watts-hymns-2-136-the-king-of-glory-sends-his-son": "The King of Glory Sends His Son",
  "gutenberg-watts-psalms-121-2-to-heaven-i-lift-my-waiting-eyes": "To Heaven I Lift My Waiting Eyes",
  "gutenberg-watts-hymns-3-7-when-i-survey-the-wondrous-cross": "When I Survey the Wondrous Cross",
  "gutenberg-watts-hymns-2-9-alas-and-did-my-saviour-bleed": "Alas, and Did My Saviour Bleed",
  "gutenberg-watts-hymns-2-76-hosanna-to-the-prince-of-light": "Hosanna to the Prince of Light",
  "ccel-watts-psalms-hymns-iii-1-twas-on-that-dark-that-doleful-night": "’Twas on That Dark, That Doleful Night",
  "gutenberg-watts-hymns-2-72-bless-d-morning-whose-young-dawning-rays": "Blessed Morning, Whose Young Dawning Rays",
  "gutenberg-watts-hymns-2-34-come-holy-spirit-heavenly-dove": "Come, Holy Spirit, Heavenly Dove",
  "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound": "Amazing Grace",
};

/** Does an occasion have day pages of its own (Holy Week borrows Lent's, and links to them). */
export const hasOwnDays = (occasion: Occasion): boolean => Array.isArray(occasion.days);

/** Every indexable countdown address (design 7.7): the hub, each occasion, and each day page; never a ?date=. */
export function countdownPaths(): string[] {
  const paths = ["/countdowns"];
  for (const occasion of OCCASIONS) {
    paths.push(`/countdowns/${occasion.slug}`);
    if (Array.isArray(occasion.days) && occasion.target.kind !== "chosen") {
      for (const day of occasion.days) paths.push(`/countdowns/${occasion.slug}/${day.key}`);
    }
  }
  return paths;
}
