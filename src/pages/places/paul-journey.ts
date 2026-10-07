// Paul's guided journey (Atlas → Journeys), built entirely from the Letters study's sourced data
// (src/data/letters/paul-letters.json): its four journey maps, its letter maps, and the dated steps of its
// "Paul's life and letters" timeline. Nothing here adds a claim; it only chooses which recorded step sits at which place.
import type { Citation, LetterGroup, MapLayer, Span, TimelineEvent } from "@/data/letters/types";

/** Scripture names the stop; or scholars propose it (the text does not say, the note gives whose view); or it rests on
 * later writers (cited, and the page says so). */
export type StopLayer = "scripture" | "proposed" | "tradition";
export interface JourneyStop { name: string; placeId: string; refs: Span[]; note?: string; layer: StopLayer; cites: string[] }
export interface JourneyChapter {
  id: string;
  title: string;
  summary: string;
  /** Years AD as the cited scholars date them; the Bible itself states none. */
  years?: [number, number];
  /** True: the stops are in travel order and the map draws the (reconstructed) way between them. */
  route: boolean;
  stops: JourneyStop[];
  cites: string[];
}
export interface PaulJourney { story: JourneyChapter[]; letters: JourneyChapter[]; citations: Citation[]; datingCites: string[] }

// Places named in the timeline steps that have no map of their own (ids from data/places.json).
const PLACE = { jerusalem: "a15257a", damascus: "a69c1d4", arabia: "a0f4ea8", tarsus: "a666ea0", antioch: "ae41ab4", caesarea: "a58735e", rome: "afc8e7a" } as const;
type PlaceKey = keyof typeof PLACE;

/** Which timeline step sits where: [the start of its label, place, the name shown]. */
const EARLY: [string, PlaceKey, string][] = [
  ["At the stoning of Stephen", "jerusalem", "Jerusalem"],
  ["Conversion on the road to Damascus", "damascus", "Damascus"],
  ["Into Arabia", "arabia", "Arabia"],
  ["Escape from Damascus", "damascus", "Damascus"],
  ["First visit to Jerusalem", "jerusalem", "Jerusalem"],
  ["Sent to Tarsus", "tarsus", "Tarsus"],
  ["Barnabas brings him to Antioch", "antioch", "Antioch in Syria"],
  ["Famine-relief visit to Jerusalem", "jerusalem", "Jerusalem"],
];
const ARREST: [string, PlaceKey, string][] = [
  ["Arrested in the temple", "jerusalem", "Jerusalem"],
  ["Two years held at Caesarea", "caesarea", "Caesarea"],
];
const ROME: [string, PlaceKey, string][] = [
  ["Two years under guard in Rome", "rome", "Rome"],
  ["Released; further travels", "rome", "Further travels"],
  ["Second Roman imprisonment and death", "rome", "Rome"],
];

function fromTimeline(events: TimelineEvent[], steps: [string, PlaceKey, string][]): JourneyStop[] {
  return steps.map(([start, place, name]) => {
    const event = events.find((e) => e.label.startsWith(start));
    if (!event) throw new Error(`Paul's journey: no timeline step starting "${start}" in paul-letters.json (was it renamed?)`);
    // A step that cites later writers is tradition, even where a verse is linked beside it (2 Timothy 4:6 is Paul's
    // own word about his "departure", not a record of his death in Rome).
    return { name, placeId: PLACE[place], refs: event.refs ?? [], note: event.label, layer: event.cites?.length ? "tradition" : "scripture", cites: event.cites ?? [] };
  });
}

const span = (events: TimelineEvent[], stops: [string, PlaceKey, string][]): [number, number] => {
  const chosen = events.filter((e) => stops.some(([start]) => e.label.startsWith(start)));
  return [Math.min(...chosen.map((e) => e.from)), Math.max(...chosen.map((e) => e.to ?? e.from))];
};

function fromMap(map: MapLayer | undefined, id: string): JourneyChapter {
  if (!map) throw new Error(`Paul's journey: no map "${id}" in paul-letters.json (was it renamed?)`);
  return {
    id: map.id, title: map.title, summary: map.claim.text, years: map.years, route: !!map.route, cites: map.claim.cites ?? [],
    stops: map.stops.map((stop) => ({ name: stop.name, placeId: stop.placeId, refs: stop.refs ?? [], note: stop.note, layer: stop.refs?.length ? "scripture" : "proposed", cites: [] })),
  };
}

export function buildPaulJourney(group: LetterGroup): PaulJourney {
  const timeline = group.timelines.find((t) => t.id === "pauls-life");
  if (!timeline) throw new Error("Paul's journey: the timeline \"pauls-life\" is missing from paul-letters.json");
  const events = timeline.events;
  const map = (id: string) => fromMap(group.maps.find((m) => m.id === id), id);
  const story: JourneyChapter[] = [
    { id: "early-years", title: "Damascus to Antioch", years: span(events, EARLY), route: true, cites: [], stops: fromTimeline(events, EARLY),
      summary: "From persecutor to apostle. Acts and Paul's own account in Galatians place him in Jerusalem, on the Damascus road, in Arabia, at Tarsus and at Antioch before the first journey." },
    map("journey-1"), map("journey-2"), map("journey-3"),
    { id: "arrest", title: "Arrest and Caesarea", years: span(events, ARREST), route: true, cites: [], stops: fromTimeline(events, ARREST),
      summary: "Arrested in the temple at Jerusalem, Paul is held for two years at Caesarea and appeals to Caesar (Acts 21–26)." },
    map("voyage-rome"),
    { id: "rome", title: "Rome, and after Acts", years: span(events, ROME), route: false, cites: [], stops: fromTimeline(events, ROME),
      summary: "Acts ends with Paul two years under guard in Rome. What followed is not told in Scripture: later writers tell of his release, further travels and death in Rome. Those steps are marked as tradition, with their sources." },
  ];
  return { story, letters: [map("letter-destinations"), map("written-from")], citations: group.citations, datingCites: timeline.claim.cites ?? [] };
}
