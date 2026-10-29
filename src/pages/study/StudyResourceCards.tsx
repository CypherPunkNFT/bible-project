import { ArrowUpRight, Sparkles } from "lucide-react";
import { Fragment, useId, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PARABLES, PARABLE_ROOMS } from '@/data/parables';
import { ParablesPreview } from "./hub/ParablesCard";
import { CreedsPreview } from "./hub/CreedsCard";
import { StudyMiniature } from "@/components/study/StudyArtwork";
import type { StudyCollectionId } from "@/data/study-collections";
import { categoryStyle } from "@/lib/topic-style";
import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { HymnsCardArt } from "./HymnsCardArt";
import { TheologyCardArt } from "./theology-articles/TheologyCardArt";
import { VersionsStackArt } from "./VersionsCardArt";
import "./study.css";

type ResourceProps = {
  to: string; title: string; description: ReactNode; source: string;
  number: string; category: string; color: string; className?: string; children: ReactNode;
};

export function Resource({ to, title, description, source, number, category, color, className = "", children }: ResourceProps) {
  const titleId = useId(), location = useLocation();
  return (
    <li className={`study-resource ${className}`} style={{ "--resource-color": `var(--${color})` } as CSSProperties}>
      <Link to={to} className="study-resource-link" aria-labelledby={titleId} state={{ from: { path: location.pathname + location.search + location.hash, label: location.pathname.includes("theology") ? "Scripture & Theology" : "Study collection" } }}>
        <div className="study-card-top"><span>{category}</span><span className="study-card-number">{number} / 10</span></div>
        {children}
        <div className="study-card-copy">
          <h2 id={titleId}>{title}</h2>
          <p>{description}</p>
          <div className="study-card-foot"><span>{source}</span><span className="study-open"><ArrowUpRight size={20} aria-hidden="true" /></span></div>
        </div>
      </Link>
    </li>
  );
}

/** A labelled example of the four accounts in Robertson's harmony. */
function GospelPreview() {
  const gospels = [
    { name: "Matthew", reference: "14:13–21", color: "#bf9bea" },
    { name: "Mark", reference: "6:30–44", color: "#84b8e8" },
    { name: "Luke", reference: "9:10–17", color: "#81cbb8" },
    { name: "John", reference: "6:1–15", color: "#e8c17b" },
  ];
  return (
    <div className="study-gospels" aria-hidden="true">
      <div className="study-gospel-labels">
        {gospels.map((g) => <div key={g.name} style={{ color: g.color }}><span>{g.name}</span><small>{g.reference}</small></div>)}
      </div>
      <svg viewBox="0 0 600 132" fill="none" preserveAspectRatio="none">
        {gospels.map((g, i) => <g key={g.name}>
          <path d={`M ${75 + i * 150} 0 C ${75 + i * 150} 76, ${255 + i * 30} 45, ${255 + i * 30} 126`} stroke={g.color} strokeWidth="1.5" />
          <circle cx={75 + i * 150} cy="3" r="3" fill={g.color} />
          <circle className="study-gospel-light" cx={255 + i * 30} cy="126" r="4" fill={g.color} style={{ animationDelay: `${i * 0.4}s` }} />
        </g>)}
      </svg>
      <div className="study-gospel-event"><span>One event. Four accounts.</span><strong>Feeding the five thousand</strong></div>
    </div>
  );
}

function MiraclePreview() {
  return <div className="study-art study-miracle-art" aria-hidden="true">
    <div className="study-ripple study-ripple-one" /><div className="study-ripple study-ripple-two" /><div className="study-ripple study-ripple-three" />
    <Sparkles className="study-miracle-star" strokeWidth={1} />
    <span className="study-art-note">Healing · Provision · Wonders</span>
  </div>;
}

function PeoplePreview() {
  return <div className="study-art study-family-art" aria-hidden="true">
    <svg viewBox="0 0 360 170" fill="none">
      <path d="M180 42V77M76 110V77H284V110M180 77V110" stroke="currentColor" strokeOpacity=".45" />
      <circle cx="180" cy="28" r="18" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
      <circle cx="180" cy="28" r="5" fill="currentColor" /><text x="180" y="65">Abraham</text>
      {([[76, "Ishmael"], [180, "Isaac"], [284, "Zimran"]] as const).map(([x, name]) => <g key={name}>
        <circle cx={x} cy="120" r="10" fill="var(--surface)" stroke="currentColor" /><circle cx={x} cy="120" r="3" fill="currentColor" /><text x={x} y="150">{name}</text>
      </g>)}
    </svg>
    <span className="study-art-note">People, families & their stories</span>
  </div>;
}

