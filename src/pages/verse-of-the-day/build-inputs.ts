// The one entry file scripts/build-verse-of-the-day.ts bundles with esbuild (docs/features/verse-widget/design.md 4.6):
// re-exports only, so the build reads the countdowns, the curation file and the passage helpers exactly as the site does.
export { OCCASIONS } from "@/data/countdowns";
export { FIXED_DAYS, POOL } from "@/data/verse-of-the-day/curation";
export { passageKey, readPath } from "@/data/verse-of-the-day/keys";
export { assemblePassage, CARD_FULL, passageReference, passageVerseIds } from "@/pages/life-events/passage";
export { buildSchedule, passageOfDay, rotationOf, scheduledKey } from "./schedule";
export { dayFileOf, MAX_ORDINARY } from "./day-file";
