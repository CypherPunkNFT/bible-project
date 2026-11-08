// Funeral and sympathy pages (docs/features/sympathy/design.md 7.1): the shape of a passage set, and the helper the set
// files use to name a passage. Imports nothing through "@/", so the build scripts (outside Vite) can read the sets.
// Verse wording is never stored here: a passage is verse ids (the life-event shape), and the words come from the Berean files.
import { p, type LifeEventPassage, type PassageRole } from "../life-events/types";

export type ServicePart = "opening" | "old-testament" | "new-testament" | "graveside" | "blessing";

/** A sympathy passage is a life-event passage (so the shared helpers take it) with two optional labels. */
export interface SympathyPassage extends LifeEventPassage {
  /** "For a believer": it speaks of a Christian's hope after death (design 2.5, 4.1). */
  believer?: true;
  /** "Often better a few weeks on": a verse of future joy that can sting in the first days (design 4.1). */
  later?: true;
  /** A muted hint the card maker shows under this verse (Isaiah 54:5, design 4.3). */
  hint?: string;
  /** Funeral readings page only: the part of the service it belongs to. */
  servicePart?: ServicePart;
}

export interface SympathySet {
  /** "loss-of-mother"; "" for the hub's own set. */
  slug: string;
  /** The h1, the search phrase in title case. */
  heading: string;
  /** For the hub list and links: "A mother". */
  short: string;
  /** 60–160 words; the page's search description, so its first sentence names the loss. */
  intro: string;
  explainer?: { title: string; paragraphs: string[] };
  /** The suicide page only: the calm help strip under the introduction (design 5.4). */
  helpStrip?: true;
  /** The first card verse is the default card verse and carries no label (tested). */
  passages: SympathyPassage[];
  card: { heading: string; inside: string };
  /** Topic pages to link to; each slug and title must match data/topics/index.json. */
  topics: { slug: string; title: string }[];
  /** Sibling loss-page slugs. */
  related: string[];
}

interface SympathyExtras {
  context?: string;
  part?: string;
  believer?: boolean;
  later?: boolean;
  hint?: string;
  servicePart?: ServicePart;
}

/** A passage from a short reference ("PSA 34:18", "PSA 30:5b" with `part`), as the life-event p(), plus the two labels. */
export function sp(reference: string, role: PassageRole, note: string, extras: SympathyExtras = {}): SympathyPassage {
  const passage: SympathyPassage = p(reference, role, note, { context: extras.context, part: extras.part });
  if (extras.believer) passage.believer = true;
  if (extras.later) passage.later = true;
  if (extras.hint) passage.hint = extras.hint;
  if (extras.servicePart) passage.servicePart = extras.servicePart;
  return passage;
}
