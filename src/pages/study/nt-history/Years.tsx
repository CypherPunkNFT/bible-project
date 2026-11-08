// 05 The years of Jesus: the anchors the text gives, then the views with their holders, at equal weight. A strip draws Herod's two
// possible deaths, the two birth ranges and the two Fridays; the reader may bring one view forward, and both stay drawn.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { anchorById, D, rangeWord, type View } from "./model";
import { Head, Prose } from "./parts";

const S0 = -8, S1 = 36, SW = 860, SX = (year: number) => 20 + ((year < 0 ? year + 1 : year) - (S0 + 1)) / (S1 + 1 - (S0 + 1)) * SW;
// The birth ranges and the two Fridays are the build's checked anchor years, not numbers of this file's own.
const [early, late] = anchorById.get("birth")!.years, [first, second] = anchorById.get("cross")!.years;
const BIRTH = { early: [early.from, early.to], late: [late.from, late.to] } as const;
const CROSS = { [String(first.from)]: first.from, [String(second.from)]: second.from } as Record<"30" | "33", number>;

function Strip({ birth, cross }: { birth: "early" | "late" | null; cross: "30" | "33" | null }) {
  const end = (year: number) => SX(year) + SX(1) - SX(0);
  return <svg className="nh-strip" viewBox="0 0 900 96" aria-hidden="true">
    <defs><pattern id="nh-hatch-years" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line className="nh-hatch-line" x1="0" y1="0" x2="0" y2="5" /></pattern></defs>
    {[-5, 1, 10, 20, 30].map((y) => <g key={y}><line x1={SX(y)} x2={SX(y)} y1="6" y2="74" /><text x={SX(y) + 2} y="88">{rangeWord(y, y)}</text></g>)}
    <rect className="nh-strip-herod" x={SX(S0)} y="8" width={end(-4) - SX(S0)} height="12" /><text x={SX(S0) + 4} y="18">Herod: to 4 BC</text>
    <rect className="nh-strip-herod" x={SX(S0)} y="24" width={end(-1) - SX(S0)} height="12" opacity=".6" /><text x={end(-1) + 4} y="34">or to 1 BC</text>
    {(Object.entries(BIRTH) as ["early" | "late", readonly [number, number]][]).map(([id, [a, b]]) => <g key={id}>
      <rect className={`nh-strip-range${birth && birth !== id ? " dim" : ""}`} x={SX(a)} y="42" width={end(b) - SX(a)} height="12" />
      {id === "early" ? <text x={SX(a) - 4} y="52" textAnchor="end">Born, early view</text> : <text x={end(b) + 4} y="52">Born, late view</text>}
    </g>)}
    {(Object.entries(CROSS) as ["30" | "33", number][]).map(([id, y]) => <g key={id}>
      <line className={`nh-strip-point${cross && cross !== id ? " dim" : ""}`} x1={SX(y) + 4} x2={SX(y) + 4} y1="40" y2="74" />
      <text x={SX(y) + 8} y="50">{`AD ${y}`}</text>
    </g>)}
  </svg>;
}

function Views({ views, chosen, word }: { views: View[]; chosen: string | null; word: (v: View) => string }) {
  return <div className="nh-views">{views.map((v) => <div key={v.id} className={`nh-view${chosen && chosen !== word(v) ? " dim" : ""}`}>
    <h4><Checked text={v.label} /></h4>
    <p><b>Held by:</b> <Prose text={v.held} /></p>
    {v.rests && <p><b>Rests on:</b> <Prose text={v.rests} /></p>}
  </div>)}</div>;
}

function Switch({ name, value, options, onPick }: { name: string; value: string | null; options: [string | null, string][]; onPick: (v: string | null) => void }) {
  return <div className="nh-switch" role="group" aria-label={name}>{options.map(([v, text]) => <button key={text} type="button" aria-pressed={value === v} onClick={() => onPick(v)}>{text}</button>)}</div>;
}

export function Years({ birth, cross, onChange }: { birth: "early" | "late" | null; cross: "30" | "33" | null; onChange: (values: Record<string, string | null>) => void }) {
  const { chronology: c } = D;
  return <>
    <Head num="05" kicker="The years of Jesus" title="Two births." turn="Two Fridays." lead={<Prose text={c.lead} />} />
    <Strip birth={birth} cross={cross} />
    <div className="nh-years-grid">
      <div>
        <h3>The birth</h3>
        <ul className="nh-anchorlist">{c.birth.anchors.map((a) => <li key={a}><Prose text={a} /></li>)}</ul>
        <Switch name="Bring forward a view of the birth" value={birth} options={[[null, "Both views"], ["early", "About 6 to 4 BC"], ["late", "About 3 to 2 BC"]]} onPick={(v) => onChange({ birth: v })} />
        <Views views={c.birth.views} chosen={birth} word={(v) => v.id} />
        <p className="nh-caption"><Prose text={c.birth.reckoning} /></p>
      </div>
      <div>
        <h3>The cross</h3>
        <ul className="nh-anchorlist">{c.death.anchors.map((a) => <li key={a}><Prose text={a} /></li>)}</ul>
        <Switch name="Bring forward a date for the cross" value={cross} options={[[null, "Both dates"], ["30", "AD 30"], ["33", "AD 33"]]} onPick={(v) => onChange({ cross: v })} />
        <Views views={c.death.views} chosen={cross} word={(v) => v.id.replace("ad", "")} />
        <p className="nh-caption"><Prose text={c.death.limit} /></p>
      </div>
    </div>
    <div className="nh-census">
      <p className="nh-kicker">The census of Luke 2:1–2</p>
      <h3><Prose text={c.census.question} /></h3>
      <p className="nh-para"><Prose text={c.census.evidence} /></p>
      <div className="nh-census-views">{c.census.views.map((v) => <div key={v.id} className={v.id === "error" ? "others" : undefined}>
        <span className="nh-tag">{v.id === "error" ? "Others' view, with the answer" : "A reading that holds Luke true"}</span>
        <h4><Checked text={v.label} /></h4>
        <p><b>Held by:</b> <Prose text={v.held} /></p>
        {v.against && <p><b>Against it:</b> <Prose text={v.against} /></p>}
      </div>)}</div>
      <p className="nh-caption"><Prose text={c.census.limit} /></p>
    </div>
  </>;
}
