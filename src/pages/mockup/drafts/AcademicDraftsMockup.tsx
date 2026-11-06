import StudyBranch from "@/pages/study/hub/StudyBranch";
import { AcademicDraftCards } from "./AcademicDraftCards";

/** /study/academic_mockup: the real Academic page, with each subject's researched-but-unbuilt studies added under its
 *  cards as draft cards carrying the draft drawing, the way /study/theology_mockup shows the Scripture & Theology
 *  drafts. Each card opens its research file in a plain reader. The real /study/academic is unchanged. */
export default function AcademicDraftsMockup() {
  return <StudyBranch branch="academic" afterCards={area => <AcademicDraftCards areaId={area.id} areaTitle={area.title} />} />;
}
