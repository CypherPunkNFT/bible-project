// The three Resources sections, shared by the station's doorways and the section pages' crumbs and heroes.
import type { StationArtKind } from "@/components/stations/StationArt";
import { hasResource } from "@/data/resources";

export interface ResourceSection { slug: "learning" | "fellowships" | "life"; art: StationArtKind; title: string; text: string; color: string }

export const RESOURCE_SECTIONS: ResourceSection[] = [
  { slug: "learning", art: "learning", title: "Learning materials", text: "PDFs, workbooks and study guides we make, to print or keep beside the page.", color: "epistles" },
  { slug: "fellowships", art: "fellowships", title: "Fellowships", text: "Free national fellowships that gather believers to pray and to study the word together.", color: "gospels" },
  { slug: "life", art: "life", title: "Help for life", text: "National hotlines, food, pregnancy and post-abortion care and grief care, with a map of places across the USA.", color: "history" },
];

/** A section is open once its data file exists in src/data/resources/. */
export const sectionReady = (slug: ResourceSection["slug"]) => hasResource(slug);
export const sectionBySlug = (slug: ResourceSection["slug"]) => RESOURCE_SECTIONS.find((s) => s.slug === slug)!;
