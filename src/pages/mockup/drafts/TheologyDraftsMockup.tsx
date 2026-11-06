import StudyBranch from "@/pages/study/hub/StudyBranch";
import { DraftCards } from "./DraftCards";

/** /study/theology_mockup: the real Scripture & Theology page, with each subject's written-but-unbuilt studies added
 *  under its cards as draft cards carrying the draft drawing (owner, 2026-11-05). Draft 37 is left out: it rewrites
 *  the live Long Memory page. The Academic drafts have their own copy, /study/academic_mockup (AcademicDraftsMockup). */
export default function TheologyDraftsMockup() {
  return <StudyBranch branch="theology" afterCards={area => <DraftCards areaId={area.id} areaTitle={area.title} />} />;
}
