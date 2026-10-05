import type { StudyCollectionId } from "./study-collections";

export type StudyIllustration = "arcs" | "matrix" | "sections" | "sizes" | "chapters" | "teaching" | "speech" | "harmony" | "portraits" | "timeline" | "coverage" | "people" | "prophets" | "places" | "miracles" | "letters" | "names";
export type StudySection = {
  id: string;
  title: string;
  description: string;
  kind: "Chart" | "Guide" | "Map" | "Library";
  illustration: StudyIllustration;
  to?: string;
};

/** Contents belong to the current collection, rather than unrelated collections. */
export const STUDY_SECTIONS: Record<StudyCollectionId, StudySection[]> = {
  references: [
    { id: "arcs", title: "Cross-reference arcs", description: "Follow connections across chapters, or trace the links of one book.", kind: "Chart", illustration: "arcs" },
    { id: "matrix", title: "Book to book", description: "Compare connected books and open their strongest pairs of passages.", kind: "Chart", illustration: "matrix" },
  ],
  structure: [
    { id: "sections", title: "Sections & measures", description: "Explore literary forms and compare nine ways of measuring the Bible.", kind: "Chart", illustration: "sections" },
    { id: "sizes", title: "Book lengths", description: "Compare individual books by chapters, verses or words.", kind: "Chart", illustration: "sizes" },
    { id: "chapters", title: "Chapter atlas", description: "Find your place in a numbered map of every chapter, then open it to read.", kind: "Chart", illustration: "chapters" },
  ],
  gospels: [
    { id: "portraits", title: "Four Gospel portraits", description: "See each account in its own narrative order, with eight guided comparisons and the complete event map.", kind: "Guide", illustration: "portraits" },
    { id: "jesus", title: "Teaching journeys", description: "Read eight selected teachings in their setting and compare parallel passages.", kind: "Guide", illustration: "teaching" },
    { id: "speech", title: "Where he speaks", description: "Explore the speech atlas by Gospel, chapter and red-letter word count.", kind: "Chart", illustration: "speech" },
    { id: "harmony", title: "Gospel harmony", description: "Follow 185 events and read Matthew, Mark, Luke and John side by side.", kind: "Guide", illustration: "harmony" },
  ],
  versions: [
    { id: "timeline", title: "Versions through time", description: "Place the editions in this library along a timeline of their recorded years.", kind: "Chart", illustration: "timeline" },
    { id: "coverage", title: "Version coverage", description: "Compare which books each edition includes, from Genesis to the Apocrypha.", kind: "Chart", illustration: "coverage" },
    { id: "library", title: "Choose an edition", description: "Browse the library by language and choose a version to read.", kind: "Library", illustration: "letters", to: "/library" },
  ],
  people: [
    { id: "people-directory", title: "People & families", description: "Find a person, follow their family, and read the verses that name them.", kind: "Guide", illustration: "people", to: "/study/people#people-directory" },
    { id: "prophets", title: "Prophets through time", description: "Follow the prophets by era and the kings Scripture names beside them.", kind: "Guide", illustration: "prophets", to: "/study/prophets" },
  ],
  places: [
    { id: "places-map", title: "Explore the atlas", description: "Find biblical places on the satellite map; filter by section or book.", kind: "Map", illustration: "places" },
    { id: "top-places", title: "The most-named places", description: "Compare the places mentioned most often, then locate one on the map.", kind: "Chart", illustration: "sizes" },
  ],
  miracles: [
    { id: "who-jesus", title: "The miracles of Jesus", description: "Explore 35 miracles and read the Gospel accounts of each event.", kind: "Guide", illustration: "miracles" },
    { id: "who-moses-and-aaron", title: "Moses & Aaron", description: "Explore the signs of the exodus and wilderness, grouped by kind.", kind: "Guide", illustration: "miracles" },
    { id: "other-miracles", title: "Prophets & apostles", description: "Read wonders worked through Elijah, Elisha, Peter, Paul and others.", kind: "Guide", illustration: "prophets" },
  ],
  letters: [
    { id: "paul-letters", title: "Paul's letters", description: "Compare thirteen letters, their sections, and the communities they address.", kind: "Guide", illustration: "letters" },
    { id: "general-letters", title: "Hebrews & the general letters", description: "Explore the other eight letters and how each message unfolds.", kind: "Guide", illustration: "letters" },
  ],
  names: [
    { id: "names-explorer", title: "Explore the names", description: "Unfold the names of the Father, Son and Holy Spirit into their passages.", kind: "Guide", illustration: "names" },
    { id: "names-list", title: "Find a name", description: "Search all 302 names and titles, grouped by person or arranged A to Z.", kind: "Guide", illustration: "letters" },
  ],
};
