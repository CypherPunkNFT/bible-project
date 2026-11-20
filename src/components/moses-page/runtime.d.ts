import type { Person, Span } from "@/lib/study";
import type { Aspect } from "@/lib/people-pages-index";

export function mountMoses(root: HTMLElement, options: {
  /** All the runtime reads of the person: their verses and the site's life story. */
  person: Pick<Person, "id" | "refs" | "story">;
  back: { path: string; label: string };
  personPath: (id: string, aspect?: Aspect) => string;
  fillVerses: <T>(data: T) => Promise<T>;
  bibleAbbr: string;
  refHref: (span: Span) => string;
  navigate: (href: string) => void;
  onReady: () => void;
  onMemoryReady?: () => void;
  onError: (error: unknown) => void;
}): () => void;
