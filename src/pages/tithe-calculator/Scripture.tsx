// Section 03, what the Bible says about giving (design sections 3 and 8). The confession's words, the two readings
// Baptists hold on the tithe shown side by side without choosing (as the site's generosity study does), and the
// passages as rows: opening one loads its words from the Berean, whatever language the site is shown in. Verses are
// kept as ids only (the build's verse-wording check forbids verse text in code), and one row is open at a time.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { useVerseText, verseHref, verseReference } from "@/pages/converter/verse";
import { PASSAGES } from "./passages";

export function Scripture() {
  return <div className="tc-scripture">
    <p className="tc-prose">The Baptist Faith and Message, in article XIII (stewardship), says that Christians <q>should contribute of their means cheerfully, regularly, systematically, proportionately, and liberally for the advancement of the Redeemer's cause on earth.</q> It does not say whether a tenth binds Christians. So this page states what the confession states and shows the two readings Baptists hold, without choosing.</p>
    <div className="tc-views">
      <section aria-labelledby="tc-view-tenth">
        <h3 id="tc-view-tenth">The tithe as the starting point</h3>
        <p>Many Baptists teach that a tenth is where a Christian's giving begins. Abraham gave a tenth before the law of Moses was given, and Jacob vowed one. Jesus told the Pharisees to practise justice, mercy and faithfulness without neglecting their tithes. And a Christian under grace, they argue, should not give less than an Israelite under the law.</p>
      </section>
      <section aria-labelledby="tc-view-share">
        <h3 id="tc-view-share">Generous, proportionate giving without a fixed tenth</h3>
        <p>Other Baptists hold that the tithe belonged to the law of Moses, which is fulfilled in Christ, and so does not bind Christians as a rule. When Paul teaches a church about giving at length, he never names a tenth: each one gives in keeping with what he has, as he has decided in his heart. On this reading a tenth may be a good guide, many will give more, and someone in deep need may rightly give less without guilt.</p>
      </section>
    </div>
    <p className="tc-prose">Both readings agree on more than they differ. Giving is worship; it should be regular and planned; it grows with what one has; it supports the church and the poor; and it is never a way to earn anything from God. Neither reading promises that giving will make anyone rich.</p>
    <h3 className="tc-passages-title">The passages</h3>
    <Passages />
  </div>;
}

function Passages() {
  const catalog = useCatalog();
  const [open, setOpen] = useState<number | null>(null);
  return <ul className="tc-passages">
    {PASSAGES.map((passage) => {
      const isOpen = open === passage.from;
      const panelId = `tc-passage-${passage.from}`;
      return <li key={passage.from}>
        <h4>
          <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : passage.from)}>
            <span className="tc-ref">{verseReference(catalog, passage.from, passage.to)}</span>
            <span className="tc-why">{passage.note}</span>
          </button>
        </h4>
        {isOpen && <div id={panelId} className="tc-passage"><Quote from={passage.from} to={passage.to} /></div>}
      </li>;
    })}
  </ul>;
}

function Quote({ from, to }: { from: number; to?: number }) {
  const catalog = useCatalog();
  const { state, retry } = useVerseText(from, to);
  const reference = verseReference(catalog, from, to);
  return <>
    {state.status === "loading" && <p className="tc-quiet" role="status">Loading the verse…</p>}
    {state.status === "error" && <p className="tc-failed" role="alert">The verse did not load. <button type="button" onClick={retry}>Retry</button></p>}
    {state.status === "ready" && state.value && <blockquote className="scripture tc-quote" lang="en">{state.value}</blockquote>}
    <p className="tc-quiet"><Link to={verseHref(catalog, from, to)}>{`Read ${reference} in context`}</Link></p>
  </>;
}
