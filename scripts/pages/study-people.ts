// CONTENT for People & genealogies (/study/people with its five views, /people/:id with /rule and /mission, /study/prophets).
import { FAMILY_STARTS, GOSPEL_NOTES } from "../../src/lib/genealogy-catalog";
import { PEOPLE_PERIODS } from "../../src/lib/people-periods";
import { assignRoles, PERSON_ROLES } from "../../src/lib/people-roles";
import type { PersonRow, Prophet } from "../../src/lib/study";
import type { PeoplePagesIndex, RulerSummary } from "../../src/lib/people-pages-index";
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

const VERDICT_WORDS: Record<RulerSummary["verdictTone"], string> = { right: "✓ did right", evil: "✕ did evil", mixed: "◐ mixed", none: "no verdict formula" };
const years = (r: RulerSummary) => (r.dates ? (r.dates.from > 0 && r.dates.to > 0 ? `${r.dates.approx ? "c. " : ""}${r.dates.from}–${r.dates.to} BC` : `${r.dates.from}–${r.dates.to}`) : "no years BC");

/** Rulers through time (?view=rulers, /study/rulers) and the ruler pages it opens (/people/<id>/rule). */
async function rulers(index: PeoplePagesIndex): Promise<string> {
  const realms = [...new Set(index.rulers.map((r) => r.realm))];
  return blocks(`Heading: **Thrones through time.** One ribbon across the shared era bands (the prophets' eras, src/lib/eras.ts): a lane per throne (leaders and judges, the united kingdom, Israel, Judah), each reign a bar as long as its years in the main dating system; the judges, whom Scripture gives no years BC, in the order of the book with dotted edges. The symbol at a bar's end is Scripture's verdict (✓ ✕ ◐). "Show the prophets" adds a lane of prophet medallions beside the king they served. A preview panel follows the pointer or keyboard (step through all ${index.rulers.length} in order; "Open the reign"). Below: filter chips and every ruler as a card, era by era. On a phone the ribbon runs down the page, Israel left and Judah right.`,
    ...realms.map((realm) => blocks(`#### ${realm}`, table(["#", "Ruler", "Title", "Reign (Scripture)", "Years (main system)", "Verdict", "Prophets"],
      index.rulers.filter((r) => r.realm === realm).sort((a, b) => a.order - b.order).map((r) => [r.order, r.name, r.title, r.reignText, years(r), VERDICT_WORDS[r.verdictTone], r.prophets.join(", ")])))),
    `Each ruler page (${link("/people/asa-1ki-15-8/rule")}): back link and crumbs (People / name / The reign), the switch "The person | The reign" (judges: "As judge"), a hero (title and era, the name with its one line, five figures: reigned with an ⓘ dating note, capital or tribe, house and place in the line, verdict, prophets) and the whole line of that throne lit at this reign; then section chips and, in order: the judges' cycle (judges), the anointing (Saul, David, Solomon), the succession strip (both kingdoms at once with Scripture's cross-dating lines; the judges in the book's order), the verdict word for word with "but also" and Chronicles, and the verdict row of the whole line; the kingdom card (the words above, the Atlas map below); the events by year of the reign with undated ones in a tray; what the nation did (Worship · Building · Alliances & tribute · The people); prophets of the reign; the powers of the day and records outside the Bible (sand edge); Kings and Chronicles side by side; dates differ (every dating system and the open questions); every passage; sources.`,
    `*Interface wording (RulersGuide.tsx):* ${(await wording("src/components/people-pages/RulersGuide.tsx")).join(" · ")}`);
}

