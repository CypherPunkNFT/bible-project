/** The periods of biblical history the People table groups by (owner, 2026-10-06), in time order.
 *  Ids match scripts/bible/study_people.py `people_period`; '' is a person the source gives no era. */
export const PEOPLE_PERIODS = [
  { id: "early-world", label: "Early world", note: "Creation to Babel" },
  { id: "patriarchs", label: "Patriarchs", note: "Abraham, Isaac, Jacob and Joseph" },
  { id: "exodus", label: "Exodus & the wilderness", note: "Out of Egypt and through the desert" },
  { id: "conquest", label: "Conquest", note: "Joshua and the promised land" },
  { id: "judges", label: "Judges", note: "From Joshua to Samuel" },
  { id: "united-kingdom", label: "United kingdom", note: "Saul, David and Solomon" },
  { id: "divided-kingdom", label: "Divided kingdom", note: "Israel and Judah apart" },
  { id: "exile", label: "Exile", note: "Carried away to Babylon" },
  { id: "return", label: "Return", note: "Rebuilding Jerusalem" },
  { id: "life-of-christ", label: "Life of Christ", note: "The four Gospels" },
  { id: "early-church", label: "Early church", note: "Acts and the letters" },
  { id: "", label: "Period not given", note: "Peoples, groups and others without a recorded era" },
] as const;

const ORDER = new Map<string, number>(PEOPLE_PERIODS.map((period, index) => [period.id, index]));
export const periodLabel = (id: string) => PEOPLE_PERIODS[ORDER.get(id) ?? PEOPLE_PERIODS.length - 1].label;
export const periodOrder = (id: string) => ORDER.get(id) ?? PEOPLE_PERIODS.length - 1;
