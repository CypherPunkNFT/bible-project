import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { PassageText, RefLink, StudyCredits, StudyHeader, StudySearch } from "@/components/study/StudyParts";
import { loadHarmony, shortRange, type HarmonySection, type Span } from "@/lib/study";
import { tone } from "@/lib/sections";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import "./harmony.css";

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

/** Move only the rows; scrollIntoView would also move the page and lose the coverage chart. */
function revealEvent(n: string) {
  const row = document.getElementById(`event-${n}`);
  const viewport = row?.closest<HTMLElement>(".harmony-rows");
  if (row && viewport) viewport.scrollTop += row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
}

export default function HarmonyPage({ embedded = false }: { embedded?: boolean }) {
  const location = useLocation();
  const workbench = useRef<HTMLDivElement>(null);
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

  // Include everything after this table, through the actual site footer, in the viewport budget.
  // The page's natural end then keeps the map and the entire filter strip above the event rows.
  useLayoutEffect(() => {
    const element = workbench.current;
    const main = document.getElementById("main");
    const pageFooter = main?.nextElementSibling;
    const pageHeader = main?.previousElementSibling;
    if (!embedded || !element || !main || !pageFooter || !pageHeader) return;
    const measure = () => {
      element.style.setProperty("--harmony-page-top", `${pageHeader.getBoundingClientRect().height + 16}px`);
      const tail = pageFooter.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom;
      element.style.setProperty("--harmony-page-tail", `${Math.max(0, tail)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const part of [main, pageHeader, pageFooter]) observer.observe(part);
    return () => observer.disconnect();
  }, [embedded, harmony.status]);

  // A link such as /study/harmony#event-72 (from the Miracles page) opens that event.
  useEffect(() => {
    const n = /^#event-(\w+)$/.exec(location.hash)?.[1];
    if ((!n && location.hash !== "#harmony") || harmony.status !== "ready") return;
    if (n) {
      setQuery("");
      setOnly([]);
      setExactly(false);
      setOpen(n);
    }
    const frame = requestAnimationFrame(() => {
      workbench.current?.scrollIntoView({ block: "start", behavior: "instant" });
      if (n) revealEvent(n);
    });
    return () => cancelAnimationFrame(frame);
  }, [harmony.status, location.hash]);

  const pickEvent = (n: string) => {
    if (!shown.some((row) => row.n === n)) {
      setQuery("");
      setOnly([]);
      setExactly(false);
    }
    setOpen(n);
    requestAnimationFrame(() => revealEvent(n));
  };

  const toggle = (key: GospelKey) => setOnly((list) => (list.includes(key) ? list.filter((g) => g !== key) : [...list, key]));

  return (
    <div className={embedded ? "gospel-harmony" : "mx-auto max-w-7xl px-4 pb-16 sm:px-6"}>
      {!embedded && <StudyHeader
        eyebrow="Study · Harmony of the Gospels"
        title="The four Gospels, side by side."
        lead={
          <p>
            Every event in the life of Christ in order, with where Matthew, Mark, Luke and John each tell it — A. T. Robertson's harmony of 1922, in his own
            fourteen parts. Open an event to read the Gospels next to one another.
          </p>
        }
      />}
      {harmony.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {harmony.status === "error" && <p className="text-muted">The harmony could not be loaded.</p>}
      {harmony.status === "ready" && (
        <>
          <div ref={workbench} className="harmony-workbench">
          <Coverage rows={rows} shown={shown} onPick={pickEvent} />
          <div className="harmony-filters space-y-3 border-y border-line bg-page py-3">
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
          </div>
          {!embedded && <StudyCredits><HarmonySource /></StudyCredits>}
        </>
      )}
    </div>
  );
}

export function HarmonySource() {
  return <span>A. T. Robertson, <cite>A Harmony of the Gospels for Students of the Life of Christ</cite> (1922), public domain, Project Gutenberg. Events, fourteen parts and references follow his harmony; headings use sentence case. References checked against the KJV; passages shown in the KJV. This order is not an independently established chronology.</span>;
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
    <figure className="harmony-coverage rounded-2xl border border-line bg-surface p-4">
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
                  onClick={() => onPick(row.n)}
                  data-event={row.n}
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
          "One column per event, first to last. Filled = that Gospel tells it. Select an event to read its accounts."
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
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLOListElement>(null);
  const outsideScroll = useRef<HTMLDivElement>(null);
  const outsideSize = useRef<HTMLDivElement>(null);
  const mirrored = useRef(new WeakMap<HTMLDivElement, number>());

  useLayoutEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
  }, [rows]);

  useLayoutEffect(() => {
    const syncSize = () => {
      if (!viewport.current || !outsideSize.current || !outsideScroll.current) return;
      outsideSize.current.style.height = `${viewport.current.scrollHeight}px`;
      mirrored.current.set(outsideScroll.current, viewport.current.scrollTop);
      outsideScroll.current.scrollTop = viewport.current.scrollTop;
    };
    syncSize();
    const observer = new ResizeObserver(syncSize);
    if (content.current) observer.observe(content.current);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  const syncScroll = (from: HTMLDivElement, to: HTMLDivElement | null) => {
    const expected = mirrored.current.get(from);
    mirrored.current.delete(from);
    if (expected !== undefined && Math.abs(expected - from.scrollTop) <= .5) return;
    if (to && Math.abs(to.scrollTop - from.scrollTop) > .5) {
      mirrored.current.set(to, from.scrollTop);
      to.scrollTop = from.scrollTop;
    }
  };
  let lastPart = 0;
  return (
    <div className="harmony-table">
    <div className="harmony-table-heading">
    <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1.5"><span className="harmony-all h-3 w-6 rounded-sm border border-line" aria-hidden />All four Gospels</span>
      <span className="flex items-center gap-1.5"><span className="harmony-three h-3 w-6 rounded-sm border border-line" aria-hidden />Three Gospels</span>
    </p>
    <div aria-hidden className="harmony-column-labels mt-3 hidden grid-cols-[2.5rem_minmax(0,6fr)_repeat(4,minmax(0,1fr))] gap-x-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted md:grid">
      <span />
      <span>Event</span>
      {GOSPELS.map((g) => (
        <span key={g.key}>{g.name}</span>
      ))}
    </div>
    </div>
    <div className="harmony-scroll-shell">
    <div ref={viewport} onScroll={(event) => syncScroll(event.currentTarget, outsideScroll.current)} className="harmony-rows no-scrollbar" role="region" aria-label="Gospel harmony events" tabIndex={0}>
    <ol ref={content}>
      {rows.map((row) => {
        const partHeading = row.part !== lastPart;
        lastPart = row.part;
        const isOpen = open === row.n;
        const told = GOSPELS.filter((g) => row.refs[g.key]).length;
        return (
          <li key={row.n} id={`event-${row.n}`}>
            {partHeading && (
              <h2 className="mb-1 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Part {row.part} · {row.partTitle}
              </h2>
            )}
            <div
              className={cn(
                "grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line py-2.5 md:grid-cols-[2.5rem_minmax(0,6fr)_repeat(4,minmax(0,1fr))]",
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
    </div>
    <div ref={outsideScroll} onScroll={(event) => syncScroll(event.currentTarget, viewport.current)} className="harmony-outside-scroll slim-scroll" aria-hidden="true" tabIndex={-1}><div ref={outsideSize} className="w-px" /></div>
    </div>
    </div>
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
