// CONTENT for People & genealogies (/study/people with its three views, /people/:id, /study/prophets).
import { FAMILY_STARTS, GOSPEL_NOTES } from "../../src/lib/genealogy-catalog";
import { PEOPLE_PERIODS } from "../../src/lib/people-periods";
import { assignRoles, PERSON_ROLES } from "../../src/lib/people-roles";
import type { PersonRow, Prophet } from "../../src/lib/study";
import { contentsCards } from "./study-charts";
import { headerAndCredits } from "./study-guides";
import { blocks, link, loadCatalog, n, readJson, ref, table } from "./study-lib";
import { byTag, findAll, first, jsxRoots, wording } from "./study-source";
import type { PageContent } from "./types";

const PEOPLE = "src/pages/study/PeoplePage.tsx";
const PROPHETS = "src/pages/study/ProphetsPage.tsx";

/** Every card in the catalogue, period by period and in the catalogue's own order: name · who they were · its one line · verses. */
function everyCard(periods: { id: string; label: string; people: PersonRow[] }[], roles: ReturnType<typeof assignRoles>): string {
  const label = (id: string) => PERSON_ROLES.find((role) => role.id === roles.get(id))?.label ?? "";
  return blocks("### Everyone, period by period (every card in the catalogue, in its order)\n\nEach line: name · who they were (the dot) · the card's one-line description · verses naming them.",
    ...periods.map((period) => blocks(`#### ${String(PEOPLE_PERIODS.findIndex((p) => p.id === period.id) + 1).padStart(2, "0")} ${period.label} (${n(period.people.length)} people)`,
      period.people.map((person) => `- ${person.n} · ${label(person.id)} · ${person.b.replace(/\s+/g, " ").trim()} · ${n(person.c)}`).join("\n"))));
}

async function everyone(all: PersonRow[]): Promise<string> {
  const people = all.filter((person) => !person.g);
  const roles = assignRoles(people);
  const top = [...all].sort((a, b) => b.c - a.c).slice(0, 20);
  const caption = first(await jsxRoots(PEOPLE, "MostNamed"), byTag("figcaption")).text;
  const credits = first(await jsxRoots(PEOPLE, "Everyone"), byTag("StudyCredits")).text;
  const roleCount = (list: PersonRow[]) => PERSON_ROLES.map((role) => [role.label, list.filter((person) => roles.get(person.id) === role.id).length] as const).filter(([, count]) => count);
  const periods = PEOPLE_PERIODS.map((period) => ({ ...period, people: people.filter((person) => person.p === period.id).sort((a, b) => b.c - a.c || a.n.localeCompare(b.n)) })).filter((period) => period.people.length);
  const groups = all.filter((person) => person.g).map((person) => person.n).sort((a, b) => a.localeCompare(b));
  return blocks(`### "${caption}" (bar chart; each name opens the person's page)`,
    table(["#", "Person", "Verses naming them", "Period"], top.map((person, i) => [i + 1, person.n, n(person.c), PEOPLE_PERIODS.find((p) => p.id === person.p)?.label ?? person.p])),
    `### Everyone in the Bible (the catalogue)\n\nSubtext: "We've catalogued ${n(people.length)} people in order of biblical history." Search box "Name, another name, or what they did". Period buttons (${periods.length}, click again for everyone) and a dot legend of who they were (click to show one kind). Cards in their own scrolling frame, under numbered period headings; each card shows the name, a one-line description, its coloured dot and kind, and the number of verses, and opens the person's page.`,
    `Who they were (read from each one-line description; legend with counts): ${roleCount(people).map(([label, count]) => `${label} ${n(count)}`).join(" · ")}. ${PERSON_ROLES.map((role) => `${role.label}: ${role.note}`).join("; ")}.`,
    table(["#", "Period", "Note", "People", "Who they were", "Most named (verses)"], periods.map((period) => [String(PEOPLE_PERIODS.indexOf(PEOPLE_PERIODS.find((p) => p.id === period.id)!) + 1).padStart(2, "0"), period.label, period.note, n(period.people.length),
      roleCount(period.people).map(([label, count]) => `${label} ${count}`).join(", "), period.people.slice(0, 12).map((person) => `${person.n} (${n(person.c)})`).join(", ")])),
    everyCard(periods, roles),
    `Left out of the catalogue because they are tribes, clans or peoples, not people (content/people/catalogue-corrections.json; they keep their own pages for family links): ${groups.length}: ${groups.join(", ")}.`,
    `Credits under the catalogue: ${credits}`,
    `*Interface wording (PeopleCatalog.tsx):* ${(await wording("src/components/study/PeopleCatalog.tsx")).join(" · ")}`);
}

