// How a creed came: four steps on one thread, from a summary inside Scripture to what later confessions say councils are worth;
// then the site's own stance, once, in its own panel.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, EC } from "./model";
import { Cite, Head, Prose, Refs } from "./parts";

export function Creed() {
  return <>
    <Head kicker="How a creed came" title="Scripture first. Councils after." lead={<Prose text={D.creedPath.lead} />} />
    <ol className="ek-thread">{D.creedPath.steps.map((s, i) => {
      const held = EC.held[`.creedPath.steps[${i}].evidence`] ?? [];
      const titles = [...new Set(held.map((h) => h.title))];
      return <li key={s.id}>
        <div>
          <p className="ek-kicker"><b>{s.n}</b> · <Checked text={s.when} /></p>
          <h3><Checked text={s.title} /></h3>
          <p className="ek-para"><Prose text={s.evidence} /></p>
          <Refs labels={s.verses} />
        </div>
        <div className="ek-thread-notes">
          <p><b>What follows</b> <Prose text={s.inference} /></p>
          <p><b>Where it stops</b> <Prose text={s.limit} /></p>
          {titles.length > 0 && <p className="ek-held">{`Quotations checked word for word against the site's held text of ${titles.join(", ")}.`}</p>}
          <Cite ids={s.sources} />
        </div>
      </li>;
    })}</ol>
    <aside className="ek-stance" aria-label={D.stance.head}>
      <div>
        <p className="ek-kicker">{D.stance.head}</p>
        <p className="ek-confession"><Checked text={D.stance.confession} /><small><Checked text={D.stance.confessionSource} /></small></p>
      </div>
      <p className="ek-para"><Prose text={D.stance.body} /></p>
    </aside>
  </>;
}
