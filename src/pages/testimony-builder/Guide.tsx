// Shelf 04, writing it well (design §3.4): what makes a testimony worth reading, what to do with it, and where it can
// go next: the testimony tree on this site, with its limits said plainly so a person knows what to shorten.
import { Link } from "react-router-dom";

const POINTS: readonly { title: string; text: string }[] = [
  { title: "Keep Jesus the hero", text: "The story is about what God did, not about how bad things were or how good they are now. Give the cross more room than the sin." },
  { title: "Be specific", text: "One real scene, with a place and a time of day, says more than a page of general words. Readers remember details." },
  { title: "Be honest", text: "Do not make the old life darker or the new life brighter than it is. A story that admits what is still hard is believed." },
  { title: "Say what the words mean", text: "Grace, saved, repent, born again: fine words, but a reader who has never been in a church needs you to say them in plain language too." },
  { title: "Protect other people", text: "Tell your own part. Where someone else comes in, say only what you would be glad for them to read." },
  { title: "Write it to be read aloud", text: "Three to five minutes aloud is a good length for a church, a baptism or a small group. Read it to yourself and cut what you stumble on." },
  { title: "Let someone read it first", text: "A friend who knows you will catch what is missing and what is unclear, and will tell you which line made them stop." },
];

export function Guide() {
  return <div className="tb-guide">
    <ol className="tb-points">
      {POINTS.map((point) => <li key={point.title}><strong>{point.title}.</strong> {point.text}</li>)}
    </ol>
    <div className="tb-prose">
      <h3>What to do with it</h3>
      <p>Print it and keep it where you will find it in a hard year. Read it at your baptism, or when your church asks for testimonies. Give it to your children when they are old enough to ask. Send it, as a letter, to the person who first pointed you to Jesus. Or read it aloud to a friend who is where you once were.</p>
      <h3>Share it on the testimony tree</h3>
      <p>Bible Guide keeps a <Link to="/testimonies">tree of testimonies</Link>, each one a branch grown from the person who invited the writer. If you are invited there, this sheet is most of what its form asks for. Its title holds up to 120 characters, its short summary up to 600 (your answer to the one-sentence question fits), and the full story can be the sheet as it stands.</p>
    </div>
  </div>;
}
