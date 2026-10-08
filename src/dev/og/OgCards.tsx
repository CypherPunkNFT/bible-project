// The link-preview (Open Graph) image designs: 1200 × 630, the site's own fonts, colours and artwork.
// Development only (og.html); the chosen one is photographed at 1× into public/ by scripts/og-image.mjs.
import { CollectionArtwork, OpenBible } from "@/components/home/HomeArtwork";
import { PlacesArtwork } from "@/pages/places/PlacesArtwork";
import { SECTIONS } from "@/lib/sections";

export const OG_DESIGNS = [
  { id: "open-word", name: "The open Word", theme: "dark" },
  { id: "five-ways", name: "Five ways in", theme: "light" },
  { id: "journeys", name: "Walk it", theme: "dark" },
] as const;
export type OgDesignId = (typeof OG_DESIGNS)[number]["id"];

/** What the site does, in short lines (figures checked against the site's data on 2026-10-07). */
const LINES = [
  "37 free Bible versions in 17 languages",
  "Studies, charts and 3,052 people",
  "An atlas of 1,252 Bible places",
  "Honest answers to hard questions",
];
const ADDRESS = "bibleproject.io";

function Strip() {
  return <div className="og-strip" aria-hidden="true">{SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => <span key={s.id} style={{ background: `var(--${s.id})` }} />)}</div>;
}
function Brand() {
  return <div className="og-brand"><img src="/favicon.svg" alt="" /><span>Bible Project</span></div>;
}

function OpenWord() {
  return <div className="og-card og-open-word">
    <Strip />
    <div className="og-ow-art" aria-hidden="true"><span className="og-orbit og-orbit-one" /><span className="og-orbit og-orbit-two" /><div className="og-ow-book"><OpenBible /></div></div>
    <div className="og-ow-text">
      <Brand />
      <h1>One Word.<br /><em>A world to discover.</em></h1>
      <ul>{LINES.map((line) => <li key={line}>{line}</li>)}</ul>
      <p className="og-address">{ADDRESS}</p>
    </div>
  </div>;
}

function FiveWays() {
  const ways = [["Bible", "Read & compare"], ["Study", "See the connections"], ["Apologetics", "Explore the questions"], ["Topics", "Follow a subject"], ["Atlas", "Enter the world"]];
  return <div className="og-card og-five">
    <Strip />
    <header><Brand /><p className="og-address">{ADDRESS}</p></header>
    <h1>The whole Bible, <em>free and open to all.</em></h1>
    <div className="og-five-facts"><span><b>37</b> versions</span><span><b>17</b> languages</span><span><b>3,052</b> people</span><span><b>1,252</b> places</span></div>
    <div className="og-five-row">{ways.map(([name, line]) => <div key={name} className="og-five-card"><div className="og-five-art"><CollectionArtwork kind={name} /></div><b>{name}</b><span>{line}</span></div>)}</div>
  </div>;
}

function Journeys() {
  return <div className="og-card og-journeys">
    <Strip />
    <div className="og-j-art" aria-hidden="true"><PlacesArtwork kind="journeys" /></div>
    <div className="og-j-text">
      <Brand />
      <h1>Read it.<br />Study it.<br /><em>Walk it.</em></h1>
      <ul>{LINES.map((line) => <li key={line}>{line}</li>)}</ul>
      <p className="og-address">{ADDRESS}</p>
    </div>
  </div>;
}

/** One design at its exact size; `data-og` marks the element the photograph is taken of. */
export function OgCard({ id }: { id: OgDesignId }) {
  return <div className="og-frame" data-og={id}>{id === "five-ways" ? <FiveWays /> : id === "journeys" ? <Journeys /> : <OpenWord />}</div>;
}
