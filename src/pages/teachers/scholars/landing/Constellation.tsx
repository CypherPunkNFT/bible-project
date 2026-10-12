import type { ScholarsData } from "@/data/teachers/pages-types";
import { LegacyConstellation } from "./LegacyConstellation";
import { IdeaLineage } from "./IdeaLineage";
interface SkyProps { data: ScholarsData; matches: ReadonlySet<string>; searching: boolean; onOpen: (id: string, origin: Element | null) => void }
export function Constellation(props: SkyProps) {
  const version = new URLSearchParams(window.location.search).get("scholars-view");
  return version === "timeline" || version === "spirals" ? <LegacyConstellation {...props}/> : <IdeaLineage/>;
}
