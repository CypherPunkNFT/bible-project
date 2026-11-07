// /study/atlas_colors_mockup/3 (and /1): the real study page with six copies of the Atlas window under the two doors,
// each outlined in a different colour, to choose the map's own colour beside Scripture's gold and Academic's orange
// (owner, 2026-11-06). Version 3 shows six colours and version 1 six others, each followed by the standard gold for comparison, so the two pages together show twelve:
// version 3 has the site's four free section colours plus sage and stone; version 1 has six new ones.
import { useParams } from "react-router-dom";
import StudyHub from "@/pages/study/hub/StudyHub";
import { AtlasV1, AtlasV3 } from "./AtlasVersions";

type ToneRow = [name: string, source: string, value: string];
const TONES_V3: ToneRow[] = [
  ["Teal", "the Poetry colour", "var(--poetry)"],
  ["Blue", "the Prophets colour", "var(--prophets)"],
  ["Purple", "the Gospels colour", "var(--gospels)"],
  ["Magenta", "the Acts colour", "var(--acts)"],
  ["Sage", "new", "#9cc47a"],
  ["Stone", "new", "#cbbfa6"],
  ["Gold", "the standard yellow the button had before", "var(--accent)"],
];
const TONES_V1: ToneRow[] = [
  ["Rose", "new", "#e8848c"],
  ["Sky", "new", "#72c5ec"],
  ["Indigo", "new", "#9399f2"],
  ["Olive", "new", "#c2c060"],
  ["Mint", "new", "#86dbb0"],
  ["Silver", "new", "#b9c3cd"],
  ["Gold", "the standard yellow the button had before", "var(--accent)"],
];

function ToneAtlases({ Version, tones }: { Version: typeof AtlasV3; tones: ToneRow[] }) {
  return <>{tones.map(([name, source, value], i) => <div key={name} style={{ ["--tone" as string]: value }}>
    <p className="am-tone-label"><i /><strong>{`${i + 1} · ${name}`}</strong><span>{source}</span></p>
    <Version tone={value} />
  </div>)}</>;
}

export default function AtlasColorsMockupPage() {
  const isV1 = useParams().version === "1";
  const Version = isV1 ? AtlasV1 : AtlasV3, tones = isV1 ? TONES_V1 : TONES_V3;
  return <StudyHub key={Version.name} Atlas={() => <ToneAtlases Version={Version} tones={tones} />} />;
}
