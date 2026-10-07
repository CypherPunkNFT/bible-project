import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProphetsRiver } from "@/components/study/ProphetsRiver";
import { cameFrom } from "@/lib/came-from";
import { kingFinder } from "@/lib/prophet-links";
import { prophetEra } from "@/lib/prophet-eras";
import { RefLink, StudyCredits, StudyHeader } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { bookByCode } from "@/lib/refs";
import { tone, type Tone } from "@/lib/sections";
import { loadPeople, loadProphets, type Prophet } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";

const KINDS: { id: Prophet["kind"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "writing", label: "Writing prophets" },
  { id: "prophet", label: "Other prophets" },
  { id: "nt", label: "New Testament" },
  { id: "false", label: "False prophets" },
];
const KIND_TONE: Record<Prophet["kind"], Tone> = { writing: "prophets", prophet: "history", nt: "gospels", false: "apocrypha" };
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function ProphetsPage() { return <ProphetsContent />; }

export function ProphetsContent({ embedded = false }: { embedded?: boolean }) {
  const prophets = useAsync(loadProphets, "prophets");
  // Every prophet, and the king beside them, opens their own page (owner, 2026-10-07).
  const people = useAsync(loadPeople, "people");
  const kingId = useMemo(() => (people.status === "ready" ? kingFinder(people.value) : () => undefined), [people]);
  const [kind, setKind] = useState<Prophet["kind"] | "all">("all");

  const shown = prophets.status === "ready" ? prophets.value.filter((p) => kind === "all" || p.kind === kind) : [];
  const eras = [...new Set(shown.map((p) => p.era))];

  return (
    <div className={embedded ? "min-w-0" : "mx-auto max-w-6xl px-4 pb-16 sm:px-6"}>
      {!embedded && <StudyHeader
        eyebrow="Study · Prophets"
        title="The prophets, in order."
        lead={
          <p>
            Every prophet and prophetess the Bible names, placed by the king Scripture says they served under — and the false prophets the text condemns. The
            sixteen whose books bear their names are marked.
          </p>
        }
      />}
      {prophets.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {prophets.status === "error" && <p className="text-muted">The prophets could not be loaded.</p>}
      {prophets.status === "ready" && (
        <>
          <div id="prophets-directory" className="study-section-anchor"><ProphetsRiver prophets={prophets.value} kingId={kingId} /></div>
          <h3 className="mt-10 font-serif text-2xl font-semibold">Every prophet, era by era</h3>
          <div role="group" aria-label="Show" className="mt-6 flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={kind === k.id}
                onClick={() => setKind(k.id)}
                className={cn("rounded-full border px-3 py-1 text-sm", kind === k.id ? "border-ink bg-ink font-semibold text-page" : "border-line hover:bg-surface-2")}
              >
                {k.label}
                {k.id !== "all" && <span className="ms-1 text-xs opacity-70">{prophets.value.filter((p) => p.kind === k.id).length}</span>}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-8">
            {eras.map((era) => (
              <section key={era} aria-labelledby={`era-${slug(era)}`}>
                <EraBar id={`era-${slug(era)}`} era={era} count={shown.filter((p) => p.era === era).length} />
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shown
                    .filter((p) => p.era === era)
                    .map((p) => (
                      <ProphetCard key={p.id} prophet={p} kingId={kingId} />
                    ))}
                </ol>
              </section>
            ))}
          </div>
          <StudyCredits>
            Who counts as a prophet is our own hand-checked list (people the Bible calls prophet, prophetess or seer, or shows prophesying). Names, families and
            summaries: STEP Bible's TIPNR data (
            <a className="underline" href="https://www.stepbible.org" rel="noreferrer">
              STEPBible.org
            </a>
            , CC BY 4.0; STEP notes its summaries were adapted from AI output, 2024; shown here without markup, era names
            shortened). Each "in the days of" comes from the verse given beside it; Joel, Obadiah, Nahum, Habakkuk and Malachi are not dated by any king in
            Scripture and are placed by era only.
          </StudyCredits>
        </>
      )}
    </div>
  );
}

function ProphetCard({ prophet, kingId }: { prophet: Prophet; kingId: (name: string) => string | undefined }) {
  const catalog = useCatalog();
  const book = prophet.book ? bookByCode(catalog, prophet.book) : undefined;
  const colors = tone(KIND_TONE[prophet.kind]);
  const role = prophet.kind === "false" ? (prophet.sex === "Female" ? "False prophetess" : "False prophet") : prophet.sex === "Female" ? "Prophetess" : "Prophet";
  return (
    <li id={`prophet-${prophet.id}`} className="relative scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent">
      {/* The kind of prophet, faded so the era bars lead (owner); the false prophets' grey is already quiet. */}
      <div className="h-1.5" style={{ background: prophet.kind === "false" ? colors.tab : `color-mix(in srgb, ${colors.tab} 40%, var(--surface))` }} aria-hidden />
      <div className="p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {role}
          {book && " · wrote a book"}
        </p>
        <h3 className={cn("font-serif text-xl font-semibold", prophet.kind === "false" && "text-muted")}>
          {/* The name's link covers the whole card; the king, the verse and the book sit above it. */}
          <Link to={`/people/${prophet.id}`} state={cameFrom("Prophets through time")} className="after:absolute after:inset-0 hover:text-accent">
            {prophet.name}
          </Link>
        </h3>
        {prophet.brief && <p className="mt-1 text-sm">{prophet.brief}</p>}
        <p className="mt-2 text-sm text-muted">
          {prophet.king ? (
            <>
              {prophet.king === "Moses" || prophet.king === "the judges" || prophet.king === "the exile" ? "In the time of " : "In the days of "}
              {kingId(prophet.king) ? <Link to={`/people/${kingId(prophet.king)}`} state={cameFrom("Prophets through time")} className="relative z-10 underline decoration-line underline-offset-2 hover:text-accent">{prophet.king}</Link> : prophet.king}
              {prophet.anchor && (
                <>
                  {" — "}
                  <span className="relative z-10"><RefLink span={prophet.anchor} /></span>
                </>
              )}
            </>
          ) : (
            "Not dated by any king in Scripture"
          )}
        </p>
        {book && (
          <p className="mt-2 text-sm">
            <Link to={`/read/kjv/${book.code}/1`} className="relative z-10 font-semibold underline decoration-line underline-offset-2 hover:text-accent">
              Read {book.name}
            </Link>
          </p>
        )}
      </div>
    </li>
  );
}

/** An era's heading as a bar in the colour of the part of the Bible that tells it, with its icon, dates and books. */
function EraBar({ id, era, count }: { id: string; era: string; count: number }) {
  const info = prophetEra(era), colors = tone(info.tone), Icon = info.icon;
  return (
    <h2 id={id} className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 sm:px-4" style={{ background: `linear-gradient(90deg, ${colors.tab}, color-mix(in srgb, ${colors.tab} 62%, transparent))`, color: colors.tabInk }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "color-mix(in srgb, currentColor 16%, transparent)" }} aria-hidden><Icon size={18} strokeWidth={1.75} /></span>
      <span className="min-w-0">
        <span className="block font-serif text-xl font-semibold leading-tight">{info.label}</span>
        <span className="block truncate text-xs font-normal opacity-85">{info.dates}{info.told && ` · told in ${info.told}`}</span>
      </span>
      <span className="ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, currentColor 16%, transparent)" }}>{count} {count === 1 ? "prophet" : "prophets"}</span>
    </h2>
  );
}
