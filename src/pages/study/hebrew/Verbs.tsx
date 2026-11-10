// Section 06: one word carries who, what kind and (loosely) when. A real grid of one verb as it stands in the text, one verb across four
// stems, four verses where the form and the time do not line up, the chart of forms by book, and the claim that the form tells the time.
import { VerseAt } from "@/components/Verse";
import { D, H, thousands, verseByLabel } from "./model";
import { Cite, He, Head, Mixed, Test, ThreeParts, VerseLink } from "./parts";
import { VerbChart } from "./VerbChart";
import { plural } from "@/lib/site-format";

function Grid({ onOpen }: { onOpen: (key: string) => void }) {
  const { rows, cols } = D.grid;
  return <div className="hw-gridwrap" role="region" aria-label="The verb to keep, by person and form" tabIndex={0}>
    <table className="hw-grid">
      <caption><He>{D.grid.letters}</He>{`, ${D.grid.name}, in its plain stem. Each cell is the commonest form in the text with no object ending. Press one for a verse.`}</caption>
      <thead><tr><td />{cols.map((col) => <th key={col.id} scope="col">{col.label}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}>
        <th scope="row">{row.label}</th>
        {cols.map((col) => {
          const key = `${row.id}-${col.id}`, cell = H.grid[key];
          return <td key={col.id}>{cell
            ? <button type="button" data-open={`cell:${key}`} onClick={() => onOpen(`cell:${key}`)} aria-label={`${row.label} · ${col.label}: ${cell.step} · ${plural(cell.count, "once", "{n} times")}`}><span lang="he" dir="rtl">{cell.he}</span><small>{plural(cell.count, "once", "{n} times")}</small></button>
            : <span className="hw-empty">not in the text</span>}</td>;
        })}
      </tr>)}</tbody>
    </table>
  </div>;
}

function Stems({ onOpen }: { onOpen: (key: string) => void }) {
  const items = D.featured.filter((f) => f.group === "stems");
  return <ol className="hw-rows">{items.map((item) => {
    const data = H.featured[item.id];
    return <li key={item.id}>
      <button type="button" data-open={`word:${item.id}`} onClick={() => onOpen(`word:${item.id}`)}><span className="hw-rowhe" lang="he" dir="rtl">{data.he}</span></button>
      <div><b>{item.stem}: {item.word}</b> <small>{`${thousands(H.counts.seeStems[item.stemCode!])} of ${thousands(H.counts.seeTotal)} verbs tagged with this word`}</small>
        <p>{item.tends}.</p><p className="hw-verse-ref"><VerseLink label={data.label} /></p></div>
    </li>;
  })}</ol>;
}

function Times({ onOpen }: { onOpen: (key: string) => void }) {
  const items = D.featured.filter((f) => f.group === "time");
  return <ol className="hw-rows">{items.map((item) => {
    const data = H.featured[item.id], verse = verseByLabel.get(data.label);
    return <li key={item.id}>
      <button type="button" data-open={`word:${item.id}`} onClick={() => onOpen(`word:${item.id}`)}><span className="hw-rowhe" lang="he" dir="rtl">{data.he}</span></button>
      <div><b>{item.formName}: {item.word}</b>
        <p>{item.note}</p>
        <p className="hw-verse-ref">{verse && <VerseAt verse={verse} />} <VerseLink label={data.label} /></p></div>
    </li>;
  })}</ol>;
}

export function Verbs({ formValue, onForm, onOpen }: { formValue: string | null; onForm: (id: string) => void; onOpen: (key: string) => void }) {
  const claim = D.claims.time;
  return <>
    <Head letter="ו" num="06" kicker="The verb" title={<>Who, what kind, and when.<em> One word.</em></>}
      lead="A Hebrew verb carries most of a small sentence in itself. Its added letters name who. Its stem shows what kind of action it tends to be. Its form shows how the event is presented. The time is a different question." />
    <h3 className="hw-sub">Who: one verb, as it stands in the text</h3>
    <p className="hw-para">Added letters at the end, or in front. Follow a row across and watch them move.</p>
    <Grid onOpen={onOpen} />
    <h3 className="hw-sub">What kind: one verb, four stems</h3>
    <p className="hw-para"><He>ראה</He> means to see. Change its stem and it can mean to appear, to show, or to look at one another. Each of these four comes from Genesis.</p>
    <Stems onOpen={onOpen} />
    <h3 className="hw-sub">When: the form narrows it, and the verse settles it</h3>
    <Times onOpen={onOpen} />
    <p className="hw-note">Genesis 1:3 holds the difference in one small word. <He>יְהִי</He> asks for something to be: STEP Bible's tags call it a jussive, a wish or a command. <He>וַיְהִי</He> reports that it was: their tags call it the narrative form.</p>
    <VerbChart formValue={formValue} onForm={onForm} />
    <div className="hw-claim">
      <p className="hw-claim-text">{claim.claim}</p>
      <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} />
      <Test kicker="What can the form actually say?" question={claim.test.question} options={claim.test.options} />
    </div>
    <h3 className="hw-sub">How the forms should be explained is still argued</h3>
    <p className="hw-para">Scholars still dispute whether these forms chiefly mark time, or the way an event is seen, or something else. This study reports four accounts and does not choose. You do not need to settle the matter to sound out a verse or to trust the Berean's reading of one.</p>
    <ul className="hw-views">{D.views.map((v) => <li key={v.who}><b>{v.who}</b><p><Mixed text={v.view} /></p><small>{v.status}</small></li>)}</ul>
    <ThreeParts {...D.records.verbs} />
    <Cite ids={["stepTahot", "stepTehmc", "gkc", "waltke", "cook", "joosten"]} />
  </>;
}
