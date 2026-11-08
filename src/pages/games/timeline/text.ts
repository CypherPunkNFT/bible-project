// Timeline sort: the data the game loads and the words of the reveal (design §8.3, §8.4). The gap shown is always the
// smallest any dating system allows, every year says "about", and early-Genesis events never print a year.
import { formatGap, formatYear, verseHref, verseLabel } from "../whos-older/explain";
import { buildOrderIndex, type Explanation, type OrderFact, type OrderIndex, type Span, type Step, type TimelineEvent } from "./order";

export interface EventEntry extends TimelineEvent {
  dating: string;
  refs: Span[];
  people: { name: string; href: string }[];
}

/** timeline.json, as scripts/build-timeline.ts writes it. */
export interface TimelineData {
  stamp: string;
  books: Record<string, [string, string]>;
  events: EventEntry[];
  facts: OrderFact[];
  contested: [string, string][];
}

export interface Loaded { data: TimelineData; index: OrderIndex; byId: ReadonlyMap<string, EventEntry> }

export function prepare(data: TimelineData): Loaded {
  return { data, index: buildOrderIndex(data.events, data.facts, data.contested), byId: new Map(data.events.map((event) => [event.id, event])) };
}

export interface VerseLink { label: string; href: string }
export const verseLink = (data: Pick<TimelineData, "books">, span: Span): VerseLink => ({ label: verseLabel(data, span), href: verseHref(data, span) });

const quoted = (loaded: Loaded, id: string) => `“${loaded.byId.get(id)?.label ?? id}”`;

/** One step in plain words, naming both events when it is part of a two-step reason. */
function stepText(loaded: Loaded, step: Step, named: boolean): string {
  if (step.link.kind === "fact") return step.link.fact.why;
  const bothShown = loaded.byId.get(step.from)!.shown && loaded.byId.get(step.to)!.shown;
  if (!named) return bothShown ? `At least ${formatGap(step.link.gap)} later, even on the dating systems that bring them closest.` : "Later in the Bible's story.";
  return bothShown
    ? `${quoted(loaded, step.to)} came at least ${formatGap(step.link.gap)} after ${quoted(loaded, step.from)}, even on the dating systems that bring them closest.`
    : `${quoted(loaded, step.to)} comes later in the Bible's story than ${quoted(loaded, step.from)}.`;
}

export interface Reason { text: string; verses: VerseLink[] }

/** Why the later card follows the earlier one: one line, with the deciding verses of any facts (§8.3 step 3). */
export function reasonOf(loaded: Loaded, steps: Explanation): Reason {
  const verses = steps.flatMap((step) => (step.link.kind === "fact" && step.link.fact.refs.length ? [verseLink(loaded.data, step.link.fact.refs[0])] : []));
  if (steps.length === 1) return { text: stepText(loaded, steps[0], false), verses };
  return { text: `By way of ${quoted(loaded, steps[0].to)}: ${stepText(loaded, steps[0], true)} ${stepText(loaded, steps[1], true)}`, verses };
}

/** The round's year axis, or null when any card is from early Genesis, whose years are not real (§8.3). */
export function yearAxis(events: readonly EventEntry[]): { lo: number; hi: number; loText: string; hiText: string } | null {
  if (events.some((event) => !event.shown)) return null;
  const years = events.flatMap((event) => [event.lo, event.hi]).filter((year): year is number => year !== null);
  if (!years.length) return null;
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? null : { lo, hi, loText: formatYear(lo), hiText: formatYear(hi) };
}

/** Where an event's window sits on the axis, as percentages; an open edge runs to the end of the axis. */
export function barOf(event: EventEntry, axis: { lo: number; hi: number }): { left: number; width: number; open: boolean } {
  const span = axis.hi - axis.lo;
  const lo = event.lo ?? axis.lo;
  const hi = event.hi ?? axis.hi;
  const left = ((lo - axis.lo) / span) * 100;
  return { left, width: Math.max(1.5, ((hi - lo) / span) * 100), open: event.lo === null || event.hi === null };
}
