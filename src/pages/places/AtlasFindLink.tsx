import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { loadPlaces } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { atlasHasPlace } from "./atlas-find";
import { ATLAS_BASE as BASE } from "./routes";

/**
 * "Find <place> in the atlas", opening the map searched for that name. Shown only once the places data confirms
 * the map has a place by that name: the map holds Bible places only, so a history place such as Constantinople
 * would open an empty search (found 2026-10-07).
 */
export function AtlasFindLink({ place }: { place: string }) {
  const places = useAsync(loadPlaces, "places");
  if (places.status !== "ready" || !atlasHasPlace(places.value, place)) return null;
  return <Link to={`${BASE}/map?find=${encodeURIComponent(place)}`}>Find {place} in the atlas<ArrowRight size={16} aria-hidden /></Link>;
}
