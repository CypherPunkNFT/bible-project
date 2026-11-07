// Where "Back to …" goes from a study the visitor reached without a way back in hand (from the homepage, search or a
// shared link): the area of Scripture & Theology or Academic Studies that lists the study, never the Study page
// (owner, 2026-11-06). Read from the study catalogue itself, so a study added to an area is covered with no extra step.
import type { CameFrom } from "@/lib/came-from";
import { RESOURCE_PATHS } from "../resource-paths";
import { STUDY_BRANCHES, type BranchId } from "./collections";

const pathOf = (href: string) => href.split(/[?#]/)[0].replace(/\/$/, "");

/** Every study address in the catalogue, with the section area that lists it; the first area to list it wins. */
const HOMES: { path: string; home: CameFrom }[] = [];
for (const [id, branch] of Object.entries(STUDY_BRANCHES) as [BranchId, (typeof STUDY_BRANCHES)[BranchId]][]) {
  for (const area of branch.areas) {
    const home = { path: `/study/${id}?area=${area.id}`, label: branch.label };
    const hrefs = [area.featured.href, ...area.items.map(item => item.href), ...(area.cards ?? []).map(card => RESOURCE_PATHS[card])];
    for (const href of hrefs) {
      const path = pathOf(href);
      if (path.startsWith("/study/") && !HOMES.some(h => h.path === path)) HOMES.push({ path, home });
    }
  }
}
HOMES.sort((a, b) => b.path.length - a.path.length);

/** The area that lists the study at `pathname` (or the study it belongs to), if any. */
export function homeAreaOf(pathname: string): CameFrom | undefined {
  const path = pathOf(pathname);
  return HOMES.find(h => path === h.path || path.startsWith(h.path + "/"))?.home;
}
