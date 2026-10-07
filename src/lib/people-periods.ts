/** The periods of biblical history the People table groups by (owner, 2026-10-06), in time order.
 *  Ids match scripts/bible/study_people.py `people_period`; '' is a person the source gives no era. */
export const PEOPLE_PERIODS = [
  { id: "early-world", label: "Early world" },
  { id: "patriarchs", label: "Patriarchs" },
  { id: "exodus", label: "Exodus & the wilderness" },
  { id: "conquest", label: "Conquest" },
  { id: "judges", label: "Judges" },
  { id: "united-kingdom", label: "United kingdom" },
  { id: "divided-kingdom", label: "Divided kingdom" },
  { id: "exile", label: "Exile" },
  { id: "return", label: "Return" },
  { id: "life-of-christ", label: "Life of Christ" },
  { id: "early-church", label: "Early church" },
  { id: "", label: "Period not given" },
] as const;

const ORDER = new Map<string, number>(PEOPLE_PERIODS.map((period, index) => [period.id, index]));
export const periodLabel = (id: string) => PEOPLE_PERIODS[ORDER.get(id) ?? PEOPLE_PERIODS.length - 1].label;
export const periodOrder = (id: string) => ORDER.get(id) ?? PEOPLE_PERIODS.length - 1;
