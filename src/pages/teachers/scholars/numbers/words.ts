// "The thirty-five, counted": the heading names the count in words, computed from the data so it never goes stale.
const UNITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** 35 → "thirty-five"; numbers of 100 or more stay as digits. */
export function countWord(n: number): string {
  if (n < 0 || n >= 100 || !Number.isInteger(n)) return String(n);
  if (n < 20) return UNITS[n];
  const tens = TENS[Math.floor(n / 10)], unit = n % 10;
  return unit ? `${tens}-${UNITS[unit]}` : tens;
}
