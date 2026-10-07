import { ArrowLeft, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { CategoryCard } from "@/components/topics/TopicCards";
import { loadTopicIndex } from "@/lib/data";
import { categoryStyle } from "@/lib/topic-style";
import { topicCount, topicUrl, type TopicIndex, type TopicSubcategory } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

const PREVIEW = 8;

/** One group: its topics as chips, the most-cited first; expands to show them all. */
function GroupCard({ sub, index, color, open }: { sub: TopicSubcategory; index: TopicIndex; color: string; open: boolean }) {
  const [expanded, setExpanded] = useState(open);
  const ordered = [...sub.topics].sort((a, b) => index.topics[b].refs - index.topics[a].refs);
  const shown = expanded ? ordered : ordered.slice(0, PREVIEW);
  const passages = sub.topics.reduce((n, id) => n + index.topics[id].refs, 0);
  return (
    <section id={sub.id} aria-labelledby={`${sub.id}-title`} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5" style={{ borderTop: `3px solid ${color}` }}>
      <h2 id={`${sub.id}-title`} className="font-serif text-xl font-semibold">{sub.title}</h2>
      <p className="mt-1 text-sm text-muted">{sub.description}</p>
      <p className="mt-1 text-xs text-muted">{sub.topics.length} topics · {formatNumber(passages)} passages</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {shown.map((id) => <li key={id}><Link to={topicUrl(id)} className="inline-flex items-baseline gap-1.5 rounded-full border border-line bg-page px-3 py-1.5 text-sm hover:border-current" style={{ color: "var(--ink)" }}>{index.topics[id].title}<span className="text-[11px] text-muted">{index.topics[id].refs}</span></Link></li>)}
      </ul>
      {ordered.length > PREVIEW && (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color }}>
          {expanded ? "Show fewer" : `Show all ${ordered.length}`} <ChevronDown size={15} className={expanded ? "rotate-180 transition" : "transition"} />
        </button>
      )}
    </section>
  );
}

/** A topic family: coloured header, its groups as expandable cards, and the other families. */
export default function TopicCategoryPage() {
  const { category: id = "" } = useParams();
  const { hash } = useLocation();
  const index = useAsync(loadTopicIndex, "topic-index");
  useEffect(() => {
    if (index.status === "ready" && hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [index.status, hash]);

  if (index.status !== "ready") return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><Loading height={400} /></div>;
  const category = index.value.categories.find((c) => c.id === id);
  if (!category) return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="font-serif text-3xl">No such topic family.</h1><Link to="/topics" className="mt-4 inline-block text-accent underline">All topics</Link></div>;
  const { Icon, color, box } = categoryStyle(category.id);
  const target = hash ? decodeURIComponent(hash.slice(1)) : "";

  return (
    <div className="pb-20">
      <header className="relative overflow-hidden border-b border-line" style={{ background: `color-mix(in srgb, ${box} 35%, var(--page))` }}>
        <span aria-hidden className="absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-30" style={{ background: box }} />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Link to="/topics" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All topics</Link>
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: color }}><Icon size={28} /></span>
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{category.title}</h1>
              <p className="mt-1 text-muted">{category.description} {topicCount(category)} topics in {category.subcategories.length} groups.</p>
            </div>
          </div>
          <nav aria-label="Groups" className="mt-6 flex flex-wrap gap-1.5">
            {category.subcategories.map((sub) => <a key={sub.id} href={`#${sub.id}`} className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-current">{sub.title}</a>)}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {category.subcategories.map((sub) => <GroupCard key={sub.id} sub={sub} index={index.value} color={color} open={sub.id === target} />)}
        </div>
        <section aria-labelledby="other-families" className="mt-16">
          <h2 id="other-families" className="font-serif text-2xl font-semibold">Other families</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {index.value.categories.filter((c) => c.id !== category.id).map((c) => <li key={c.id}><CategoryCard category={c} compact /></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
