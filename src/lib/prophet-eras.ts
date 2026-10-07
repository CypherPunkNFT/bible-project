import { Cross, Crown, Mountain, Route, Scale, Split, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/sections";

/**
 * The eras the prophets are placed in (TIPNR's era names), each coloured by the part of the Bible that tells it, so the
 * prophets' bars match the reading chart's colours (src/lib/sections.ts): the exodus and the judges are told in the
 * History books, the united kingdom is the age of the Psalms and Proverbs, the two kingdoms and the exile are the age
 * of the Prophets, and the New Testament prophets are in the Gospels and Acts.
 */
export interface ProphetEra { id: string; label: string; dates: string; told: string; tone: Tone; icon: LucideIcon }

export const PROPHET_ERAS: ProphetEra[] = [
  { id: "Egypt and Wilderness", label: "Exodus & wilderness", dates: "c. 1450–1400 BC", told: "Exodus – Deuteronomy", tone: "history", icon: Mountain },
  { id: "Judges", label: "The judges", dates: "c. 1380–1050 BC", told: "Joshua – Ruth", tone: "history", icon: Scale },
  { id: "United Monarchy", label: "United kingdom", dates: "c. 1050–930 BC", told: "Samuel, Kings · the Psalms and Proverbs", tone: "poetry", icon: Crown },
  { id: "Divided Monarchy", label: "Two kingdoms", dates: "930–586 BC", told: "Kings, Chronicles · Isaiah – Zephaniah", tone: "prophets", icon: Split },
  { id: "Exile and Return", label: "Exile & return", dates: "586–430 BC", told: "Ezra – Esther · Ezekiel, Daniel, Haggai – Malachi", tone: "prophets", icon: Route },
  { id: "New Testament", label: "New Testament", dates: "AD 1–60", told: "Matthew – Acts", tone: "gospels", icon: Cross },
];

const BY_ID = new Map(PROPHET_ERAS.map((era) => [era.id, era]));
export const prophetEra = (id: string): ProphetEra =>
  BY_ID.get(id) ?? { id, label: id, dates: "", told: "", tone: "apocrypha", icon: Route };
