// The national lines as a directory: the kinds of help down the left, each in its own solid colour, and the chosen
// kind's lines in a dense list beside them. Every line keeps its first call or text button on the closed row and opens
// in place (one at a time) for everything else.
import { useState, type CSSProperties } from "react";
import type { LifeData } from "@/data/resources";
import { groupStats, kindOf, plural, tone } from "./format";
import { LifeRow } from "./Row";

export function NationalLines({ groups }: { groups: LifeData["groups"] }) {
  const [chosen, setChosen] = useState(groups[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);
  return <section className="lf-nat" aria-labelledby="lf-national">
    <div className="lf-sec-head"><span>01</span><h2 id="lf-national">National lines</h2><p>Pick a kind of help on the left. Every line has its first call or text button ready on the closed row; open it for everything else.</p></div>
    <div className="lf-dir">
      <div className="lf-kinds" role="group" aria-label="Kind of help">{groups.map((g) => {
        const { Icon } = kindOf(g.id), s = groupStats(g);
        return <button key={g.id} type="button" className="lf-kind" data-g={g.id} aria-pressed={g.id === chosen} style={{ "--c": tone(g.id) } as CSSProperties} onClick={() => setChosen(g.id)}>
          <span className="lf-kind-disc"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></span><span className="lf-t">{g.title.replace(/ — .*/, "")}</span>
          <span className="lf-n">{s.n}</span><span className="lf-w">{s.line}</span>
        </button>;
      })}</div>
      <div className="lf-list">{groups.map((g) => <div key={g.id} className="lf-pane" data-g={g.id} hidden={g.id !== chosen} style={{ "--c": tone(g.id) } as CSSProperties}>
        <p className="lf-pane-title"><span>{g.title}</span><small>{plural(g.entries.length, "line")}</small></p>
        <ol aria-label={g.title}>{g.entries.map((e) => <LifeRow key={e.id} entry={e} kind={g.id} layout="wide" quick={g.id === "crisis" ? 2 : 1}
          open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />)}</ol>
      </div>)}</div>
    </div>
  </section>;
}
