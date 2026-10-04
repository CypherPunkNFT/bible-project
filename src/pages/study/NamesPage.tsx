import { ChevronDown } from "lucide-react";
import { NamesOfGod as NamesSection } from "@/components/names/NamesOfGod";
import { useMemo, useState } from "react";
import { PassageText, RefLink, StudyCredits, StudyHeader, StudySearch } from "@/components/study/StudyParts";
import { loadNames, type NamesOfGod } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";

type Name = NamesOfGod["groups"][number]["names"][number];
// The same gold, blue and green as the three words above (tokens in components/names/names-of-god.css).
const GROUP_COLOR: Record<string, string> = { father: "var(--name-father)", son: "var(--name-son)", spirit: "var(--name-spirit)" };
// Named like the three words above.
const GROUP_TITLE: Record<string, string> = { father: "Abba Father", son: "Jesus Christ", spirit: "Holy Spirit" };

/** Names of God: the Faith page's three word fields in this site's page, then every name in the same colours. */
export default function NamesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · Names of God"
        title="His names."
        titleId="names-title"
        lead={<p>Names and titles of God as revealed in Scripture. Click a word to unfold its names, then click a name to read its passages.</p>}
      />
      <div id="names-explorer" className="study-section-anchor"><NamesSection labelledBy="names-title" /></div>
      <NamesList />
      <StudyCredits>
        The names, their three groups and their order are the ones chosen for the Faith page of the CypherPunk NFT site, shown here the same way; compiled from
        R. A. Torrey's <cite>New Topical Text Book</cite> (1897, public domain) and other references. Verses in the King James Version.
      </StudyCredits>
    </div>
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
    <section id="names-list" aria-labelledby="names-list-title" className="study-section-anchor pt-10">
      <h2 id="names-list-title" className="mb-4 font-serif text-2xl font-semibold sm:text-3xl">
        Every name
      </h2>
      {names.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}
      {names.status === "error" && <p className="text-muted">The names could not be loaded.</p>}
      {names.status === "ready" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StudySearch value={query} onChange={setQuery} label="Find a name, e.g. Shepherd" count={count} total={total} />
            <div role="group" aria-label="View" className="flex rounded-full border border-line p-0.5 text-sm">
              {(["groups", "az"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("rounded-full px-3 py-1", view === v && "bg-ink font-semibold text-page")}>
                  {v === "groups" ? "In three groups" : "A to Z"}
                </button>
              ))}
            </div>
          </div>
          {view === "groups" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                  <h3 id={`group-${group.key}`} className="flex items-baseline justify-between rounded-t-xl px-3 py-2 font-serif text-xl font-semibold text-white" style={{ background: GROUP_COLOR[group.key] }}>
                    {GROUP_TITLE[group.key]}
                    <span className="font-sans text-sm font-normal opacity-80">{group.names.length}</span>
                  </h3>
                  <ul className="divide-y divide-line rounded-b-xl border border-t-0 border-line bg-surface">
                    {group.names.map((n) => (
                      <NameRow key={n.id} name={n} color={GROUP_COLOR[group.key]} open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)} />
                    ))}
                    {!group.names.length && <li className="px-3 py-4 text-sm text-muted">No name matches.</li>}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface sm:columns-2 sm:divide-y-0">
              {alphabetical.map((n) => (
                <NameRow key={n.id} name={n} color={GROUP_COLOR[n.group]} open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)} badge={GROUP_TITLE[n.group]} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/** One name; its colour (the same as its word above) marks the row and its badge. */
function NameRow({ name, color, open, onToggle, badge }: { name: Name; color: string; open: boolean; onToggle: () => void; badge?: string }) {
  const panel = `name-${name.id}`;
  return (
    <li className="break-inside-avoid border-s-[3px]" style={{ borderColor: color }}>
      <button type="button" aria-expanded={open} aria-controls={panel} onClick={onToggle} className="flex w-full items-start gap-1.5 px-3 py-2 text-left hover:text-accent">
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        <span className="flex-1 font-medium">{name.name}</span>
        {badge && (
          <span className="mt-0.5 shrink-0 rounded-full px-2 text-[11px] font-semibold text-white" style={{ background: color }}>
            {badge}
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
