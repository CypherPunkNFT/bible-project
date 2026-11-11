// "What the Bible says when you're...": every topic page in hub order, the addresses the sitemap lists, and the redirect
// list for pages retired on purpose (design 5.1, 7.2, 9.1). Adding a page means adding one entry to a group file and
// its slug to HUB_ORDER; the hub, the filter, the routes, the sitemap and the tests follow.
import { BODY_TOPICS } from "./body";
import { HEART_TOPICS } from "./heart";
import { HOME_TOPICS } from "./home";
import { LIFE_TOPICS } from "./life";
import { SORROW_TOPICS } from "./sorrow";
import { SOUL_TOPICS } from "./soul";
import type { TopicGroup, WhenTopic } from "./types";

export type { HelpLevel, TopicGroup, TopicPassage, WhenTopic } from "./types";

export const WHEN_YOURE_PATH = "/when-youre";

/** The hub's three groups, in order (design 5.3). */
export const GROUPS: { id: TopicGroup; title: string }[] = [
  { id: "heart", title: "In your heart" },
  { id: "body", title: "In your body" },
  { id: "life", title: "In your life" },
];

/** Hub order (design 3.2). */
export const HUB_ORDER: readonly string[] = [
  "anxious", "afraid", "overwhelmed", "depressed", "discouraged", "thinking-of-suicide", "lonely", "grieving",
  "heartbroken", "angry", "guilty", "worthless", "doubting", "far-from-god", "exhausted", "tempted", "hurt-by-someone",
  "cant-sleep",
  "facing-surgery", "sick", "serious-diagnosis", "caregiving", "dying",
  "out-of-work", "money-worries", "divorce", "struggling-marriage", "abused", "infertility", "worried-about-child",
  "addiction", "big-decision", "troubled-times",
];

const ALL = [...HEART_TOPICS, ...SORROW_TOPICS, ...SOUL_TOPICS, ...BODY_TOPICS, ...HOME_TOPICS, ...LIFE_TOPICS];
const bySlug = new Map(ALL.map((topic) => [topic.slug, topic]));

function inHubOrder(): WhenTopic[] {
  return HUB_ORDER.map((slug) => {
    const topic = bySlug.get(slug);
    if (!topic) throw new Error(`when-youre: HUB_ORDER names "${slug}", which no group file defines`);
    return topic;
  });
}

/** Every topic page, in hub order. */
export const WHEN_TOPICS: WhenTopic[] = inHubOrder();

export function topicBySlug(slug: string | undefined): WhenTopic | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export const topicPath = (topic: Pick<WhenTopic, "slug">): string => `${WHEN_YOURE_PATH}/${topic.slug}`;

/**
 * Pages retired on purpose -> the page that replaces them, chosen by hand (never a guessed "nearest" page). Empty at
 * launch; a test rejects cycles and targets that are not real pages.
 */
export const RETIRED: Readonly<Record<string, string>> = {};

/** The live page a retired slug now points to, following the list to its end, or undefined. */
export function redirectFor(slug: string | undefined, retired: Readonly<Record<string, string>> = RETIRED): string | undefined {
  const seen = new Set<string>();
  let current = slug;
  while (current && retired[current] !== undefined) {
    if (seen.has(current)) return undefined;
    seen.add(current);
    current = retired[current];
  }
  return current && current !== slug && bySlug.has(current) ? current : undefined;
}

/** The hub and every topic page: the indexable addresses (never anchors or unknown addresses). */
export function whenYourePaths(): string[] {
  return [WHEN_YOURE_PATH, ...WHEN_TOPICS.map(topicPath)];
}
