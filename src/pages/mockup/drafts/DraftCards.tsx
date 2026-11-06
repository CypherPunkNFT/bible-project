import { Resource } from "@/pages/study/StudyResourceCards";
import { DraftArtwork } from "@/pages/study/hub/DraftArt";
import { draftsForArea } from "./draft-studies";
import "./drafts.css";

const TONES = ["history", "prophets", "poetry", "epistles", "gospels", "acts"];

/** The written-but-unbuilt studies of one hub subject, as cards with the draft drawing. Nothing when it has none. */
export function DraftCards({ areaId, areaTitle }: { areaId: string; areaTitle: string }) {
  const drafts = draftsForArea(areaId);
  if (drafts.length === 0) return null;
  return <section className="draft-shelf" aria-labelledby={`draft-shelf-${areaId}`}>
    <header className="draft-shelf-head">
      <p className="eyebrow">Drafts · {drafts.length} written</p>
      <h3 id={`draft-shelf-${areaId}`}>Written. <em>Page to come.</em></h3>
      <p>These {areaTitle} studies are written and waiting for their pages. Open one to read its draft.</p>
    </header>
    <ul className="study-resource-grid theology-original-cards academic-original-cards draft-cards" aria-label={`${areaTitle} drafts`}>
      {drafts.map((draft, i) => <Resource key={draft.slug} to={`/study/drafts_mockup/${draft.slug}`} title={draft.title} description={draft.purpose}
        source={draft.mockupUrl ? "Design mock-up built" : "Design not started"} number="" category={`Draft · Study ${String(draft.number).padStart(2, "0")}`} color={TONES[i % TONES.length]}>
        <DraftArtwork />
      </Resource>)}
    </ul>
  </section>;
}
