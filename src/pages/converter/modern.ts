// Today's units beside the biblical ones, and how the converter writes numbers (design, review: "Numbers"). Every
// number goes through the site's formatNumber, so it is written the reader's way in every language; units Intl knows
// are written by Intl, and quarts, cups and bushels, which it does not know, through plural() with both forms.
import { formatNumber, plural } from "@/lib/site-format";
import type { Kind } from "./units";

/** A modern unit: its size in the kind's base, and how an amount of it is written. */
export interface ModernUnit {
  id: string;
  kind: Kind;
  name: string;
  size: number;
  /** Metric (true) or US customary (false); money's units are neither. */
  metric?: boolean;
  write: (amount: number) => string;
}

/** About three significant figures, written the site's way; compact ("60 million") from a million up. */
export function formatAmount(amount: number): string {
  if (amount >= 1e6) return formatNumber(amount, { notation: "compact", compactDisplay: "long", maximumSignificantDigits: 3 });
  return formatNumber(amount, { maximumSignificantDigits: 3 });
}

const intlUnit = (unit: string) => (amount: number) =>
  formatNumber(amount, { style: "unit", unit, unitDisplay: "short", maximumSignificantDigits: 3, ...(amount >= 1e6 ? { notation: "compact" } : {}) });

/** A count for plural(): rounded first, as plural() writes the number itself. */
const rounded = (amount: number) => Number(amount.toPrecision(3));

export const MODERN_UNITS: readonly ModernUnit[] = [
  { id: "cm", kind: "length", name: "Centimetres", size: 0.01, metric: true, write: intlUnit("centimeter") },
  { id: "m", kind: "length", name: "Metres", size: 1, metric: true, write: intlUnit("meter") },
  { id: "km", kind: "length", name: "Kilometres", size: 1000, metric: true, write: intlUnit("kilometer") },
  { id: "in", kind: "length", name: "Inches", size: 0.0254, write: intlUnit("inch") },
  { id: "ft", kind: "length", name: "Feet", size: 0.3048, write: intlUnit("foot") },
  { id: "yd", kind: "length", name: "Yards", size: 0.9144, write: intlUnit("yard") },
  { id: "mi", kind: "length", name: "Miles", size: 1609.344, write: intlUnit("mile") },
  { id: "g", kind: "weight", name: "Grams", size: 1, metric: true, write: intlUnit("gram") },
  { id: "kg", kind: "weight", name: "Kilograms", size: 1000, metric: true, write: intlUnit("kilogram") },
  { id: "oz", kind: "weight", name: "Ounces", size: 28.349523125, write: intlUnit("ounce") },
  { id: "lb", kind: "weight", name: "Pounds", size: 453.59237, write: intlUnit("pound") },
  { id: "l-dry", kind: "dry", name: "Litres", size: 1, metric: true, write: intlUnit("liter") },
  { id: "dry-quart", kind: "dry", name: "US dry quarts", size: 1.101220942715, write: (n) => plural(rounded(n), "{n} dry quart", "{n} dry quarts") },
  { id: "bushel", kind: "dry", name: "US bushels", size: 35.23907016688, write: (n) => plural(rounded(n), "{n} bushel", "{n} bushels") },
  { id: "l", kind: "liquid", name: "Litres", size: 1, metric: true, write: intlUnit("liter") },
  { id: "cup", kind: "liquid", name: "US cups", size: 0.2365882365, write: (n) => plural(rounded(n), "{n} cup", "{n} cups") },
  { id: "quart", kind: "liquid", name: "US quarts", size: 0.946352946, write: (n) => plural(rounded(n), "{n} quart", "{n} quarts") },
  { id: "gal", kind: "liquid", name: "US gallons", size: 3.785411784, write: intlUnit("gallon") },
];

/** A day's work, for the "work time" a coin stood for. */
export const WORK_HOURS = 8;
/** Working days in a year, for the Berean's "about twenty years' wages" for a talent. */
export const WORK_DAYS_A_YEAR = 300;
/** Today's day's wage until the reader sets their own: eight hours at $15. */
export const DEFAULT_WAGE = 120;

/** What `days` of a labourer's pay stood for in time worked: minutes or hours of a day, days, or years from 600 days. */
export function writeWorkTime(days: number): string {
  const long = { style: "unit", unitDisplay: "long", maximumSignificantDigits: 2 } as const;
  const minutes = days * WORK_HOURS * 60;
  if (minutes < 60) return formatNumber(minutes, { ...long, unit: "minute" });
  if (days < 1) return formatNumber(minutes / 60, { ...long, unit: "hour" });
  if (days < 2 * WORK_DAYS_A_YEAR) return formatNumber(days, { ...long, unit: "day", maximumSignificantDigits: 3 });
  return formatNumber(days / WORK_DAYS_A_YEAR, { ...long, unit: "year", ...(days >= 1e8 ? { notation: "compact" } : {}) });
}

/** Days' wages in US dollars at `wage` a day: two significant figures, as a dollar figure here is only a guide. */
export function writeDollars(days: number, wage: number): string {
  const dollars = days * wage;
  return formatNumber(dollars, { style: "currency", currency: "USD", maximumSignificantDigits: 2, ...(dollars >= 1e6 ? { notation: "compact", compactDisplay: "long" } : {}) });
}

export const modernUnitsOf = (kind: Kind): ModernUnit[] => MODERN_UNITS.filter((unit) => unit.kind === kind);

const modern = (id: string): ModernUnit => {
  const unit = MODERN_UNITS.find((candidate) => candidate.id === id);
  if (!unit) throw new Error(`converter: no modern unit "${id}" (expected one of ${MODERN_UNITS.map((each) => each.id).join(", ")})`);
  return unit;
};

/** The two modern units that suit an amount of `base` (metres, grams, litres): a metric one, then a US one. */
export function fittingUnits(kind: Exclude<Kind, "money">, base: number): [ModernUnit, ModernUnit] {
  switch (kind) {
    case "length": return base < 1 ? [modern("cm"), modern("in")] : base < 1000 ? [modern("m"), modern("ft")] : [modern("km"), modern("mi")];
    case "weight": return base < 1000 ? [modern("g"), modern("oz")] : [modern("kg"), modern("lb")];
    case "dry": return [modern("l-dry"), base < 30 ? modern("dry-quart") : modern("bushel")];
    case "liquid": return [modern("l"), base < 0.9 ? modern("cup") : base < 3.7 ? modern("quart") : modern("gal")];
  }
}

/** An amount of `base` written today's ways: metric and US, or for money the work it stood for and its dollars. */
export function writeToday(kind: Kind, base: number, wage: number): [string, string] {
  if (kind === "money") return [writeWorkTime(base), writeDollars(base, wage)];
  return fittingUnits(kind, base).map((unit) => unit.write(base / unit.size)) as [string, string];
}

/** An amount typed by the reader or read from the address, 0 to 1e12: digits with at most one decimal point or comma
 * ("6.5", "6,5"), or thousands grouped by commas ("12,000", "1,234.5"). Anything else (blank, "1e5", "0x10",
 * "Infinity", a minus sign) is null. */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim();
  const grouped = /^\d{1,3}(,\d{3})+(\.\d{1,6})?$/.test(trimmed);
  if (!grouped && !/^\d{1,12}([.,]\d{1,6})?$/.test(trimmed)) return null;
  const value = Number(grouped ? trimmed.replace(/,/g, "") : trimmed.replace(",", "."));
  return Number.isFinite(value) && value <= 1e12 ? value : null;
}
