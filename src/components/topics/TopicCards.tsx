import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { categoryStyle } from "@/lib/topic-style";
import { categoryUrl, topicCount, type TopicCategory } from "@/lib/topics";

/** A topic category as a coloured card: icon, count, description, its subcategories peeking out. */
export function CategoryCard({ category, compact = false }: { category: TopicCategory; compact?: boolean }) {
  const { Icon, color, box } = categoryStyle(category.id);
  const shown = category.subcategories.slice(0, compact ? 3 : 4);
  const more = category.subcategories.length - shown.length;
  return (
    <Link to={categoryUrl(category.id)} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg" style={{ "--tone": color, "--tone-box": box } as CSSProperties}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
      <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 transition group-hover:scale-110" style={{ background: box }} />
      <span className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: color }}><Icon size={20} /></span>
        <span>
          <span className="block font-serif text-xl font-semibold leading-tight">{category.title}</span>
          <span className="text-xs text-muted">{topicCount(category)} topics · {category.subcategories.length} groups</span>
        </span>
      </span>
      {!compact && <span className="relative mt-3 text-sm text-muted">{category.description}</span>}
      <span className="relative mt-4 flex flex-wrap gap-1.5">
        {shown.map((sub) => <span key={sub.id} className="rounded-full px-2.5 py-1 text-xs" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>{sub.title}</span>)}
        {more > 0 && <span className="rounded-full px-2.5 py-1 text-xs text-muted">+{more} more</span>}
      </span>
      <span className="relative mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold" style={{ color }}>Explore <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
    </Link>
  );
}
