// Prayers for occasions: every occasion page in hub order, and the addresses the sitemap lists (design 5.1, 7.1).
// Adding a page means adding one entry to a group file and its slug to HUB_ORDER; the hub, the filter, the routes, the
// sitemap and the tests follow.
import { CHURCH_OCCASIONS } from "./church";
import { HARD_OCCASIONS } from "./hard";
import { HEALTH_OCCASIONS } from "./health";
import { HOME_OCCASIONS } from "./home";
import { JOURNEY_OCCASIONS } from "./journeys";
import type { Occasion, OccasionGroup } from "./types";
import { WORK_OCCASIONS } from "./work";

export type { HistoricId, HistoricPrayer, Occasion, OccasionGroup, WrittenPrayer } from "./types";
export { BCP_SHORT, BCP_WORD_LIMIT, CROWN_ACKNOWLEDGEMENT, HISTORIC_PRAYERS, historicCredit, wordCount } from "./historic";

export const PRAYERS_PATH = "/prayers";

/** The hub's six groups, in order (design 5.3). */
export const GROUPS: { id: OccasionGroup; title: string }[] = [
  { id: "health", title: "Health and care" },
  { id: "work", title: "Work and study" },
  { id: "home", title: "Home and family" },
  { id: "hard", title: "Hard moments" },
  { id: "journeys", title: "Journeys and seasons" },
  { id: "church", title: "Church and Scripture" },
];

/** Hub order (design 3.2). */
export const HUB_ORDER: readonly string[] = [
  "before-surgery", "waiting-for-results", "starting-treatment", "someone-in-hospital", "recovering", "giving-birth",
  "job-interview", "new-job", "looking-for-work", "exam", "first-day-of-school", "speaking-in-public", "big-decision",
  "new-home", "moving-away", "new-baby", "wedding-day", "struggling-marriage", "child-leaving-home",
  "hard-conversation", "making-peace", "court-date", "after-bad-news", "before-a-funeral",
  "travel", "deployment", "mission-trip", "new-year", "birthday",
  "opening-a-meeting", "closing-a-meeting", "before-reading-the-bible",
];

const ALL = [...HEALTH_OCCASIONS, ...WORK_OCCASIONS, ...HOME_OCCASIONS, ...HARD_OCCASIONS, ...JOURNEY_OCCASIONS, ...CHURCH_OCCASIONS];
const bySlug = new Map(ALL.map((occasion) => [occasion.slug, occasion]));

function inHubOrder(): Occasion[] {
  return HUB_ORDER.map((slug) => {
    const occasion = bySlug.get(slug);
    if (!occasion) throw new Error(`occasion-prayers: HUB_ORDER names "${slug}", which no group file defines`);
    return occasion;
  });
}

/** Every occasion page, in hub order. */
export const OCCASIONS: Occasion[] = inHubOrder();

/** Every occasion any group file defines, whether or not HUB_ORDER lists it (the tests compare the two). */
export const DEFINED_OCCASIONS: readonly Occasion[] = ALL;

export function occasionBySlug(slug: string | undefined): Occasion | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export const occasionPath = (occasion: Pick<Occasion, "slug">): string => `${PRAYERS_PATH}/${occasion.slug}`;

/** The hub and every occasion page: the indexable addresses (never anchors or unknown addresses). */
export function occasionPrayerPaths(): string[] {
  return [PRAYERS_PATH, ...OCCASIONS.map(occasionPath)];
}
