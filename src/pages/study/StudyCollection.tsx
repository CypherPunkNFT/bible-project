import { ArrowDown, ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { StudyMiniature } from "@/components/study/StudyArtwork";
import type { StudyCollectionId } from "@/data/study-collections";
import "./study.css";

type ResourceProps = {
  to: string; title: string; description: string; source: string;
  number: string; category: string; color: string; className?: string; children: ReactNode;
};

function Resource({ to, title, description, source, number, category, color, className = "", children }: ResourceProps) {
  return (
    <li className={`study-resource ${className}`} style={{ "--resource-color": `var(--${color})` } as CSSProperties}>
      <Link to={to} className="study-resource-link" aria-labelledby={`study-title-${number}`}>
        <div className="study-card-top"><span>{category}</span><span className="study-card-number">{number} / 09</span></div>
        {children}
        <div className="study-card-copy">
          <h2 id={`study-title-${number}`}>{title}</h2>
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

export default function StudyCollection() {
  return (
    <div className="study-hub mx-auto max-w-7xl px-4 sm:px-6">
      <header className="study-intro">
        <div>
          <p className="study-eyebrow"><span /> The study collection</p>
          <h1>Go deeper into <em>the Word.</em></h1>
          <p className="study-intro-copy">Follow a life. Compare the accounts. Discover the shape, connections and setting of Scripture. Guides, charts and maps bring different questions to the same open Bible.</p>
        </div>
        <div className="study-intro-aside">
          <BookOpen size={28} strokeWidth={1.1} aria-hidden="true" />
          <p>Nine ways to explore.<br /><span>Every path leads to Scripture.</span></p>
          <a href="#study-collection">Find your starting point <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
      </header>
      <div id="study-collection" className="study-collection-heading"><span>Explore the collection</span><span>Open a guide. Begin anywhere.</span></div>
      <ul className="study-resource-grid" aria-label="Study resources">
        <Resource to="/study/gospels" title="Jesus & the Gospels" description="Read his teaching in its setting, see where he speaks, and compare 185 events across Matthew, Mark, Luke and John. Four accounts open onto one life." source="Gospel harmony · Teaching journeys · Speech atlas" number="01" category="The life of Christ" color="gospels" className="study-feature"><GospelPreview /></Resource>
        <Resource to="/study/miracles" title="Miracles & encounters" description="Explore the 35 miracles of Jesus, and wonders worked through Moses, Elijah, the apostles and others. Open each event to its passages." source="Robertson & Torrey" number="02" category="Signs & wonders" color="acts"><MiraclePreview /></Resource>
        <Resource to="/study/references" title="Connections in Scripture" description="How does one passage lead to another? Follow the cross-reference arcs and compare whole books, then read the linked passages in context." source="Cross-reference arcs · Book-to-book matrix" number="03" category="Passages in conversation" color="poetry"><ChartPreview kind="references" note="Across chapters. Between books." /></Resource>
        <Resource to="/study/structure" title="The shape of the Bible" description="How does the whole fit together? Explore literary forms, compare nine measures, and find your place among the books and numbered chapters." source="Sections & measures · Book lengths · Chapter atlas" number="04" category="Books & literary forms" color="history"><ChartPreview kind="structure" note="The whole. The books. The chapters." /></Resource>
        <Resource to="/study/people" title="People & relationships" description="Meet 3,130 people, follow their families and read their stories. The prophets guide places named prophets in the eras Scripture gives them." source="People · Families · Prophets through time" number="05" category="Lives & lineages" color="history"><PeoplePreview /></Resource>
        <Resource to="/study/letters" title="Letters & their message" description="Explore all 21 New Testament letters: who wrote them, who received them, and how each message unfolds, section by section." source="Berean Standard Bible headings" number="06" category="Letters to the church" color="epistles"><LettersPreview /></Resource>
        <Resource to="/study/atlas" title="Places & journeys" description="Find 1,252 biblical places on a map of the ancient world. Explore the settings of the story, compare places by book, and open their passages." source="OpenBible.info · OpenStreetMap" number="07" category="The world of the Bible" color="poetry" className="study-map-feature"><PlacesPreview /></Resource>
        <Resource to="/study/names" title="Names & descriptions of God" description="302 names and titles of the Father, the Son and the Holy Spirit. Unfold each name to discover the passages behind it." source="The Faith-page collection" number="08" category="His character, revealed" color="revelation" className="study-wide"><NamesPreview /></Resource>
        <Resource to="/study/versions" title="Versions & languages" description="Which edition are you reading? Place the library's versions in time, compare their actual book collections, and choose one to read." source="Edition timeline · Book coverage · Library" number="09" category="Editions & contents" color="acts" className="study-wide"><ChartPreview kind="versions" note="The texts in your hands" /></Resource>
      </ul>
      <div className="study-source-note"><BookOpen size={20} strokeWidth={1.4} aria-hidden="true" /><p>Made for an open Bible.<span>Built from public-domain reference books and openly licensed data. Every passage links to the reader.</span></p><Link to="/versions">Meet the sources <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
  );
}
