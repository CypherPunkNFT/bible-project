export const ATLAS_BASE = "/study/atlas";

export const atlasDestination = (id: string) => `${ATLAS_BASE}/${id === "atlas" ? "map" : id}`;
