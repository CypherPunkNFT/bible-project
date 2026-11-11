// /tools_mockup: the tools hub with category doors under the hero in place of the pill links, like the study hub's
// subject doors, and only the chosen category's tools under them (owner, 2026-11-11: "people can see the super
// categories before having to scroll all the way down"). Hero, sections and tiles are the real page's own
// (src/pages/tools/ToolsPage.tsx); the doors, the order, three shorter titles and the tighter hero are new. No MOCK-UP tag: a mock-up shows only the real page.
import { useSearchParams } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { HubDoors } from "@/components/hub-doors/HubDoors";
import { selectedDoor } from "@/components/hub-doors/door-parts";
import { HeroArt } from "@/pages/tools/art/HeroArt";
import { DOOR_ART, DOOR_TONES } from "@/pages/tools/art/doors";
import { CategorySection, type CategoryOfTools } from "@/pages/tools/ToolsPage";
import { CATEGORIES, toolsForHub, isLive, type Category } from "@/pages/tools/registry";
import "@/pages/games/games.css";
import "@/pages/tools/tools.css";

const DOOR_ORDER: readonly Category[] = ["family", "prayer", "sharing", "study", "witness", "hard-times"];
const DOOR_TITLES: Partial<Record<Category, string>> = { family: "Life events", prayer: "Prayer & home", sharing: "Sharing & churches", witness: "Your story" };

export default function ToolsMockupPage() {
  const [params] = useSearchParams();
  const tools = toolsForHub();
  const live = tools.filter(isLive).length;
  const forChurches = tools.filter((tool) => tool.audiences.includes("churches")).length;
  // Hard times last; shorter titles (owner, 2026-11-11). Until the real page takes them, the new titles are English only.
  const categories: CategoryOfTools[] = DOOR_ORDER.map((key) => CATEGORIES.find((category) => category.key === key)!)
    .map((category) => ({ ...category, title: DOOR_TITLES[category.key] ?? category.title, tools: tools.filter((tool) => tool.category === category.key) }))
    .filter((category) => category.tools.length > 0);
  const selected = selectedDoor(params.get("category"), categories.map((category) => category.key));
  const index = categories.findIndex((category) => category.key === selected);
  return <div className="st-page gm-page tl-page hub-doors-page mx-auto max-w-7xl px-4 sm:px-6">
    <div className="hub-doors-fold">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <p className="st-kick">Tools</p>
        <h1>Bible tools for<br /><span>every season of life.</span></h1>
        <p className="gm-lede">Names for a new baby, verses for a birthday or a wedding, comfort when someone has died, prayers for the days that matter, and ways to share Scripture with friends and your church.</p>
        <StationStats items={[["Tools", tools.length], ["Ready to use", live], ["Coming soon", tools.length - live], ["For churches", forChurches]]} />
      </div>
      <div className="gm-hero-figure"><HeroArt /></div>
    </header>
    <HubDoors param="category" label="Kinds of tool" controls={`tools-${selected}`} selected={selected}
      doors={categories.map((category) => ({ key: category.key, title: category.title, tone: DOOR_TONES[category.key], count: category.tools.length, art: DOOR_ART[category.key] }))} />
    </div>
    <CategorySection key={selected} category={categories[index]} index={index + 1} />
  </div>;
}
