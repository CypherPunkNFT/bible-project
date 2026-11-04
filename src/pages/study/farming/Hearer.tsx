// Section 04: what the first hearer already knew, in Ruth, the prophets and the parables. Each entry stays with the farm work; the
// parables link to the study that reads them for their teaching. The verse is the evidence, and the rest is marked as this study's.
import { Link } from "react-router-dom";
import { D, seasonNames, type HearerItem } from "./model";
import { Cite, Head, Quote, ThreeParts } from "./parts";
import { MiniWheel } from "./Wheel";

function Entry({ item }: { item: HearerItem }) {
  return <li><details className="fy-hearitem">
    <summary><MiniWheel lit={item.seasons} /><span><strong>{item.verse}</strong><small>{seasonNames(item.seasons)}</small></span></summary>
    <ThreeParts evidence={<Quote label={item.verse} />} inference={item.knew} limit={item.limit} />
    {item.parable && <p className="fy-parable"><Link to={`/study/gospels?guide=parables&parable=${encodeURIComponent(item.parable)}`}>What this parable teaches: The parables of Christ →</Link></p>}
    <Cite ids={item.sources} />
  </details></li>;
}

export function Hearer() {
  return <>
    <Head num="04" kicker="What the hearer knew" title={<>Nobody stopped to explain.<em> Nobody needed it.</em></>}
      lead="Three kinds of writing lean on the year in three ways. Open a passage for the verse, what a hearer could assume, and where that stops." />
    <div className="fy-hearers">{D.hearers.map((group) => <div key={group.id} className="fy-heargroup">
      <h3>{group.name}</h3>
      <p className="fy-hearhead">{group.head}</p>
      <p className="fy-hearlead">{group.lead}</p>
      <ul>{group.items.map((item) => <Entry key={item.id} item={item} />)}</ul>
      <Link className="fy-hearlink" to={group.link.href}>{group.link.label} →</Link>
    </div>)}</div>
  </>;
}
