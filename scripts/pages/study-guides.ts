// CONTENT for two Study guides: Miracles & encounters (/study/miracles) and Names & descriptions of God (/study/names).
import { nameGroups } from "../../src/data/faith-name-order";
import { MIRACLE_CATEGORIES, MIRACLE_CATEGORY, MOSES_CATEGORIES, MOSES_CATEGORY } from "../../src/data/miracle-categories";
import type { HarmonySection, Miracles, NamesOfGod, StudyIndex } from "../../src/lib/study";
import { contentsCards } from "./study-charts";
import { blocks, link, loadCatalog, n, readJson, refs, table } from "./study-lib";
import { byTag, findAll, first, jsxRoots, wording, type JsxNode } from "./study-source";
import type { PageContent } from "./types";

interface Harmony { parts: { n: number; title: string; sections: HarmonySection[] }[] }

/** A guide page's StudyHeader (eyebrow, title, lead) and its StudyCredits text, read from the page file. */
export async function headerAndCredits(file: string, fn?: string): Promise<{ header: string; credits: string; roots: JsxNode[] }> {
  const roots = await jsxRoots(file, fn);
  const head = first(roots, byTag("StudyHeader"));
  const credits = findAll(roots, byTag("StudyCredits")).map((node) => node.text).join("\n\n");
  const header = head ? `## Heading\n\n- Eyebrow: ${head.attrs.eyebrow}\n- Title: **${head.attrs.title}**\n- Lead: ${head.attrs.lead}\n- Above it: "Back to Study"` : "";
  return { header, credits, roots };
}

async function miracles(): Promise<PageContent> {
  const [data, harmony, index, catalog] = await Promise.all([readJson<Miracles>("data/study/miracles.json"), readJson<Harmony>("data/study/harmony.json"), readJson<StudyIndex>("data/study/index.json"), loadCatalog()]);
  const { header, credits, roots } = await headerAndCredits("src/pages/study/MiraclesPage.tsx", "MiraclesPage");
  const events = new Map(harmony.parts.flatMap((part) => part.sections).map((section) => [section.n, section]));
  const groups = [{ who: "Jesus", count: data.christ.length }, ...data.servants.map((group) => ({ who: group.who, count: group.items.length }))].sort((a, b) => b.count - a.count);
  const chips = (categories: readonly { id: string; name: string }[], of: Record<string, string>, titles: string[]) =>
    [`All ${titles.length}`, ...categories.map((c) => `${c.name} ${titles.filter((t) => of[t] === c.id).length}`)].join(" · ");
  const name = (id: string, categories: readonly { id: string; name: string }[]) => categories.find((c) => c.id === id)?.name ?? "—";
  const jesus = data.christ.map((m, i) => {
    const event = events.get(m.section);
    return [i + 1, m.title, name(MIRACLE_CATEGORY[m.title], MIRACLE_CATEGORIES), ...(["MAT", "MRK", "LUK", "JHN"] as const).map((key) => refs(catalog, event?.refs[key]) || "—"), `§${m.section}`];
  });
  const moses = data.servants.find((group) => group.who === "Moses and Aaron")!;
  const others = data.servants.filter((group) => group !== moses).map((group) => `### ${group.who} (${group.items.length})\n\n${group.items.map((item) => `- ${item.title}: ${refs(catalog, item.refs)}`).join("\n")}`);
  const evil = first(roots, (node) => node.tag === "section" && node.attrs["aria-labelledby"] === "evil");
  const corrections = index.corrections.map((c) => `- ${c.where}: printed ${c.printed}, corrected to ${c.corrected} (${c.why})`).join("\n");
  return { dir: "Study/miracles-and-encounters", title: "Miracles & encounters", markdown: blocks(`**Address:** ${link("/study/miracles")}`, header, await contentsCards("miracles"),
    `## Through whom (chart above the lists)\n\n"Through whom — events, not tellings": one bar per person or group, counting events. Legend: Old Testament · Jesus · The apostles and the church.`,
    table(["Through", "Events"], groups.map((g) => [g.who, g.count])),
    `Search box "Find a miracle or a name" looks across all groups (${n(data.christ.length + data.servants.reduce((sum, g) => sum + g.items.length, 0))} miracles in all); otherwise the cards show one group at a time. Opening a miracle shows its passages (KJV), and for Jesus' miracles a link to the event in the Gospel harmony.`,
    `## 01 The miracles of Jesus (${data.christ.length})\n\nCategory buttons: ${chips(MIRACLE_CATEGORIES, MIRACLE_CATEGORY, data.christ.map((m) => m.title))}. A ten-row box that scrolls.`,
    table(["#", "Miracle", "Kind", "Matthew", "Mark", "Luke", "John", "Harmony event"], jesus),
    `## 02 Moses & Aaron (${moses.items.length})\n\nCategory buttons: ${chips(MOSES_CATEGORIES, MOSES_CATEGORY, moses.items.map((m) => m.title))}.`,
    table(["Miracle", "Kind", "Passages"], moses.items.map((item) => [item.title, name(MOSES_CATEGORY[item.title], MOSES_CATEGORIES), refs(catalog, item.refs)])),
    `## 03 Prophets & apostles (${data.servants.length - 1} groups)`, ...others,
    `## ${first([evil], byTag("h2")).text} (shown with Prophets & apostles)\n\n${first([evil], byTag("p")).text}\n\n${data.evil.map((item) => `- ${item.title}: ${refs(catalog, item.refs)}`).join("\n")}`,
    `## Credits (page foot)\n\n${credits}\n\nThe corrected misprints listed there:\n\n${corrections}`,
    `*Interface wording (MiraclesPage.tsx):* ${(await wording("src/pages/study/MiraclesPage.tsx")).join(" · ")}`) };
}

