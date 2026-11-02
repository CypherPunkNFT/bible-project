// MOCK-UP: the end of /home_mockup6's version I (owner, 2026-10-31: "for I, at the bottom, let's put in scroll A. So that
// the manuscript bottoms will go into the footer"). Mock-up 4's Scroll A, drawn as it is there, with the blessing of Numbers
// 6:24-25 in the reader's language's own Bible in place of the opening's words, and Joshua 1:9 from "be strong and courageous"
// under it (owner, same day; own Bible 2026-11-02); it is the last thing before the footer. The three wise men walk along the scroll's top
// (HomeOpenings6Caravan.tsx).
import { Link } from "react-router-dom";
import { BIBLE_OWN_NAMES, BLESSING_VERSES } from "@/components/home/banner-verses";
import { useSiteLanguage } from "@/lib/language";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { bibleName, useCurrentBible } from "@/lib/verses";
import { ScrollArt } from "./HomeArtOpenings";
import { ScrollCaravan } from "./HomeOpenings6Caravan";

export function ScrollBlessing() {
  // On phones the scroll is raised to show more of its English rows (owner, 2026-10-31); home-phone.css lifts it by the same amount.
  const phone = useMediaQuery("(max-width: 860px)");
  const language = useSiteLanguage();
  const bible = useCurrentBible();
  const quote = ([lead, ending]: [string, string]) => <blockquote lang={bible.lang} dir={bible.dir} translate="no">“{lead}{language === "zh-Hans" ? "" : " "}<em>{ending}</em>”</blockquote>;
  const version = <span lang={bible.lang} translate="no">{BIBLE_OWN_NAMES[bible.slug] ?? bibleName(bible)}</span>;
  return <div className="home-opening hm6-last">
    <section className="hm4-b hm6-blessing" aria-label="A blessing"><ScrollArt fit="edge" below={phone ? 64 : 0} /><ScrollCaravan />
      <div className="home-wrap"><div className="home-hero-copy">
        {quote(BLESSING_VERSES[language].numbers)}
        <p className="hm6-blessing-cite"><Link to={`/read/${bible.slug}/NUM/6?hl=24`}>Numbers 6:24–25</Link> · {version}</p>
        {quote(BLESSING_VERSES[language].joshua)}
        <p className="hm6-blessing-cite"><Link to={`/read/${bible.slug}/JOS/1?hl=9`}>Joshua 1:9</Link> · {version}</p>
      </div></div>
    </section>
  </div>;
}
