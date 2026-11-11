// 05 The storyteller: the seven tools as a strip of story frames, the one for what is left unsaid drawn empty. The chosen
// tool shows its key verses in Hebrew and Berean, whole verse beside whole verse (these are prose, so there are no lines to
// pair), and its three parts. Then the art-and-history panel: Alter and Sternberg side by side, the site's view as its own.
import { plural } from "@/lib/site-format";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, toolById, type Item } from "./model";
import { useOpen } from "./open";
import { Head, Prose, RefButton, SourceButton, ThreeParts, VersePair } from "./parts";

// The verses each tool is shown by: the research record's own verse list, by the use it gives each one.
const KEY: Record<string, string[]> = {
  background: ["Genesis 22:3"], firstwords: ["Genesis 25:30"], repetition: ["Genesis 41:19"],
  typescene: ["Genesis 29:10", "Exodus 2:17", "1 Samuel 9:11"], gaps: ["2 Samuel 11:11", "2 Samuel 11:27"], narrator: ["1 Samuel 18:20"],
};

const verseCount = (from: string, to: string) => Number(to.split(":")[1]) - Number(from.split(":")[1]) + 1;

/** Scene and summary: how many verses the telling gives each stretch, from the record's own references. */
function Pace({ item }: { item: Item }) {
  const [a, b, c, d] = item.examples;
  const rows: [string, string, number][] = [[a, b, verseCount(a, b)], [c, d, verseCount(c, d)]];
  const most = Math.max(...rows.map((r) => r[2]));
  return <div className="hpn-pace">{rows.map(([from, to, n]) => <p key={from}>
    <span><RefButton label={from} /> to <RefButton label={to} /></span>
    <span className="hpn-pace-bar" style={{ width: `${(n / most) * 100}%` }} />
    <small>{plural(n, "{n} verse", "{n} verses")}</small>
  </p>)}
  </div>;
}

/** What is left unsaid: David and Uriah as frames, one of them empty. */
function GapFrames({ item }: { item: Item }) {
  const open = useOpen();
  const [first, second, third, last] = item.examples;
  const frame = (label: string) => <li><button type="button" className="hpn-frame-cell" data-opener={`ref:${label}`} aria-haspopup="dialog" onClick={() => open(`ref:${label}`)}>{label.replace("2 Samuel ", "")}</button></li>;
  return <ol className="hpn-frames-row" aria-label="2 Samuel 11 as story frames, with one frame left empty">
    {frame(first)}{frame(second)}{frame(third)}
    <li><span className="hpn-frame-cell hpn-frame-empty" aria-label="An empty frame: did Uriah know? The narrator never says.">?</span></li>
    {frame(last)}
  </ol>;
}

export function Story({ tool, onChange }: { tool: string; onChange: (values: Record<string, string | null>) => void }) {
  const item = toolById.get(tool)!;
  const { storyteller } = D;
  return <>
    <Head num="05" kicker="The storyteller" headline={storyteller.headline} lead={storyteller.lead} />
    <ol className="hpn-strip" aria-label="The storyteller's tools">{storyteller.tools.map((t, i) => <li key={t.id}>
      <button type="button" className={`hpn-strip-frame${t.id === "gaps" ? " hpn-strip-empty" : ""}`} aria-pressed={t.id === tool} onClick={() => onChange({ tool: t.id })}>
        <b>{String(i + 1).padStart(2, "0")}</b><span><Checked text={t.name} /></span>
      </button>
    </li>)}</ol>
    <div className="hpn-tool" aria-live="polite">
      <h3 className="hpn-sub"><Checked text={item.name} /></h3>
      <p className="hpn-look"><Prose text={item.look} /></p>
      {tool === "scene" && <Pace item={item} />}
      {tool === "gaps" && <GapFrames item={item} />}
      <div className="hpn-pairs">{(KEY[tool] ?? []).map((label) => <VersePair key={label} label={label} />)}</div>
      <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
    </div>
    <div className="hpn-fiction">
      <h3 className="hpn-sub">{storyteller.fiction.head}</h3>
      <div className="hpn-two">{storyteller.fiction.views.map((v) => <div key={v.who} className="hpn-view">
        <p className="hpn-who"><Checked text={v.who} /></p>
        <p className="hpn-para"><Prose text={v.held} /></p>
        {v.source && <SourceButton id={v.source} />}
      </div>)}</div>
      <p className="hpn-site-voice"><Prose text={storyteller.fiction.note} /></p>
    </div>
  </>;
}
