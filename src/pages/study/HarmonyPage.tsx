import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PassageText, RefLink, StudyCredits, StudyHeader, StudySearch } from "@/components/study/StudyParts";
import { loadHarmony, shortRange, type HarmonySection, type Span } from "@/lib/study";
import { tone } from "@/lib/sections";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";

const GOSPELS = [
  { key: "MAT", name: "Matthew", short: "Mt" },
  { key: "MRK", name: "Mark", short: "Mk" },
  { key: "LUK", name: "Luke", short: "Lk" },
  { key: "JHN", name: "John", short: "Jn" },
] as const;
type GospelKey = (typeof GOSPELS)[number]["key"];

interface Row extends HarmonySection {
  part: number;
  partTitle: string;
}

export default function HarmonyPage() {
  const harmony = useAsync(loadHarmony, "harmony");
  const [query, setQuery] = useState("");
  const [only, setOnly] = useState<GospelKey[]>([]);
  const [exactly, setExactly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const rows: Row[] = useMemo(
    () => (harmony.status === "ready" ? harmony.value.parts.flatMap((p) => p.sections.map((s) => ({ ...s, part: p.n, partTitle: p.title }))) : []),
    [harmony],
  );
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase();
    return rows.filter((row) => {
      const has = GOSPELS.filter((g) => row.refs[g.key]).map((g) => g.key);
      if (only.length && !only.every((g) => has.includes(g))) return false;
      if (only.length && exactly && has.length !== only.length) return false;
      return !words || row.title.toLowerCase().includes(words) || row.items.some((i) => i.title.toLowerCase().includes(words));
    });
  }, [rows, query, only, exactly]);

  // A link such as /study/harmony#event-72 (from the Miracles page) opens that event.
  useEffect(() => {
    const n = /^#event-(\w+)$/.exec(window.location.hash)?.[1];
    if (!n || harmony.status !== "ready") return;
    setOpen(n);
    const timer = window.setTimeout(() => document.getElementById(`event-${n}`)?.scrollIntoView({ block: "start" }), 80);
    return () => window.clearTimeout(timer);
  }, [harmony.status]);

  const toggle = (key: GospelKey) => setOnly((list) => (list.includes(key) ? list.filter((g) => g !== key) : [...list, key]));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · Harmony of the Gospels"
        title="The four Gospels, side by side."
        lead={
          <p>
            Every event in the life of Christ in order, with where Matthew, Mark, Luke and John each tell it — A. T. Robertson's harmony of 1922, in his own
            fourteen parts. Open an event to read the Gospels next to one another.
          </p>
        }
      />
      {harmony.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {harmony.status === "error" && <p className="text-muted">The harmony could not be loaded.</p>}
      {harmony.status === "ready" && (
        <>
          <Coverage rows={rows} shown={shown} onPick={(n) => setOpen(n)} />
          <div className="sticky top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-10 -mx-4 mt-6 space-y-3 border-b border-line bg-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <StudySearch value={query} onChange={setQuery} label="Find an event, e.g. lepers" count={shown.length} total={rows.length} />
            <fieldset className="flex flex-wrap items-center gap-2 text-sm">
              <legend className="sr-only">Show only events told in</legend>
              <span className="text-muted">Told in:</span>
              {GOSPELS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={only.includes(g.key)}
                  onClick={() => toggle(g.key)}
                  className={cn("rounded-full border px-3 py-1", only.includes(g.key) ? "border-transparent font-semibold" : "border-line hover:bg-surface-2")}
                  style={only.includes(g.key) ? { background: tone("gospels").tab, color: tone("gospels").tabInk } : undefined}
                >
                  {g.name}
                </button>
              ))}
              <label className={cn("ms-1 flex items-center gap-1.5", !only.length && "opacity-50")}>
                <input type="checkbox" disabled={!only.length} checked={exactly} onChange={(e) => setExactly(e.target.checked)} className="accent-[var(--gospels)]" />
                and no other Gospel
              </label>
            </fieldset>
          </div>
          <HarmonyTable rows={shown} open={open} setOpen={setOpen} />
          <StudyCredits>
            Events, their order, the fourteen parts and the references: A. T. Robertson, <cite>A Harmony of the Gospels for Students of the Life of Christ</cite>{" "}
            (1922), public domain, from Project Gutenberg. His headings are shown in ordinary sentence case; references are his, checked against the King James
            text. Passages shown in the King James Version.
          </StudyCredits>
        </>
      )}
    </div>
  );
}

