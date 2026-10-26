// Homepage (live; first tried on home_mockup2): the section under the row of studies. First what the project is (the About content of the contact
// page, its four convictions shared from AboutSections.tsx), then "Where are you starting from?": each answer glides the page
// down to that numbered part and opens it. Styles: home-guide.css.
// Two layouts: "columns" (home_mockup2: story in columns, then the four answers in a row) and "side" (home_mockup: the story
// stacked on the left, the answers as rows on the right, the four convictions along the bottom).
import { ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";
import { CONVICTIONS, ConvictionList } from "../contact/AboutSections";
import "../contact/contact.css";
import "./home-guide.css";

const PATHS = [
  { part: 0, number: "01", tone: "epistles", who: "I'm new to the faith",
    text: "Start with the story itself. Read it a book at a time, in the version you understand best, and let it speak for itself.",
    steps: ["Begin with the Gospel of John", "Listen to a chapter read aloud", "Pick up where you stopped, any time"] },
  { part: 1, number: "02", tone: "gospels", who: "I believe, and want to go deeper",
    text: "Take a passage further: its words in the original languages, the places it happened, and what the Church has said about it.",
    steps: ["Follow a verse's cross-references", "See the places on the map", "Read the teachers on a passage"] },
  { part: 2, number: "03", tone: "prophets", who: "I want to defend what I believe",
    text: "The hard questions, the debates and the evidence, so you can give a reason for the hope that is in you, with gentleness.",
    steps: ["Who is Jesus?", "Can I trust Scripture?", "Hear both sides of the great debates"] },
  { part: 3, number: "04", tone: "resource-life", who: "I need help, or company",
    text: "Fellowship, help for life's hard seasons, and learning materials, for when faith needs company more than answers.",
    steps: ["Find a church or a group near you", "Help for grief, fear and struggle", "Courses and reading plans"] },
];

function Story() {
  return <div className="home-guide-story">
    <p>For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and prayed. Most of
      that inheritance survives, but it is scattered across libraries and archives, in books long out of print, and much of it
      behind a paywall. Bible Guide gathers it into one source and gives it away, for the glory of God.</p>
    <p>Here you can read the Bible in 37 versions across 17 languages, set two side by side line by line, and follow the 343,545
      cross-references that tie one passage to another. Behind the text stand the places on the map, the creeds and
      confessions, the teachers of the Church across the centuries, and the questions people have always asked.</p>
    <p>Whether you are opening a Bible for the first time or have read it all your life, there is a way in for you, and nothing
      to sign up for or pay.</p>
  </div>;
}

const FACTS = [["66", "books"], ["37", "versions"], ["17", "languages"], ["343,545", "cross-references"]];

/** The "side" layout's story: short blocks under small headings, with the collection's numbers in the middle. */
function SideStory() {
  return <div className="home-guide-story home-guide-blocks">
    <div><h3>Why it exists</h3>
      <p>For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and prayed. Most of
        that inheritance survives, but it is scattered across libraries and archives, in books long out of print, and much of it
        behind a paywall. Bible Guide gathers it into one source and gives it away, for the glory of God.</p></div>
    <div><h3>What you'll find</h3>
      <p>The Bible to read slowly, in the version you love or two side by side, with every passage linked to the others that echo
        it. Around the text: the places on the map, the creeds and confessions, the teachers of the Church across the centuries,
        and honest answers to the questions people have always asked.</p>
      <dl className="home-guide-facts">{FACTS.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl></div>
    <div><h3>A library with a paper trail</h3>
      <p>Every work here is traced back to where it came from: who wrote it, when, and which edition it was taken from, so you can
        always check what you read against its source.</p></div>
    <div><h3>Start anywhere</h3>
      <p>Open a book, a single verse, a question or a place on the map: everything is linked to everything else, so one thread
        leads to the next. The reader remembers where you stopped, so each visit picks up where the last one ended.</p></div>
  </div>;
}

/** For the glory of God, said a little more fully than on the contact page, so it is not the shortest of the four. */
const GLORY_TEXT = "Every page is offered back to the One it is about: the Almighty, the Alpha and Omega, the beginning and the ending, worthy of all praise.";

function Convictions() {
  return <ol className="home-guide-convictions">{CONVICTIONS.map((item) => <li key={item.numeral}>
    <span aria-hidden="true">{item.numeral}</span><h3>{item.title}</h3><p>{item.text}</p>
    <blockquote>“{item.verse}”<cite>{item.reference}</cite></blockquote>
  </li>)}</ol>;
}

function Paths({ onChoose, withSteps }: { onChoose: (part: number) => void; withSteps: boolean }) {
  return <div className="home-guide-paths">{PATHS.map((path) => <button type="button" key={path.number} className="home-guide-path" style={{ "--home-color": `var(--${path.tone})` } as CSSProperties} onClick={() => onChoose(path.part)}>
    <span className="home-guide-number" aria-hidden="true">{path.number}</span>
    <span className="home-guide-words"><strong>{path.who}</strong><span className="home-guide-text">{path.text}</span>
      {withSteps && <ul>{path.steps.map((step) => <li key={step}>{step}</li>)}</ul>}</span>
    <span className="home-guide-where" aria-hidden="true"><ArrowDown size={18} strokeWidth={1.4} /></span>
  </button>)}</div>;
}

/** contactList: show the convictions exactly as on the contact page (drawings, giant numerals) instead of this section's own.
 *  number: the section's number before its label (home_mockup2). */
export function HomeGuide({ onChoose, layout = "columns", boxed = false, contactList = false, number }: { onChoose: (part: number) => void; layout?: "columns" | "side"; boxed?: boolean; contactList?: boolean; number?: string }) {
  const head = <header className="home-guide-head">
    <p className="home-eyebrow">{number && <span className="home-number">{number}</span>}About the project</p>
    <h2 id="home-guide-title">Two thousand years of faith, <em>gathered in one place.</em></h2>
  </header>;
  const ask = <><h2 className="home-guide-ask">Where are you starting from?</h2>
    <p className="home-guide-ask-lead">Choose the one closest to you, and we'll take you to the right place.</p></>;
  if (layout === "side") return <section className="home-guide home-wrap" data-layout="side" data-boxed={boxed || undefined} aria-labelledby="home-guide-title">
    {head}
    <div className="home-guide-split"><SideStory /><div>{ask}<Paths onChoose={onChoose} withSteps={false} /></div></div>
    {contactList ? <div className="home-guide-contact-list"><ConvictionList firstText={GLORY_TEXT} shelf /></div> : <Convictions />}
  </section>;
  return <section className="home-guide home-wrap" aria-labelledby="home-guide-title">
    {head}<Story /><Convictions />{ask}<Paths onChoose={onChoose} withSteps />
  </section>;
}
