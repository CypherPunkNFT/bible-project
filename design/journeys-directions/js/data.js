// The Journeys page's own words (AtlasCollection.tsx EXPERIENCES.journeys), unchanged.
window.PAGE = {
  kicker: "Explore by person",
  title: "Follow a life. See the story unfold.",
  description: "Choose a person, then a way of looking. One journey can open onto people, teaching, letters, and the world around them.",
  choose: "Whose journey will you follow?",
  next: "The guided route, scene-by-scene navigation, and passages come next.",
};
window.PEOPLE = [
  { id: "paul", name: "Paul", sub: "Damascus to Rome", tone: "epistles" },
  { id: "abraham", name: "Abraham", sub: "Called to go", tone: "history" },
  { id: "moses", name: "Moses", sub: "Egypt & the wilderness", tone: "prophets" },
  { id: "ruth", name: "Ruth", sub: "Moab to Bethlehem", tone: "poetry" },
  { id: "david", name: "David", sub: "Wilderness & kingdom", tone: "gospels" },
  { id: "peter", name: "Peter", sub: "Galilee & beyond", tone: "acts" },
];
window.LENSES = [
  { id: "story", label: "Story" }, { id: "people", label: "People" }, { id: "teaching", label: "Teaching" },
  { id: "letters", label: "Letters", only: ["paul", "peter"] }, { id: "setting", label: "Setting" },
];
window.LAYER = { scripture: "Named in Scripture", proposed: "Proposed by scholars", tradition: "Later tradition" };
window.DATING = "Dating: W. M. Ramsay (1895); A. T. Robertson (1915). None of these years is stated in the Bible.";
window.KEY = [
  ["scripture", "Places and passages: named in Acts and Paul's letters"],
  ["route", "Dashed line: the way between stops is reconstructed. Scripture names the places, not the roads"],
  ["proposed", "Proposed by scholars: the text does not say"],
  ["tradition", "Later tradition: told by writers after the New Testament"],
];

// The First journey keeps the cities in the order Acts names them. The two region names Acts 14:24 adds on the way back
// ("Pisidia", "Pamphylia") are left off the route: they are regions, not stops.
(() => {
  const first = PAUL_CHAPTERS.find((c) => c.id === "journey-1");
  first.stops = first.stops.filter((s) => s.name !== "Pisidia" && s.name !== "Pamphylia");
})();
window.CHAPTERS = PAUL_CHAPTERS;
window.yearsOf = (c) => (c.years ? `AD ${c.years[0]}${c.years[1] !== c.years[0] ? `–${c.years[1]}` : ""}` : "");
window.pad2 = (n) => String(n).padStart(2, "0");
window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
