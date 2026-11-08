// Permanent day keys (design 6.5). They sit in church newsletters, messages and calendar files for years, so every
// released key is listed here and a test fails if one disappears. A key retired on purpose moves to KEY_ALIASES, which
// sends it to its replacement, as sympathy's card keys do.

const dates = (month: string, first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) => `${month}-${String(first + index).padStart(2, "0")}`);

const LENT_KEYS = [
  "day-1", "day-2", "day-3", "day-4", "sunday-1",
  "day-5", "day-6", "day-7", "day-8", "day-9", "day-10", "sunday-2",
  "day-11", "day-12", "day-13", "day-14", "day-15", "day-16", "sunday-3",
  "day-17", "day-18", "day-19", "day-20", "day-21", "day-22", "sunday-4",
  "day-23", "day-24", "day-25", "day-26", "day-27", "day-28", "sunday-5",
  "day-29", "day-30", "day-31", "day-32", "day-33", "day-34", "sunday-6",
  "day-35", "day-36", "day-37", "day-38", "day-39", "day-40", "easter",
];

/** Every released day key, by occasion. */
export const KEPT_KEYS: Record<string, string[]> = {
  advent: [...dates("nov", 27, 30), ...dates("dec", 1, 25)],
  lent: LENT_KEYS,
};

/** Retired keys and the day each now opens, by occasion. Empty at launch. */
export const KEY_ALIASES: Record<string, Record<string, string>> = {};
