// Where the fellowships meet (fellowship-cities.json): the Help for life city section, shared, with its own words. A USA
// map of the searched cities, the chosen city's facts and a bar of its gatherings by kind, then the county map with a
// numbered pin for every group or church a fellowship's own finder listed there. Under it, the groups just outside the
// county, listed in full in two columns.
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loadResource, type FellowshipCities, type FellowshipCity, type FellowshipsData } from "@/data/resources";
import { CitySection } from "../life/CitySection";
import { CITY_FILES, hasCityFiles, hostOf, listOf, plural, tone } from "../life/format";
import { gatheringWords, shortName, toCity } from "./format";

export function Gatherings({ data, cities }: { data: FellowshipsData; cities: FellowshipCities }) {
  const lookup = useMemo(() => {
    const byId = new Map(data.groups.flatMap((g) => g.entries.map((f) => [f.id, { f, kind: g.id }] as const)));
    return (id: string) => byId.get(id) ?? { f: undefined, kind: "" };
  }, [data]);
  const searched = useMemo(() => cities.cities.filter((c) => c.places.length > 0 && hasCityFiles(c.id)), [cities]);
  const shaped = useMemo(() => searched.map((c) => toCity(c, lookup)), [searched, lookup]);
  const fellowshipOf = useMemo(() => {
    const names = new Map(searched.flatMap((c) => c.places.map((p) => [p.id, shortName(lookup(p.fellowship).f?.name ?? "") + (p.sbc ? " · Southern Baptist" : "")] as const)));
    return (placeId: string) => names.get(placeId) ?? "";
  }, [searched, lookup]);
  const words = useMemo(() => gatheringWords(fellowshipOf), [fellowshipOf]);

  // Choosing a city fades the old one out and the new one in, as on Help for life; the new city's files are read during the fade.
  const [chosenId, setChosenId] = useState<string | null>(null), [leaving, setLeaving] = useState(false);
  const timer = useRef(0), gone = useRef(false);
  useEffect(() => { gone.current = false; return () => { gone.current = true; window.clearTimeout(timer.current); }; }, []);
  const chosen = shaped.find((c) => c.id === chosenId) ?? shaped[0];
  const pick = (id: string) => {
    if (id === chosen?.id || leaving || !hasCityFiles(id)) return;
    const files = CITY_FILES[id];
    const ready = Promise.all([loadResource(files.facts), loadResource(files.map)]).catch(() => null);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { void ready.then(() => { if (!gone.current) setChosenId(id); }); return; }
    setLeaving(true);
    timer.current = window.setTimeout(() => { void ready.then(() => { if (gone.current) return; setChosenId(id); setLeaving(false); }); }, 220);
  };
  if (!chosen || !hasCityFiles(chosen.id)) return null;
  const raw = searched.find((c) => c.id === chosen.id)!;
  return <div id="fw-where" className="fw-where">
    <CitySection city={{ ...chosen, id: chosen.id }} cities={shaped} onPick={pick} leaving={leaving} checked={cities.checked} words={words} />
    <Beyond key={raw.id} city={raw} lookup={lookup} />
  </div>;
}

type Lookup = (id: string) => { f?: { name: string }; kind: string };

/** The places just outside the county, one row per address: a church two searches list shows both. */
function byAddress(nearby: FellowshipCity["nearby"]) {
  const rows = new Map<string, FellowshipCity["nearby"]>();
  for (const g of nearby) {
    const key = `${g.host.toLowerCase()}|${g.address.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}`;
    rows.set(key, [...(rows.get(key) ?? []), g]);
  }
  return [...rows.values()];
}

/** What meets at one address: "Church listed by Founders Ministries and 9Marks", or each group with its time. */
function whatMeets(same: FellowshipCity["nearby"]) {
  const words = same.map((x) => [x.name, x.when].filter(Boolean).join(", ")).filter((w, n, all) => all.indexOf(w) === n);
  const lead = "Church listed by ";
  return words.length > 1 && words.every((w) => w.startsWith(lead)) ? `${lead}${listOf(words.map((w) => w.slice(lead.length)))}` : words.join("; ");
}

/** The places just outside the county: one list in two columns, every place shown, no scroll box (owner, 2026-10-22). */
function Beyond({ city, lookup }: { city: FellowshipCity; lookup: Lookup }) {
  const rows = byAddress(city.nearby);
  if (!rows.length) return null;
  return <section className="fw-beyond lf-fade" aria-labelledby="fw-nearby">
    <div className="fw-beyond-head">
      <h3 id="fw-nearby">Just outside the county<small>{plural(rows.length, "place")}</small></h3>
      {/* A way to search on one's own (owner, 2026-10-22): the Southern Baptist Convention's own church finder. */}
      <a className="fw-sbc" href="https://churches.sbc.net/" target="_blank" rel="noreferrer">Find a Southern Baptist church<ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
    <ul>{rows.map((same) => { const [g] = same, { kind } = lookup(g.fellowship); return <li key={g.id} style={{ "--c": tone(kind) } as CSSProperties}>
      <span><strong>{g.host}</strong> · {whatMeets(same)}<br />{g.address}<br />
        {same.map((x, n) => { const { f } = lookup(x.fellowship); return <span key={x.id}>{n > 0 && " · "}<a href={x.source} target="_blank" rel="noreferrer">{f ? shortName(f.name) : hostOf(x.source)}</a></span>; })}
        {same.some((x) => x.sbc) && <> · <a href={same.find((x) => x.sbc)!.sbc} target="_blank" rel="noreferrer">Southern Baptist</a></>} · checked {g.checked}</span>
    </li>; })}</ul>
  </section>;
}
