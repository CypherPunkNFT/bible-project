export interface ReadingSource {
  id: string; title: string; author: string; role: string; note: string; url: string;
  basis?: "westminster" | "quran-pickthall";
  held?: { id: string; title: string; availability: string };
  catholic?: boolean;
}
export const readingSourceUrl = (id: string, locator?: string) => `/sources/reading/${encodeURIComponent(id)}${locator ? "?at=" + encodeURIComponent(locator) : ""}`;
export const apSourceUrl = (id: string, locator?: string) => readingSourceUrl("ap-" + id, locator);
