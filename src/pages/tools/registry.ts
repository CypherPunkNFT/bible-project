// Every tool on /tools, one entry each. The hub draws its cards from this list, so finishing a tool never touches the
// page layout or the menu: set its entry live and give it the address its own route answers at (README.md beside this
// file). The ten tools are the owner's approved list (BibleProject/APPROVED-IDEAS.md, 2026-11-07, ideas 2 to 11).
import type { GameArt } from "@/pages/games/art/draw";
import { CITATION_ART } from "@/pages/citation-generator/art";
import { CONVERTER_ART } from "@/pages/converter/converter-art";
import { HOLY_DAYS_ART } from "@/pages/holy-days/art";
import { NAME_IN_HEBREW_ART } from "@/pages/name-in-hebrew/art";
import { OCCASION_VERSES_ART } from "@/pages/occasion-verses/art";
import { RANDOM_VERSE_ART } from "@/pages/random-verse/art";
import { MEMORY_ART } from "@/pages/scripture-memory/memory-art";
import { PUZZLE_MAKER_ART } from "@/pages/puzzle-maker/art";
import { READING_PLANNER_ART } from "@/pages/reading-planner/planner-art";
import { TITHE_ART } from "@/pages/tithe-calculator/tithe-art";
import { WORD_COUNTER_ART } from "@/pages/word-counter/art";
import { WORSHIP_SLIDES_ART } from "@/pages/worship-slides/art";
import { TOOL_ART } from "./art";

export type Audience = "parents" | "families" | "churches" | "anyone";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  parents: "Parents",
  families: "Families",
  churches: "Churches and pastors",
  anyone: "Anyone",
};

/** The hub's categories, in page order: each tool sits in one. "study" holds the study and reference tools (sequence 41). */
export type Category = "family" | "hard-times" | "prayer" | "sharing" | "study";

export const CATEGORIES: readonly { key: Category; title: string; text: string }[] = [
  { key: "family", title: "Family and life events", text: "A name for a new baby and any name in Hebrew, a verse for a birthday, and passages and cards for weddings, baptisms and graduations." },
  { key: "hard-times", title: "Hard times", text: "Comfort for someone grieving, and what the Bible says when life is heavy." },
  { key: "prayer", title: "Prayer and the home", text: "Short prayers for the days that matter, and blessings to say and print at home." },
  { key: "sharing", title: "Sharing and churches", text: "Send a verse to a friend, follow Advent and Lent together, or put a daily verse on a church website." },
  { key: "study", title: "Study and reference", text: "Tools for reading the Bible closely: its measures and money in today's terms, and more to come." },
];

interface ToolBase {
  /** A name for the entry: lower case, words joined by hyphens. */
  slug: string;
  title: string;
  /** One line, shown on the card. */
  description: string;
  audiences: readonly Audience[];
  category: Category;
  /** Its picture on the hub, from art/. */
  art: GameArt;
}

/** A tool still being made: a card that says "Coming soon" and no link. */
export interface ComingSoonTool extends ToolBase { status: "coming-soon"; path?: never }

/** A finished tool: `path` is its own address, routed in src/App.tsx. */
export interface LiveTool extends ToolBase { status: "live"; path: string }

export type ToolEntry = ComingSoonTool | LiveTool;

