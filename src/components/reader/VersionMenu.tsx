import { Check, Columns2 } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import type { Translation } from "@/lib/types";
import { cn } from "@/lib/utils";

const LANGUAGE_GROUPS: [string, string[]][] = [
  ["English", ["en", "enm"]],
  ["Hebrew", ["he"]],
  ["Greek", ["grc"]],
  ["Latin", ["la"]],
];

const MAX_SIDE_BY_SIDE = 2;

interface Props {
  bookCode: string;
  current: Translation;
  parallel: Translation[];
  onRead: (slug: string) => void;
  onParallel: (slugs: string[]) => void;
}

/** Every version as one row: click the row to read in it, the column button to add it side by side. */
export function VersionMenu({ bookCode, current, parallel, onRead, onParallel }: Props) {
  const catalog = useCatalog();
  const parallelSlugs = parallel.map((p) => p.slug);
  const toggleParallel = (slug: string) =>
    onParallel(parallelSlugs.includes(slug) ? parallelSlugs.filter((s) => s !== slug) : [...parallelSlugs, slug]);

  return (
    <div className="max-h-[min(70vh,36rem)] overflow-y-auto overscroll-contain p-2">
      <p className="px-2 pb-2 pt-1 text-xs text-muted">Choose a version. The column button reads it side by side (up to {MAX_SIDE_BY_SIDE}).</p>
      {LANGUAGE_GROUPS.map(([group, langs]) => {
        const versions = catalog.translations.filter((t) => langs.includes(t.lang));
        return (
          <section key={group} aria-label={group} className="mb-2">
            <h3 className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{group}</h3>
            <ul>
              {versions.map((t) => {
                const has = !!t.books[bookCode];
                const isCurrent = t.slug === current.slug;
                const isParallel = parallelSlugs.includes(t.slug);
                const canAdd = has && !isCurrent && (isParallel || parallel.length < MAX_SIDE_BY_SIDE);
                return (
                  <li key={t.slug} className={cn("flex items-center gap-1 rounded-xl", isCurrent && "bg-surface-2")}>
                    <button
                      type="button"
                      disabled={!has}
                      onClick={() => onRead(t.slug)}
                      aria-current={isCurrent ? "true" : undefined}
                      className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="w-12 shrink-0 font-semibold">{t.abbr}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{t.name}</span>
                        <span className="block text-xs text-muted">{has ? t.year : `${t.year} · does not include this book`}</span>
                      </span>
                      {isCurrent && <Check className="h-4 w-4 shrink-0 text-accent" aria-label="reading now" />}
                    </button>
                    <button
                      type="button"
                      disabled={!canAdd}
                      onClick={() => toggleParallel(t.slug)}
                      aria-pressed={isParallel}
                      aria-label={isParallel ? `Remove ${t.abbr} from side by side` : `Read ${t.abbr} side by side`}
                      title={isParallel ? "Remove from side by side" : "Read side by side"}
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink disabled:invisible",
                        isParallel && "bg-accent/15 text-accent",
                      )}
                    >
                      <Columns2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
