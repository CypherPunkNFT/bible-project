import { ArrowUpRight, BookOpen, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { lastReadPath } from "@/lib/last-read";
import "./bible.css";

const SHELVES = ["Genesis", "Exodus", "Psalms", "Isaiah", "Matthew", "Romans", "Revelation"];

export default function BiblePage() {
  const catalog = useCatalog();
  const recent = lastReadPath();
  const [, , slug, code, chapter] = recent?.split("/") ?? [];
  const version = catalog.translations.find(item => item.slug === slug && item.books[code]?.includes(chapter));
  const resume = version ? recent! : "/read";
  const book = catalog.books.find(item => item.code === code);
  const languages = new Set(catalog.translations.map(item => item.lang)).size;
  return <div className="bible-hub mx-auto max-w-7xl px-4 sm:px-6">
    <header className="bible-intro"><p className="bible-eyebrow">The Bible, open to you</p><h1>Find your place.<br /><em>Enter the Word.</em></h1><p>Explore the whole collection, or settle into a passage. One library. A lifetime of reading.</p></header>
    <div className="bible-paths">
      <Link to="/library" className="bible-path bible-library" aria-labelledby="bible-library-title">
        <div className="bible-path-top"><Library size={20} aria-hidden="true" /><span>Explore the collection</span><ArrowUpRight size={22} aria-hidden="true" /></div>
        <div className="bible-shelf" aria-hidden="true">{SHELVES.map((name, index) => <span key={name} style={{ "--spine": `var(--${["history", "history", "poetry", "prophets", "gospels", "epistles", "revelation"][index]})` } as React.CSSProperties}><i>{name}</i></span>)}</div>
        <div className="bible-path-copy"><h2 id="bible-library-title">Library</h2><p>See the Bible at a glance. Choose a version, explore its books, and open any chapter from the reading chart.</p><div className="bible-path-foot"><span>{catalog.translations.length} versions · {languages} languages</span><strong>Explore the library <ArrowUpRight size={16} aria-hidden="true" /></strong></div></div>
      </Link>
      <Link to={resume} className="bible-path bible-reading" aria-labelledby="bible-reading-title">
        <div className="bible-path-top"><BookOpen size={20} aria-hidden="true" /><span>Spend time in Scripture</span><ArrowUpRight size={22} aria-hidden="true" /></div>
        <div className="bible-open-book" aria-hidden="true"><div><small>THE GOSPEL ACCORDING TO</small><b>John</b><span>1</span><p>In the beginning was the Word, and the Word was with God, and the Word was God.</p><i /><i /></div><div><i /><i /><i /><i /><i /><i /><i /><i /><span className="bible-bookmark" /></div></div>
        <div className="bible-path-copy"><h2 id="bible-reading-title">Read</h2><p>Give a passage your attention. Compare versions side by side, follow references, and return to where you left off.</p><div className="bible-path-foot"><span>{version ? `${book?.name ?? code} ${chapter} · ${version.abbr}` : "Begin with Genesis 1"}</span><strong>{version ? "Continue reading" : "Open the reader"} <ArrowUpRight size={16} aria-hidden="true" /></strong></div></div>
      </Link>
    </div>
    <p className="bible-connection"><span />The reading chart is also a doorway: choose a chapter in the Library and you are already reading.<span /></p>
  </div>;
}