export const TOOLS: readonly ToolEntry[] = [
  {
    slug: "baby-names", status: "live", path: "/baby-names",
    title: "Biblical baby names",
    description: "Every name from the Bible: what it means, who bore it and the verses where it appears.",
    audiences: ["parents", "families"],
    category: "family", art: TOOL_ART.babyNames,
  },
  {
    slug: "birthday-verses", status: "live", path: "/birthday-verses",
    title: "Birthday verses",
    description: "A verse for every day of the year, with a card to send a friend on their birthday.",
    audiences: ["families", "anyone"],
    category: "family", art: TOOL_ART.birthdayVerses,
  },
  {
    slug: "life-events", status: "live", path: "/life-events",
    title: "Verses for life's big moments",
    description: "Weddings, baptisms, new babies and graduations: chosen passages and a card to print at home.",
    audiences: ["families", "churches"],
    category: "family", art: TOOL_ART.lifeEvents,
  },
  {
    slug: "sympathy", status: "live", path: "/sympathy",
    title: "Funeral and sympathy",
    description: "Comforting passages for a loss, readings for a funeral, and a gentle card to send someone grieving.",
    audiences: ["anyone", "churches"],
    category: "hard-times", art: TOOL_ART.sympathy,
  },
  {
    slug: "when-youre", status: "live", path: "/when-youre",
    title: "What the Bible says when you're…",
    description: "Passages for when you're anxious, grieving, lonely, tempted or facing surgery, with help close at hand.",
    audiences: ["anyone"],
    category: "hard-times", art: TOOL_ART.whenYoure,
  },
  {
    slug: "occasion-prayers", status: "live", path: "/prayers",
    title: "Prayers for occasions",
    description: "Short prayers rooted in Scripture for surgery, a job interview, a new home or a hard conversation.",
    audiences: ["anyone", "families"],
    category: "prayer", art: TOOL_ART.occasionPrayers,
  },
  {
    slug: "home-blessings", status: "live", path: "/blessings",
    title: "Blessings for the home",
    description: "House blessings, graces for meals and bedtime blessings for children, ready to print.",
    audiences: ["families", "parents"],
    category: "prayer", art: TOOL_ART.homeBlessings,
  },
  {
    slug: "verse-cards", status: "live", path: "/verse-cards",
    title: "Shareable verse cards",
    description: "Good-looking verse pictures for social media and messages, each linking back to the verse.",
    audiences: ["anyone", "churches"],
    category: "sharing", art: TOOL_ART.verseCards,
  },
  {
    slug: "countdowns", status: "live", path: "/countdowns",
    title: "Countdowns",
    description: "Daily readings through Advent and Lent, to follow at home or share with your church.",
    audiences: ["families", "churches"],
    category: "sharing", art: TOOL_ART.countdowns,
  },
  {
    slug: "verse-widget", status: "live", path: "/verse-of-the-day",
    title: "Verse of the day for churches",
    description: "A daily verse a church can put on its own website by pasting in a few lines.",
    audiences: ["churches"],
    category: "sharing", art: TOOL_ART.verseWidget,
  },
  {
    slug: "biblical-converter", status: "live", path: "/converter",
    title: "Biblical converter",
    description: "Cubits, shekels, talents and denarii in today's units and dollars, with the Berean's notes as the source.",
    audiences: ["anyone", "churches"],
    category: "study", art: CONVERTER_ART,
  },
  {
    slug: "reading-planner", status: "live", path: "/reading-planner",
    title: "Bible reading planner",
    description: "A daily plan for any books, by a finish date or a pace, with the time each day takes. Print it or add it to your calendar.",
    audiences: ["anyone", "families", "churches"],
    category: "study", art: READING_PLANNER_ART,
  },
  {
    slug: "holy-days", status: "live", path: "/holy-days",
    title: "Holy days calendar",
    description: "Easter, Western and Orthodox, Lent, Advent, Pentecost and the biblical feasts for any year, with key passages.",
    audiences: ["churches", "families"],
    category: "sharing", art: HOLY_DAYS_ART,
  },
  {
    slug: "word-counter", status: "live", path: "/word-counter",
    title: "Bible word counter",
    description: "How many times a word or phrase appears in the Bible, book by book, with every verse it is in.",
    audiences: ["anyone", "churches"],
    category: "study", art: WORD_COUNTER_ART,
  },
  {
    slug: "citation-generator", status: "live", path: "/citation-generator",
    title: "Bible citation generator",
    description: "Any Bible reference in MLA, APA, Chicago, Turabian or SBL style, for any version on the site, ready to copy.",
    audiences: ["anyone", "churches"],
    category: "study", art: CITATION_ART,
  },
  {
    slug: "random-verse", status: "live", path: "/random-verse",
    title: "Random Bible verse",
    description: "One tap for a verse, from the whole Bible, one book or a theme such as hope or peace. Copy it or share it.",
    audiences: ["anyone", "families"],
    category: "sharing", art: RANDOM_VERSE_ART,
  },
  {
    slug: "tithe-calculator", status: "live", path: "/tithe-calculator",
    title: "Tithe and giving calculator",
    description: "A tithe, or any percentage you choose, of your income by week, month and year. Nothing you type is sent or saved.",
    audiences: ["families", "churches", "anyone"],
    category: "family", art: TITHE_ART,
  },
  {
    slug: "name-in-hebrew", status: "live", path: "/name-in-hebrew",
    title: "Your name in Hebrew, Greek and Aramaic",
    description: "Any name written in Hebrew, Greek and Aramaic letters, and for a Bible name, how Scripture spells it and its meaning.",
    audiences: ["anyone", "parents", "families"],
    category: "family", art: NAME_IN_HEBREW_ART,
  },
  {
    slug: "occasion-verses", status: "live", path: "/occasion-verses",
    title: "Occasion verse picker",
    description: "Verses for weddings by part of the service, baptisms, confirmations, birthdays and funerals, with a list to print and certificates.",
    audiences: ["families", "churches", "anyone"],
    category: "family", art: OCCASION_VERSES_ART,
  },
  {
    slug: "scripture-memory", status: "live", path: "/scripture-memory",
    title: "Scripture memory helper",
    description: "Pick a verse and say it once a day as its words fade, until you know it by heart. Saved only in your browser.",
    audiences: ["anyone", "families"],
    category: "study", art: MEMORY_ART,
  },
  {
    slug: "worship-slides", status: "live", path: "/worship-slides",
    title: "Worship slide maker",
    description: "Any verse or passage as clean slides for a service or livestream. Download pictures or a PowerPoint file.",
    audiences: ["churches"],
    category: "sharing", art: WORSHIP_SLIDES_ART,
  },
  {
    slug: "puzzle-maker", status: "live", path: "/puzzle-maker",
    title: "Puzzle maker",
    description: "Printable Bible word searches and crosswords from any passage or theme, with an answer key.",
    audiences: ["parents", "families", "churches"],
    category: "sharing", art: PUZZLE_MAKER_ART,
  },
];

export const isLive = (tool: ToolEntry): tool is LiveTool => tool.status === "live";

/** Live tools first, each group in list order: what the hub shows. */
export const toolsForHub = (tools: readonly ToolEntry[] = TOOLS) => [...tools.filter(isLive), ...tools.filter((tool) => !isLive(tool))];
