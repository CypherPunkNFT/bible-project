// The hub's "What's happening?" filter (design 5.3): a local way to find a page, never an assessment. What is typed is
// matched here in memory and never stored, put in the address or sent anywhere (design 6.5). Crisis words use the
// "when you're…" list, imported rather than copied, so both features recognise the same words.
import { normaliseFeeling, urgentMatches, type UrgentTopic } from "@/data/when-youre/help";
import type { Occasion } from "@/data/occasion-prayers";

export interface FilterResult {
  /** The urgent "when you're…" pages to point to above the results. */
  urgent: UrgentTopic[];
  /** Matching occasions in hub order; every occasion when nothing was typed or nothing matched. */
  occasions: Occasion[];
  /** True when something was typed and no occasion matched it. */
  unmatched: boolean;
}

const contains = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `);

/** Does an occasion's label, heading or plain words match the typed text (either way round, by whole words)? */
export function occasionMatches(occasion: Occasion, query: string): boolean {
  const typed = normaliseFeeling(query);
  if (!typed) return true;
  const terms = [occasion.label, occasion.heading.replace(/^An? (Opening |Closing |Birthday )?Prayer /, ""), ...occasion.words].map(normaliseFeeling).filter(Boolean);
  return terms.some((term) => (typed.length >= 3 && term.startsWith(typed)) || contains(term, typed) || contains(typed, term));
}

export function filterOccasions(occasions: Occasion[], query: string): FilterResult {
  const typed = normaliseFeeling(query);
  if (!typed) return { urgent: [], occasions, unmatched: false };
  const matched = occasions.filter((occasion) => occasionMatches(occasion, query));
  return { urgent: urgentMatches(query), occasions: matched.length ? matched : occasions, unmatched: matched.length === 0 };
}
