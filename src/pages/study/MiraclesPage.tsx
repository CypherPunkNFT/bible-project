import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PassageText, RefLink, StudyCredits, StudyHeader, StudySearch } from "@/components/study/StudyParts";
import { loadStudyIndex, loadHarmony, loadMiracles, shortRange, type HarmonySection, type Span } from "@/lib/study";
import { tone, type Tone } from "@/lib/sections";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";

const GOSPELS = [
  ["MAT", "Mt"],
  ["MRK", "Mk"],
  ["LUK", "Lk"],
  ["JHN", "Jn"],
] as const;

interface Item {
  key: string;
  title: string;
  refs: Span[];
  gospels?: HarmonySection["refs"];
  section?: string;
}
interface Group {
  who: string;
  testament: "old" | "new";
  items: Item[];
}

const OLD_TESTAMENT_LAST_BOOK = 39;

export default function MiraclesPage() {
  const miracles = useAsync(loadMiracles, "miracles");
  const harmony = useAsync(loadHarmony, "harmony");
  const index = useAsync(loadStudyIndex, "study-index");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const groups: Group[] = useMemo(() => {
    if (miracles.status !== "ready" || harmony.status !== "ready") return [];
    const sections = new Map(harmony.value.parts.flatMap((p) => p.sections).map((s) => [s.n, s]));
    const christ: Group = {
      who: "Jesus",
      testament: "new",
      items: miracles.value.christ.map((m, i) => {
        const section = sections.get(m.section)!;
        const refs = GOSPELS.flatMap(([g]) => section.refs[g] ?? []);
        return { key: `christ-${i}`, title: m.title, refs, gospels: section.refs, section: m.section };
      }),
    };
    const servants = miracles.value.servants.map((g, gi) => ({
      who: g.who,
      testament: Math.floor(g.items[0].refs[0][0] / 1_000_000) > OLD_TESTAMENT_LAST_BOOK ? ("new" as const) : ("old" as const),
      items: g.items.map((item, i) => ({ key: `s${gi}-${i}`, title: item.title, refs: item.refs })),
    }));
    return [christ, ...servants];
  }, [miracles, harmony]);

  const words = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !words || i.title.toLowerCase().includes(words) || g.who.toLowerCase().includes(words)) }))
    .filter((g) => g.items.length);
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const shownCount = filtered.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · Miracles"
        title="Miracles in the Bible."
        lead={<p>The miracles of Jesus, each with every Gospel that tells it, and the miracles worked through Moses, the prophets and the apostles. Open one to read it.</p>}
      />
      {(miracles.status === "loading" || harmony.status === "loading") && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {(miracles.status === "error" || harmony.status === "error") && <p className="text-muted">The miracles could not be loaded.</p>}
      {groups.length > 0 && miracles.status === "ready" && (
        <>
          <WhoChart groups={groups} />
          <div className="mt-6">
            <StudySearch value={query} onChange={setQuery} label="Find a miracle or a name" count={shownCount} total={total} />
          </div>
          <div className="mt-6 space-y-8">
            {filtered.map((group) => (
              <section key={group.who} aria-labelledby={`who-${group.who}`}>
                <h2 id={`who-${group.who}`} className="mb-2 flex items-baseline gap-2 font-serif text-2xl font-semibold">
                  <span className="h-3 w-3 self-center rounded-full" style={{ background: tone(groupTone(group)).tab }} aria-hidden />
                  {group.who === "Jesus" ? "The miracles of Jesus" : group.who}
                  <span className="font-sans text-sm font-normal text-muted">{group.items.length}</span>
                </h2>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {group.items.map((item) => (
                    <MiracleRow key={item.key} item={item} open={open === item.key} onToggle={() => setOpen(open === item.key ? null : item.key)} />
                  ))}
                </ul>
              </section>
            ))}
            {!filtered.length && <p className="py-10 text-center text-muted">No miracle matches.</p>}
          </div>
          {!words && (
            <section aria-labelledby="evil" className="mt-10 rounded-2xl border border-dashed border-line p-4">
              <h2 id="evil" className="font-serif text-xl font-semibold">Signs worked against God</h2>
              <p className="mt-1 text-sm text-muted">Torrey also lists wonders done through other powers. Only the events he names are shown here.</p>
              <ul className="mt-2 space-y-1 text-sm">
                {miracles.value.evil.map((item) => (
                  <li key={item.title}>
                    {item.title} —{" "}
                    {item.refs.map((span, i) => (
                      <span key={i}>
                        {i > 0 && "; "}
                        <RefLink span={span} />
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <StudyCredits>
            The miracles of Jesus: A. T. Robertson's list in <cite>A Harmony of the Gospels</cite> (1922), each tied to its event in his harmony —{" "}
            <Link className="underline" to="/study/harmony">
              see the Harmony
            </Link>
            . Other miracles: R. A. Torrey, <cite>The New Topical Text Book</cite> (1897), "Miracles Wrought Through Servants of God" and the examples under
            "Miracles Through Evil Agents". Both public domain. Every reference is checked against the King James text
            {index.status === "ready" && index.value.corrections.length > 0 && (
              <>
                ; corrected misprints:{" "}
                {index.value.corrections.map((c) => `${c.where} — printed ${c.printed}, corrected to ${c.corrected} (${c.why})`).join(" · ")}
              </>
            )}
            .
          </StudyCredits>
        </>
      )}
    </div>
  );
}

function groupTone(group: Group): Tone {
  if (group.who === "Jesus") return "gospels";
  return group.testament === "new" ? "acts" : "prophets";
}

/** Who worked how many: one bar per person, counting events (not the number of Gospels telling them). */
function WhoChart({ groups }: { groups: Group[] }) {
  const max = Math.max(...groups.map((g) => g.items.length));
  const sorted = [...groups].sort((a, b) => b.items.length - a.items.length);
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Through whom — events, not tellings</figcaption>
      <ol className="space-y-1">
        {sorted.map((g) => (
          <li key={g.who} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-2 text-sm">
            <a href={`#who-${g.who}`} className="truncate text-right hover:text-accent">
              {g.who}
            </a>
            <span className="h-3.5 rounded-sm" style={{ width: `${Math.max(2, (g.items.length / max) * 100)}%`, background: tone(groupTone(g)).tab }} />
            <span className="tabular-nums text-muted">{g.items.length}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: tone("prophets").tab }} />Old Testament</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: tone("gospels").tab }} />Jesus</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: tone("acts").tab }} />The apostles and the church</span>
      </p>
    </figure>
  );
}

function MiracleRow({ item, open, onToggle }: { item: Item; open: boolean; onToggle: () => void }) {
  const panel = `miracle-${item.key}`;
  return (
    <li className={cn(open && "bg-page/40")}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5">
        <button type="button" aria-expanded={open} aria-controls={panel} onClick={onToggle} className="flex min-w-[12rem] flex-1 items-start gap-1.5 text-left font-medium hover:text-accent">
          <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
          {item.title}
        </button>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {item.gospels
            ? GOSPELS.filter(([g]) => item.gospels?.[g]).map(([g, short]) => (
                <span key={g} className="whitespace-nowrap">
                  <span className="me-1 text-xs font-semibold text-muted">{short}</span>
                  {item.gospels![g]!.map((span, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      <RefLink span={span} label={shortRange(span)} />
                    </span>
                  ))}
                </span>
              ))
            : item.refs.map((span, i) => (
                <span key={i} className="whitespace-nowrap">
                  <RefLink span={span} />
                </span>
              ))}
        </span>
      </div>
      {open && (
        <div id={panel} role="region" aria-label={item.title} className="space-y-3 px-3 pb-4 ps-9">
          {item.refs.slice(0, item.gospels ? 4 : 3).map((span) => (
            <div key={span.join("-")}>
              <p className="mb-0.5 text-xs font-semibold text-muted">
                <RefLink span={span} />
              </p>
              <PassageText span={span} max={18} />
            </div>
          ))}
          {item.section && (
            <p className="text-xs text-muted">
              Event §{item.section} in the <Link className="underline" to="/study/harmony">Harmony of the Gospels</Link>.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
