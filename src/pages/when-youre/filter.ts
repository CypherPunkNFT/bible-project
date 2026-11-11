// The hub's "How are you feeling?" filter (design 5.3): a local navigation aid, never a diagnosis or a risk assessment.
// What is typed is matched here in memory and never stored, logged, put in the address or sent anywhere (design 6.6).
import { normaliseFeeling, urgentMatches, type UrgentTopic } from "@/data/when-youre/help";
import type { WhenTopic } from "@/data/when-youre";

export interface FilterResult {
  /** The urgent pages whose help box shows above the results, in a fixed order. */
  urgent: UrgentTopic[];
  /** Matching pages in hub order; every page when nothing was typed or nothing matched. */
  topics: WhenTopic[];
  /** True when something was typed and no page matched it. */
  unmatched: boolean;
}

const contains = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `);

/** Does a topic's label, heading or plain words match the typed text (either way round, by whole words)? */
export function topicMatches(topic: WhenTopic, query: string): boolean {
  const typed = normaliseFeeling(query);
  if (!typed) return true;
  const terms = [topic.label, topic.heading.replace(/^What the Bible Says When /, ""), ...topic.words].map(normaliseFeeling).filter(Boolean);
  return terms.some((term) => (typed.length >= 3 && term.startsWith(typed)) || contains(term, typed) || contains(typed, term));
}

export function filterTopics(topics: WhenTopic[], query: string): FilterResult {
  const typed = normaliseFeeling(query);
  if (!typed) return { urgent: [], topics, unmatched: false };
  const urgent = urgentMatches(query);
  const matched = topics.filter((topic) => topicMatches(topic, query) || (urgent as string[]).includes(topic.slug));
  return { urgent, topics: matched.length ? matched : topics, unmatched: matched.length === 0 };
}
