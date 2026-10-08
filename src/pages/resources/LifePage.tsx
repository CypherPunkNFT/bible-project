// /resources/life: help for people who may be in crisis, from life.json. First a plain strip with the emergency and
// crisis numbers (taken from the data, never typed here), then the national lines as kinds you choose between, then the
// USA map of the researched cities and their places.
import { Baby, HandHeart, HeartHandshake, LifeBuoy, MessageSquareText, Phone, Sprout, Users, Wheat, Flower2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useResource, type Help, type LifeData } from "@/data/resources";
import { HelpEntry } from "./Contacts";
import { dialable, smsHref, wayOf } from "./contact-links";
import { LifeMap } from "./LifeMap";
import { ResourceShell } from "./Shell";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const listOf = (words: string[]) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`);

const KIND_ICONS: [RegExp, LucideIcon][] = [
  [/crisis|suicide|danger/, LifeBuoy], [/after|abortion|heal/, HeartHandshake], [/pregnan/, Baby], [/child|famil|parent/, Users],
  [/food|hunger|meal/, Wheat], [/grief|loss|bereave/, Flower2], [/recover|addict/, Sprout],
];
const iconFor = (id: string, title: string) => KIND_ICONS.find(([re]) => re.test(`${id} ${title}`.toLowerCase()))?.[1] ?? HandHeart;

/** Every way to reach a number across the national lines: is 988 a call line, a text line, or both? */
function waysTo(groups: LifeData["groups"], number: string) {
  const ways = new Set<string>();
  for (const e of groups.flatMap((g) => g.entries)) for (const c of e.contact) {
    const way = wayOf(c.kind);
    if ((way === "call" || way === "text") && dialable(c.value) === number) ways.add(way);
  }
  return ways;
}

function CrisisStrip({ groups }: { groups: LifeData["groups"] }) {
  const danger = waysTo(groups, "911"), crisis = waysTo(groups, "988");
  if (!danger.size && !crisis.size) return null;
  return <aside className="rs-crisis" aria-label="Help right now">
    {danger.has("call") && <p><span>In danger now?</span><a href="tel:911"><Phone size={18} aria-hidden="true" />Call 911</a></p>}
    {crisis.size > 0 && <p><span>Thinking of suicide or in crisis?</span>
      <span className="rs-crisis-ways">{crisis.has("call") && <a href="tel:988"><Phone size={18} aria-hidden="true" />{crisis.has("text") ? "Call" : "Call 988"}</a>}
      {crisis.has("call") && crisis.has("text") && <span>or</span>}
      {crisis.has("text") && <a href={smsHref("988")}><MessageSquareText size={18} aria-hidden="true" />{crisis.has("call") ? "text 988" : "Text 988"}</a>}</span>
    </p>}
  </aside>;
}

export default function LifePage({ data }: { data: LifeData }) {
  const states = useResource("us-states");
  const [kind, setKind] = useState(data.groups[0]?.id ?? "");
  const group = data.groups.find((g) => g.id === kind) ?? data.groups[0];
  const national = data.groups.reduce((n, g) => n + g.entries.length, 0);
  const cities = data.cities.filter((c) => c.verified === true && c.entries.length > 0);
  const where = cities.length <= 3 ? listOf(cities.map((c) => c.name)) : plural(cities.length, "city", "cities");
  const local = cities.reduce((n, c) => n + c.entries.length, 0);
  return <ResourceShell slug="life" top={<CrisisStrip groups={data.groups} />}
    lead={`Free national lines for the hardest moments, ${cities.length ? `and places in ${where} that help with ${listOf([...new Set(cities.flatMap((c) => c.entries.map((e) => e.category)))].sort())}` : ""}. Every number can be tapped to call or text.`}
    stats={[["National lines", national], ["Local places", local], ...(cities.length ? [["Cities", cities.length] as [string, number]] : []), ["Checked", data.checked]]}
    note="How this list is made: every number, address and hour is copied from the organisation’s own page, and each entry links to the page it was checked on. Numbers change; if one fails, the organisation’s page is the place to look.">
    <div className="rs-section-head"><span>01</span><h2>National lines</h2><p>Choose what you need. Each line shows its hours, its cost and the ways to reach it.</p></div>
    <div className="rs-kinds" role="group" aria-label="Kind of help">
      {data.groups.map((g) => { const Icon = iconFor(g.id, g.title); return <button key={g.id} type="button" className="rs-kind" aria-pressed={g.id === group?.id} onClick={() => setKind(g.id)}>
        <Icon size={22} aria-hidden="true" /><span>{g.title}</span><small>{plural(g.entries.length, "line")}</small>
      </button>; })}
    </div>
    {group && <ol className="rs-help" aria-label={group.title} style={{ borderTop: 0 }}>{group.entries.map((e: Help) => <HelpEntry key={e.id} entry={e} />)}</ol>}
    {cities.length > 0 && <>
      <div className="rs-section-head"><span>02</span><h2>Places across the USA</h2><p>{cities.length === 1 ? `${cities[0].name} so far: its places on a small map, with addresses and how to reach each, and its phone lines.` : `${where} so far. Choose one to see its places on a small map, with addresses and how to reach each.`}</p></div>
      {typeof states === "object" ? <LifeMap states={states} cities={cities} /> : <p className="tl-status">{states === "loading" ? "Loading the map…" : "The map outline is missing."}</p>}
    </>}
  </ResourceShell>;
}
