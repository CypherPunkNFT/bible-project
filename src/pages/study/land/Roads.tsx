// 05 · Roads and battles: the two long roads and the climbing roads, what passed along them, and six battle places where the
// ground left few ways in. The Valley of Elah is opened in place first; every place opens its full record in the sheet.
import { D, firstSentence } from "./model";
import { Head, Opener, StudyLink, T, ThreeParts, VerseRefs } from "./parts";

export function Roads({ battleId, onChange }: { battleId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const battles = D.battles.items;
  const chosen = battles.find((b) => b.id === battleId) ?? battles[0];
  const ground = D.faith.items.filter((f) => f.id === "hills-claim" || f.id === "wilderness");
  return <>
    <Head num="05" kicker="Roads and battles" title="Few ways in." turn="The same valleys, again." lead={<p><T text={D.roads.lead} /></p>} />
    <ul className="ls-roads">{D.roads.items.map((r, i) => <li key={r.id}>
      <Opener openKey={`road:${r.id}`}>
        <span className="ls-card-k">{`Road · ${String(i + 1).padStart(2, "0")} / ${String(D.roads.items.length).padStart(2, "0")}`}</span>
        <span className="ls-card-t">{r.name}</span>
        <span className="ls-card-d">{firstSentence(r.evidence)}</span>
        <span className="ls-card-v">Open the record →</span>
      </Opener>
    </li>)}</ul>
    <p className="ls-kicker ls-gap">What passed along them</p>
    <p className="ls-para ls-muted"><T text={D.trade.lead} /></p>
    <ul className="ls-list">{D.trade.items.map((t) => <li key={t.id}><Opener openKey={`trade:${t.id}`}><span className="ls-card-t">{t.name}</span><span className="ls-card-v">Open the record →</span></Opener></li>)}</ul>
    <h3 className="ls-subhead">Six battle places <em>where the ground decided the meeting</em></h3>
    <p className="ls-para ls-muted"><T text={D.battles.lead} /></p>
    <div className="ls-battles">
      <ol className="ls-battle-list" aria-label="Battle places">{battles.map((b, i) => <li key={b.id}>
        <button type="button" aria-pressed={b.id === chosen.id} className={b.id === chosen.id ? "is-on" : ""} onClick={() => onChange({ battle: b.id })}>
          <b>{String(i + 1).padStart(2, "0")}</b>{b.name}</button>
      </li>)}</ol>
      <div className="ls-record" aria-live="polite">
        <h3>{chosen.name}</h3>
        <ThreeParts evidence={chosen.evidence} inference={chosen.inference} limit={chosen.limit} />
        <VerseRefs labels={chosen.verses} />
        <StudyLink title={chosen.link} />
        <Opener openKey={`battle:${chosen.id}`} className="ls-inline">Open in the side sheet →</Opener>
      </div>
    </div>
    <p className="ls-kicker ls-gap">The ground in the story</p>
    <ul className="ls-list">{ground.map((f) => <li key={f.id}><Opener openKey={`faith:${f.id}`}><span className="ls-card-t">{f.name}</span><span className="ls-card-v">Open the record →</span></Opener></li>)}</ul>
  </>;
}
