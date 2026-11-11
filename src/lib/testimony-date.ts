import { dateFormat } from "./site-format";

/** Browser presentation only; shared worker validation must not import locale storage. */
export function formatTestimonyDate(iso: string): string {
  if (!iso) return "Not shared";
  return dateFormat({ month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}
