// Section 05: the letters. Paul's thirteen in three groups, by how scholars have weighed them, with the letters he says he
// signed and the one that names its scribe; the critical case and the evangelical answer side by side, each in its own
// terms; then the other names on the pen: Peter's two letters, Hebrews' four candidates (not chosen), Revelation's John.
import type { ReactElement } from "react";
import { D, LETTER_IDS, SCRIBED, SIGNED, findLetter, type LetterId } from "./model";
import { Head, Holders, SiteWord, Text } from "./parts";

type Change = (values: Record<string, string | null>) => void;

function Pen({ kind }: { kind: "signed" | "scribe" }) {
  return <svg className="nb-pen" viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true">
    {kind === "signed" ? <path d="M-6 5C-3 1-1 6 1 2s3 0 5-3" /> : <path d="M-5 6 5-6M3-6h2v2" />}
  </svg>;
}

function Groups() {
  return <div className="nb-groups">
    {D.paul.groups.map((group) => <div key={group.id} className={`nb-group ${group.id}`}>
      <p className="nb-kicker">{group.name} · {group.letters.length}</p>
      <ul>{group.letters.map((name) => <li key={name}>
        <span>{name}</span>
        {SIGNED.includes(name) && <span className="nb-penmark"><Pen kind="signed" />his own hand</span>}
        {SCRIBED.includes(name) && <span className="nb-penmark"><Pen kind="scribe" />names its scribe</span>}
      </li>)}</ul>
      <p className="nb-caption"><Text text={group.note} /></p>
    </div>)}
  </div>;
}

function Peter() {
  const p = D.petrine;
  return <div className="nb-other">
    <h3><Text text={p.head} /></h3>
    <p className="nb-sidehead">What the letters say</p><p className="nb-para"><Text text={p.evidence} /></p>
    <p className="nb-sidehead">The views</p><p className="nb-para"><Text text={p.views} /></p>
    <p className="nb-sidehead">Where the evidence stops</p><p className="nb-para nb-muted"><Text text={p.limit} /></p>
  </div>;
}

function Hebrews() {
  const h = D.hebrews;
  return <div className="nb-other">
    <h3><Text text={h.head} /></h3>
    <p className="nb-para"><Text text={h.evidence} /></p>
    <div className="nb-four"><Holders views={h.views} label="Proposed by" /></div>
    <div className="nb-sides">
      <div><p className="nb-sidehead">For Paul</p><p className="nb-para"><Text text={h.forPaul} /></p></div>
      <div><p className="nb-sidehead">Against Paul</p><p className="nb-para"><Text text={h.againstPaul} /></p></div>
    </div>
    <p className="nb-sidehead">Its date</p><p className="nb-para"><Text text={h.date} /></p>
    <SiteWord head="Not chosen" text={h.stance} />
  </div>;
}

function Revelation() {
  const r = D.revelation;
  return <div className="nb-other">
    <h3><Text text={r.head} /></h3>
    <p className="nb-para"><Text text={r.evidence} /></p>
    <Holders views={r.views} />
    <p className="nb-sidehead">Its date</p><p className="nb-para"><Text text={r.date} /></p>
    <p className="nb-sidehead">Where the evidence stops</p><p className="nb-para nb-muted"><Text text={r.limit} /></p>
  </div>;
}

const OTHER: Record<LetterId, [string, () => ReactElement]> = { peter: ["Peter's two letters", Peter], hebrews: ["Hebrews", Hebrews], revelation: ["Revelation", Revelation] };

export function Letters({ letterId, onChange }: { letterId: string | null; onChange: Change }) {
  const chosen = findLetter(letterId), Chosen = OTHER[chosen][1];
  const { criticalCase, answer } = D.paul;
  return <>
    <Head num="05" kicker="Letters" title={<>His name on the letter.<em> Another hand on the pen.</em></>} lead={D.paul.lead} />
    <Groups />
    <div className="nb-debate">
      <div><p className="nb-kicker">{criticalCase.head}</p><ol>{criticalCase.points.map((p) => <li key={p}><Text text={p} /></li>)}</ol></div>
      <div><p className="nb-kicker">{answer.head}</p><ol>{answer.points.map((p) => <li key={p}><Text text={p} /></li>)}</ol></div>
    </div>
    <SiteWord text={answer.stance} />
    <h3 className="nb-subhead">Other names on the pen</h3>
    <div className="nb-booktabs" role="group" aria-label="Choose a letter or book">
      {LETTER_IDS.map((id) => <button key={id} type="button" aria-pressed={id === chosen} onClick={() => onChange({ letter: id })}>{OTHER[id][0]}</button>)}
    </div>
    <div className="nb-bookcard" aria-live="polite"><Chosen /></div>
  </>;
}
