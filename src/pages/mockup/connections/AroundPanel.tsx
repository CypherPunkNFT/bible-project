// The panel beside the field: with nothing chosen, every ring of the category as a row of names; with a point chosen,
// what joins it to Moses (the page's own notes for the hand-checked people, then the verses, in the BSB).
import type { CSSProperties } from "react";
import type { Catalog } from "@/lib/types";
import { bookByNum } from "@/lib/refs";
import { slugOf } from "@/lib/people-slugs";
import { fieldHref, pageHref, type GraphIndex } from "./graph-data";
import type { AroundPoint, Category } from "./around-data";
import { Verse } from "./Panel";
import { useVerseTexts } from "./verse-texts";

interface Props { category: Category; index: GraphIndex; catalog: Catalog; onField: Set<string>; point?: AroundPoint; choose: (key: string) => void; centre: string }

function Centre({ category, onField, choose, centre }: Pick<Props, "category" | "onField" | "choose" | "centre">) {
  return <div className="cn-pbody">
    <p className="cn-kicker">The centre · {category.label}</p>
    <h3>{centre}</h3>
    {category.rings.map((ring) => {
      const shown = category.points.filter((p) => p.ring === ring.key && onField.has(p.key));
      return shown.length ? <div key={ring.key} className="ar-ringrow" style={{ "--cn-tone": ring.tone } as CSSProperties}>
        <p className="cn-small">{ring.label} · {ring.total.toLocaleString()}</p>
        <div className="cn-starts">{shown.map((p) => <button key={p.key} type="button" onClick={() => choose(p.key)}>{p.label}</button>)}</div>
      </div> : null;
    })}
  </div>;
}

function goLinks(point: AroundPoint, catalog: Catalog) {
  if (point.kind === "x") {
    const code = bookByNum(catalog, Math.floor(Number(point.id) / 1000))?.code ?? "GEN";
    return [{ href: `/read/bsb/${code}/${Number(point.id) % 1000}`, text: `Read ${point.label}` }];
  }
  if (point.id.startsWith("who:")) return [];
  const page = point.kind === "p" ? `/people/${slugOf(point.id) ?? point.id}` : pageHref(point.kind, point.id);
  return [{ href: page, text: `Open ${point.label}'s page` }, ...(point.kind === "p" ? [{ href: fieldHref("p", point.id), text: `${point.label}'s connections` }] : [])];
}

export function AroundPanel({ category, index, catalog, onField, point, choose, centre }: Props) {
  const pairs = point?.chapter?.[3] ?? [];
  const evidence = point ? point.evidence.slice(0, 4) : [];
  const texts = useVerseTexts(catalog, point ? (point.chapter ? pairs.flatMap((p) => [p[0], p[1]]) : evidence) : []);
  if (!point) return <Centre category={category} onField={onField} choose={choose} centre={centre} />;
  const ring = category.rings.find((r) => r.key === point.ring);
  const description = point.kind === "x" ? "" : index.entities[`${point.kind}:${point.id}`]?.[2];
  const named = category.points.filter((p) => point.links.includes(p.key) && onField.has(p.key));
  return <div className="cn-pbody" key={point.key} style={{ "--cn-tone": ring?.tone } as CSSProperties}>
    <p className="cn-kicker ar-kicker">{category.label} · {ring?.label}{point.role && point.role.toLowerCase() !== ring?.label.toLowerCase() ? ` · ${point.role}` : ""}</p>
    <h3>{point.label}</h3>
    {description && <p className="cn-plain">{description}</p>}
    {point.claims?.map((text) => <p key={text} className="cn-how">{text}</p>)}
    {point.quote && <blockquote className="ar-quote">{point.quote.text}</blockquote>}
    {point.chapter ? <>
      <p className="cn-how">Verses naming {centre} point to {point.label} <b>{point.chapter[2].toLocaleString()}</b> {point.chapter[2] === 1 ? "time" : "times"} in OpenBible.info's cross-references. The strongest:</p>
      <ul className="cn-pairs">{pairs.map(([from, to, votes]) => <li key={`${from}-${to}`}><ul className="cn-verses"><Verse catalog={catalog} id={from} text={texts[from]} other={centre} /><Verse catalog={catalog} id={to} text={texts[to]} other={centre} /></ul><small>{votes} votes</small></li>)}</ul>
    </> : evidence.length > 0 && <>
      <p className="cn-how">{point.id.startsWith("who:") ? `Where ${point.label === "God" ? "God speaks" : "they speak"} of ${centre}` : `Named with ${centre} in ${point.weight.toLocaleString()} ${point.weight === 1 ? "verse" : "verses"}`}{point.evidence.length > evidence.length || point.weight > evidence.length ? `; the first ${evidence.length}:` : ":"}</p>
      <ul className="cn-verses">{evidence.map((v) => <Verse key={v} catalog={catalog} id={v} text={texts[v]} other={centre} />)}</ul>
    </>}
    {named.length > 0 && <><p className="cn-small">Their words name</p><div className="cn-starts">{named.map((p) => <button key={p.key} type="button" onClick={() => choose(p.key)}>{p.label}</button>)}</div></>}
    <div className="cn-go">{goLinks(point, catalog).map((link) => <a key={link.href} href={link.href}>{link.text} →</a>)}</div>
  </div>;
}
