// Shared look-ups for the Authors mock-ups, so all four colour and group people the same way.
// Each person belongs to one family, taken from their traditions in the library's author registry, coloured with the
// site's own section colours.
window.FAMILIES = [
  { key: "puritan", label: "Puritans", tone: "--history" },
  { key: "baptist", label: "Baptists", tone: "--poetry" },
  { key: "anglican", label: "Anglicans", tone: "--acts" },
  { key: "continental-reformed", label: "Dutch & Swiss Reformed", tone: "--gospels" },
  { key: "presbyterian", label: "Presbyterians", tone: "--prophets" },
  { key: "calvinist-evangelical", label: "Evangelicals", tone: "--epistles" },
  { key: "reformed", label: "Reformed", tone: "--revelation" },
];
const FAMILY_ORDER = ["baptist", "anglican", "puritan", "continental-reformed", "presbyterian", "calvinist-evangelical", "reformed"];
const FAMILY_OVERRIDES = { "author-l13-david-brainerd": "presbyterian" }; // no tradition recorded in the registry

window.familyOf = (person) => {
  const key = FAMILY_OVERRIDES[person.id] ?? FAMILY_ORDER.find((k) => person.traditions.includes(k)) ?? "reformed";
  return FAMILIES.find((f) => f.key === key);
};

window.THIS_YEAR = 2026;
window.lifeEnd = (person) => person.died ?? THIS_YEAR;
window.lifeLabel = (person) => `${person.circa ? "c. " : ""}${person.born}–${person.died ?? ""}`;
window.personById = (id) => AUTHORS.people.find((p) => p.id === id);

// Where a person was living in a given year (their places carry the year they arrived), or null outside their life.
window.placeIn = (person, year) => {
  if (year < person.born || year > lifeEnd(person)) return null;
  let found = person.places[0];
  for (const place of person.places) if (place[3] <= year) found = place;
  return { name: found[0], lat: found[1], lon: found[2], index: person.places.indexOf(found) };
};

// Share of a person's catalogued works that are sermons (0–1); people with no works return null.
window.sermonShare = (person) => (person.works ? (person.genres.sermon ?? 0) / person.works : null);

window.formatNumber = (n) => n.toLocaleString("en-GB");