/** Four rows (one per Gospel) of 185 cells: where each Gospel tells the story. */
function Coverage({ rows, shown, onPick }: { rows: Row[]; shown: Row[]; onPick: (n: string) => void }) {
  const [hover, setHover] = useState<Row | null>(null);
  const visible = new Set(shown.map((r) => r.n));
  const colors = tone("gospels");
  // A filled block is dark green where all four Gospels tell the event, light green where three do.
  const blockColor = (row: Row) => {
    const told = GOSPELS.filter((g) => row.refs[g.key]).length;
    return told === 4 ? "#2e9e5b" : told === 3 ? "#9bd3b0" : colors.tab;
  };
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <div className="overflow-x-auto pb-1">
      <div className="min-w-[36rem] space-y-1" role="img" aria-label="Which Gospels tell each event, from the first event to the last">
        {GOSPELS.map((g) => (
          <div key={g.key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-right text-xs font-semibold text-muted">{g.name}</span>
            <div className="flex h-5 flex-1 gap-px">
              {rows.map((row) => (
                <span
                  key={row.n}
                  onMouseEnter={() => setHover(row)}
                  onClick={() => {
                    onPick(row.n);
                    document.getElementById(`event-${row.n}`)?.scrollIntoView({ block: "center" });
                  }}
                  className={cn("flex-1 cursor-pointer rounded-[1px]", !visible.has(row.n) && "opacity-25")}
                  style={{ background: row.refs[g.key] ? blockColor(row) : "var(--surface-2)" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
      <figcaption className="mt-2 min-h-[1.25rem] ps-16 text-xs text-muted">
        {hover ? (
          <>
            §{hover.n} {hover.title} — {GOSPELS.filter((g) => hover.refs[g.key]).map((g) => g.name).join(", ") || "no Gospel"}
          </>
        ) : (
          "Each column is one event, first to last. Filled = that Gospel tells it (dark green: all four tell it; light green: three). Point at one; click to go to it."
        )}
      </figcaption>
    </figure>
  );
}

function Refs({ spans }: { spans: Span[] | undefined }) {
  if (!spans) return <span className="text-muted/50" aria-label="not told">—</span>;
  return (
    <span className="flex flex-col">
      {spans.map((span) => (
        <RefLink key={span.join("-")} span={span} label={shortRange(span)} />
      ))}
    </span>
  );
}

function HarmonyTable({ rows, open, setOpen }: { rows: Row[]; open: string | null; setOpen: (n: string | null) => void }) {
  let lastPart = 0;
  return (
    <>
    <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1.5"><span className="harmony-all h-3 w-6 rounded-sm border border-line" aria-hidden />All four Gospels tell it</span>
      <span className="flex items-center gap-1.5"><span className="harmony-three h-3 w-6 rounded-sm border border-line" aria-hidden />Three tell it</span>
    </p>
    <div aria-hidden className="mt-3 hidden grid-cols-[2.5rem_minmax(0,1fr)_repeat(4,6.5rem)] gap-x-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted md:grid">
      <span />
      <span>Event</span>
      {GOSPELS.map((g) => (
        <span key={g.key}>{g.name}</span>
      ))}
    </div>
    <ol className="mt-2">
      {rows.map((row) => {
        const partHeading = row.part !== lastPart;
        lastPart = row.part;
        const isOpen = open === row.n;
        const told = GOSPELS.filter((g) => row.refs[g.key]).length;
        return (
          <li key={row.n} id={`event-${row.n}`} className="scroll-mt-48">
            {partHeading && (
              <h2 className="mb-1 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Part {row.part} · {row.partTitle}
              </h2>
            )}
            <div
              className={cn(
                "grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line py-2.5 md:grid-cols-[2.5rem_minmax(0,1fr)_repeat(4,6.5rem)]",
                isOpen ? "bg-surface" : told === 4 ? "harmony-all" : told === 3 ? "harmony-three" : "",
              )}
            >
              <span className="pt-0.5 text-right text-xs tabular-nums text-muted">§{row.n}</span>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`event-${row.n}-panel`}
                onClick={() => setOpen(isOpen ? null : row.n)}
                className="flex items-start gap-1.5 text-left font-medium hover:text-accent"
              >
                <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden />
                <span>{row.title}</span>
              </button>
              <div className="col-start-2 mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-sm md:col-start-auto md:mt-0 md:contents">
                {GOSPELS.map((g) => (
                  <div key={g.key} className="flex gap-1.5 md:block">
                    <span className="w-6 shrink-0 text-xs font-semibold text-muted md:hidden">{g.short}</span>
                    <Refs spans={row.refs[g.key]} />
                  </div>
                ))}
              </div>
              {row.refs.also && (
                <p className="col-start-2 mt-1 text-xs text-muted md:col-span-5">
                  Also:{" "}
                  {row.refs.also.map((span, i) => (
                    <span key={span.join("-")}>
                      {i > 0 && "; "}
                      <RefLink span={span} />
                    </span>
                  ))}
                </p>
              )}
            </div>
            {isOpen && <EventPanel row={row} />}
          </li>
        );
      })}
      {!rows.length && <li className="py-10 text-center text-muted">No event matches.</li>}
    </ol>
    </>
  );
}

function EventPanel({ row }: { row: Row }) {
  const told = GOSPELS.filter((g) => row.refs[g.key]);
  return (
    <section id={`event-${row.n}-panel`} aria-label={`${row.title}: the Gospel passages`} className="border-b border-line bg-surface px-3 pb-5 pt-3">
      <div className={cn("grid gap-5", told.length > 1 && "md:grid-cols-2", told.length > 2 && "xl:grid-cols-4")}>
        {told.map((g) => (
          <div key={g.key}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: tone("gospels").tab }}>
              {g.name}
            </h3>
            {row.refs[g.key]!.map((span) => (
              <div key={span.join("-")} className="mb-2">
                <PassageText span={span} max={30} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {row.items.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Within this event</h3>
          <ul className="space-y-1 text-sm">
            {row.items.map((item, i) => (
              <li key={i} className={cn(!item.refs && "mt-2 font-semibold")}>
                {item.title}
                {item.refs && (
                  <span className="text-muted">
                    {" — "}
                    {GOSPELS.filter((g) => item.refs?.[g.key]).map((g, j) => (
                      <span key={g.key}>
                        {j > 0 && "; "}
                        {g.short}{" "}
                        {item.refs![g.key]!.map((span, k) => (
                          <span key={k}>
                            {k > 0 && ", "}
                            <RefLink span={span} label={shortRange(span)} />
                          </span>
                        ))}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
