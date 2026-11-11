// Pieces several occasion files share: the site topics they link (slug and title as in data/topics/index.json, which a
// test checks), and the context notes that travel with a verse wherever it is used (design 4.3).
import { sp } from "../sympathy/types";

export const T = {
  sickness: { slug: "sickness", title: "Sickness" },
  physician: { slug: "physician", title: "Physician" },
  prayer: { slug: "prayer", title: "Prayer" },
  care: { slug: "care", title: "Care" },
  peace: { slug: "peace", title: "Peace" },
  waiting: { slug: "waiting-upon-god", title: "Waiting Upon God" },
  children: { slug: "children", title: "Children" },
  parents: { slug: "parents", title: "Parents" },
  blessing: { slug: "blessing", title: "Blessing" },
  labor: { slug: "labor", title: "Labor" },
  industry: { slug: "industry", title: "Industry" },
  contentment: { slug: "contentment", title: "Contentment" },
  wisdom: { slug: "wisdom", title: "Wisdom" },
  knowledge: { slug: "knowledge", title: "Knowledge" },
  diligence: { slug: "diligence", title: "Diligence" },
  speaking: { slug: "speaking", title: "Speaking" },
  tongue: { slug: "tongue", title: "Tongue" },
  meekness: { slug: "meekness", title: "Meekness" },
  decision: { slug: "decision", title: "Decision" },
  house: { slug: "house", title: "House" },
  thankfulness: { slug: "thankfulness", title: "Thankfulness" },
  protection: { slug: "protection", title: "Protection" },
  strangers: { slug: "strangers", title: "Strangers" },
  marriage: { slug: "marriage", title: "Marriage" },
  forgiveness: { slug: "forgiveness", title: "Forgiveness" },
  humility: { slug: "humility", title: "Humility" },
  time: { slug: "time", title: "Time" },
  reconciliation: { slug: "reconciliation", title: "Reconciliation" },
  lawsuits: { slug: "lawsuits", title: "Lawsuits" },
  integrity: { slug: "integrity", title: "Integrity" },
  mourning: { slug: "mourning", title: "Mourning" },
  bereavement: { slug: "bereavement", title: "Bereavement" },
  soldiers: { slug: "soldiers", title: "Soldiers" },
  missions: { slug: "missions", title: "Missions" },
  benedictions: { slug: "benedictions", title: "Benedictions" },
  wordOfGod: { slug: "word-of-god", title: "Word of God" },
  scriptures: { slug: "scriptures", title: "The Scriptures" },
};

/** The Berean words that stand for the first half of Psalm 31:15 (the same excerpt the "when you're…" data uses). */
export const MY_TIMES = "My times are in Your hands;";

/** Psalm 31:14–15a, "My times are in Your hands". */
export const myTimes = (note: string) => sp("PSA 31:14-15a", "card", note, { part: MY_TIMES });

/** Psalm 121:7–8 carries this note on every page it roots (design 4.3). */
export const GUARD_NOTE =
  "God keeps his people's souls and goes with them wherever they go. This is a promise about who holds us, not a guarantee that no harm will come.";

/** Psalm 121:7–8, "The LORD will guard you from all evil", always with its note. */
export const guarded = (note: string) => sp("PSA 121:7-8", "card", note, { context: GUARD_NOTE });

/** Jeremiah 17:14 carries this note wherever it roots a prayer for healing (design 4.3). */
export const HEAL_NOTE =
  "Jeremiah's own prayer for healing, which anyone may pray. It is not a promise of the same answer for everyone.";

/** Lamentations 3:22–23, used on four pages. */
export const newMercies = (note: string) => sp("LAM 3:22-23", "card", note);

/** Numbers 6:24–26, the priestly blessing. */
export const priestlyBlessing = (note: string) => sp("NUM 6:24-26", "card", note);

/** Proverbs 16:9 is about God's rule over our steps, not a promise that our plans will succeed. */
export const STEPS_NOTE = "We make our plans; God rules over where our steps actually lead. That is a comfort, not a guarantee that our plans succeed.";
