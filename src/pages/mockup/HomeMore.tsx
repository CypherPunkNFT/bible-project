// MOCK-UP (home_mockup2): the four sections under the four parts: the quiz (HomeQuiz.tsx), the sources (HomeSources.tsx),
// churches and help close to home (HomeNearby.tsx) and a closing blessing (Numbers 6:24-26, Berean Standard Bible). Styles for the blessing: home-more.css.
import { HomeNearby } from "./HomeNearby";
import { HomeQuiz } from "./HomeQuiz";
import { HomeSources } from "./HomeSources";
import "./home-more.css";

function Blessing() {
  return <section className="hm-blessing home-wrap" aria-label="A blessing">
    <span className="hm-blessing-rule" aria-hidden="true" />
    <blockquote>
      <p>May the LORD bless you and keep you;<br />may the LORD cause His face to shine upon you and be gracious to you;<br />may the LORD lift up His countenance toward you and give you peace.</p>
      <cite>Numbers 6:24–26 · BSB</cite>
    </blockquote>
  </section>;
}

/** resourcesTab: the "Close to home" heading with one Resources card; numbered: the sections numbered 02-04 after "About the
 *  project" (01), with no closing line under the sources (home_mockup2 only until the owner approves them); trial: the pill that switches the "Close to home" opening (mock-ups only). */
export function HomeMore({ resourcesTab = false, numbered = false, trial = false }: { resourcesTab?: boolean; numbered?: boolean; trial?: boolean }) {
  return <><HomeQuiz number={numbered ? "02" : undefined} /><HomeSources number={numbered ? "03" : undefined} foot={!numbered} />
    <HomeNearby resourcesTab={resourcesTab} number={numbered ? "04" : undefined} trial={trial} /><Blessing /></>;
}
