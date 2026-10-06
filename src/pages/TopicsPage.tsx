import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { loadTopicIndex } from "@/lib/data";
import { topicUrl } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

/** Every topic, in two levels: category, then subcategory, then the topics themselves (scripts/build-topics.py). */
export default function TopicsPage() {
  const index = useAsync(loadTopicIndex, "topic-index");
  const [filter, setFilter] = useState("");
  const { hash } = useLocation();

  // Jump to a category or subcategory named in the address (#salvation, #attributes-of-god) once the list exists.
  useEffect(() => {
    if (index.status === "ready" && hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [index.status, hash]);

  const shown = useMemo(() => {
    if (index.status !== "ready") return [];
    const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
    const keep = (id: string) => words.every((word) => index.value.topics[id]?.title.toLowerCase().includes(word));
    return index.value.categories
      .map((category) => ({ ...category, subcategories: category.subcategories.map((sub) => ({ ...sub, topics: sub.topics.filter(keep) })).filter((sub) => sub.topics.length) }))
      .filter((category) => category.subcategories.length);
  }, [index, filter]);

  if (index.status !== "ready") return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><Loading height={400} /></div>;
  const { categories, topics } = index.value;
  const subcategoryCount = categories.reduce((n, c) => n + c.subcategories.length, 0);
  const count = shown.reduce((n, c) => n + c.subcategories.reduce((m, s) => m + s.topics.length, 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <header className="pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Topics</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Every subject, every verse.</h1>
        <p className="mt-3 max-w-3xl text-muted">{formatNumber(Object.keys(topics).length)} topics in {categories.length} categories and {subcategoryCount} subcategories, each with the passages that speak to it, from R. A. Torrey’s <em>New Topical Textbook</em> (1897).</p>
      </header>

      <div className="sticky top-14 z-10 -mx-4 bg-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <label className="relative block max-w-xl">
          <span className="sr-only">Find a topic</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted" aria-hidden />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a topic: grace, prayer, the Sabbath, lions…" className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3" />
        </label>
        <nav aria-label="Categories" className="mt-3 flex flex-wrap gap-1.5">
          {shown.map((category) => <a key={category.id} href={`#${category.id}`} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-ink">{category.title}</a>)}
        </nav>
        {filter && <p className="mt-2 text-sm text-muted" role="status">{formatNumber(count)} {count === 1 ? "topic" : "topics"}</p>}
      </div>

      {shown.map((category) => (
        <section key={category.id} id={category.id} aria-labelledby={`${category.id}-title`} className="scroll-mt-40 pt-10">
          <h2 id={`${category.id}-title`} className="font-serif text-3xl font-semibold">{category.title}</h2>
          <p className="mt-1 max-w-3xl text-muted">{category.description}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {category.subcategories.map((sub) => (
              <section key={sub.id} id={sub.id} className="scroll-mt-40 rounded-2xl border border-line bg-surface p-4">
                <h3 className="font-semibold">{sub.title}</h3>
                <p className="mt-0.5 text-xs text-muted">{sub.description}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {sub.topics.map((id) => <li key={id}><Link to={topicUrl(id)} className="inline-flex items-baseline gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-sm hover:text-accent">{topics[id].title}<span className="text-[10px] text-muted">{topics[id].refs}</span></Link></li>)}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ))}
      {!shown.length && <p className="mt-10 text-muted">No topic matches “{filter}”. Try the <Link to={`/search?q=${encodeURIComponent(filter)}`} className="text-accent underline">full search</Link>.</p>}
      <p className="mt-16 text-xs text-muted">Topics, points and references: R. A. Torrey, <em>The New Topical Textbook</em> (1897), public domain. Categories by the Bible Project.</p>
    </div>
  );
}
