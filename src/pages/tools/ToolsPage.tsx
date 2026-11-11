// /tools: the tools hub. Built like the games hub (src/pages/games/GamesPage.tsx) and with its styles (games.css, the
// gm- classes), so the two read as one design: a hero with the tools-table drawing, then one door per category
// (registry.ts CATEGORIES; the row and its behaviour in src/components/hub-doors/), and under the doors the chosen
// category's tools (?category=<key>, the first category by default), each tool a tile with its own picture (art/). A
// finished tool links to its own address; one not built yet is a "Coming soon" tile with its full picture and no link.
// tools.css only sets the three columns. The doors replaced a long page of every category (owner, 2026-11-11; the
// versions the owner chose from stay at /tools_mockup and /tools_mockup2 on the preview).
// How to add or finish a tool: README.md beside this file.
import { ArrowUpRight, Hourglass } from "lucide-react";
import type { CSSProperties } from "react";
import { Link, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { HubDoors } from "@/components/hub-doors/HubDoors";
import { selectedDoor } from "@/components/hub-doors/door-parts";
import { StationStats } from "@/components/stations/Station";
import { GameArtImage } from "@/pages/games/art/parts";
import { plural } from "@/lib/site-format";
import { DOOR_ART, DOOR_TONES } from "./art/doors";
import { HeroArt } from "./art/HeroArt";
import { AUDIENCE_LABELS, CATEGORIES, toolsForHub, isLive, type Category, type ToolEntry } from "./registry";
import "@/pages/games/games.css";
import "./tools.css";

const pad = (n: number) => String(n).padStart(2, "0");

export default function ToolsPage() {
  return <Routes>
    <Route index element={<ToolsHub />} />
    <Route path="*" element={<Navigate replace to="/tools" />} />
  </Routes>;
}

export interface CategoryOfTools { key: Category; title: string; text: string; tools: ToolEntry[] }

function ToolsHub() {
  const [params] = useSearchParams();
  const tools = toolsForHub();
  const live = tools.filter(isLive).length;
  const forChurches = tools.filter((tool) => tool.audiences.includes("churches")).length;
  // Live tools first within each category (toolsForHub's order); a category with no tools is not drawn.
  const categories: CategoryOfTools[] = CATEGORIES.map((category) => ({ ...category, tools: tools.filter((tool) => tool.category === category.key) }))
    .filter((category) => category.tools.length > 0);
  const selected = selectedDoor(params.get("category"), categories.map((category) => category.key));
  const shown = categories.find((category) => category.key === selected) ?? categories[0];
  return <div className="st-page gm-page tl-page hub-doors-page mx-auto max-w-7xl px-4 sm:px-6">
    <div className="hub-doors-fold v2">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <p className="st-kick">Tools</p>
        <h1>Bible tools for<br /><span>every season of life.</span></h1>
        <p className="gm-lede">Names for a new baby, verses for a birthday or a wedding, comfort when someone has died, prayers for the days that matter, and ways to share Scripture with friends and your church.</p>
        <StationStats items={[["Tools", tools.length], ["Ready to use", live], ["Coming soon", tools.length - live], ["For churches", forChurches]]} />
      </div>
      <div className="gm-hero-figure"><HeroArt /></div>
    </header>
    <HubDoors param="category" label="Kinds of tool" controls={`tools-${shown.key}`} selected={shown.key}
      doors={categories.map((category) => ({ key: category.key, title: category.title, tone: DOOR_TONES[category.key], count: category.tools.length, art: DOOR_ART[category.key] }))} />
    </div>
    <CategorySection key={shown.key} category={shown} plain />
  </div>;
}

/** A category's heading and tiles. `plain` (the hub): title and text only, no number and no count; with an `index`
 * (the first mock-up, /tools_mockup) the heading carries its number and the count. */
export function CategorySection({ category, index, plain }: { category: CategoryOfTools; index?: number; plain?: boolean }) {
  const titleId = `tools-${category.key}-title`;
  const live = category.tools.filter(isLive).length;
  const ready = live === 0 ? "all coming soon" : live === category.tools.length ? "all ready to use" : `${live} ready to use`;
  return <section className={`gm-shelf${plain ? " hub-doors-bare" : ""}`} id={`tools-${category.key}`} aria-labelledby={titleId}>
    <div className={`gm-shelf-head${plain ? " hub-doors-bare-head" : ""}`}>
      {!plain && <span className="gm-shelf-num" aria-hidden="true">{pad(index ?? 0)}</span>}
      <div><h2 id={titleId}>{category.title}</h2><p>{category.text}</p></div>
      {!plain && <span className="gm-shelf-count">{plural(category.tools.length, "{n} tool", "{n} tools")} · {ready}</span>}
    </div>
    <ul className="gm-grid" aria-label={category.title}>
      {category.tools.map((tool) => <li key={tool.slug}><ToolTile tool={tool} /></li>)}
    </ul>
  </section>;
}

export function ToolTile({ tool }: { tool: ToolEntry }) {
  const id = `tool-${tool.slug}`;
  const live = isLive(tool);
  const body = <>
    <div className="gm-art">
      <GameArtImage art={tool.art} />
      {/* The badge repeats the footer for the eye, so screen readers hear it once, from the footer. */}
      <span className="gm-badge" aria-hidden="true">{live ? "Ready to use" : <><Hourglass size={11} />Coming soon</>}</span>
    </div>
    <div className="gm-text">
      <h3 id={id}>{tool.title}</h3>
      <p>{tool.description}</p>
      <ul className="gm-audiences" aria-label="Who it's for">
        {tool.audiences.map((audience) => <li key={audience}>{AUDIENCE_LABELS[audience]}</li>)}
      </ul>
      <div className="gm-card-foot">{live ? <strong>Open<ArrowUpRight size={14} aria-hidden="true" /></strong> : <span>Coming soon</span>}</div>
    </div>
  </>;
  const { tone } = tool.art;
  const style = { "--game": `var(--${tone})`, "--game-tab": `var(--${tone}-tab)`, "--game-tab-ink": `var(--${tone}-tab-ink)` } as CSSProperties;
  return isLive(tool)
    ? <Link to={tool.path} className="gm-card" style={style} aria-labelledby={id}>{body}</Link>
    : <div className="gm-card" style={style} role="group" aria-disabled="true" aria-labelledby={id}>{body}</div>;
}
