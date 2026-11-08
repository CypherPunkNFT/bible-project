// 06 Into Greek: three patterns, each in its own verses (the Berean alone: the site holds the New Testament in English here),
// Mark's sandwiches drawn as one story opened, interrupted and closed, and the further reading the record leaves open.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, greekById } from "./model";
import { Head, Prose, RefButton, ThreeParts, VersePair } from "./parts";

// Mark's two sandwiches in the record's own words (its "look"), each part with the reference the record gives for it.
const SANDWICHES: [string, string][][] = [
  [["Mark 5:21", "Jairus asks Jesus to heal his daughter"], ["Mark 5:25", "a woman who has bled for twelve years touches him"], ["Mark 5:43", "the girl is raised"]],
  [["Mark 11:12", "Jesus curses a fig tree"], ["", "he drives the traders from the temple"], ["Mark 11:20", "the fig tree is found withered"]],
];

function Sandwiches() {
  return <div className="hpn-sandwiches">{SANDWICHES.map((parts) => <figure key={parts[0][0]} className="hpn-sandwich">
    {parts.map(([label, words], i) => <p key={words} className={i === 1 ? "hpn-filling" : "hpn-bread"}>{label && <RefButton label={label} />} {words}</p>)}
  </figure>)}</div>;
}

const SHOWN: Record<string, string[]> = { hebrewlines: ["Luke 1:3", "Luke 1:46"], paul: ["Philippians 2:6", "Romans 3:1"] };

export function Greek() {
  return <>
    <Head num="06" kicker="Into Greek" headline={D.greek.headline} lead={D.greek.lead} />
    <div className="hpn-greek">{D.greek.items.map((item, i) => <article key={item.id} className="hpn-pattern">
      <h3 className="hpn-sub"><b>{String(i + 1).padStart(2, "0")}</b> <Checked text={greekById.get(item.id)!.name} /></h3>
      <p className="hpn-look"><Prose text={item.look} /></p>
      {item.id === "sandwich" && <Sandwiches />}
      {(SHOWN[item.id] ?? []).length > 0 && <div className="hpn-pairs">{SHOWN[item.id].map((label) => <VersePair key={label} label={label} />)}</div>}
      <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
    </article>)}</div>
    <p className="hpn-caption"><Prose text={D.greek.more} /></p>
  </>;
}