async function names(): Promise<PageContent> {
  const [data, catalog] = await Promise.all([readJson<NamesOfGod>("data/study/names.json"), loadCatalog()]);
  const { header, credits } = await headerAndCredits("src/pages/study/NamesPage.tsx", "NamesPage");
  const titles: Record<string, string> = { father: "Abba Father", son: "Jesus Christ", spirit: "Holy Spirit" };
  const total = data.groups.reduce((sum, group) => sum + group.names.length, 0);
  // The explorer (the Faith page's three words) reads its own copy of the list; say whether it matches the list below.
  const explorer = nameGroups.map((group) => group.map((entry) => entry.name));
  const listed = data.groups.map((group) => group.names.map((entry) => entry.name));
  const differences = explorer.flatMap((group, g) => group.map((nameText, i) => (nameText === listed[g]?.[i] ? null : `${titles[data.groups[g].key]} #${i + 1}: explorer "${nameText}", list "${listed[g]?.[i] ?? "—"}"`))).filter(Boolean);
  const sameShape = explorer.every((group, g) => group.length === listed[g]?.length);
  const groupTables = data.groups.map((group) => blocks(`### ${titles[group.key]} (${group.label}, ${group.names.length})`,
    table(["#", "Name", "Note", "Passages"], group.names.map((entry, i) => [i + 1, entry.name, entry.note, refs(catalog, entry.refs)]))));
  return { dir: "Study/names-and-descriptions-of-god", title: "Names & descriptions of God", markdown: blocks(`**Address:** ${link("/study/names")}`, header, await contentsCards("names"),
    `## 01 Explore the names (the Faith page's three words)\n\nThree large words, ABBA FATHER · JESUS CHRIST · HOLY SPIRIT, each filled with its names; clicking a word unfolds its names, clicking a name opens its passages (KJV) with "Read in context" into this site's reader. Counts: ${explorer.map((group, g) => `${titles[data.groups[g].key]} ${group.length}`).join(" · ")}.`,
    sameShape && !differences.length ? "Checked: the explorer shows the same names, in the same groups and order, as the list below." : `Checked: the explorer and the list differ:\n\n${differences.map((d) => `- ${d}`).join("\n")}`,
    `*Interface wording (NamesOfGod.tsx):* ${(await wording("src/components/names/NamesOfGod.tsx")).join(" · ")}`,
    `## 02 Find a name: "Every name" (${total})\n\nSearch box "Find a name, e.g. Shepherd" (searches names and notes); view buttons "In three groups" (three coloured columns) and "A to Z" (one list, each name with its group badge). Each row shows its number of passages and opens its note and verses.`,
    ...groupTables,
    `## Credits (page foot)\n\n${credits}`) };
}

export const guidePages = () => Promise.all([miracles(), names()]);
