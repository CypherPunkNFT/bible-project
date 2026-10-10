import { ArrowUpRight, Search } from "lucide-react";
import { useState } from "react";
import type { Directory, SourceProfile } from "./types";

const categories = [["all", "All sources"], ["library", "Libraries & ministries"], ["data", "Scripture, study & atlas"], ["software", "Search tools"]] as const;
const number = (value: number) => value.toLocaleString();

function Provider({ source }: { source: SourceProfile }) {
  return <tr className="align-top">
    <th scope="row" className="w-[24%] px-4 py-4 text-left font-medium">{source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">{source.name} <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden /></a> : source.name}</th>
    <td className="w-[18%] px-4 py-4 text-xs leading-relaxed text-muted">{source.formats.map(format => format.replace(/^\./, "").toUpperCase()).join(", ") || "\u2014"}</td>
    <td className="px-4 py-4 text-right tabular-nums">{source.files === undefined ? "\u2014" : number(source.files)}</td>
    <td className="px-4 py-4 text-right tabular-nums text-accent">{source.files === undefined ? "\u2014" : number(source.textReady || 0)}</td>
    <td className="px-4 py-4 text-right tabular-nums">{source.files === undefined ? "\u2014" : number(source.pending || 0)}</td>
    <td className="w-[24%] px-4 py-4 text-xs">
      <details><summary className="cursor-pointer whitespace-nowrap text-accent">Edition notes & credits</summary>
        {source.bytes !== undefined && <p className="mt-3 text-muted">Storage: {(source.bytes / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB</p>}
        <p className="mt-3 leading-relaxed text-muted">{source.terms}</p>
        {source.channel && <p className="mt-3 leading-relaxed text-muted">{source.channel}</p>}
      </details>
    </td>
  </tr>;
}

export function SourceProviders({ directory }: { directory: Directory }) {
  const [category, setCategory] = useState("library");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(12);
  const profiles: SourceProfile[] = directory.sourceProfiles || directory.sources.map(source => ({ id: source.id, name: source.name, url: source.url, category: "library" as const, formats: [], terms: "Consult the original edition for its author, contributor credits and terms.", channel: source.role.replace(/-/g, " ") }));
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = profiles.filter(source => (category === "all" || source.category === category) && terms.every(term => `${source.name} ${source.formats.join(" ")} ${source.channel}`.toLocaleLowerCase().includes(term)))
    .sort((a, b) => (b.files || 0) - (a.files || 0) || a.name.localeCompare(b.name));
  const hosts = new Set(profiles.filter(source => source.url).map(source => new URL(source.url!).hostname.replace(/^www\./, "")));
  const aliases = new Set(["github.com", "wp.me", "tabletalkmagazine.com"]);
  const discovery = directory.sources.filter(source => !hosts.has(new URL(source.url).hostname.replace(/^www\./, "")) && !aliases.has(new URL(source.url).hostname.replace(/^www\./, "")));
  return <section id="repositories" className="scroll-mt-24 py-8">
    <h2 className="font-serif text-3xl">Libraries, archives & ministries.</h2>
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">The providers behind the collection, with links to their catalogues and edition notes.</p>
    <p className="mt-4 text-xs leading-relaxed text-muted">{profiles.length} documented source profiles. Held files include metadata and supporting files; searchable texts can be books, sermons, articles or reference records. File totals are not book counts.</p>
    {directory.sourceProfilesMeasuredAt && <p className="mt-2 text-xs text-muted">Source holdings recorded {new Date(directory.sourceProfilesMeasuredAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}. These are dated snapshots.</p>}
    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Source type">{categories.map(([id, label]) => <button key={id} type="button" aria-pressed={category === id} onClick={() => { setCategory(id); setLimit(12); }} className={`rounded-full border px-4 py-2 text-xs ${category === id ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-accent"}`}>{label} <span className="ml-1">{profiles.filter(source => id === "all" || source.category === id).length}</span></button>)}</div>
    <label className="mt-5 flex max-w-xl items-center gap-3 rounded-xl border border-line px-4 py-3"><Search className="h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="sr-only">Search source providers</span><input value={query} onChange={event => { setQuery(event.target.value); setLimit(12); }} placeholder="Find a library, ministry or format…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
    <p role="status" className="mt-4 text-xs text-muted">{matches.length} sources{!matches.length && " — try another name or source type."}</p>
    <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface" role="region" aria-label="Source providers table" tabIndex={0}>
      <table className="w-full min-w-[800px] text-sm">
        <caption className="sr-only">Source providers and dated holdings. Held files include metadata and supporting files.</caption>
        <thead className="border-b border-line bg-surface-2 text-xs text-muted"><tr>
          <th scope="col" className="px-4 py-3 text-left font-medium">Source</th>
          <th scope="col" className="px-4 py-3 text-left font-medium">Formats</th>
          <th scope="col" className="px-4 py-3 text-right font-medium">Held files</th>
          <th scope="col" className="px-4 py-3 text-right font-medium">Searchable</th>
          <th scope="col" className="px-4 py-3 text-right font-medium">Awaiting intake</th>
          <th scope="col" className="px-4 py-3 text-left font-medium">Notes</th>
        </tr></thead>
        <tbody className="divide-y divide-line">{matches.slice(0, limit).map(source => <Provider key={source.id} source={source} />)}</tbody>
      </table>
    </div>
    {matches.length > limit && <button type="button" onClick={() => setLimit(value => value + 12)} className="mt-6 rounded-full border border-line px-5 py-3 text-sm text-accent">Show more sources ({matches.length - limit} remaining)</button>}
    {!!discovery.length && <details className="mt-7 rounded-2xl border border-line p-5"><summary className="cursor-pointer font-serif text-xl">Discovery & publisher links</summary><p className="mt-3 text-xs leading-relaxed text-muted">These registry links help identify works and editions. They do not indicate that a complete text has been downloaded.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{discovery.map(source => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">{source.name} <ArrowUpRight className="inline h-3 w-3" aria-hidden /></a>)}</div></details>}
  </section>;
}
