// The verse on Bible Jeopardy's answer screen (design 5.3): the Berean Standard Bible's words for the answer's verse,
// with its reference linked to the reader in a new tab so the game is not lost. Without a link, or when the words do
// not load, the reference alone. Same data calls as the test page's VerseWords (parts.tsx).
import { ArrowUpRight } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { loadChapterPlain } from "@/lib/data";
import type { QuizQuestion } from "@/lib/live-quiz/protocol";
import { plainLookup } from "@/lib/refs";
import { useAsync } from "@/lib/useAsync";

/** The verse's words, shortened past 260 letters, or null when there is no verse to show. */
async function loadVerse(chapters: string[], link: NonNullable<QuizQuestion["link"]>): Promise<string | null> {
  if (!link.verse || !chapters.includes(String(link.chapter))) return null;
  const plain = await loadChapterPlain("bsb", link.book, chapters, String(link.chapter));
  const text = plainLookup(plain, link.chapter, link.verse)?.replace(/^¶\s*/, "").trim();
  if (!text) return null;
  return text.length > 260 ? `${text.slice(0, 257).replace(/\s+\S*$/, "")}…` : text;
}

export function Verse({ q }: { q: QuizQuestion }) {
  const catalog = useCatalog();
  const link = q.link;
  const chapters = link ? catalog.translations.find((t) => t.slug === "bsb")?.books[link.book] ?? [] : [];
  const words = useAsync(() => (link ? loadVerse(chapters, link) : Promise.resolve(null)), `jp-verse:${link ? `${link.book}.${link.chapter}.${link.verse ?? ""}` : "none"}`);
  if (!q.reference && !link) return null;
  const reference = q.reference ?? (link ? `${link.book} ${link.chapter}${link.verse ? `:${link.verse}` : ""}` : "");
  const to = link ? `/read/bsb/${link.book}/${link.chapter}${link.verse ? `?v=${link.verse}` : ""}` : null;
  return <figure className="jp-verse">
    {words.status === "ready" && words.value && <blockquote>{words.value}</blockquote>}
    <figcaption>
      {to ? <a href={to} target="_blank" rel="noopener">{reference}<ArrowUpRight size={14} strokeWidth={1.6} aria-hidden /><span className="sr-only">(opens in a new tab)</span></a> : <span>{reference}</span>}
      {words.status === "ready" && words.value && <span className="jp-verse-version">BSB</span>}
    </figcaption>
  </figure>;
}
