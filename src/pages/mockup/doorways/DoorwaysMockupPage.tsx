// MOCK-UP: the design sheet for the six doorway squares beside the homepage's city, opened at /doorways_mockup on this
// computer's preview only (owner, 2026-10-31: "a mock-up page with a row for each of these, and a column for variations. Do
// 5 variations"). Every card is title only, with the room the line under the title used to take given to a taller drawing.
// The drawings live one row to a file beside this one.
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { APOLOGETICS_DOORWAYS } from "./DoorwayApologetics";
import { ATLAS_DOORWAYS } from "./DoorwayAtlas";
import { BIBLE_DOORWAYS } from "./DoorwayBible";
import { RESOURCES_DOORWAYS } from "./DoorwayResources";
import { SOURCES_DOORWAYS } from "./DoorwaySources";
import { STUDY_DOORWAYS } from "./DoorwayStudy";
import type { DoorwayVariant } from "./doorway-types";
import "./doorways-mockup.css";

interface Row { title: string; color: string; note: string; variants: DoorwayVariant[] }
const ROWS: Row[] = [
  { title: "Bible", color: "epistles", note: "Longer, more like a book, less like a children’s book.", variants: BIBLE_DOORWAYS },
  { title: "Study", color: "gospels", note: "Undecided: the present drawing refitted, and four new ideas.", variants: STUDY_DOORWAYS },
  { title: "Apologetics", color: "history", note: "Alright as it is: the present drawing enlarged, and four close relatives.", variants: APOLOGETICS_DOORWAYS },
  { title: "Atlas", color: "poetry", note: "Liked: the present map enlarged, taller too, and four close relatives.", variants: ATLAS_DOORWAYS },
  { title: "Resources", color: "resource-life", note: "To change: five new drawings.", variants: RESOURCES_DOORWAYS },
  { title: "Sources", color: "prophets", note: "Liked: the present shelf enlarged, and four close relatives.", variants: SOURCES_DOORWAYS },
];

export default function DoorwaysMockupPage() {
  return <main className="dw-sheet">
    <h1>Doorway squares</h1>
    <p>Title only, no line under it; the room it took goes to the drawing. One row for each square, five drawings across.</p>
    {ROWS.map((row) => <section key={row.title} style={{ "--home-color": `var(--${row.color})` } as CSSProperties} aria-label={row.title}>
      <header><h2>{row.title}</h2><p>{row.note}</p></header>
      <div className="dw-row">{row.variants.map(({ name, Art }, index) => <figure key={name}>
        <a className="dw-card" href="#" onClick={(event) => event.preventDefault()}>
          <div className="dw-art"><Art /></div>
          <div className="dw-copy"><strong>{row.title}</strong><ArrowUpRight size={16} aria-hidden /></div>
        </a>
        <figcaption><span>{index + 1}</span>{name}</figcaption>
      </figure>)}</div>
    </section>)}
  </main>;
}