async function families(): Promise<string> {
  const roots = await jsxRoots("src/components/study/GenealogyExplorer.tsx", "GenealogyTree");
  const heading = first(roots, (node) => node.tag === "header" && (node.attrs.className ?? "").includes("genealogy-heading"));
  return blocks(`Heading: ${findAll([heading], byTag("p")).map((p) => p.text).join(" / ")} · **${first([heading], byTag("h2")).text}**`,
    `"Begin with": ${FAMILY_STARTS.slice(0, 6).map(([name]) => name).join(" · ")} as buttons, and a "24 families" list: ${FAMILY_STARTS.map(([name]) => name).join(", ")}. For Jesus, a choice of Gospel genealogy (Matthew 1 or Luke 3) with a "KJV source" link; "Full branch" shows every recorded generation.`,
    `Notes shown for Jesus' line:\n\n- Matthew: ${GOSPEL_NOTES.matthew}\n- Luke: ${GOSPEL_NOTES.luke}`,
    "The tree: search, a Generations number, direction and zoom controls (Expand opens the full-screen circle or tree view), generation bands, an era legend for the circle outlines, matching C markers for cross-family connections, and a \"Selected life\" panel (era, description, first recorded reference, \"Explore their family\", \"Read their story\").",
    `*Interface wording (GenealogyExplorer.tsx):* ${(await wording("src/components/study/GenealogyExplorer.tsx")).join(" · ")}`);
}

async function prophets(list: Prophet[]): Promise<string> {
  const catalog = await loadCatalog();
  const { header, credits, roots } = await headerAndCredits(PROPHETS, "ProphetsContent");
  const embedded = findAll(roots, (node) => node.tag === "div" && node.attrs.className === "mb-6")[0];
  const kinds: Record<Prophet["kind"], string> = { writing: "Writing prophets", prophet: "Other prophets", nt: "New Testament", false: "False prophets" };
  const eras = [...new Set(list.map((p) => p.era))];
  const role = (p: Prophet) => (p.kind === "false" ? (p.sex === "Female" ? "False prophetess" : "False prophet") : p.sex === "Female" ? "Prophetess" : "Prophet");
  const when = (p: Prophet) => (!p.king ? "Not dated by any king in Scripture" : `${["Moses", "the judges", "the exile"].includes(p.king) ? "In the time of" : "In the days of"} ${p.king}${p.anchor ? ` (${ref(catalog, p.anchor)})` : ""}`);
  return blocks(`In the People page this view's heading is: ${embedded?.text ?? "…"}. On its own address (${link("/study/prophets")}) the page has this heading instead:\n\n${header.replace("## Heading\n\n", "")}`,
    `A timeline of era bands (one dot per prophet, coloured by kind), then buttons: All · ${Object.entries(kinds).map(([id, label]) => `${label} ${list.filter((p) => p.kind === id).length}`).join(" · ")}. Each card: its kind ("· wrote a book" for the sixteen), the name (opens the person's page), a one-line description, when, and "Read <book>" for writing prophets.`,
    ...eras.map((era) => blocks(`#### ${era === "Judges" ? "The Judges" : era}`, table(["Prophet", "Kind", "Description", "When"], list.filter((p) => p.era === era).map((p) => [p.name, `${role(p)} · ${kinds[p.kind]}${p.book ? " · wrote a book" : ""}`, p.brief, when(p)])))),
    `Credits: ${credits}`,
    `*Interface wording (ProphetsPage.tsx):* ${(await wording(PROPHETS, "ProphetsContent")).join(" · ")}`,
    `*The prophets view, the river (ProphetsRiver.tsx):* ${(await wording("src/components/study/ProphetsRiver.tsx")).join(" · ")}`);
}

export async function peoplePage(): Promise<PageContent> {
  const [people, prophetList] = await Promise.all([readJson<PersonRow[]>("data/study/people.json"), readJson<Prophet[]>("data/study/prophets.json")]);
  const { header } = await headerAndCredits(PEOPLE, "PeoplePage");
  const profile = await wording("src/components/study/PersonProfile.tsx");
  const personCredits = first(await jsxRoots("src/pages/PersonPage.tsx", "PersonPage"), byTag("StudyCredits")).text;
  const groups = people.filter((person) => person.g).length;
  return { dir: "Study/people-and-genealogies", title: "People & genealogies", markdown: blocks(
    `**Addresses:** ${link("/study/people")} (Everyone, the default) · ${link("/study/people?view=families")} · ${link("/study/people?view=prophets")} · ${link("/study/prophets")} (the prophets on their own page) · /people/<id> (one page per person, e.g. ${link("/people/david-rut-4-17")}); old /study/people/<id> addresses forward to it.`,
    header, await contentsCards("people", "On this page the cards switch the view below in place (the address gains ?view=families or ?view=prophets) instead of opening another page; the chosen card is outlined."),
    "## Everyone in the Bible (default view)", await everyone(people),
    "## People & families (the family trees)", await families(),
    "## Prophets through time", await prophets(prophetList),
    `## One page per person (/people/<id>)\n\n${n(people.length)} person pages (data/study/people/<id>.json), including the ${groups} tribes and peoples left out of the catalogue. Each shows: a back link naming where the visitor came from, the name, "Also called …", sex · period · tribe, "one of N people named …", the one-line description, "Their story" (STEP's short summary, with the full article on request), "Family" (parents, brothers and sisters, spouses, children, each a link), a bar chart "Genesis to Revelation. Point at a bar." of where they are named, and "Every verse that names <name>".`,
    `*Interface wording (PersonProfile.tsx):* ${profile.join(" · ")}`, `Credits on each person page: ${personCredits}`) };
}
