import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { NamesOfGod as NamesSection } from "@/components/names/NamesOfGod";
import { useMemo, useState } from "react";
import { PassageText, RefLink, StudyCredits, StudySearch } from "@/components/study/StudyParts";
import { tone, type Tone } from "@/lib/sections";
import { loadNames, type NamesOfGod } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";

type Name = NamesOfGod["groups"][number]["names"][number];
const GROUP_TONE: Record<string, Tone> = { father: "poetry", son: "gospels", spirit: "epistles" };

/** Names of God: exactly the CypherPunk Faith page's section, then every name as a searchable list. */
export default function NamesPage() {
  const [listOpen, setListOpen] = useState(false);
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link to="/study" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Study
        </Link>
      </div>
      <div className="mt-4">
        <NamesSection headingLevel="h1" />
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <button
          type="button"
          aria-expanded={listOpen}
          aria-controls="names-list"
          onClick={() => setListOpen(!listOpen)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", listOpen && "rotate-180")} aria-hidden />
          Search all 302 names as a list
        </button>
      </div>
      {listOpen && (
        <div id="names-list">
          <NamesList />
        </div>
      )}
      {!listOpen && (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <StudyCredits>
            The names, their three groups and their order are the ones chosen for the Faith page of the CypherPunk NFT site, shown here the same way; compiled
            from R. A. Torrey's <cite>New Topical Text Book</cite> (1897, public domain) and other references. Verses in the King James Version.
          </StudyCredits>
        </div>
      )}
    </>
  );
}

function NamesList() {
  const names = useAsync(loadNames, "names");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"groups" | "az">("groups");
  const [open, setOpen] = useState<string | null>(null);

  const words = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      names.status === "ready"
        ? names.value.groups.map((g) => ({ ...g, names: g.names.filter((n) => !words || n.name.toLowerCase().includes(words) || n.note.toLowerCase().includes(words)) }))
        : [],
    [names, words],
  );
  const total = names.status === "ready" ? names.value.groups.reduce((sum, g) => sum + g.names.length, 0) : 0;
  const count = groups.reduce((sum, g) => sum + g.names.length, 0);
  const alphabetical = useMemo(
    () => groups.flatMap((g) => g.names.map((n) => ({ ...n, group: g.key, label: g.label }))).sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
      {names.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {names.status === "error" && <p className="text-muted">The names could not be loaded.</p>}
      {names.status === "ready" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StudySearch value={query} onChange={setQuery} label="Find a name, e.g. Shepherd" count={count} total={total} />
            <div role="group" aria-label="View" className="flex rounded-full border border-line p-0.5 text-sm">
              {(["groups", "az"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("rounded-full px-3 py-1", view === v && "bg-ink font-semibold text-page")}>
                  {v === "groups" ? "Father · Son · Spirit" : "A to Z"}
                </button>
              ))}
            </div>
          </div>
          {view === "groups" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                  <h2 id={`group-${group.key}`} className="mb-2 flex items-baseline justify-between rounded-t-xl px-3 py-2 font-serif text-xl font-semibold" style={{ background: tone(GROUP_TONE[group.key]).tab, color: tone(GROUP_TONE[group.key]).tabInk }}>
                    {group.label}
                    <span className="font-sans text-sm font-normal opacity-80">{group.names.length}</span>
                  </h2>
                  <ul className="divide-y divide-line rounded-b-xl border border-t-0 border-line bg-surface">
                    {group.names.map((n) => (
                      <NameRow key={n.id} name={n} open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)} />
                    ))}
                    {!group.names.length && <li className="px-3 py-4 text-sm text-muted">No name matches.</li>}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface sm:columns-2 sm:divide-y-0">
              {alphabetical.map((n) => (
                <NameRow key={n.id} name={n} open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)} badge={n.label} badgeTone={GROUP_TONE[n.group]} />
              ))}
            </ul>
          )}
          <StudyCredits>
            The list, its three groups and its order are the ones chosen for the Faith page of the CypherPunk NFT site, compiled from R. A. Torrey's{" "}
            <cite>New Topical Text Book</cite> (1897, public domain) and other references. Verses shown in the King James Version.
          </StudyCredits>
        </>
      )}
    </div>
  );
}

function NameRow({ name, open, onToggle, badge, badgeTone }: { name: Name; open: boolean; onToggle: () => void; badge?: string; badgeTone?: Tone }) {
  const panel = `name-${name.id}`;
  return (
    <li className="break-inside-avoid">
      <button type="button" aria-expanded={open} aria-controls={panel} onClick={onToggle} className="flex w-full items-start gap-1.5 px-3 py-2 text-left hover:text-accent">
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        <span className="flex-1 font-medium">{name.name}</span>
        {badge && badgeTone && (
          <span className="mt-0.5 shrink-0 rounded-full px-2 text-[11px]" style={{ background: tone(badgeTone).box }}>
            {badge.replace("The ", "")}
          </span>
        )}
        <span className="mt-0.5 shrink-0 text-xs text-muted">{name.refs.length}</span>
      </button>
      {open && (
        <div id={panel} role="region" aria-label={name.name} className="space-y-2 px-3 pb-3 ps-9">
          {name.note && <p className="text-sm italic text-muted">{name.note}</p>}
          {name.refs.map((span) => (
            <div key={span.join("-")}>
              <p className="text-xs font-semibold text-muted">
                <RefLink span={span} />
              </p>
              <PassageText span={span} max={6} />
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
