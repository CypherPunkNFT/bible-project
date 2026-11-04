import type { ReactNode } from "react";
import "@/pages/charts.css";
import "@/pages/study/connections/connections.css";
import "./connections-art.css";
import { LandingScene, ShelvesScene, StacksScene, WallScene } from "./scenes";

/** Four settings for the Connections heading drawing, side by side: the open Bible in front, books behind it as soft
 *  coloured silhouettes. Each plays the same two-half loop, with its own backdrop and its own way of drawing the connections. */
const OPTIONS: { letter: string; title: string; line: string; scene: ReactNode }[] = [
  { letter: "A", title: "Library wall", line: "One long row of books behind the Bible, coloured like the chart; threads arch from verse to verse across the pages.", scene: <WallScene /> },
  { letter: "B", title: "Two shelves", line: "A low row above and a taller row below; a fine web of many threads over the pages.", scene: <ShelvesScene /> },
  { letter: "C", title: "Threads to the books", line: "The threads leave the pages and land on the tops of the books behind, in the colour of each.", scene: <LandingScene /> },
  { letter: "D", title: "Shelf and stacks", line: "A few upright books behind, flat piles in front at each side; threads arch across the pages.", scene: <StacksScene /> },
];

export default function ConnectionsArtMockup() {
  return (
    <div className="cxa-page mx-auto max-w-7xl px-4 sm:px-6">
      <header className="cxa-head">
        <p className="cx-words">Connections in Scripture · Heading drawing</p>
        <h1>Four <em>settings</em> for the book.</h1>
        <p className="cx-lead">Each loop plays the same two halves: threads joining one colour to itself, then threads joining two different colours.</p>
      </header>
      <div className="cxa-grid">
        {OPTIONS.map(({ letter, title, line, scene }) => (
          <figure key={letter} className="cxa-tile" id={`option-${letter.toLowerCase()}`}>
            {scene}
            <figcaption><span>{letter}</span><div><strong>{title}</strong><p>{line}</p></div></figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
