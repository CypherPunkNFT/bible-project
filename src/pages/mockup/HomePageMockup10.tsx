// MOCK-UP of the homepage with the doorway drawings the owner picked from /doorways_mockup, opened at /home_mockup10 on this
// computer's preview only (see mockup-routes.tsx); never on the live site. Owner, 2026-10-31: "Bible: 2, Study 2 or 3,
// Apologetics 2, Atlas ... for now do 3, resources go 3 ... 1 is a close second, sources do 3 but 1 is a close second ...
// give me some mockups with the variations that I liked". It is the real HomePage, unchanged, with the squares handed those
// drawings; the four versions on the pill (?v=a to d) cover the open choices: Study 2 or 3, and Resources and Sources 3 or 1.
// The squares' drawings stand taller, in the room the lines under the titles used to take.
import { useSearchParams } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { APOLOGETICS_DOORWAYS } from "./doorways/DoorwayApologetics";
import { ATLAS_DOORWAYS } from "./doorways/DoorwayAtlas";
import { BIBLE_DOORWAYS } from "./doorways/DoorwayBible";
import { RESOURCES_DOORWAYS } from "./doorways/DoorwayResources";
import { SOURCES_DOORWAYS } from "./doorways/DoorwaySources";
import { STUDY_DOORWAYS } from "./doorways/DoorwayStudy";
import { DoorwayArt } from "./home-openings/HomeOpenings6Squares";
import { VersionPill } from "./legal/VersionPill";
import "./home-openings/home-mockup10.css";

const VERSIONS = [
  { id: "a", name: "First picks", study: 2, resources: 3, sources: 3 },
  { id: "b", name: "Study: annotated page", study: 3, resources: 3, sources: 3 },
  { id: "c", name: "Close seconds", study: 2, resources: 1, sources: 1 },
  { id: "d", name: "Annotated, seconds", study: 3, resources: 1, sources: 1 },
] as const;
type VersionId = (typeof VERSIONS)[number]["id"];

/** The sheet numbers its drawings from 1. */
const pick = (row: { Art: () => JSX.Element }[], number: number) => row[number - 1].Art;

export default function HomePageMockup10() {
  const [params] = useSearchParams();
  const version = VERSIONS.find((item) => item.id === params.get("v")) ?? VERSIONS[0];
  const art = {
    Bible: pick(BIBLE_DOORWAYS, 2),
    Study: pick(STUDY_DOORWAYS, version.study),
    Apologetics: pick(APOLOGETICS_DOORWAYS, 2),
    Atlas: pick(ATLAS_DOORWAYS, 3),
    Resources: pick(RESOURCES_DOORWAYS, version.resources),
    Sources: pick(SOURCES_DOORWAYS, version.sources),
  };
  return <div className="hm10">
    <DoorwayArt.Provider value={art}><HomePage /></DoorwayArt.Provider>
    <VersionPill<VersionId> label="Doorways" versions={VERSIONS.map(({ id, name }) => ({ id, name }))} current={version.id} />
  </div>;
}