function MemoryPreview() {
  const lensId = useId().replace(/:/g, "");
  return <div className="study-art study-memory-art" aria-hidden="true"><svg className="study-memory-grid" viewBox="0 0 600 170" fill="none">
    {[0,1,2].map(row => <g key={row}><path d={`M12 ${16+row*48}H588M12 ${56+row*48}H588`} stroke="currentColor" strokeOpacity=".5" strokeWidth="1.4" />
      {Array.from({length:42},(_,i) => <circle key={i} cx={18+(i*41)%560} cy={23+row*48+(i*17)%26} r={i%5===0?3.2:1.8} fill="currentColor" opacity={.4+(i%5)*.15} />)}
      {[12,126,245,366,478,588].map(x => <path key={x} d={`M${x} ${16+row*48}V${56+row*48}`} stroke="currentColor" strokeOpacity=".5" strokeWidth="1.4" />)}</g>)}
    <defs><clipPath id={lensId}><circle cx="410" cy="82" r="29" /></clipPath></defs>
    <g className="study-memory-glass"><path d="M435 107L461 133" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <circle cx="410" cy="82" r="33" fill="var(--surface)" fillOpacity=".94" stroke="currentColor" strokeWidth="2.5" />
      <g clipPath={`url(#${lensId})`}><path d="M377 71H443M377 94H443M398 49V115M422 49V115" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
        {[[389,61],[408,88],[426,65],[395,103],[433,97]].map(([x,y])=><circle key={x} cx={x} cy={y} r="3.8" fill="currentColor" />)}</g>
    </g>
  </svg><span className="study-art-note">A life remembered across Scripture</span></div>;
}

function LettersPreview() {
  return <div className="study-art study-letters-art" aria-hidden="true">
    <div className="study-letter-sheet study-letter-back" />
    <div className="study-letter-sheet study-letter-front">
      <span>THE EPISTLE TO THE</span><strong>Romans</strong><div className="study-letter-rule" />
      <i /><i /><i /><i /><div className="study-letter-sections"><b /><b /><b /><b /><b /></div>
    </div>
    <span className="study-art-note">21 letters. Section by section.</span>
  </div>;
}

function ChartPreview({ kind, note }: { kind: StudyCollectionId; note: string }) {
  return <div className="study-art study-chart-art"><StudyMiniature kind={kind} /><span className="study-art-note">{note}</span></div>;
}

// Faded topic names drifting around the drawing: [label, left %, top %, drift delay s].
const FLOATING_TOPICS: [string, number, number, number][] = [
  ["Grace", 9, 14, 0], ["Prayer", 77, 10, 1.6], ["Covenant", 4, 52, 3.1], ["Mercy", 84, 48, .8], ["Faith", 16, 84, 2.4],
  ["Holiness", 70, 86, 4], ["Repentance", 36, 6, 5.2], ["Hope", 58, 4, 2.9], ["Angels", 90, 72, 1.2], ["Temple", 2, 30, 4.6],
];

/** The God family's drawing (the triangle in the radiant circle) with topic names floating faintly around it. */
function TopicsPreview() {
  return <div className="study-art study-topics-art" style={{ "--resource-color": categoryStyle("god").color } as CSSProperties} aria-hidden="true">
    {FLOATING_TOPICS.map(([label, left, top, delay]) => <span key={label} className="study-topics-word" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `-${delay}s` }}>{label}</span>)}
    <TopicsArtwork kind="god" />
  </div>;
}

function NamesPreview() {
  return <div className="study-art study-names-art" aria-hidden="true">
    <span>Abba Father</span><span>Jesus Christ</span><span>Holy Spirit</span><div className="study-name-orbit" />
  </div>;
}

function PlacesPreview() {
  return <div className="study-art study-places-art" aria-hidden="true">
    <img src="/atlas/bluemarble-region-preview.jpg" width="1500" height="755" alt="" loading="lazy" />
    <div className="study-map-grid" /><span className="study-map-caption"><span className="study-map-dot" /> Explore the biblical world</span>
    <span className="study-map-credit">NASA Blue Marble</span>
  </div>;
}

