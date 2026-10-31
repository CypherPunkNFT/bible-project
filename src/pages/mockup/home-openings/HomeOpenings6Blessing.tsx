// MOCK-UP: the end of /home_mockup6's version I (owner, 2026-10-31: "for I, at the bottom, let's put in scroll A. So that
// the manuscript bottoms will go into the footer"). Mock-up 4's Scroll A, drawn as it is there, with the blessing of Numbers
// 6:24-25 in the Berean Standard Bible in place of the opening's words, and Joshua 1:9 from "be strong and courageous" under
// it (owner, same day); it is the last thing before the footer.
import { Link } from "react-router-dom";
import { ScrollArt } from "./HomeArtOpenings";

export function ScrollBlessing() {
  return <div className="home-opening hm6-last">
    <section className="hm4-b hm6-blessing" aria-label="A blessing"><ScrollArt fit="edge" />
      <div className="home-wrap"><div className="home-hero-copy">
        <blockquote>“May the LORD bless you and keep you; <em>may the LORD cause His face to shine upon you and be gracious to you.</em>”</blockquote>
        <p className="hm6-blessing-cite"><Link to="/read/bsb/NUM/6?hl=24">Numbers 6:24–25</Link> · Berean Standard Bible</p>
        <blockquote>“Be strong and courageous. Do not be afraid; do not be discouraged, <em>for the LORD your God is with you wherever you go.</em>”</blockquote>
        <p className="hm6-blessing-cite"><Link to="/read/bsb/JOS/1?hl=9">Joshua 1:9</Link> · Berean Standard Bible</p>
      </div></div>
    </section>
  </div>;
}
