import { loadChapterPlain } from "./data";
import { plainLookup } from "./refs";
import type { PlainBook } from "./types";
import { useAsync } from "./useAsync";

/**
 * One verse's plain words, downloading only its chapter (never the whole book). Lettered and ranged labels are
 * matched by plainLookup, as before. `text` is undefined while loading or when the version lacks the verse.
 */
export function useVerseText(
  version: { slug: string; books: Record<string, string[]> } | undefined,
  code: string,
  chapter: number,
  verse: number,
): { loading: boolean; text: string | undefined } {
  const has = !!version && !!version.books[code]?.includes(String(chapter));
  const plain = useAsync<PlainBook>(
    () => (has ? loadChapterPlain(version!.slug, code, version!.books[code], String(chapter)) : Promise.resolve({})),
    `chapter-plain:${version?.slug}:${code}:${chapter}:${has}`,
  );
  return { loading: plain.status === "loading", text: plain.status === "ready" ? plainLookup(plain.value, chapter, verse) : undefined };
}
