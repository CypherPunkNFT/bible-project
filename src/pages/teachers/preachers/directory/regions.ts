// "Everyone, by where they served": each teacher's main town (the one where they spent the most years after their
// birthplace) and the country or region it is in (ported from the mock-up's directory.js).
import type { Person } from "@/data/teachers/pages-types";
import { familyOf, lifeEnd } from "../../shared/people";

// Which country or region each town is in.
const REGIONS: Record<string, string> = {
  England: "Marston Jabbett|Cambridge|Ipswich|Tostock|London|Rollesby|Oxford|Stadhampton|Coggeshall|Bromsgrove|Dartmouth|Elstow|Bedford|Kettering|Gloucester|Liverpool|Olney|Paulerspury|Leicester|Macclesfield|Helmingham|Stradbroke|Kelvedon|Waterbeach|Bristol|Epworth",
  Scotland: "Haddington|Edinburgh|Nisbet|Anwoth|Aberdeen|St Andrews|Duns|Simprin|Ettrick|Collace|Glasgow|Dundee|Kirkmahoe|Badbea|Hamilton",
  Wales: "Cardiff|Aberavon",
  Ireland: "Dublin",
  Switzerland: "Bremgarten|Zürich|Geneva",
  France: "Noyon|Paris|Strasbourg",
  Germany: "Wittenberg|Heidelberg|Neustadt",
  Silesia: "Breslau",
  Netherlands: "Franeker|Enkhuizen|Utrecht|Leiden|Maassluis|Amsterdam|Hoogeveen|Kampen|Heerenveen|Emmen",
  "United States": "West Nottingham|Fredericksburg|Wilkes-Barre|East Windsor|Northampton|Stockbridge|Princeton|Savannah|Newburyport|Haddam|Crossweeksung|Lexington, Virginia|Philadelphia|Lexington, Kentucky|Allegheny|Grand Rapids|Vriesland|Baltimore|Pittsburgh|Ligonier|Orlando|Sanford|Deerfield|Chattanooga|Minneapolis|Columbia, South Carolina|Cleveland|Phoenix|Northfield|Boston|Chicago|Charlotte|Cleveland, Tennessee|Temple Terrace|Wheaton|Western Springs|Montreat",
  Canada: "Vancouver|Montreal",
  India: "Serampore|Allahabad",
  "Middle East": "Bahrain|Cairo",
  "Australia & Pacific": "Tanna|Aniwa|Melbourne",
};
const REGION_ORDER = Object.keys(REGIONS);
const REGION_OF = new Map<string, string>();
for (const [region, towns] of Object.entries(REGIONS)) for (const town of towns.split("|")) REGION_OF.set(town, region);
const UNKNOWN_REGION = "Elsewhere";

function regionOf(town: string) {
  const region = REGION_OF.get(town);
  if (!region) console.error(`Teachers directory: no country or region recorded for the town "${town}"; listed under "${UNKNOWN_REGION}"`);
  return region ?? UNKNOWN_REGION;
}

// Each place from the year they arrived to the next arrival (or the end of their life). When the birthplace is not
// recorded, the first place is only the earliest known one, counted from the year they arrived.
const knowsBirthplace = (person: Person) => person.birthplaceKnown !== false;
function staysOf(person: Person) {
  return person.places.map((place, i) => ({
    name: place[0],
    from: i === 0 && knowsBirthplace(person) ? person.born : place[3],
    to: i + 1 < person.places.length ? person.places[i + 1][3] : lifeEnd(person),
  }));
}

/** The town where they spent the most years after their birthplace (repeat stays add up), or the birthplace if it is their only place. */
function mainTown(person: Person) {
  const stays = staysOf(person);
  const pool = stays.length > 1 && knowsBirthplace(person) ? stays.slice(1) : stays;
  const years = new Map<string, number>();
  for (const s of pool) years.set(s.name, (years.get(s.name) ?? 0) + (s.to - s.from));
  return [...years].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

export interface DirectoryRow { person: Person; town: string }
export interface RegionGroup { region: string; rows: DirectoryRow[] }

/** Everyone grouped by region, each group in birth order; the largest groups first. */
export function regionGroups(people: Person[]): RegionGroup[] {
  const groups = new Map<string, DirectoryRow[]>();
  for (const person of people) {
    const town = mainTown(person), region = regionOf(town);
    groups.set(region, [...(groups.get(region) ?? []), { person, town }]);
  }
  return [...groups].map(([region, rows]) => ({ region, rows: rows.sort((a, b) => a.person.born - b.person.born) }))
    .sort((a, b) => b.rows.length - a.rows.length || REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
}

export interface ShownGroup { region: string; order: number; rows: DirectoryRow[] }
/** The groups after the name/town search and the family chip, laid into two balanced columns (each group goes to the shorter column). */
export function filterIntoColumns(groups: RegionGroup[], query: string, family: string | null) {
  const q = query.trim().toLowerCase();
  const matches = (r: DirectoryRow) => (!family || familyOf(r.person).key === family)
    && (!q || r.person.name.toLowerCase().includes(q) || r.town.toLowerCase().includes(q));
  const columns: { size: number; groups: ShownGroup[] }[] = [{ size: 0, groups: [] }, { size: 0, groups: [] }];
  let shown = 0;
  groups.forEach((group, order) => {
    const rows = group.rows.filter(matches);
    if (!rows.length) return;
    shown += rows.length;
    const column = columns[0].size <= columns[1].size ? columns[0] : columns[1];
    column.size += rows.length + 2;
    column.groups.push({ region: group.region, order, rows });
  });
  return { shown, columns: columns.map((c) => c.groups) };
}
