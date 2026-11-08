// 01 Parallel lines: four kinds of pair, each shown in its own verses with the Hebrew line beside the Berean line, the second
// line set in under the first; then the five readers from Kimhi to Berlin on one rule, the metre question shown without a
// choice, and where poetry ends and prose begins.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { D, kindById } from "./model";
import { Head, Prose, SourceButton, ThreeParts, VersePair } from "./parts";

export function Lines({ kind, onChange }: { kind: string; onChange: (values: Record<string, string | null>) => void }) {
  const item = kindById.get(kind)!;
  return <>
    <Head num="01" kicker="Parallel lines" headline={D.parallelism.headline} lead={D.parallelism.lead} />
    <div className="hpn-lines">
      <div className="hpn-kinds" role="group" aria-label="Kinds of paired line">
        {D.parallelism.kinds.map((k, i) => <button key={k.id} type="button" className="hpn-kind" aria-pressed={k.id === kind}
          onClick={() => onChange({ kind: k.id })}>
          <b>{String(i + 1).padStart(2, "0")}</b>
          <span>{k.name}</span>
          <small>Lowth: {k.lowth}</small>
        </button>)}
      </div>
      <div className="hpn-kind-body" aria-live="polite">
        <p className="hpn-look"><Prose text={item.look} /></p>
        <div className="hpn-pairs">{item.examples.map((label) => <VersePair key={label} label={label} />)}</div>
        <p className="hpn-caption">Hebrew on the right, read from the right; the Berean on the left. The Hebrew is divided where the Masoretes' accents mark the verse's main pause, and only as many times as the Berean has lines: the division is the build's reading of those accents, not a line break in any manuscript.</p>
        <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
      </div>
    </div>
    <h3 className="hpn-sub">Five readers, one feature</h3>
    <ol className="hpn-readers">{D.parallelism.readers.map((r) => <li key={r.id}>
      <p className="hpn-who"><Checked text={r.who} /></p>
      <p><Prose text={r.held} /></p>
      {r.note && <p className="hpn-caption"><Prose text={r.note} /></p>}
      {r.source && <SourceButton id={r.source} />}
    </li>)}</ol>
    <div className="hpn-two">
      <div>
        <h3 className="hpn-sub">{D.parallelism.metre.head}</h3>
        <p className="hpn-para"><Prose text={D.parallelism.metre.lead} /></p>
        <ul className="hpn-views">{D.parallelism.metre.views.map((v) => <li key={plainText(v.who)}>
          <b><Checked text={v.who} /></b> <Prose text={v.held} /> {v.source && <SourceButton id={v.source} />}
        </li>)}</ul>
        <p className="hpn-caption"><Prose text={D.parallelism.metre.limit} /></p>
      </div>
      <div>
        <h3 className="hpn-sub">{D.parallelism.border.head}</h3>
        <ul className="hpn-evidence">{D.parallelism.border.evidence.map((e) => <li key={plainText(e)}><Prose text={e} /></li>)}</ul>
        <p className="hpn-para"><Prose text={D.parallelism.border.inference} /></p>
        <ul className="hpn-views">{D.parallelism.border.views.map((v) => <li key={plainText(v.who)}><b><Checked text={v.who} /></b> <Prose text={v.held} /></li>)}</ul>
        <p className="hpn-caption"><Prose text={D.parallelism.border.limit} /></p>
      </div>
    </div>
  </>;
}