const RESOURCE_CARDS = {
  topics: <Resource to="/topics" title="Topics" description="5,603 subjects in 55 families, from the love of God and the books of the Bible to every person, place, miracle and parable. Each gathers every passage that speaks to it, with key verses quoted in full." source="Torrey, Nave & Easton" number="01" category="Every subject, every verse" color="epistles" className="study-topics-resource study-wide"><TopicsPreview /></Resource>,
  names: <Resource to="/study/names" title="Names & descriptions of God" description="302 names and titles of the Father, the Son and the Holy Spirit. Unfold each name to discover the passages behind it." source="The Faith-page collection" number="02" category="His character, revealed" color="revelation" className="study-wide"><NamesPreview /></Resource>,
  gospels: <Resource to="/study/gospels" title="Jesus & the Gospels" description="Read his teaching in its setting, see where he speaks, and compare 185 events across Matthew, Mark, Luke and John. Four accounts open onto one life." source="Gospel harmony · Teaching journeys · Speech atlas" number="03" category="The life of Christ" color="gospels" className="study-feature"><GospelPreview /></Resource>,
  parables: <Resource to="/study/gospels?guide=parables" title="The parables of Christ" description="A seed, a treasure, an open door. Enter the stories Jesus told, discover the turn that changes everything, and hear their invitation to respond." source={`${PARABLES.length} studies & ${PARABLE_ROOMS.length} themes`} number="" category="Stories that open our eyes" color="epistles" className="study-parables-resource"><ParablesPreview /></Resource>,
  miracles: <Resource to="/study/miracles" title="Miracles & encounters" description="Explore the 35 miracles of Jesus, and wonders worked through Moses, Elijah, the apostles and others. Open each event to its passages." source="Robertson & Torrey" number="04" category="Signs & wonders" color="acts"><MiraclePreview /></Resource>,
  references: <Resource to="/study/connections" title="Connections in Scripture" description="How does one passage lead to another? Follow the cross-reference arcs and compare whole books, then read the linked passages in context." source="Cross-reference arcs · Book-to-book matrix" number="05" category="Passages in conversation" color="poetry"><ChartPreview kind="references" note="Across chapters. Between books." /></Resource>,
  structure: <Resource to="/study/structure" title="The Bible by the numbers" description="How much of Scripture is history, poetry, prophecy or letter? Weigh the six parts nine ways, from words and verses to miracles and the words of Jesus, then line up all 66 books by length." source="Parts & measures · Book lengths · Chapters" number="06" category="Measures & proportions" color="history"><ChartPreview kind="structure" note="Six parts. 66 books. 1,189 chapters." /></Resource>,
  people: <Resource to="/study/people" title="People & genealogies" description="Meet 3,052 people in the order of biblical history, follow their families and open each life on its own page. The prophets guide places named prophets in the eras Scripture gives them." source="People · Families · Prophets · Rulers · Apostles" number="07" category="Lives & lineages" color="history"><PeoplePreview /></Resource>,
  memory: <Resource to="/study/long-memory" title="Long Memory" description={<>Follow a life across Scripture, one verse at a time.<br /><span>Begin with ten lives: explore their mentions, words, pivotal moments, and how Scripture remembers them.</span></>} source="Ten lives · Four study lenses · Every light opens a verse" number="" category="A life across Scripture" color="epistles" className="study-memory-resource"><MemoryPreview /></Resource>,
  letters: <Resource to="/study/letters" title="Letters & their message" description="Explore all 21 New Testament letters: who wrote them, who received them, and how each message unfolds, section by section." source="Westcott, Lightfoot, Ramsay & other public-domain scholars" number="08" category="Letters to the church" color="epistles"><LettersPreview /></Resource>,
  atlas: <Resource to="/study/atlas" title="Places & journeys" description="Find 1,252 biblical places on a map of the ancient world. Explore the settings of the story, compare places by book, and open their passages." source="OpenBible.info · OpenStreetMap" number="09" category="The world of the Bible" color="poetry" className="study-map-feature"><PlacesPreview /></Resource>,
  creeds: <Resource to="/study/creeds" title="Catechisms & Creeds" description="What has the church actually confessed? 66 creeds, confessions and catechisms in full, from Israel's own creed to the First Vatican Council, with every Scripture quotation shown in the Berean Standard Bible." source="12 traditions · 11,375 questions & sections · Creeds.json, Schaff & Project Gutenberg" number="" category="The faith, said out loud" color="revelation" className="study-creeds-resource"><CreedsPreview /></Resource>,
  "theology-articles": <Resource to="/study/theology-articles" title="Theology" description="The faith, thought through. Long-form articles on Christian doctrine: what the church actually confesses, where the words came from, and what the explanations cannot do. The Trinity opens the section, with every analogy placed beside the limit its own author set on it." source="Augustine, Aquinas, the Cappadocians & two councils · Nicene and Post-Nicene Fathers" number="" category="Doctrine, taken slowly" color="gospels" className="study-theology-resource study-wide"><TheologyCardArt /></Resource>,
  hymns: <Resource to="/study/hymns" title="Hymns" description="1,228 hymns whose words we hold, from Isaac Watts's psalms and hymns to the Olney Hymns of John Newton and William Cowper, each beside the chapter it was written on. Amazing Grace opens with every verse its lines echo." source="Watts, Newton & Cowper · CCEL & Project Gutenberg" number="" category="The faith, sung" color="poetry" className="study-hymns-resource study-wide"><HymnsCardArt /></Resource>,
  versions: <Resource to="/study/versions" title="Versions & languages" description="Which edition are you reading? Place the library's versions in time, compare their actual book collections, and choose one to read." source="Edition timeline · Book coverage · Library" number="10" category="Editions & contents" color="acts" className="study-wide"><VersionsStackArt /></Resource>,
};

export type StudyResourceId = keyof typeof RESOURCE_CARDS;
export const STUDY_RESOURCE_IDS = Object.keys(RESOURCE_CARDS).filter(id => id !== "parables" && id !== "memory" && id !== "creeds" && id !== "hymns" && id !== "theology-articles") as StudyResourceId[];

/** The original Study2 cards, shared intact with the organized Theology collections. */
export function StudyResourceCards({ ids = STUDY_RESOURCE_IDS, className = "", label = "Study resources" }: {
  ids?: readonly StudyResourceId[]; className?: string; label?: string;
}) {
  return <ul className={`study-resource-grid ${className}`} aria-label={label}>
    {ids.map(id => <Fragment key={id}>{RESOURCE_CARDS[id]}</Fragment>)}
  </ul>;
}
