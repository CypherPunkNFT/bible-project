import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { CategoryCard } from "@/components/topics/TopicCards";
import { loadTopicIndex } from "@/lib/data";
import { categoryStyle } from "@/lib/topic-style";
import { categoryUrl, matchTopics, placeOf, topicUrl } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

const POPULAR = ["love-of-god", "prayer", "faith", "grace", "afflictions", "christ-the-shepherd", "heaven", "holy-spirit-the-is-god"];

/** Topics home: 12 category cards (two levels below them), a finder, and a few well-loved topics to start from. */
export default function TopicsPage() {
  const index = useAsync(loadTopicIndex, "topic-index");
  const [query, setQuery] = useState("");
  const found = useMemo(() => (index.status === "ready" && query.trim() ? matchTopics(index.value, query, 60) : []), [index, query]);

  if (index.status !== "ready") return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><Loading height={400} /></div>;
  const { categories, topics } = index.value;
  const subcategories = categories.reduce((n, c) => n + c.subcategories.length, 0);
  const popular = POPULAR.filter((id) => topics[id]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <header className="pb-8 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Topics</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">Every subject, every verse.</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted">{formatNumber(Object.keys(topics).length)} topics in {categories.length} families and {subcategories} groups, each with the passages that speak to it.</p>
        <label className="relative mt-6 block max-w-2xl">
          <span className="sr-only">Find a topic</span>
          <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a topic: grace, prayer, the Sabbath, lions…" className="h-14 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 text-lg shadow-sm" />
        </label>
        {!query && popular.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-muted">Popular:</span>{popular.map((id) => <Link key={id} to={topicUrl(id)} className="rounded-full border border-line bg-surface px-3 py-1 hover:border-accent">{topics[id].title}</Link>)}</p>
        )}
      </header>

      {query.trim() ? (
        <section aria-live="polite">
          <p className="text-sm text-muted">{found.length ? `${found.length} topics` : `No topic is named “${query}”.`} {!found.length && <Link to={`/search?q=${encodeURIComponent(query)}`} className="text-accent underline">Try the full search</Link>}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((id) => {
              const place = placeOf(index.value, id);
              const color = place ? categoryStyle(place.category.id).color : "var(--accent)";
              return (
                <li key={id}><Link to={topicUrl(id)} className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-accent" style={{ borderLeft: `4px solid ${color}` }}>
                  <span className="block font-serif text-lg font-semibold">{topics[id].title}</span>
                  {place && <span className="mt-0.5 block text-xs text-muted">{place.category.title} › {place.subcategory.title}</span>}
                  <span className="mt-2 block text-xs text-muted">{topics[id].points} points · {formatNumber(topics[id].refs)} passages</span>
                </Link></li>
              );
            })}
          </ul>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => <li key={category.id}><CategoryCard category={category} /></li>)}
        </ul>
      )}
      <p className="mt-16 text-xs text-muted">Topics, points and references: R. A. Torrey, <em>The New Topical Textbook</em> (1897), public domain. Families and groups by the Bible Project. Jump to a family: {categories.map((c, i) => <span key={c.id}>{i > 0 && " · "}<Link to={categoryUrl(c.id)} className="underline">{c.title}</Link></span>)}</p>
    </div>
  );
}
