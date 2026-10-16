import type { Person, Span } from "@/lib/study";
import type { Aspect } from "@/lib/people-pages-index";

export function mountMoses(root: HTMLElement, options: {
  person: Person;
  back: { path: string; label: string };
  personPath: (id: string, aspect?: Aspect) => string;
  refHref: (span: Span) => string;
  navigate: (href: string) => void;
  onReady: () => void;
  onMemoryReady?: () => void;
  onError: (error: unknown) => void;
}): () => void;
