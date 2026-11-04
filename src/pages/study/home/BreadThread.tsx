// Section 03: the share of grain in the diet as a range, the words Scripture uses for food, and two parallel chains of work, grain to
// table and fibre to bed. Each begins once the grain or fibre is at the house.
import { useState } from "react";
import { D, HH, type Ladder } from "./model";
import { Cite, Head, Quote, SourceLink } from "./parts";

function GrainRange() {
  return <div className="hh-range">
    <p className="hh-kicker">How much of a day's food was grain?</p>
    <p className="hh-q">A range, because no one measured it.</p>
    <div className="hh-track" role="img" aria-label="On a scale of none to all of the day's calories, Tim Frank's book gives a range of 53 to 75 percent, and Carol Meyers says more than 70 percent.">
      <i className="hh-band" style={{ left: "53%", width: "22%" }} />
      <i className="hh-open" style={{ left: "70%", width: "30%" }} />
      <span style={{ left: "53%" }}>53</span><span style={{ left: "75%" }}>75</span>
    </div>
    <div className="hh-axis"><span>None</span><span>All of the day's calories</span></div>
    <ul className="hh-range-key">
      <li><i className="hh-key-band" /> <b>53 to 75 percent.</b> <SourceLink id="frank-book" /></li>
      <li><i className="hh-key-open" /> <b>More than 70 percent.</b> <SourceLink id="meyers" /></li>
    </ul>
  </div>;
}

function FoodWords() {
  const top = Math.max(...D.words.map((w) => w.count));
  return <div className="hh-words">
    <p className="hh-kicker">How often does the Hebrew Bible name it?</p>
    <ul>{D.words.map((w) => <li key={w.id}><span>{w.label}</span><i><u style={{ width: `${(w.count / top) * 100}%` }} /></i><b>{w.count}</b></li>)}</ul>
    <p className="hh-caption">Tim Frank's counts, in the article below. As a check, this site's tagged King James has {HH.breadTags} tags for the same Hebrew word. A tag is not an exact count of uses, so a small gap is expected. A count shows what writers named, not what people ate.</p>
    <Cite ids={["frank-odyssey"]} />
  </div>;
}

function LadderView({ ladder }: { ladder: Ladder }) {
  const [chosen, setChosen] = useState(ladder.steps[0].id);
  const step = ladder.steps.find((s) => s.id === chosen) ?? ladder.steps[0];
  return <div className="hh-ladder">
    <h3>{ladder.name} <small>{ladder.from} {ladder.to}</small></h3>
    <ol>{ladder.steps.map((s, i) => <li key={s.id}>
      <button type="button" aria-pressed={s.id === step.id} onClick={() => setChosen(s.id)}><b>{i + 1}</b>{s.name}</button>
    </li>)}</ol>
    <div className="hh-step" aria-live="polite">
      <p>{step.line}</p>
      <Quote label={step.verse} />
      {step.source !== "scripture" && <div className="hh-cite"><SourceLink id={step.source} /></div>}
    </div>
  </div>;
}

export function BreadThread() {
  return <>
    <Head num="03" kicker="Bread and thread" title={<>Bread every day.<em> Cloth from scratch.</em></>}
      lead="Two chains of work, starting where the grain or the fibre is already at the house. Growing and threshing belong to the planned study of the farming year." />
    <div className="hh-pair"><GrainRange /><FoodWords /></div>
    <div className="hh-ladders">{D.ladders.map((ladder) => <LadderView key={ladder.id} ladder={ladder} />)}</div>
  </>;
}
