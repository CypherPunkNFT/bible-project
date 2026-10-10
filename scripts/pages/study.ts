import {STUDY_BRANCHES} from "../../src/pages/study/hub/collections";
import {WRITERS} from "../../src/pages/study/hub/writers";
// The Study area's CONTENT.md files (run by scripts/export-pages.ts): the Study hub (/study) and its eight pages.
// Places & journeys (/study/atlas) belongs to the Atlas area. Each page's extractor lives in a study-*.ts file here.
import { STUDY_COLLECTIONS } from "../../src/data/study-collections";
import { chartPages } from "./study-charts";
import { gospelsPage } from "./study-gospels";
import { guidePages } from "./study-guides";
import { lettersPage } from "./study-letters";
import { blocks, link, table } from "./study-lib";
import { peoplePage } from "./study-people";
import { wording } from "./study-source";
import type { Extractor, PageContent } from "./types";

/** The Study parent and both subject landings, from their production records. */
async function hub(): Promise<PageContent> {
  const text = await wording("src/pages/study/hub/StudyHub.tsx", "StudyHub");
  return {dir:"Study",title:"Study",markdown:blocks(
    `**Address:** ${link("/study")} · Original collection retained at ${link("/study2")}`,
    "## Parent hub\n\n" + text.join(" · "),
    "## People\n\nWriters of Scripture / Scripture & Theology: " + WRITERS.map(w=>w.name).join(" · ") + ". Footer choices switch the illustration; the card opens the writers directory.\n\nScholars / Academic Studies: All fields · History · Languages · Archaeology · Reference · Theology. Field choices occupy two footer rows beside Explore Scholars. The constellation glow extends across the card rather than clipping at the illustration boundary.",
    "## Atlas\n\nExplore the map · Ancient cities · Follow Paul. Selected places and journey lenses lead into the full Atlas. Paul zooms to Antioch, then the route draws with a subtle departure and arrival pulse. Reduced motion shows the completed route.",
    ...Object.entries(STUDY_BRANCHES).map(([id,b])=>blocks(`## ${b.label}\n\n${link(`/study/${id}`)}\n\n${b.lead}`,
      ...b.areas.map(a=>blocks(`### ${a.title}\n\n${a.intro}`,table(["Kind","Title","Description","Address"],[a.featured,...a.items].map(e=>[e.kind,e.title,e.text,link(e.href)])),"Useful connections: "+a.support.map(([title,href])=>`${title}: ${link(href)}`).join(" · "))))),
    "## Preserved collection registry",table(["Study","Address","Lens","Colour"],STUDY_COLLECTIONS.map(c=>[c.label,link(c.path),c.lens,c.color]))
  )};
}

export const extract: Extractor = async () => {
  const [study, charts, gospels, guides, people, letters] = await Promise.all([hub(), chartPages(), gospelsPage(), guidePages(), peoplePage(), lettersPage()]);
  return [study, gospels, ...charts, people, ...guides, letters];
};
