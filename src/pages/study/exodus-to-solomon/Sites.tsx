// 03 Ai and 04 The gates: two changes of scale, from the whole track down to one site and then to one structure. Ai is two hills
// side by side, each with the view that places Ai there and who holds it, and a schematic two-pin sketch that names both. The
// gates are one illustrative plan drawn alike three times, each with the conventional and the low dating as two bars.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { debateById, recordOf, spanWord, XS } from "./model";
import { Head, OpenRecord, Prose, ThreeParts } from "./parts";

/** A hill in profile: et-Tell broad (its Early Bronze city), Khirbet el-Maqatir small with a fortress outline. Not surveyed. */
function Hill({ broad }: { broad: boolean }) {
  return <svg className="xs-hill" viewBox="0 0 240 70" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={broad ? "M4 64C40 60 54 22 120 20s80 40 116 44" : "M4 64C60 62 84 38 120 36s60 26 116 28"} fill="currentColor" fillOpacity=".06" />
    {broad ? <path d="M70 34h100M80 28h80" strokeDasharray="3 3" opacity=".6" /> : <path d="M106 36v-12h28v12M106 24l4-4h20l4 4" opacity=".8" />}
  </svg>;
}

function TwoPins() {
  return <figure className="xs-pins">
    <svg viewBox="0 0 300 120" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="A schematic sketch: Beitin, usually taken as Bethel, to the west; et-Tell to its east; Khirbet el-Maqatir about a kilometre west of et-Tell. Not to scale.">
      <path d="M10 96c40-8 80-30 140-34s100 18 140 14" opacity=".35" />
      <g className="xs-pin-b"><circle cx="46" cy="66" r="4" /><text x="46" y="52" textAnchor="middle">Beitin (Bethel?)</text></g>
      <g className="xs-pin"><path d="M152 70v-22" /><circle cx="152" cy="44" r="5" /><text x="152" y="32" textAnchor="middle">Khirbet el-Maqatir</text></g>
      <g className="xs-pin"><path d="M232 74v-22" /><circle cx="232" cy="48" r="5" /><text x="232" y="100" textAnchor="middle">et-Tell</text></g>
      <path d="M156 86h72" strokeDasharray="2 3" /><text className="xs-pin-scale" x="192" y="82" textAnchor="middle">about 1 km</text>
      <path d="M268 18v16m0-16-4 6m4-6 4 6" /><text className="xs-pin-scale" x="268" y="44" textAnchor="middle">N</text>
    </svg>
    <figcaption>Schematic, not to scale. Both pins are proposals for Ai; Bethel at Beitin is the usual placement, which one proposal disputes.</figcaption>
  </figure>;
}

export function Ai() {
  const debate = debateById.get("ai")!;
  const record = recordOf("conquest", "ai");
  return <>
    <Head num="03" kicker={<>Ai</>} title="Two hills." turn="One name." lead={<Prose text="Joshua 8:28 says Joshua burned Ai and left it a ruin. Two hills about a kilometre apart are each proposed as the place. The ground at each is real; which one the text means is a judgment." />} />
    <div className="xs-ai">{debate.views.map((v, i) => <article key={v.name}>
      <Hill broad={i === 0} />
      <h3><Checked text={v.name} /></h3>
      <p className="xs-held"><b>Placed here by</b> <Prose text={v.held} /></p>
      {v.forIt && <p><b>For it</b> <Prose text={v.forIt} /></p>}
      {v.against && <p><b>Against it</b> <Prose text={v.against} /></p>}
      {v.wouldShow && <p className="xs-would"><b>What would settle it</b> <Prose text={v.wouldShow} /></p>}
    </article>)}</div>
    <div className="xs-ai-foot">
      <TwoPins />
      {record && <div><p className="xs-kicker">What was dug, and what it can show</p><ThreeParts evidence={record.evidence} inference={record.inference} limit={record.limit} /></div>}
    </div>
  </>;
}

const PIERS = [10, 30, 50, 70];

/** One six-chambered gate in plan: three chambers each side of the passage, two towers at the front. Illustrative. */
function GatePlan() {
  return <svg className="xs-gate-plan" viewBox="0 0 120 110" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10h30M86 10h30" opacity=".5" />
    <g fill="currentColor" fillOpacity=".1">{PIERS.map((y) => <g key={y}><rect x="22" y={y} width="28" height="6" /><rect x="70" y={y} width="28" height="6" /></g>)}
      <rect x="14" y="78" width="36" height="22" /><rect x="70" y="78" width="36" height="22" /></g>
    <path d="M22 10v68M98 10v68" />
    <path d="M60 4v102" strokeDasharray="2 4" opacity=".45" />
  </svg>;
}

const SCALE = { from: 1000, to: 800, width: 200 };
const gx = (year: number) => ((SCALE.from - year) / (SCALE.from - SCALE.to)) * SCALE.width;
const GATE_CITIES = ["Hazor", "Megiddo", "Gezer"];

function Datings() {
  const [conventional, low] = XS.bars.gates ?? [];
  if (!conventional || !low) return null;
  return <svg className="xs-gate-bars" viewBox={`-16 0 ${SCALE.width + 32} 52`} role="img" aria-label={`Two datings: conventional, ${spanWord(conventional)}; low, ${spanWord(low)}.`}>
    {[1000, 900, 800].map((y) => <g key={y} className="xs-tick"><line x1={gx(y)} x2={gx(y)} y1={4} y2={40} /><text x={gx(y)} y={50} textAnchor="middle">{y}</text></g>)}
    <rect className="xs-bar" x={gx(conventional[0])} y={8} width={gx(conventional[1]) - gx(conventional[0])} height={9} rx={2} />
    <text className="xs-bar-label" x={gx(conventional[1]) + 4} y={16}>Conventional</text>
    <rect className="xs-bar alt" x={gx(low[0])} y={24} width={gx(low[1]) - gx(low[0])} height={9} rx={2} />
    <text className="xs-bar-label" x={gx(low[0]) - 4} y={32} textAnchor="end">Low</text>
  </svg>;
}

export function Gates() {
  const tenth = debateById.get("tenth")!;
  const gates = recordOf("solomon", "gates");
  return <>
    <Head num="04" kicker="The gates" title="One plan. Three cities." turn="Which century?" lead={<>The same plan stands at all three cities <Prose text="1 Kings 9:15" /> names. The plan is agreed; the century is the argument.</>} />
    <ul className="xs-gates">{GATE_CITIES.map((city, i) => <li key={city}>
      <p className="xs-kicker">{String(i + 1).padStart(2, "0")} / 03</p>
      <h3>{city}</h3>
      <GatePlan />
      <Datings />
    </li>)}</ul>
    <p className="xs-caption">The three are drawn alike on purpose: one illustrative plan, not measured from any site, with the record's two datings, which it gives for all three. Each bar is a range no narrower than its source; neither is a building date.</p>
    <div className="xs-tenth">
      <ul className="xs-tenth-views">{tenth.views.map((v) => <li key={v.name}><h4><Checked text={v.name} /></h4><p className="xs-held"><Prose text={v.held} /></p>{v.note && <p><Prose text={v.note} /></p>}</li>)}</ul>
      {gates && <ThreeParts evidence={gates.evidence} inference={gates.inference} limit={gates.limit} />}
      <p className="xs-more"><OpenRecord station="solomon" record="low" /> <OpenRecord station="solomon" record="conventional" /> <OpenRecord station="solomon" record="copper" /></p>
    </div>
  </>;
}
