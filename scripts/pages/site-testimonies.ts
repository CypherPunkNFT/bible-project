// CONTENT for the Site page "Testimonies" (/testimonies, /testimonies/join, /testimonies/access): the page's own
// wording, the story themes and limits, and the founder placeholder. Published stories live in the production
// database; only their number is read, from the same public address the page itself calls (no credentials).
import { founderBranch, founderPin } from "../../src/data/testimony-founder";
import { MAX_TESTIMONY_BLURB, MAX_TESTIMONY_CHARACTERS, TESTIMONY_THEMES } from "../../src/lib/testimonies";
import { blocks, link, n } from "./study-lib";
import { wordingList } from "./site-source";
import type { PageContent } from "./types";

const PAGE = "src/pages/TestimoniesPage.tsx";
const API = "https://bibleproject.io/api/testimonies/";

/** How many stories the live site shows, from its public branch and map addresses; null if the site cannot be reached. */
async function published(): Promise<{ total: number; pins: number } | null> {
  try {
    const get = async <T>(address: string): Promise<T> => {
      const response = await fetch(API + address, { signal: AbortSignal.timeout(15_000), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`${address} answered ${response.status}`);
      return (await response.json()) as T;
    };
    const [branches, pins] = await Promise.all([get<{ total: number }>("branches?page=0"), get<unknown[]>("map")]);
    return { total: branches.total, pins: pins.length };
  } catch (error) {
    console.warn(`Site content: testimonies count not read (${(error as Error).message})`);
    return null;
  }
}

export async function testimoniesPage(): Promise<PageContent> {
  const live = await published();
  const founder = founderBranch.nodes[0];
  const parts: [string, string][] = [["src/components/TestimonyTree.tsx", "The tree"], ["src/components/TestimonyWorldMap.tsx", "The world map"], ["src/components/TestimonyReader.tsx", "Reading a full testimony"]];
  return { dir: "Site/testimonies", title: "Testimonies", markdown: blocks(
    `**Addresses:** ${link("/testimonies")} (the "Testimonies" item at the end of the site's main menu) · /testimonies/join (an invitation link; the code travels after #) · /testimonies/access (a private access link; the key travels after #). /testimonies/design redirects to /testimonies.`,
    "## The stories themselves",
    `Published testimonies are not part of the site's code or data files: people write them through invitations, and they are stored in the production database (Cloudflare D1) and fetched by the page as it opens. This file does not list them. ${live ? `On the live site, the public addresses the page uses report **${n(live.total)}** published ${live.total === 1 ? "story" : "stories"} and ${n(live.pins)} ${live.pins === 1 ? "place" : "places"} on the world map.` : "The live count could not be read on this run (the site did not answer)."}`,
    `While no story is published, the page shows the founder's placeholder: **${founder.name}**, "${founder.title}" — ${founder.blurb} His pin on the world map: ${founderPin.city}, ${founderPin.region}.`,
    "## What a story holds",
    `A name, a title, a short testimony of up to ${n(MAX_TESTIMONY_BLURB)} characters, an optional full testimony of up to ${n(MAX_TESTIMONY_CHARACTERS)} characters, when it happened (up to 80 characters), consent to be public, and an optional theme: ${TESTIMONY_THEMES.join(" · ")}.`,
    "Three ways to look at the stories: a tree (the lines show who invited whom), a world map, and a list, a page at a time. A story's place on the map is not typed: it is the approximate location of the writer's connection, rounded to about 10 km. Each invitation is for one person; when the guest publishes, their story joins the inviter's branch. Readers can report a concern on a story; the site owner sees the reports and can hide a story.",
    "## Every piece of wording on the page",
    "In source order, across explore, invite, write, manage and access views. \"…\" marks a name, date or number filled in as the page runs.",
    await wordingList(PAGE),
    ...(await Promise.all(parts.map(async ([file, title]) => blocks(`### ${title}`, await wordingList(file))))),
  ) };
}
