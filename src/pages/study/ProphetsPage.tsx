import { useState } from "react";
import { Link } from "react-router-dom";
import { RefLink, StudyCredits, StudyHeader } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { bookByCode } from "@/lib/refs";
import { tone, type Tone } from "@/lib/sections";
import { loadProphets, type Prophet } from "@/lib/study";
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
const ERA_LABEL: Record<string, string> = { Judges: "The Judges" };
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function ProphetsPage() {
  const prophets = useAsync(loadProphets, "prophets");
  const [kind, setKind] = useState<Prophet["kind"] | "all">("all");

  const shown = prophets.status === "ready" ? prophets.value.filter((p) => kind === "all" || p.kind === kind) : [];
  const eras = [...new Set(shown.map((p) => p.era))];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · Prophets"
        title="The prophets, in order."
        lead={
          <p>
            Every prophet and prophetess the Bible names, placed by the king Scripture says they served under — and the false prophets the text condemns. The
            sixteen whose books bear their names are marked.
          </p>
        }
      />
      <aside className="study-related-guide"><p>The prophets belong to the wider story of people and their relationships. Open a person's profile to follow their family and passages.</p><Link to="/study/people">Explore People & relationships →</Link></aside>
      {prophets.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {prophets.status === "error" && <p className="text-muted">The prophets could not be loaded.</p>}
      {prophets.status === "ready" && (
        <>
          <Timeline prophets={prophets.value} active={kind} />
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
                <h2 id={`era-${slug(era)}`} className="mb-3 font-serif text-2xl font-semibold">
                  {ERA_LABEL[era] ?? era}
                </h2>
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shown
                    .filter((p) => p.era === era)
                    .map((p) => (
                      <ProphetCard key={p.id} prophet={p} />
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

/** Era bands left to right, one dot per prophet, coloured by kind. */
function Timeline({ prophets, active }: { prophets: Prophet[]; active: Prophet["kind"] | "all" }) {
  const eras = [...new Set(prophets.map((p) => p.era))];
  const [hover, setHover] = useState<Prophet | null>(null);
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {eras.map((era) => {
          const here = prophets.filter((p) => p.era === era);
          return (
            <div key={era} className="min-w-[3.5rem]" style={{ flexGrow: here.length, flexBasis: 0 }}>
              <div className="flex min-h-[3.25rem] flex-wrap content-end gap-1 rounded-t-lg bg-surface-2 p-1.5">
                {here.map((p) => (
                  <a
                    key={p.id}
                    href={`#prophet-${p.id}`}
                    aria-label={`${p.name}, ${p.kind === "false" ? "false prophet" : "prophet"}`}
                    onMouseEnter={() => setHover(p)}
                    onFocus={() => setHover(p)}
                    className={cn("h-3.5 w-3.5 rounded-full ring-offset-1 hover:ring-2 hover:ring-ink", active !== "all" && active !== p.kind && "opacity-20")}
                    style={{ background: tone(KIND_TONE[p.kind]).tab }}
                  />
                ))}
              </div>
              <p className="truncate border-t-2 border-ink/70 pt-1 text-center text-[11px] text-muted">{ERA_LABEL[era] ?? era}</p>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
        <span className="min-h-[1.25rem]">{hover ? `${hover.name} — ${hover.brief || hover.era}` : "Each dot is one prophet, in time order. Point at one; click to go to it."}</span>
        <span className="flex flex-wrap gap-3">
          {KINDS.filter((k) => k.id !== "all").map((k) => (
            <span key={k.id} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone(KIND_TONE[k.id as Prophet["kind"]]).tab }} aria-hidden />
              {k.label}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

function ProphetCard({ prophet }: { prophet: Prophet }) {
  const catalog = useCatalog();
  const book = prophet.book ? bookByCode(catalog, prophet.book) : undefined;
  const colors = tone(KIND_TONE[prophet.kind]);
  const role = prophet.kind === "false" ? (prophet.sex === "Female" ? "False prophetess" : "False prophet") : prophet.sex === "Female" ? "Prophetess" : "Prophet";
  return (
    <li id={`prophet-${prophet.id}`} className="scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-1.5" style={{ background: colors.tab }} aria-hidden />
      <div className="p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {role}
          {book && " · wrote a book"}
        </p>
        <h3 className={cn("font-serif text-xl font-semibold", prophet.kind === "false" && "text-muted")}>
          <Link to={`/study/people/${prophet.id}`} className="hover:text-accent">
            {prophet.name}
          </Link>
        </h3>
        {prophet.brief && <p className="mt-1 text-sm">{prophet.brief}</p>}
        <p className="mt-2 text-sm text-muted">
          {prophet.king ? (
            <>
              {prophet.king === "Moses" || prophet.king === "the judges" || prophet.king === "the exile" ? `In the time of ${prophet.king}` : `In the days of ${prophet.king}`}
              {prophet.anchor && (
                <>
                  {" — "}
                  <RefLink span={prophet.anchor} />
                </>
              )}
            </>
          ) : (
            "Not dated by any king in Scripture"
          )}
        </p>
        {book && (
          <p className="mt-2 text-sm">
            <Link to={`/read/kjv/${book.code}/1`} className="font-semibold underline decoration-line underline-offset-2 hover:text-accent">
              Read {book.name}
            </Link>
          </p>
        )}
      </div>
    </li>
  );
}
