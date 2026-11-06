import { Resource } from "@/pages/study/StudyResourceCards";
import { DraftArtwork } from "@/pages/study/hub/DraftArt";
import { academicDraftsForArea } from "./academic-drafts";
import "./drafts.css";

const TONES = ["history", "prophets", "poetry", "epistles", "gospels", "acts"];

/** The written-but-unbuilt Academic studies of one hub subject, as cards with the draft drawing. Nothing when it has none. */
export function AcademicDraftCards({ areaId, areaTitle }: { areaId: string; areaTitle: string }) {
  const drafts = academicDraftsForArea(areaId);
  if (drafts.length === 0) return null;
  return <section className="draft-shelf" aria-labelledby={`draft-shelf-${areaId}`}>
    <header className="draft-shelf-head">
      <p className="eyebrow">Drafts · {drafts.length} written</p>
      <h3 id={`draft-shelf-${areaId}`}>Researched. <em>Page to come.</em></h3>
      <p>These {areaTitle} studies have their research written and are waiting for their pages. Open one to read its research.</p>
    </header>
    <ul className="study-resource-grid theology-original-cards academic-original-cards draft-cards" aria-label={`${areaTitle} drafts`}>
      {drafts.map((draft, i) => <Resource key={draft.slug} to={`/study/academic_drafts_mockup/${draft.slug}`} title={draft.title} description={draft.premise ?? draft.note ?? "A research draft: its sources, claims and limits, with a design note for the page."}
        source="Research written · design note written" number="" category={`Draft · Academic ${String(draft.order).padStart(2, "0")}`} color={TONES[i % TONES.length]}>
        <DraftArtwork />
      </Resource>)}
    </ul>
  </section>;
}
