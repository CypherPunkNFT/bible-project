import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { groupOf, VERSION_GROUPS } from "@/lib/languages";
import type { Translation } from "@/lib/types";

// One colour per group (English, original and ancient languages, translations), shared with the versions lists.
const GROUP_COLOR: Record<string, string> = { english: "var(--history)", original: "var(--prophets)", translations: "var(--gospels)" };
const START = 1350;
const END = 2030;

/** Every version placed on a time axis by the year of the text it carries. */
export function VersionsTimeline() {
  const catalog = useCatalog();
  const sorted = [...catalog.translations].sort((a, b) => a.year - b.year);
  const early = sorted.filter((t) => t.year < START);
  const later = sorted.filter((t) => t.year >= START);
  // Stack dots that would collide into rows.
  const rows: Translation[][] = [];
  for (const t of later) {
    const row = rows.find((r) => t.year - r[r.length - 1].year >= 14);
    if (row) row.push(t);
    else rows.push([t]);
  }
  const left = (year: number) => `${((year - START) / (END - START)) * 100}%`;

  return (
    <div>
      <div className="relative overflow-x-auto pb-2">
        <div className="relative min-w-[720px]" style={{ height: rows.length * 34 + 40 }}>
          {[1400, 1500, 1600, 1700, 1800, 1900, 2000].map((year) => (
            <div key={year} className="absolute bottom-0 top-0 border-l border-dashed border-line" style={{ left: left(year) }}>
              <span className="absolute bottom-0 -translate-x-1/2 text-[11px] text-muted">{year}</span>
            </div>
          ))}
          {rows.map((row, r) =>
            row.map((t) => (
              <Link
                key={t.slug}
                to={`/read/${t.slug}/${Object.keys(t.books)[0]}/1`}
                title={`${t.name} (${t.year})`}
                className="absolute flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-line bg-surface px-2 py-0.5 text-xs shadow-sm transition hover:z-10 hover:scale-110"
                style={{ left: left(t.year), top: r * 34 + 4 }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[groupOf(t.lang).id] }} />
                <strong>{t.abbr}</strong> <span className="text-muted">{t.year}</span>
              </Link>
            )),
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {VERSION_GROUPS.map((g) => (
          <span key={g.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[g.id] }} /> {g.title}
          </span>
        ))}
        {early.map((t) => (
          <span key={t.slug}>
            · Off the left edge: <strong className="text-ink">{t.abbr}</strong> — the Leningrad Codex, copied about {t.year} AD.
          </span>
        ))}
      </div>
    </div>
  );
}
