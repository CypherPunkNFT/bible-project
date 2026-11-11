// The public anchors of a topic page's passages, and the shared-verse fragment read back from an address (design 5.1).
import { passageKey } from "@/data/sympathy/card-keys";
import type { WhenTopic } from "@/data/when-youre";

/** The first role owns the public anchor; a passage repeated in a later role gets "-read" or "-pray" (design 5.1). */
export function passageAnchors(topic: Pick<WhenTopic, "passages">): string[] {
  const used = new Set<string>();
  return topic.passages.map((passage) => {
    const key = passageKey(passage);
    const id = used.has(key) ? `${key}-${passage.role === "blessing" ? "pray" : "read"}` : key;
    used.add(key);
    return id;
  });
}

/** The verse a shared link names, or null for a malformed or unsafe fragment. */
export function sharedVerseId(hash: string): string | null {
  try {
    const key = decodeURIComponent(hash.replace(/^#/, "")).toLowerCase();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) ? key : null;
  } catch {
    return null;
  }
}
