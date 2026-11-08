// The funeral readings as words: each reading's time aloud, its part of the service, the list link for the pastor and the
// list as text for a funeral program.
import { FUNERAL_PATH, SERVICE_PARTS } from "@/data/sympathy";
import { SITE_ORIGIN } from "@/lib/page-head";
import { plural } from "@/lib/site-format";
import type { ShownSympathy } from "./useSympathyPassages";

/** "About 1 minute aloud", at about 150 words a minute. */
export function readingTime(text: string): string {
  const minutes = Math.max(1, Math.round(text.split(/\s+/).length / 150));
  return plural(minutes, "About {n} minute aloud", "About {n} minutes aloud");
}

export const partTitle = (item: ShownSympathy) => SERVICE_PARTS.find((part) => part.id === item.passage.servicePart)?.title ?? "";

/** The address to send the pastor: the readings page with the chosen keys, in order, from the public site. */
export const listUrl = (keys: string[]): string => `${SITE_ORIGIN}${FUNERAL_PATH}?list=${keys.join(",")}`;

/** References and full text, for a funeral program. */
export function listAsText(items: ShownSympathy[]): string {
  const readings = items.map((item) => `${partTitle(item)}\n${item.reference}\n${item.text}`);
  return [...readings, "Scripture quotations are from the Berean Standard Bible (public domain)."].join("\n\n");
}
