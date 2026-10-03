// Copied from the CypherPunk NFT site (src/data/faith-name-order.ts) so the Names of God look and order match
// its Faith page exactly. The two JSON files are byte-identical copies of that site's (snapshot 2026-10-03,
// checksums in sources/SOURCES.md).
import data from "./faith-names.json";
import approved from "./faith-names-approved.json";

const people = ["father", "son", "spirit"] as const;
const displayNames: Record<string, string> = approved.names;
// Retain every Scripture record; only approved groups appear on the page.
export const entries = data.entries.map((entry) => ({ ...entry, name: displayNames[entry.id] ?? entry.name }));
export type NameEntry = (typeof entries)[number];
const byId = new Map(entries.map((entry) => [entry.id, entry]));
export const nameGroups = people.map((person) =>
  approved.groups[person].map((id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error("Unknown approved Scripture entry: " + id);
    return entry;
  }),
);
