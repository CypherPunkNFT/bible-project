// /study/atlas_colors_mockup/3 (and /1): the real study page with six copies of the Atlas window under the two doors,
// each outlined in a different colour, to choose the map's own colour beside Scripture's gold and Academic's orange
// (owner, 2026-11-06). The first four are the site's own section colours; sage and stone are new.
import { useParams } from "react-router-dom";
import StudyHub from "@/pages/study/hub/StudyHub";
import { AtlasV1, AtlasV3 } from "./AtlasVersions";

const TONES: [name: string, source: string, value: string][] = [
  ["Teal", "the Poetry colour", "var(--poetry)"],
  ["Blue", "the Prophets colour", "var(--prophets)"],
  ["Purple", "the Gospels colour", "var(--gospels)"],
  ["Magenta", "the Acts colour", "var(--acts)"],
  ["Sage", "new", "#9cc47a"],
  ["Stone", "new", "#cbbfa6"],
];

function SixAtlases({ Version }: { Version: typeof AtlasV3 }) {
  return <>{TONES.map(([name, source, value], i) => <div key={name} style={{ ["--tone" as string]: value }}>
    <p className="am-tone-label"><i /><strong>{`${i + 1} · ${name}`}</strong><span>{source}</span></p>
    <Version tone={value} />
  </div>)}</>;
}

export default function AtlasColorsMockupPage() {
  const Version = useParams().version === "1" ? AtlasV1 : AtlasV3;
  return <StudyHub key={Version.name} Atlas={() => <SixAtlases Version={Version} />} />;
}
