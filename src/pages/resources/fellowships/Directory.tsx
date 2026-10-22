// The national fellowships as a directory, in the Help for life style: who you are first (a row of audiences, each with
// how many fellowships are open to it), then the four kinds of fellowship down the left in their own colours and the
// chosen kind's fellowships beside them. A closed row keeps "Find a group" ready, and "On the map" when the city maps
// below pin any of its groups; it opens in place for the rest. Every word comes from fellowships.json.
import { ChevronDown, MapPin, Search } from "lucide-react";
import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Fellowship, FellowshipsData } from "@/data/resources";
import { firstSentence, hostOf, kindOf, plural, restOf, tone } from "../life/format";
import { ContactLink } from "../life/Row";
import { AUDIENCES, sentence, shortCost } from "./format";

const STROKE = 1.6;

export function FellowshipDirectory({ data, mapped, mapCities }: { data: FellowshipsData; mapped: Map<string, number>; mapCities: number }) {
  const [chosen, setChosen] = useState(data.groups[0]?.id ?? "");
  const [who, setWho] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const all = data.groups.flatMap((g) => g.entries);
  // A fellowship open to anyone ("all") is open to every audience.
  const fits = (f: Fellowship) => !who || f.for.includes(who) || f.for.includes("all");
  const audiences = AUDIENCES.filter((a) => a !== "all" && all.some((f) => f.for.includes(a)));
  return <section className="lf-nat fw-dir-section" aria-labelledby="fw-national">
    <div className="lf-sec-head"><span>01 · National fellowships</span><h2 id="fw-national">Find your people</h2>
      <p>Who are you looking for a group for? Each number counts the fellowships open to them, including those open to anyone. Then pick a kind of fellowship on the left; every row has its group finder ready.</p></div>
    <div className="fw-who" role="group" aria-label="Who it is for">
      <button type="button" aria-pressed={who === ""} onClick={() => setWho("")}><b>{all.length}</b><span>Everyone</span></button>
      {audiences.map((a) => <button key={a} type="button" aria-pressed={who === a} onClick={() => setWho(who === a ? "" : a)}>
        <b>{all.filter((f) => f.for.includes(a) || f.for.includes("all")).length}</b><span>{sentence(a)}</span></button>)}
    </div>
    <div className="lf-dir">
      <div className="lf-kinds" role="group" aria-label="Kind of fellowship">{data.groups.map((g) => {
        const { Icon } = kindOf(g.id), shown = g.entries.filter(fits);
        const finders = shown.filter((f) => f.locator).length, onMap = shown.filter((f) => mapped.get(f.id)).length;
        return <button key={g.id} type="button" className="lf-kind" data-g={g.id} aria-pressed={g.id === chosen} style={{ "--c": tone(g.id) } as CSSProperties} onClick={() => setChosen(g.id)}>
          <span className="lf-kind-disc"><Icon size={18} strokeWidth={STROKE} aria-hidden="true" /></span><span className="lf-t">{g.title}</span>
          <span className="lf-n">{shown.length}</span>
          <span className="lf-w">{plural(finders, "group finder")}{onMap ? ` · ${onMap} on the map` : ""}</span>
        </button>;
      })}</div>
      <div className="lf-list">{data.groups.map((g) => {
        const shown = g.entries.filter(fits);
        return <div key={g.id} className="lf-pane" data-g={g.id} hidden={g.id !== chosen} style={{ "--c": tone(g.id) } as CSSProperties}>
          <p className="lf-pane-title"><span>{g.title}</span><small>{plural(shown.length, "fellowship")}{who ? ` open to ${who === "all" ? "anyone" : who}` : ""}</small></p>
          {shown.length ? <ol aria-label={g.title}>{shown.map((f) => <FellowshipRow key={f.id} fellowship={f} kind={g.id} mapped={mapped.get(f.id) ?? 0} mapCities={mapCities}
            open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />)}</ol>
            : <p className="fw-none">None of these is for {who}. <button type="button" onClick={() => setWho("")}>Show everyone</button></p>}
        </div>;
      })}</div>
    </div>
  </section>;
}

interface RowProps { fellowship: Fellowship; kind: string; mapped: number; mapCities: number; open: boolean; onToggle: () => void }

const FellowshipRow = memo(function FellowshipRow({ fellowship: f, kind, mapped, mapCities, open, onToggle }: RowProps) {
  // A closed row's body is inert, so its links stay out of the tab order (as on Help for life).
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (body.current) body.current.inert = !open; }, [open]);
  const cost = shortCost(f.cost), rest = restOf(f.summary);
  const chev = <span className="lf-chev" aria-hidden="true"><ChevronDown size={18} strokeWidth={STROKE} /></span>;
  return <li className="lf-row" data-layout="wide" data-id={f.id} data-open={open || undefined} style={{ "--c": tone(kind) } as CSSProperties}>
    <button type="button" className="lf-row-head" aria-expanded={open} onClick={onToggle}>
      <span className="lf-name">{f.name}</span>
      <span className="lf-sub">{f.for.map(sentence).join(" · ")}  ·  {f.meets.map(sentence).join(" · ")}</span>
      <span className="lf-sum">{firstSentence(f.summary)}</span>
      <span className="lf-cost" data-none={cost ? undefined : ""}>{cost ? <b>{cost}</b> : f.cost ? "Cost: open for details" : "Cost not stated on its page"}</span>
    </button>
    <div className="lf-quick-row">
      {f.locator && <a className="lf-quick" data-way="call" href={f.locator} target="_blank" rel="noreferrer"><Search size={16} strokeWidth={STROKE} aria-hidden="true" /><span>Find a group</span></a>}
      {mapped > 0 && <a className="lf-quick" href="#fw-where" title={`Pinned on the city maps below (${plural(mapCities, "city", "cities")} searched)`}><MapPin size={16} strokeWidth={STROKE} aria-hidden="true" /><span>{mapped} on the map</span></a>}
    </div>
    <button type="button" className="lf-chev-btn" tabIndex={-1} aria-hidden="true" onClick={onToggle}>{chev}</button>
    <div className="lf-body" ref={body}><div>
      {rest && <p className="lf-rest">{rest}</p>}
      <dl className="fw-facts">
        <div><dt>Who it is for</dt><dd>{f.for.map(sentence).join(", ")}</dd></div>
        <div><dt>How it meets</dt><dd>{f.meets.map(sentence).join(", ")}</dd></div>
        {f.cost && <div><dt>Cost</dt><dd>{f.cost}</dd></div>}
        {f.jacksonville && <div><dt>Near Jacksonville, {f.checked}</dt><dd>{f.jacksonville}</dd></div>}
      </dl>
      <div className="lf-contacts">
        {f.locator && <ContactLink contact={{ kind: "web", value: f.locator, note: "Find a group" }} />}
        {f.faith && <ContactLink contact={{ kind: "web", value: f.faith, note: "Statement of faith" }} />}
      </div>
      <p className="lf-checked">Checked {f.checked} on <a href={f.source} target="_blank" rel="noreferrer">{hostOf(f.source)}</a></p>
    </div></div>
  </li>;
});
