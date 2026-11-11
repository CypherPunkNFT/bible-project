import { DoorwayArt } from "./HomeOpenings6Squares.shared";
// The doorway squares beside the city: three down each side, Bible to Sources, title only, each with a line drawing
// (first version H of /home_mockup6, owner, 2026-10-31: "make a H where the same squares as existed before are there for
// Bible - Sources"). The drawings are the ones the owner picked from the /doorways_mockup sheet, version A of
// /home_mockup10 (owner, same day: "bring back the drawings I approved, version A. Make that the homepage"): Bible 2, Study 5
// (the Bible with the notepad and pencil; owner, 2026-11-01), Apologetics 2, Atlas 3, Resources 3, Sources 3.
import { ArrowUpRight } from "lucide-react";
import { useContext, type CSSProperties, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { APOLOGETICS_DOORWAYS } from "../doorways/DoorwayApologetics.shared";
import { ATLAS_DOORWAYS } from "../doorways/DoorwayAtlas.shared";
import { BIBLE_DOORWAYS } from "../doorways/DoorwayBible.shared";
import { RESOURCES_DOORWAYS } from "../doorways/DoorwayResources.shared";
import { SOURCES_DOORWAYS } from "../doorways/DoorwaySources.shared";
import { STUDY_DOORWAYS } from "../doorways/DoorwayStudy.shared";

/** Title only, no line under it (owner, 2026-10-31: "take away the read and compare, enter the world, the subtext ... Just
 *  have the title"). The sheet numbers its drawings from 1, so its drawing 2 is [1] here. */
interface Square { title: string; to: string; color: string; Art: () => ReactElement }
const SQUARES: Record<"left" | "right", Square[]> = {
  left: [
    { title: "Bible", to: "/bible", color: "epistles", Art: BIBLE_DOORWAYS[1].Art },
    { title: "Study", to: "/study", color: "gospels", Art: STUDY_DOORWAYS[4].Art },
    { title: "Apologetics", to: "/apologetics", color: "history", Art: APOLOGETICS_DOORWAYS[1].Art },
  ],
  right: [
    { title: "Atlas", to: "/study/atlas", color: "poetry", Art: ATLAS_DOORWAYS[2].Art },
    { title: "Resources", to: "/resources", color: "resource-life", Art: RESOURCES_DOORWAYS[2].Art },
    { title: "Sources", to: "/sources", color: "prophets", Art: SOURCES_DOORWAYS[2].Art },
  ],
};

export function SquareColumn({ side }: { side: "left" | "right" }) {
  const swapped = useContext(DoorwayArt);
  return <nav className={`home-doorways hm6-squares hm6-squares-${side}`} aria-label={side === "left" ? "Read and study" : "Explore"}>
    {SQUARES[side].map((item) => { const Swap = swapped[item.title]; return <Link to={item.to} key={item.title} style={{ "--home-color": `var(--${item.color})` } as CSSProperties}>
      <div className="home-doorway-art">{Swap ? <Swap /> : <item.Art />}</div>
      <div className="home-doorway-copy"><strong>{item.title}</strong><ArrowUpRight size={16} aria-hidden /></div>
    </Link>; })}
  </nav>;
}
