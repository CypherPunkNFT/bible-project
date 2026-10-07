import type { MapLayer } from "@/data/letters/types";
import type { PlaceRef } from "@/data/people-pages/types";

/** Places with an Atlas id as map layers: Scripture's places as pins, places known only from tradition dashed. */
export function placeLayers(places: PlaceRef[], title: string): MapLayer[] {
  const pins = (list: PlaceRef[]) => list.filter((p) => p.placeId).map((p) => ({ name: p.name, placeId: p.placeId!, refs: p.refs, note: p.note }));
  const scripture = pins(places.filter((p) => !p.tradition)), tradition = pins(places.filter((p) => p.tradition));
  return [
    ...(scripture.length ? [{ id: "scripture", title, stops: scripture, claim: { text: "" } }] : []),
    ...(tradition.length ? [{ id: "tradition", title: "Known from tradition", stops: tradition, dashed: true, claim: { text: "Dashed pins are places known only from later tradition, not from Scripture." } }] : []),
  ];
}
