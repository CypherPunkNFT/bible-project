// The panel beside the field: the centre's summary, or the chosen point with the verses that join it to the centre.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Waypoints } from "lucide-react";
import { loadPlain } from "@/lib/data";
import { formatRange, splitId, bookByNum } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { cameFrom } from "@/lib/came-from";
import { RING_NAME, chapterName, type Point } from "./field-layout";
import { KIND_NAME, fieldHref, pageHref, type Entity, type GraphIndex, type Kind, type LinkedChapter } from "./graph-data";

const RELATION: Record<string, string> = { parent: "Parent", child: "Child", spouse: "Husband or wife", sibling: "Brother or sister" };

/** The Berean Standard Bible's words for each verse, loaded a book at a time. */
function useVerseTexts(catalog: Catalog, verses: number[]): Record<number, string> {
  const [texts, setTexts] = useState<Record<number, string>>({});
  const wanted = verses.join(",");
  useEffect(() => {
    let live = true;
    const ids = wanted ? wanted.split(",").map(Number) : [];
    Promise.all(ids.map(async (id) => {
      const { num, chapter, verse } = splitId(id);
      const code = bookByNum(catalog, num)?.code;
      if (!code) return [id, ""] as const;
      const book = await loadPlain("bsb", code).catch((reason: unknown) => { console.error(`connections: BSB ${code} did not load`, reason); return {}; });
      return [id, (book as Record<string, string>)[`${chapter}:${verse}`] ?? ""] as const;
    })).then((pairs) => { if (live) setTexts(Object.fromEntries(pairs)); });
    return () => { live = false; };
  }, [catalog, wanted]);
  return texts;
}

function Verse({ catalog, id, text, other }: { catalog: Catalog; id: number; text?: string; other?: string }) {
  const { num, chapter, verse } = splitId(id);
  const code = bookByNum(catalog, num)?.code ?? "GEN";
  return <li><Link to={`/read/bsb/${code}/${chapter}?hl=${verse}`} state={cameFrom(`Connections: ${other ?? ""}`)}>{formatRange(catalog, id, id)}</Link>
    <q>{text || "…"}</q></li>;
}

function Summary({ entity, catalog, passages, choose }: { entity: Entity; catalog: Catalog; passages: LinkedChapter[]; choose: (key: string) => void }) {
  const books = Object.entries(entity.b).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const most = books[0]?.[1] ?? 1;
  const starts = [entity.p[0] && `p:${entity.p[0][0]}`, entity.l[0] && `l:${entity.l[0][0]}`, entity.t[0] && `t:${entity.t[0][0]}`, passages[0] && `x:${passages[0][0]}`].filter(Boolean) as string[];
  const names: Record<string, string> = Object.fromEntries((["p", "l", "t"] as const).flatMap((kind) => entity[kind].map((r) => [`${kind}:${r[0]}`, r[1]])));
  return <div className="cn-pbody">
    <p className="cn-kicker">The centre · {KIND_NAME[entity.k]}</p>
    <h3>{entity.n}</h3>
    {entity.d && <p className="cn-plain">{entity.d}</p>}
    <p className="cn-small">Where the {entity.v.toLocaleString()} verses naming {entity.n} are found</p>
    <ul className="cn-books">{books.map(([code, n]) => <li key={code}><span>{catalog.books.find((b) => b.code === code)?.name ?? code}</span><i style={{ width: `${(n / most) * 100}%` }} /><b>{n}</b></li>)}</ul>
    <p className="cn-small">Start anywhere</p>
    <div className="cn-starts">{starts.map((key) => <button key={key} type="button" onClick={() => choose(key)}>{key.startsWith("x:") ? chapterName(catalog, Number(key.slice(2))) : names[key]}</button>)}</div>
  </div>;
}

interface Props { entity: Entity; index: GraphIndex; catalog: Catalog; passages: LinkedChapter[]; point?: Point; choose: (key: string) => void }

export function Panel({ entity, index, catalog, passages, point, choose }: Props) {
  const pairs = point?.chapter?.[3] ?? [];
  const texts = useVerseTexts(catalog, point ? (point.chapter ? pairs.flatMap((p) => [p[0], p[1]]) : point.evidence) : []);
  if (!point) return <Summary entity={entity} catalog={catalog} passages={passages} choose={choose} />;
  const kind = (point.ring === "fam" ? "p" : point.ring) as Kind | "x";
  const id = point.key.slice(2);
  const description = kind === "x" ? "" : index.entities[`${kind}:${id}`]?.[2];
  return <div className="cn-pbody" key={point.key}>
    <p className="cn-kicker">{RING_NAME[point.ring]}{point.relation ? ` · ${RELATION[point.relation] ?? point.relation}` : ""}</p>
    <h3>{point.label}</h3>
    {description && <p className="cn-plain">{description}</p>}
    {point.ring === "fam" && <p className="cn-how">{RELATION[point.relation ?? ""] ?? "Family"} of {entity.n}, in STEP Bible's list of the Bible's people.</p>}
    {point.row && <p className="cn-how">Named together with {entity.n} in <b>{point.weight.toLocaleString()}</b> {point.weight === 1 ? "verse" : "verses"}{point.weight > point.evidence.length ? `; the first ${point.evidence.length}:` : ":"}</p>}
    {point.row && <ul className="cn-verses">{point.evidence.map((v) => <Verse key={v} catalog={catalog} id={v} text={texts[v]} other={entity.n} />)}</ul>}
    {point.chapter && <>
      <p className="cn-how">Verses naming {entity.n} point to {point.label} <b>{point.chapter[2].toLocaleString()}</b> {point.chapter[2] === 1 ? "time" : "times"} in OpenBible.info's cross-references ({point.chapter[1].toLocaleString()} reader votes). The strongest:</p>
      <ul className="cn-pairs">{pairs.map(([from, to, votes]) => <li key={`${from}-${to}`}><ul className="cn-verses"><Verse catalog={catalog} id={from} text={texts[from]} other={entity.n} /><Verse catalog={catalog} id={to} text={texts[to]} other={entity.n} /></ul><small>{votes} votes</small></li>)}</ul>
    </>}
    <div className="cn-go">
      {kind === "x" ? (() => { const code = bookByNum(catalog, Math.floor(Number(id) / 1000))?.code ?? "GEN"; return <Link to={`/read/bsb/${code}/${Number(id) % 1000}`}>Read {point.label}<ArrowUpRight size={14} aria-hidden /></Link>; })()
        : <><Link to={fieldHref(kind, id)}><Waypoints size={14} aria-hidden />{point.label}'s connections</Link>
          <Link to={pageHref(kind, id)} state={cameFrom(`Connections: ${entity.n}`)}>Open {point.label}'s page<ArrowUpRight size={14} aria-hidden /></Link></>}
    </div>
  </div>;
}
