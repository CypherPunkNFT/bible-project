// 04: Browse the exact author credits and page evidence behind the site's sources.
import { useEffect, useMemo, useRef, useState } from "react";
import usageUrl from "../../../../content/teachers/feature-usage.json?url";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { groupUses, selectCredits, type AuthorCredit, type CreditSort, type SourceFeature } from "./named/credits";
import "./Named.css";

const number = (n: number) => n.toLocaleString("en-US");
const count = (n: number, label: string) => `${number(n)} ${label}${n === 1 ? "" : "s"}`;
const kinds = { data: "Feature input", citation: "Page citation", bibliography: "Bibliography entry" };

function CreditDetail({ credit }: { credit: AuthorCredit }) {
  const [limit, setLimit] = useState(20);
  return <div className="credit-detail">
    <header><span className="credit-kicker">Recorded author credit</span><h3>{credit.name}</h3>
      <p>{count(credit.pages, "content page")} · {count(credit.areas, "site area")} · {count(credit.records.length, "source record")}</p></header>
    <div className="credit-evidence" tabIndex={0} role="region" aria-label={`Source evidence for ${credit.name}`} onScroll={e => {
      const el = e.currentTarget;
      if (el.scrollTop >= (el.scrollHeight - el.clientHeight) * .4) setLimit(n => Math.min(n + 20, credit.records.length));
    }}>
      {credit.records.slice(0, limit).map(record => { const uses = groupUses(record.uses); return <article className="credit-work" key={`${record.featureId}-${record.id}`}>
        <div className="credit-meta"><span>{record.featureLabel}</span><span>{kinds[record.kind]}</span></div>
        <h4>{record.title}</h4>{record.year && <p className="credit-year">{record.year}</p>}
        <a href={record.url} target={record.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">Open source ↗</a>
        <ul>{uses.slice(0, 3).map((use, i) => <li key={i}><a href={use.address}>{use.page}</a>{use.locator && <p>{use.locator}</p>}</li>)}</ul>
        {uses.length > 3 && <details><summary>{uses.length - 3} more content pages</summary><ul>{uses.slice(3).map((use, i) => <li key={i}><a href={use.address}>{use.page}</a>{use.locator && <p>{use.locator}</p>}</li>)}</ul></details>}
      </article>; })}
      <p className="credit-end">{limit >= credit.records.length ? "All source records shown" : "More records load as you scroll"}</p>
    </div>
  </div>;
}

export function Named() {
  const [features, setFeatures] = useState<SourceFeature[]>([]);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState<CreditSort>("pages");
  const [limit, setLimit] = useState(40);
  const [selected, setSelected] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(usageUrl, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("Source index unavailable"); return r.json(); })
      .then(data => setFeatures(data.features)).catch(e => { if (e.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, []);
  const credits = useMemo(() => selectCredits(features, query, area, sort), [features, query, area, sort]);
  const credit = credits.find(c => c.name === selected) ?? credits[0];
  const reset = () => { setLimit(40); setSelected(""); if (listRef.current) listRef.current.scrollTop = 0; };
  return <>
    <SectionHead section="named" kicker="In the site's own pages" title={<>Where the site <em>names them</em></>}
      line="Start with a source's author credit to see the works and pages behind it. This index includes credited names beyond the documented scholar profiles." />
    <div className="credit-browser">
      <div className="credit-controls">
        <label>Find a credited name or work<input type="search" placeholder="Search author credits" value={query} onChange={e => { setQuery(e.target.value); reset(); }} /></label>
        <label>Site area<select aria-label="Site area" value={area} onChange={e => { setArea(e.target.value); reset(); }}><option value="">All site areas</option>{features.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
        <label>Sort<select aria-label="Sort" value={sort} onChange={e => { setSort(e.target.value as CreditSort); reset(); }}><option value="pages">Most content pages</option><option value="name">Name A–Z</option></select></label>
      </div>
      <p className="credit-count" aria-live="polite">{features.length ? <><strong>{number(credits.length)}</strong> matching author credits. Counts reflect the selected site area.</> : error ? "The credit index could not load. Reload the page to try again." : "Loading author credits…"}</p>
      {credit ? <div className="credit-layout">
        <div className="credit-list" ref={listRef} tabIndex={0} role="region" aria-label="Author credits" onScroll={e => {
          const el = e.currentTarget;
          if (el.scrollTop >= (el.scrollHeight - el.clientHeight) * .4) setLimit(n => Math.min(n + 40, credits.length));
        }}>
          {credits.slice(0, limit).map(c => <button className="credit-person" key={c.name} aria-pressed={credit.name === c.name} onClick={() => setSelected(c.name)}><b>{c.name}</b><span>{count(c.pages, "content page")} · {count(c.areas, "site area")}</span></button>)}
          <p className="credit-end">{limit >= credits.length ? "All matching credits shown" : "More names load as you scroll"}</p>
        </div>
        <CreditDetail key={`${area}|${credit.name}`} credit={credit} />
      </div> : features.length > 0 && <p className="credit-empty">No matching source credits in this selection. This does not mean the author is absent from the library or every page on the site.</p>}
      <p className="credit-scope">Coverage: verified feature inputs, registered page bibliographies and published apologetics study citations. Counts describe distinct content pages, not repeated name occurrences. A bibliography entry does not establish an in-text citation. Names retain the source's spelling, initials and joint credits; they are not a count of unique people. Incidental mentions and library holdings are outside this index.</p>
    </div>
  </>;
}
