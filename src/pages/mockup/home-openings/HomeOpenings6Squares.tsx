// The doorway squares beside the city: three down each side, Bible to Sources, title only, each with a line drawing
// (first version H of /home_mockup6, owner, 2026-10-31: "make a H where the same squares as existed before are there for
// Bible - Sources"). The drawings are the ones the owner picked from the /doorways_mockup sheet, version A of
// /home_mockup10 (owner, same day: "bring back the drawings I approved, version A. Make that the homepage"): Bible 2, Study 5
// (the Bible with the notepad and pencil; owner, 2026-11-01), Apologetics 2, Atlas 3, Resources 3, Sources 3.
import { ArrowUpRight } from "lucide-react";
import { createContext, useContext, useLayoutEffect, type CSSProperties, type ReactElement, type RefObject } from "react";
import { Link } from "react-router-dom";
import { APOLOGETICS_DOORWAYS } from "../doorways/DoorwayApologetics";
import { ATLAS_DOORWAYS } from "../doorways/DoorwayAtlas";
import { BIBLE_DOORWAYS } from "../doorways/DoorwayBible";
import { RESOURCES_DOORWAYS } from "../doorways/DoorwayResources";
import { SOURCES_DOORWAYS } from "../doorways/DoorwaySources";
import { STUDY_DOORWAYS } from "../doorways/DoorwayStudy";

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

/** The squares stay as long as there is room beside the city (owner, 2026-10-31: "the margins to the left and right can be
 *  reduced completely ... these could potentially squeeze to the edge of the yellow line"). As the screen narrows, the
 *  margin at the screen's edge and the gap to the wall's gold line shrink together, passing under the pearls, until both
 *  are 12px (owner, same day: "the margin should be equal from the line to the edge"). Then the squares narrow; below the
 *  narrowest square they are left out. Measured from the drawn wall, so it holds at any height. Sets --hm6-square (the
 *  wall's width), --hm6-gap and --hm6-column on the stage, and data-squares="fit" when they fit. */
const COLUMN_WIDEST = 240, COLUMN_NARROWEST = 176, GAP_WIDEST = 40, GAP_NARROWEST = 12, EDGE_WIDEST = 32, EDGE_NARROWEST = 12;
export function useSquareRoom(stage: RefObject<HTMLElement>, on: boolean) {
  useLayoutEffect(() => {
    const section = stage.current;
    if (!on || !section) return;
    const place = () => {
      const wall = section.querySelector(".hm6-wall")?.getBoundingClientRect();
      if (!wall || innerWidth <= 860) { section.dataset.squares = "none"; return; }
      const room = wall.left - section.getBoundingClientRect().left, spare = room - COLUMN_WIDEST;
      const least = GAP_NARROWEST + EDGE_NARROWEST, most = GAP_WIDEST + EDGE_WIDEST;
      const share = Math.min(1, Math.max(0, (spare - least) / (most - least)));
      const gap = GAP_NARROWEST + (GAP_WIDEST - GAP_NARROWEST) * share, edge = EDGE_NARROWEST + (EDGE_WIDEST - EDGE_NARROWEST) * share;
      const column = Math.min(COLUMN_WIDEST, room - gap - edge);
      section.style.setProperty("--hm6-square", `${wall.width}px`);
      section.style.setProperty("--hm6-gap", `${gap}px`);
      section.style.setProperty("--hm6-column", `${column}px`);
      section.dataset.squares = column >= COLUMN_NARROWEST ? "fit" : "none";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(section);
    return () => observer.disconnect();
  }, [stage, on]);
}

/** A mock-up can hand the squares other drawings, by title (/home_mockup10's versions, owner, 2026-10-31). Empty
 *  everywhere else, so the squares keep their own. */
export const DoorwayArt = createContext<Partial<Record<string, () => ReactElement>>>({});

export function SquareColumn({ side }: { side: "left" | "right" }) {
  const swapped = useContext(DoorwayArt);
  return <nav className={`home-doorways hm6-squares hm6-squares-${side}`} aria-label={side === "left" ? "Read and study" : "Explore"}>
    {SQUARES[side].map((item) => { const Swap = swapped[item.title]; return <Link to={item.to} key={item.title} style={{ "--home-color": `var(--${item.color})` } as CSSProperties}>
      <div className="home-doorway-art">{Swap ? <Swap /> : <item.Art />}</div>
      <div className="home-doorway-copy"><strong>{item.title}</strong><ArrowUpRight size={16} aria-hidden /></div>
    </Link>; })}
  </nav>;
}
