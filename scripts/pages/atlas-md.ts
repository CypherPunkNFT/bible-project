// Small Markdown helpers and shared shapes for the Atlas content export (atlas.ts).
import { fixedWording } from "./atlas-source";

/** One table cell: no line breaks, pipes escaped. */
export const cell = (value: string | number) => String(value).replace(/\r?\n/g, " ").replace(/\|/g, "\\|");

export const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)].join("\n");

export const count = (n: number) => n.toLocaleString("en-US");

/** A clickable link from Pages/Atlas/<page>/CONTENT.md (or Pages/Atlas/CONTENT.md) to a Website file. */
export const codeLink = (file: string, depth: number) => `[${file.split("/").pop()}](${"../".repeat(depth + 1)}Website/${file})`;

/** A site address as a link to the live site. */
export const siteLink = (address: string) => `[${address}](https://bibleproject.io${address})`;

/** "Fixed wording" sections: the words written into the named components, one bullet list per file. */
export async function wordingSection(sources: { file: string; functions?: string[] }[], depth: number): Promise<string> {
  const parts = ["## Fixed wording in the page code", "", "Written directly into the components. \"…\" marks a part filled in from the data above; [a / b] means one of these phrases, depending on the choice made.", ""];
  for (const source of sources) {
    const wording = await fixedWording(source.file, source.functions);
    const which = source.functions ? ` (${source.functions.join(", ")})` : "";
    parts.push(`**${codeLink(source.file, depth)}${which}**`, "", ...wording.map((entry) => `- ${entry.kind}: ${entry.text}`), "");
  }
  return parts.join("\n");
}

export interface Choice {
  id: string;
  title: string;
  subtitle: string;
  place: string;
  placeId?: string;
}

export interface Lens {
  id: string;
  label: string;
  title: string;
  description: string;
}

/** The Journeys / Ancient Cities / Gospel Events wording kept in AtlasCollection.tsx. */
export interface Experience {
  kicker: string;
  title: string;
  description: string;
  choose: string;
  options: Choice[];
  lenses: Lens[];
  next: string;
}

/** One card on the Atlas home (DESTINATIONS in AtlasCollection.tsx, or a history collection). */
export interface Destination {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  action: string;
}

export interface HistoryTopic {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  places: string[];
  threads: string[];
}

export interface HistoryCollection extends Destination {
  heading: string;
  intro: string;
  choose: string;
  topics: readonly HistoryTopic[];
  sources: readonly { title: string; url: string }[];
}

/** The Journeys and Gospel Events page body: header, choices, lenses and the "comes next" note. */
export function experienceMarkdown(data: Experience, options: { placeColumn: string; lensNote?: string }): string {
  return [
    "## Page header",
    "",
    `- Eyebrow: ${data.kicker}`,
    `- Heading: ${data.title}`,
    `- Introduction: ${data.description}`,
    "",
    `## ${data.choose}`,
    "",
    `${data.options.length} choices. Choosing one shows it in the workspace below, with a link to find its place on the map.`,
    "",
    table(["#", "Choice", "Subtitle", options.placeColumn], data.options.map((choice, index) => [String(index + 1).padStart(2, "0"), choice.title, choice.subtitle, choice.place])),
    "",
    "## Lenses (ways of looking at the choice)",
    "",
    ...(options.lensNote ? [options.lensNote, ""] : []),
    table(["Button", "Heading shown", "What it says"], data.lenses.map((lens) => [lens.label, lens.title, lens.description])),
    "",
    "## Note shown in the workspace",
    "",
    `- Labelled "Experience preview": ${data.next}`,
  ].join("\n");
}
