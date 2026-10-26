// Draft drawings for homepage blocks (Academic Studies and the Resources blocks), side by side, so the owner can choose one per block.
// Not linked from the site; reached only at /mockups. Each drawing runs live and opens up on hover like the homepage.
import type { CSSProperties } from "react";
import { MOCKUPS as OVERVIEW } from "@/components/home/mockups/OverviewMockups";
import { MOCKUPS as OVERVIEW_MORE } from "@/components/home/mockups/OverviewMockupsMore";
import { MOCKUPS as LEARNING } from "@/components/home/mockups/LearningMockups";
import { MOCKUPS as LIFE } from "@/components/home/mockups/LifeMockups";
import { MOCKUPS as ACADEMIC } from "@/components/home/mockups/AcademicMockups";
import type { Mockup } from "@/components/home/mockups/types";
import "@/components/home/home-features.css";
import "@/components/home/home-study.css";
import "@/components/home/home-resources.css";
import "./home-mockups.css";

const GROUPS: Array<{ title: string; line: string; tone: string; items: Mockup[] }> = [
  { title: "Academic Studies: enter the world, weigh the evidence", line: "Surviving witnesses, manuscripts, and a passage carried through them", tone: "history", items: ACADEMIC },
  { title: "Resources: the top drawing", line: "Learning, fellowship and help for life, in one picture", tone: "resource-life", items: OVERVIEW },
  { title: "Resources: new directions", line: "The same detail, new ideas", tone: "resource-life", items: OVERVIEW_MORE },
  { title: "Learning materials: Study it together", line: "Workbooks, lessons and activity pages for every reader", tone: "epistles", items: LEARNING },
  { title: "Help for life: the hardest moments", line: "Help right now, and close to home", tone: "resource-life", items: LIFE },
];

export default function HomeMockupsPage() {
  return <main className="hm-page">
    <h1>Homepage drawings: <em>mock-ups</em></h1>
    <p className="hm-lead">Each block has a few proposals. Hover a drawing to see how it opens up. Tell me the name of the one you want.</p>
    {GROUPS.map((group) => <section key={group.title} className="hm-group" style={{ "--home-color": `var(--${group.tone})` } as CSSProperties}>
      <h2>{group.title}</h2><p className="hm-line">{group.line}</p>
      <div className="hm-grid">{group.items.map(({ name, note, Scene }) => <figure key={name} className="hm-card">
        <div className="hf-art" data-live><Scene /></div>
        <figcaption><strong>{name}</strong><span>{note}</span></figcaption>
      </figure>)}</div>
    </section>)}
  </main>;
}