/** The apostles (?view=apostles, /study/apostles) and the apostle pages it opens (/people/<id>/mission). */
async function apostles(index: PeoplePagesIndex): Promise<string> {
  return blocks(`Heading: **The Twelve, and one untimely born.** The Twelve as a ring around a cross (Judas Iscariot dashed, Matthias in his place, Paul outside on a dashed arc); choosing a medallion rolls down a preview in place (called, home and trade, how the story ends in Scripture, what later tradition says, "Open his mission"). "The lists compared" redraws the ring as the four lists of the Twelve with a ribbon for each man; "The wider circle" adds Barnabas, James the Lord's brother, Silas, Timothy, Apollos, Priscilla, Aquila, Andronicus and Junia. On a phone the ring is a grid of medallions with Paul as a wide card. Below: every apostle as a card.`,
    table(["#", "Apostle", "Title", "Line", "Called", "Scripture on the end", "Tradition"], [...index.apostles].sort((a, b) => a.order - b.order).map((a) => [a.order, a.name, a.title, a.tagline, a.called ?? "", a.ending ?? "", a.tradition ?? ""])),
    `Each apostle page (${link("/people/peter-mat-4-18/mission")}): back link and crumbs, the switch "The person | The mission", a hero (also called, from, trade, family, his writings) with arrows to the previous and next apostle; then home, trade and family with their verses; the calling (one chip per account, the passage quoted, its harmony event); his moments with Jesus as a strip per Gospel in the harmony's order (for those Scripture barely names: the four lists of the Twelve instead); where he went (map, tradition dashed, places with no pin named) and Acts; companions (network); how the story ends (Scripture solid, tradition dashed with who and when); his writings (links only); open questions; every passage; sources.`,
    `*Interface wording (ApostlesGuide.tsx):* ${(await wording("src/components/people-pages/ApostlesGuide.tsx")).join(" · ")}`);
}

export async function peoplePage(): Promise<PageContent> {
  const [people, prophetList, pages] = await Promise.all([readJson<PersonRow[]>("data/study/people.json"), readJson<Prophet[]>("data/study/prophets.json"), readJson<PeoplePagesIndex>("src/data/people-pages/index.json")]);
  const { header } = await headerAndCredits(PEOPLE, "PeoplePage");
  const profile = await wording("src/components/study/PersonProfile.tsx");
  const personCredits = first(await jsxRoots("src/pages/PersonPage.tsx", "PersonPage"), byTag("StudyCredits")).text;
  const groups = people.filter((person) => person.g).length;
  return { dir: "Study/people-and-genealogies", title: "People & genealogies", markdown: blocks(
    `**Addresses:** ${link("/study/people")} (Everyone, the default) · ${link("/study/people?view=families")} · ${link("/study/people?view=prophets")} · ${link("/study/prophets")} (the prophets on their own page) · ${link("/study/people?view=rulers")} (also ${link("/study/rulers")}) · ${link("/study/people?view=apostles")} (also ${link("/study/apostles")}) · /people/<id>/rule and /people/<id>/mission (a ruler's or an apostle's second page) · /people/<id> (one page per person, e.g. ${link("/people/david-rut-4-17")}); old /study/people/<id> addresses forward to it.`,
    header, await contentsCards("people", "On this page the cards switch the view below in place (the address gains ?view=families, ?view=prophets, ?view=rulers or ?view=apostles) instead of opening another page; the chosen card is outlined."),
    "## Everyone in the Bible (default view)", await everyone(people),
    "## People & families (the family trees)", await families(),
    "## Prophets through time", await prophets(prophetList),
    "## Rulers through time", await rulers(pages),
    "## The apostles", await apostles(pages),
    `## One page per person (/people/<id>)\n\n${n(people.length)} person pages (data/study/people/<id>.json), including the ${groups} tribes and peoples left out of the catalogue. Each shows: a back link naming where the visitor came from, the name, "Also called …", sex · period · tribe, "one of N people named …", the one-line description, "Their story" (STEP's short summary, with the full article on request), "Family" (parents, brothers and sisters, spouses, children, each a link), a bar chart "Genesis to Revelation. Point at a bar." of where they are named, and "Every verse that names <name>". A ruler's or an apostle's page also has, under the name, the switch "The person | The reign" (or "The mission") and, beside it (above "Their story" on a phone), a card that opens that page. Under the description: "Description adapted by STEP Bible from AI output (Claude 3 Opus, 2024)", with "corrected by this site" where the site corrected the record ("Record added by this site" for records the site wrote), and the site's own note where there is one. A record that duplicates another person opens that person's page.`,
    `*Interface wording (PersonProfile.tsx):* ${profile.join(" · ")}`, `Credits on each person page: ${personCredits}`) };
}
