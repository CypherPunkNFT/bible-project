import { Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { loadChapterTopics } from "@/lib/data";
import { topicUrl, type ChapterTopics as ChapterTopicIndex } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";

const SHOWN = 12; // scripts/build-chapter-topics.py SHOWN: the book file carries titles for this many per chapter
const NONE: ChapterTopicIndex = { chapters: {}, names: {} };

/** Topics that cite this chapter (Torrey's New Topical Textbook and Nave's Topical Bible), most-cited first; each a link to the topic. */
export function ChapterTopics({ bookCode, bookNum, chapter }: { bookCode: string; bookNum: number; chapter: number }) {
  const inCanon = bookNum <= 66;
  const topics = useAsync(() => (inCanon ? loadChapterTopics(bookCode) : Promise.resolve(NONE)), `chapter-topics:${bookCode}`);
  if (!inCanon || topics.status !== "ready" || !Number.isFinite(chapter)) return null;
  const { chapters, names } = topics.value;
  const found = chapters[String(chapter)] ?? [];
  if (!found.length) return null;
  return (
    <section aria-label="Topics in this chapter" className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <Tags className="h-3.5 w-3.5" aria-hidden /> Topics in this chapter · {found.length}
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {found.slice(0, SHOWN).map(([id, count]) => (
          <li key={id}>
            <Link to={topicUrl(id)} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-sm hover:bg-surface-2">
              {names[id] ?? id}
              {count > 1 && <span className="text-xs text-muted">×{count}</span>}
            </Link>
          </li>
        ))}
        {found.length > SHOWN && <li><Link to="/topics" className="inline-flex px-2.5 py-1 text-sm text-muted hover:text-ink">+{found.length - SHOWN} more</Link></li>}
      </ul>
    </section>
  );
}
