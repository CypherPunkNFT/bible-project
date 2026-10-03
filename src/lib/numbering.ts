import type { Translation } from "./types";

/** How each verse-numbering tradition is named on the page (see scripts/bible/translations.py). */
export const NUMBERING_LABEL: Record<Translation["numbering"], string> = {
  english: "English (KJV)",
  hebrew: "Hebrew",
  greek: "Greek (Septuagint)",
  vulgate: "Latin (Vulgate)",
  mixed: "Mixed (partly Hebrew)",
  synodal: "Russian Synodal",
};
