// MOCK-UP: version H of /home_mockup6, the city of chapters with the home page's own doorway squares beside it (owner,
// 2026-10-31: "make a H where the same squares as existed before are there for Bible - Sources"). The five squares are the
// ones under the opening, unchanged: the same card, artwork, colour and line. Sources had no square, so it gets one in the
// same style, with a shelf of books drawn like the others' miniatures.
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { CollectionArtwork } from "@/components/home/HomeArtwork";

interface Square { title: string; to: string; subtitle: string; color: string }
const SQUARES: Record<"left" | "right", Square[]> = {
  left: [
    { title: "Bible", to: "/bible", subtitle: "Read & compare", color: "epistles" },
    { title: "Study", to: "/study", subtitle: "See the connections", color: "gospels" },
    { title: "Apologetics", to: "/apologetics", subtitle: "Explore the questions", color: "history" },
  ],
  right: [
    { title: "Atlas", to: "/study/atlas", subtitle: "Enter the world", color: "poetry" },
    { title: "Resources", to: "/resources", subtitle: "Study, gather, find help", color: "resource-life" },
    { title: "Sources", to: "/sources", subtitle: "Explore every source", color: "prophets" },
  ],
};

/** Book spines on a shelf: x, width, height. */
const SPINES = [[150, 18, 74], [170, 22, 92], [194, 16, 66], [212, 20, 100], [234, 24, 82], [260, 18, 106], [280, 22, 78], [304, 16, 94]];

function SourcesArtwork() {
  return <svg viewBox="0 0 480 185" fill="none" aria-hidden="true">
    <ellipse cx="240" cy="94" rx="162" ry="62" stroke="currentColor" opacity=".25" />
    {SPINES.map(([x, width, height], index) => <g key={x} stroke="currentColor" strokeWidth="1.3">
      <rect x={x} y={150 - height} width={width} height={height} rx="2" fill="var(--surface)" />
      <rect x={x} y={150 - height} width={width} height={height} rx="2" fill="currentColor" fillOpacity={0.06 + (index % 3) * 0.06} stroke="none" />
      <path d={`M${x + 3} ${150 - height + 10}H${x + width - 3}M${x + 3} ${140}H${x + width - 3}`} opacity=".5" />
    </g>)}
    <rect x="322" y="78" width="20" height="72" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" transform="rotate(14 322 150)" />
    <path d="M120 150H372" stroke="currentColor" strokeWidth="1.6" />
    {[[78, 94], [402, 94]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="8" fill="var(--surface)" stroke="currentColor" /><circle cx={x} cy={y} r="2.5" fill="currentColor" /></g>)}
  </svg>;
}

export function SquareColumn({ side }: { side: "left" | "right" }) {
  return <nav className={`home-doorways hm6-squares hm6-squares-${side}`} aria-label={side === "left" ? "Read and study" : "Explore"}>
    {SQUARES[side].map((item) => <Link to={item.to} key={item.title} style={{ "--home-color": `var(--${item.color})` } as CSSProperties}>
      <div className="home-doorway-art">{item.title === "Sources" ? <SourcesArtwork /> : <CollectionArtwork kind={item.title} />}</div>
      <div className="home-doorway-copy"><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUpRight size={16} aria-hidden /></div>
    </Link>)}
  </nav>;
}
