/**
 * The map's name search (?find=), shared by the map and the "Find … in the atlas" links so a link is only
 * offered when the map will show something for it. A place matches when its name contains the words, any case.
 */
export const placeMatchesFind = (name: string, query: string) => name.toLowerCase().includes(query.toLowerCase());

/** True when at least one atlas place answers the map's search for `query`. */
export const atlasHasPlace = (places: readonly { name: string }[], query: string) =>
  query.trim() !== "" && places.some((place) => placeMatchesFind(place.name, query));
