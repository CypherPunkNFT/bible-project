// The Trinity: the four parts assembled, with the front matter the landing and the reader both use.
// The prose is in the four modules imported below; nothing is written here but the framing.
import type { Article } from "../model";
import { CONFESSION } from "./trinity-confession";
import { ANALOGIES } from "./trinity-analogies";
import { THEOLOGIANS } from "./trinity-theologians";
import { HISTORY } from "./trinity-history";

export const THE_TRINITY: Article = {
  id: "the-trinity",
  title: "The Trinity",
  kicker: "one God, three persons",
  question: "What does the church actually confess about the Trinity — and why does every explanation of it break?",
  summary:
    "The confession, in the words the creeds use. Why ice, water and steam and the man with three jobs are both the same third-century error. The analogies Augustine, Aquinas, the Cappadocians and C. S. Lewis did offer, each one placed beside the limit its own author wrote for it. And the two councils, fifty-six years apart, that drew the fences.",
  tone: "gospels",
  // Roughly 9,000 words of prose. Checked against the real word count by theology.test.ts, so this
  // number cannot quietly drift as the article is edited.
  minutes: 38,
  sections: [CONFESSION, ANALOGIES, THEOLOGIANS, HISTORY],
  sourceIds: [
    "bsb",
    "athanasian-creed",
    "nicene-creed",
    "schaff-creeds",
    "augustine-trinity",
    "aquinas-summa",
    "basil-spirit",
    "nyssa-ablabius",
    "nazianzus-oration-31",
    "socrates-history",
    "lewis-mere-christianity",
  ],
  related: [
    {
      to: "/study/creeds/nicene-creed-381",
      label: "The Nicene Creed, 381",
      note: "The creed this article’s fourth part is about, in full, with the Spirit article the second council added.",
    },
    {
      to: "/study/creeds/athanasian-creed-800",
      label: "The Athanasian Creed",
      note: "The longest and most exact of the three ancient creeds: “neither confounding the Persons, nor dividing the Essence”, then clause after clause spelling out what that forbids, before it turns to the Incarnation.",
    },
    {
      to: "/study/creeds/nicene-creed-381-schaff",
      label: "Schaff’s edition of the creed of 381",
      note: "The Greek, the Latin of Dionysius Exiguus and the received English side by side — the copy that brackets the later Western words “and the Son”.",
    },
    {
      to: "/study/creeds",
      label: "The creeds and confessions",
      note: "Every document quoted here, and the rest of the collection, with its source edition and licence recorded on each page.",
    },
    {
      to: "/read/bsb/JHN/17",
      label: "John 17 in the Berean Standard Bible",
      note: "The prayer that no account of God with only one person in it can read straight through.",
    },
  ],
};
