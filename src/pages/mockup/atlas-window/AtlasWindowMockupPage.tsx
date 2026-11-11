// /study/atlas_mockup/1 to /4: the real study page with one of the four condensed Atlas windows in place of today's.
import StudyHub from "@/pages/study/hub/StudyHub";
import { useParams } from "react-router-dom";
import { ATLAS_VERSIONS } from "./AtlasVersions.shared";

export default function AtlasWindowMockupPage() {
  const { version } = useParams();
  const index = Math.min(Math.max(Number(version) || 1, 1), ATLAS_VERSIONS.length) - 1;
  return <StudyHub key={index} Atlas={ATLAS_VERSIONS[index]} />;
}
