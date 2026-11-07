// The good news: the shared pieces. Runs of text with their verse links, the kinds of block a part is made of, the
// ledger of news and response, and Luke 15's three fields of dots.
import { ArrowRight } from "lucide-react";
import { useContext, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bibleName, useCurrentBible } from "@/lib/verses";
import { D, passageIds, type Block, type Run } from "./model";
import { OpenVerse } from "./open-verse";

/** A passage's words in the reader's Bible; `numbered` prints each verse's number ("chapter" adds the chapter). */
export function PassageWords({ id, numbered }: { id: string; numbered?: boolean | "chapter" }) {
  const catalog = useCatalog();
  return <Verse ids={passageIds(catalog, id)} numbered={numbered} />;
}

/** The name of the Bible the words come from: its short form ("BSB") or its full name. */
export function BibleName({ short = false }: { short?: boolean }) {
  const bible = useCurrentBible();
  return <>{short ? bible.abbr : bibleName(bible)}</>;
}

export function Ref({ id, children }: { id: string; children?: ReactNode }) {
  const open = useContext(OpenVerse);
  const passage = D.passages[id];
  if (!passage) { console.error(`The good news page: passage "${id}" is not in the study's data`); return <>{children}</>; }
  return <button type="button" className="gn-ref" data-opener={id} onClick={() => open(id)} aria-haspopup="dialog">{children ?? passage.label}</button>;
}

export function Runs({ runs }: { runs: Run[] }) {
  return <>{runs.map((run, i) => {
    if (typeof run === "string") return run;
    if ("r" in run) return <Ref key={i} id={run.r}>{run.t}</Ref>;
    if ("a" in run) return <Link key={i} className="gn-link" to={run.a}>{run.t}</Link>;
    if ("b" in run) return <strong key={i}>{run.b}</strong>;
    if ("i" in run) return <em key={i}>{run.i}</em>;
    // A study named in the text. The live site has no page for it yet, so it is named, not linked.
    if ("s" in run) return <em key={i} className="gn-study">{run.t}</em>;
    return null;
  })}</>;
}

export const Label = ({ children }: { children: ReactNode }) => <span className="gn-label">{children}</span>;

export function Quote({ id, label }: { id: string; label: string }) {
  return <figure className="gn-quote"><blockquote><PassageWords id={id} /></blockquote><figcaption><Ref id={id}>{label}</Ref> · <BibleName short /></figcaption></figure>;
}

export function BlockView({ block }: { block: Block }) {
  switch (block.k) {
    case "p": return <p><Runs runs={block.runs} /></p>;
    case "h3": return <h3 className="gn-h3">{block.t}</h3>;
    case "quote": return <Quote id={block.r} label={block.label} />;
    case "care": return <aside className="gn-care"><Label>With care</Label><p><Runs runs={block.runs} /></p></aside>;
    case "limits": return <p className="gn-limits"><Label>Its limits</Label> <Runs runs={block.runs} /></p>;
    case "step": return <div className="gn-step"><h3>{block.label}</h3><p><Runs runs={block.runs} /></p></div>;
  }
}

/** A part's blocks, with its next steps set side by side, and Luke 15's dots after the first paragraph of part 03. */
export function Blocks({ blocks, partNumber }: { blocks: Block[]; partNumber?: string }) {
  const out: ReactNode[] = [];
  let steps: ReactNode[] | null = null;
  blocks.forEach((block, index) => {
    if (block.k === "step") {
      if (!steps) { steps = []; out.push(<div key={`steps-${index}`} className="gn-steps">{steps}</div>); }
      steps.push(<BlockView key={index} block={block} />);
    } else out.push(<BlockView key={index} block={block} />);
    if (partNumber === "03" && index === 0) out.push(<LostThings key="lost" />);
  });
  return <>{out}</>;
}

export function Ledger() {
  return <div className="gn-ledger" role="table" aria-label="What God has done, and what it calls for">
    <div className="gn-ledger-row gn-ledger-head" role="row"><span role="columnheader">What God has done</span><span role="columnheader" aria-hidden="true" /><span role="columnheader">What it calls for</span></div>
    {D.news.map((row) => <div key={row.r} className={`gn-ledger-row${row.response ? "" : " is-open"}`} role="row">
      <div role="cell"><p className="gn-said gn-news-said">{row.news}</p><Ref id={row.r} /></div>
      <span className="gn-then" role="cell" aria-label="then"><ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></span>
      <div role="cell">
        {row.response ? <p className="gn-said">{row.response}</p> : <p className="gn-said gn-left-open">Jesus does not say.</p>}
        <Ref id={row.then} /><small>{row.note}</small>
      </div>
    </div>)}
  </div>;
}

/** Luke 15 as three fields of dots: one lost out of a hundred, out of ten, out of two. The counts are checked in the verses. */
export function LostThings() {
  return <figure className="gn-lost" aria-label="One lost out of a hundred, one out of ten, one out of two">
    {D.lost.map((item) => <div key={item.id} className={`gn-lost-col gn-lost-${item.id}`}>
      <div className="gn-dots" aria-hidden="true">{Array.from({ length: item.count }, (_, i) => <i key={i} className={i === item.count - 1 ? "is-lost" : undefined} />)}</div>
      <p className="gn-lost-count"><b>{`1 of ${item.count}`}</b> {item.name.toLowerCase()} <Ref id={item.r} /></p>
      <p className="gn-lost-who">{item.who}: <q>{item.search}</q> <Ref id={item.sr} /></p>
      <p className="gn-lost-end"><q>{item.end}</q> <Ref id={item.er} /></p>
    </div>)}
    <figcaption>In every story the one who lost it does the looking, and every story ends in a celebration. In the third, the father goes out twice: once to the son who comes home, once to the son who will not come in.</figcaption>
  </figure>;
}
