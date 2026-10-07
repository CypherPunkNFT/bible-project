import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { categoryStyle, groupIcon } from "@/lib/topic-style";
import { categoryUrl, topicCount, type TopicCategory } from "@/lib/topics";

const GROUPS_SHOWN = 6;

/** A compact family card: the whole card is one link, its groups peeking out as chips. */
function CompactCategoryCard({ category }: { category: TopicCategory }) {
  const { Icon, color, box } = categoryStyle(category.id);
  const shown = category.subcategories.slice(0, 3);
  const more = category.subcategories.length - shown.length;
  return (
    <Link to={categoryUrl(category.id)} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
      <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 transition group-hover:scale-110" style={{ background: box }} />
      <span className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: color }}><Icon size={20} /></span>
        <span>
          <span className="block font-serif text-xl font-semibold leading-tight">{category.title}</span>
          <span className="text-xs text-muted">{topicCount(category)} topics · {category.subcategories.length} groups</span>
        </span>
      </span>
      <span className="relative mt-4 flex flex-wrap gap-1.5">
        {shown.map((sub) => <span key={sub.id} className="rounded-full px-2.5 py-1 text-xs" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>{sub.title}</span>)}
        {more > 0 && <span className="rounded-full px-2.5 py-1 text-xs text-muted">+{more} more</span>}
      </span>
      <span className="relative mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold" style={{ color }}>Explore <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
    </Link>
  );
}

/** A topic family as a coloured card: icon, count and description, then each group as its own small icon card. */
export function CategoryCard({ category, compact = false }: { category: TopicCategory; compact?: boolean }) {
  if (compact) return <CompactCategoryCard category={category} />;
  const { Icon, color, box } = categoryStyle(category.id);
  const shown = category.subcategories.slice(0, GROUPS_SHOWN);
  const more = category.subcategories.length - shown.length;
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
      <span aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-25" style={{ background: box }} />
      <Link to={categoryUrl(category.id)} className="group relative flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: color }}><Icon size={24} /></span>
        <span>
          <span className="block font-serif text-2xl font-semibold leading-tight group-hover:underline">{category.title}</span>
          <span className="text-xs text-muted">{topicCount(category)} topics · {category.subcategories.length} groups</span>
        </span>
      </Link>
      <p className="relative mt-2 text-sm text-muted">{category.description}</p>
      <ul className="relative mt-4 grid grid-cols-2 gap-2">
        {shown.map((sub) => {
          const GroupIcon = groupIcon(sub.id);
          return (
            <li key={sub.id}>
              <Link to={categoryUrl(category.id, sub.id)} className="flex h-full items-center gap-2.5 rounded-xl border border-line bg-page p-2.5 text-sm leading-tight transition hover:-translate-y-0.5 hover:border-current hover:shadow" style={{ color: "var(--ink)" }}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}><GroupIcon size={17} /></span>
                <span><span className="block font-semibold">{sub.title}</span><span className="text-xs text-muted">{sub.topics.length} topics</span></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to={categoryUrl(category.id)} className="group relative mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold" style={{ color }}>
        {more > 0 ? `All ${category.subcategories.length} groups` : `Explore ${category.title}`} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
      </Link>
    </article>
  );
}
