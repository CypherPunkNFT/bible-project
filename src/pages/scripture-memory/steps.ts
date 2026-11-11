// Scripture memory: each step's name and what it asks of the reader (design §3 and §9), under label keys so the
// translation collector picks them up. Steps 0 to 5 are shown as "Step 1 of 6" to "Step 6 of 6"; 6 is known by heart.
import { KNOWN } from "./fade";

/** What each step asks of the reader. */
export const STEP_TEXT: readonly { label: string }[] = [
  { label: "Every word is showing. Read it aloud slowly, two or three times." },
  { label: "A few words are hidden. Say the verse, and tap a gap only if you need it." },
  { label: "More words are hidden. Say it through, then check the gaps." },
  { label: "Most words are hidden. Let the first words carry you." },
  { label: "Only a few words are left. Say it from memory." },
  { label: "Every word is hidden. Say the whole verse from memory." },
  { label: "Known by heart. Say it now and then to keep it fresh." },
];

/** Steps before known by heart. */
export const STEPS = 6;

/** "Step 3 of 6", one whole template sentence for the collector ("Step {n} of {n}"), or "Known by heart". */
export const stepLabel = (stage: number): string => (stage >= KNOWN ? "Known by heart" : `Step ${Math.max(0, stage) + 1} of ${STEPS}`);
