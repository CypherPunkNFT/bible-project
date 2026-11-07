// The Atlas window's own colour, beside Scripture's gold and Academic's orange (owner, 2026-11-06).
// /study/atlas_colors_mockup/1 and /3: the study page exactly as it would ship, one Atlas window in the colour chosen
//   for that version: version 1 indigo, version 3 the homepage Atlas drawing's colour (the site's Poetry colour).
// /study/atlas_colors_compare/1 and /3: the comparison the choice was made from, seven labelled copies per version
//   (twelve colours across the two, each page ending in the standard gold).
import { useParams } from "react-router-dom";
import StudyHub from "@/pages/study/hub/StudyHub";
import { AtlasV1, AtlasV3 } from "./AtlasVersions";

const CHOSEN = { v1: "#9399f2", v3: "var(--poetry)" };

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
  ["Indigo", "new", CHOSEN.v1],
  ["Olive", "new", "#c2c060"],
  ["Mint", "new", "#86dbb0"],
  ["Silver", "new", "#b9c3cd"],
  ["Gold", "the standard yellow the button had before", "var(--accent)"],
];

function ToneAtlases({ Version, tones }: { Version: typeof AtlasV3; tones: ToneRow[] }) {
  return <>{tones.map(([name, source, value], i) => <div key={name} style={{ ["--tone" as string]: value }}>
    <p className="am-tone-label"><i /><strong>{`${i + 1} · ${name}`}</strong><span>{source}</span></p>
    <Version tone={value} copy />
  </div>)}</>;
}

const useVersion = () => useParams().version === "1";

export function AtlasColorsComparePage() {
  const isV1 = useVersion();
  const Version = isV1 ? AtlasV1 : AtlasV3, tones = isV1 ? TONES_V1 : TONES_V3;
  return <StudyHub key={Version.name} Atlas={() => <ToneAtlases Version={Version} tones={tones} />} />;
}

export default function AtlasColorsMockupPage() {
  const isV1 = useVersion();
  const Version = isV1 ? AtlasV1 : AtlasV3, tone = isV1 ? CHOSEN.v1 : CHOSEN.v3;
  return <StudyHub key={Version.name} Atlas={() => <Version tone={tone} />} />;
}
