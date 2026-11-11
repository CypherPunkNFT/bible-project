// The occasion verse picker (docs/features/occasion-verses/design.md 3): the one shape every occasion takes, whether it
// comes from a life-event pack, the funeral and sympathy pages, or the picker's own data. Imports nothing through "@/",
// so build scripts can read it. A passage is verse ids only; the words come from the site's Berean files.
import type { SympathyPassage } from "../sympathy/types";

export type OccasionPassage = SympathyPassage;

export type OccasionGroup = "wedding" | "faith" | "life" | "loss";

/** The keepsake certificate an occasion can print (design 7). */
export type CertificateKind = "wedding" | "baptism" | "profession" | "dedication";

export interface OccasionSection {
  /** Unique inside its occasion: "readings", "vows", "opening". */
  id: string;
  title: string;
  /** One line on where in the service or what for. */
  what?: string;
  passages: OccasionPassage[];
}

export interface Occasion {
  /** Lower case, words joined by hyphens: the `o` of the address. */
  slug: string;
  group: OccasionGroup;
  /** The occasion's name in the chooser: "Wedding", "A mother". */
  title: string;
  /** Its heading on the page: "Bible Verses for a Wedding". */
  heading: string;
  intro: string;
  explainer?: { title: string; paragraphs: string[] };
  /** The loss-to-suicide set: show the calm help strip (sympathy design 5.4). */
  helpStrip?: true;
  sections: OccasionSection[];
  /** The full page this occasion comes from, and its card maker. */
  more: { href: string; title: string }[];
  certificate?: CertificateKind;
}

export const OCCASION_GROUPS: { id: OccasionGroup; title: string }[] = [
  { id: "wedding", title: "Weddings and marriage" },
  { id: "faith", title: "Faith" },
  { id: "life", title: "Birthdays and milestones" },
  { id: "loss", title: "Funerals and loss" },
];
