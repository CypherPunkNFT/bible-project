// Section 02, measurements in the Bible (design section 2): one row per example. Opening a row shows its sizes worked
// out by the converter's own units and its verse in the Berean, loaded only then; one row is open at a time, and which
// is in the address (?example=noahs-ark), so a search result can land on it. Each size links into the converter.
import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { choiceSearch } from "./choice";
import { EXAMPLES, exampleById, type Example, type ExamplePart } from "./examples";
import { writeToday } from "./modern";
import { CONFIDENCE_LABELS, findUnit } from "./units";
import { useVerseText, verseHref, verseReference } from "./verse";

export function Examples({ wage }: { wage: number }) {
  const [params, setParams] = useSearchParams();
  const open = exampleById(params.get("example") ?? "");
  const toggle = (example: Example) => {
    const next = new URLSearchParams(params);
    if (open?.id === example.id) next.delete("example");
    else next.set("example", example.id);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  return <ul className="cv-examples">
    {EXAMPLES.map((example) => {
      const isOpen = open?.id === example.id;
      const panelId = `cv-example-${example.id}`;
      return <li key={example.id} id={`example-${example.id}`}>
        <h3>
          <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(example)}>{example.title}</button>
        </h3>
        {isOpen && <div id={panelId} className="cv-example"><ExampleDetail example={example} wage={wage} /></div>}
      </li>;
    })}
  </ul>;
}

function ExampleDetail({ example, wage }: { example: Example; wage: number }) {
  const catalog = useCatalog();
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => { holder.current?.scrollIntoView?.({ block: "nearest" }); }, [example.id]);
  return <div ref={holder}>
    <dl className="cv-parts">
      {example.parts.map((part) => <Part key={part.label} part={part} exampleId={example.id} wage={wage} />)}
    </dl>
    {example.note && <p className="cv-caution">{example.note}</p>}
    <Quote from={example.from} to={example.to} />
    <p className="cv-quiet"><Link to={verseHref(catalog, example.from, example.to)}>{`Read ${verseReference(catalog, example.from, example.to)} in context`}</Link></p>
  </div>;
}

function Part({ part, exampleId, wage }: { part: ExamplePart; exampleId: string; wage: number }) {
  const unit = findUnit(part.kind, part.unit);
  if (!unit) throw new Error(`converter: example part "${part.label}" names unit "${part.unit}", which ${part.kind} does not have`);
  const [first, second] = writeToday(part.kind, part.amount * unit.size, wage);
  return <div>
    <dt>{part.label}</dt>
    <dd>
      <Link to={`${choiceSearch(part.kind, part.unit, part.amount)}&example=${exampleId}#convert`}>{unit.count(part.amount)}</Link>
      <span className="cv-equals" aria-hidden="true"> ≈ </span>
      <strong>{first}</strong> · <strong>{second}</strong>
      {unit.confidence === "estimate" && <span className="cv-flag">{CONFIDENCE_LABELS.estimate}</span>}
    </dd>
  </div>;
}

function Quote({ from, to }: { from: number; to?: number }) {
  const { state, retry } = useVerseText(from, to);
  if (state.status === "loading") return <p className="cv-quiet" role="status">Loading the verse…</p>;
  if (state.status === "error") return <p className="cv-failed" role="alert">The verse did not load. <button type="button" onClick={retry}>Retry</button></p>;
  return state.value ? <blockquote className="scripture cv-quote" lang="en">{state.value}</blockquote> : null;
}
