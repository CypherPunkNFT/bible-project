// The tithe calculator's sums and its reading of what is typed (docs/features/tithe-calculator/design.md, sections 2
// and 8). Pure: nothing here touches the page, the address or storage. Parsing is strict on purpose, since a misread
// separator would multiply a gift by a thousand: anything it cannot read for certain comes back null.
import { formatNumber } from "@/lib/site-format";

export type Period = "week" | "two-weeks" | "half-month" | "month" | "year";

/** How many times a year income comes, for each choice in "How often". */
export const TIMES_A_YEAR: Record<Period, number> = { week: 52, "two-weeks": 26, "half-month": 24, month: 12, year: 1 };

export const isPeriod = (value: string): value is Period => Object.prototype.hasOwnProperty.call(TIMES_A_YEAR, value);

/** What the reader has typed and chosen, exactly as typed: kept in the page's state only. */
export interface Entry {
  amountText: string;
  period: Period;
  currency: string;
  percentText: string;
}

/** The page opens with no income, paid monthly, in US dollars, at a tenth. */
export const START: Entry = { amountText: "", period: "month", currency: "USD", percentText: "10" };

/** The largest income the calculator takes: a trillion in any currency. */
export const MAX_AMOUNT = 1_000_000_000_000;

export interface Giving {
  yearlyIncome: number;
  perYear: number;
  perMonth: number;
  perWeek: number;
  /** Each pay: shown only where income comes every two weeks or twice a month. */
  perPay: number;
}

/** What `percent` of `amount`, received every `period`, comes to a week, a month (a twelfth of a year) and a year. */
export function giving(amount: number, period: Period, percent: number): Giving {
  const yearlyIncome = amount * TIMES_A_YEAR[period];
  const perYear = (yearlyIncome * percent) / 100;
  return { yearlyIncome, perYear, perMonth: perYear / 12, perWeek: perYear / 52, perPay: perYear / TIMES_A_YEAR[period] };
}

// Signs that group thousands: comma, full stop, space, no-break space, narrow no-break space, apostrophe.
const GROUP_SIGNS = ",. \u00a0\u202f'";
const CURRENCY_SIGNS = /^[\s$€£¥₹₩₦₱₽₺₪₫]+|[\s$€£¥₹₩₦₱₽₺₪₫]+$/gu;

/**
 * A number from what was typed, or null. Plain digits with at most one decimal mark (`.` or `,`); thousands groups of
 * exactly three digits with one grouping sign throughout, the decimal mark then being a different sign. A lone
 * separator after a leading 0 or before 1–2 digits is a decimal mark; `1.234` and `1,234` read as 1,234.
 */
export function parseNumber(text: string): number | null {
  const typed = text.replace(CURRENCY_SIGNS, "");
  if (!/^[\d.,'\u0020\u00a0\u202f]+$/.test(typed) || !/\d/.test(typed)) return null;
  const separators = [...typed].filter((sign) => GROUP_SIGNS.includes(sign));
  if (separators.length === 0) return Number(typed);
  if (separators.length === 1 && ".,".includes(separators[0])) {
    const [whole, part] = typed.split(separators[0]);
    if (!/^\d*$/.test(whole) || !/^\d+$/.test(part)) return null;
    // Up to two digits after it: a decimal mark. Three: thousands, unless what comes before cannot be a group (nothing,
    // a lone 0, or more than three digits). More than three: a decimal only after such a start ("1,0005" is refused).
    const cannotGroup = whole === "" || whole === "0" || whole.length > 3;
    if (part.length > 3 && !cannotGroup) return null;
    const isDecimal = part.length !== 3 || cannotGroup;
    return Number(isDecimal ? `${whole || "0"}.${part}` : whole + part);
  }
  const group = separators[0];
  const decimal = separators[separators.length - 1];
  const lastIsDecimal = decimal !== group && ".,".includes(decimal);
  const [wholeText, fraction] = lastIsDecimal ? [typed.slice(0, typed.lastIndexOf(decimal)), typed.slice(typed.lastIndexOf(decimal) + 1)] : [typed, ""];
  if (lastIsDecimal && !/^\d+$/.test(fraction)) return null;
  const groups = wholeText.split(group);
  if (!/^\d{1,3}$/.test(groups[0]) || groups.length < 2 || groups.slice(1).some((each) => !/^\d{3}$/.test(each))) return null;
  return Number(`${groups.join("")}${lastIsDecimal ? `.${fraction}` : ""}`);
}

/** An income above zero and at most a trillion, or null. */
export function parseAmount(text: string): number | null {
  const value = parseNumber(text.trim());
  return value !== null && Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT ? value : null;
}

/** A percentage above 0 and at most 100, with at most two decimals and an optional % sign, or null. */
export function parsePercent(text: string): number | null {
  const typed = text.trim().replace(/\s*%$/, "");
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(typed)) return null;
  const value = Number(typed.replace(",", "."));
  return value > 0 && value <= 100 ? value : null;
}

/** The currencies offered, most-used by the site's readers first; "" is a plain number with no sign. */
export const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD", "NZD", "ZAR", "NGN", "KES", "GHS", "INR", "PHP", "KRW", "JPY", "BRL", "MXN"] as const;

/** An amount in the site's language: in `currency` with its own decimals (yen none), or plain with two decimals. */
export function formatMoney(value: number, currency: string): string {
  const plain = () => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (!currency) return plain();
  try {
    return formatNumber(value, { style: "currency", currency });
  } catch {
    return plain(); // a currency code this browser does not know
  }
}

/** 10 → "10%", 12.5 → "12.5%", in the site's language. */
export const formatPercent = (percent: number): string => formatNumber(percent / 100, { style: "percent", maximumFractionDigits: 2 });
