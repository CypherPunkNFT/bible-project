import type { ReactNode } from "react";
import "@/pages/charts.css";
import "@/pages/study/connections/connections.css";
import "../connections-art/connections-art.css";
import { BookScene, BookWallScene, TableScene, WebScene } from "./scenes";

/** Four settings for the Connections heading drawing, the Bible drawn in the proportions of the app icon's book. Each plays
 *  the same two-half loop: threads joining one colour to itself, then two different colours. */
const OPTIONS: { letter: string; title: string; line: string; scene: ReactNode }[] = [
  { letter: "A", title: "The book alone", line: "The icon's open book in gold: tall pages, a thick cover band, fine lines of text and a ribbon with a cross.", scene: <BookScene /> },
  { letter: "B", title: "With a soft wall", line: "The same, with a faint wall of books in the chart's colours behind it, no lines.", scene: <BookWallScene /> },
  { letter: "C", title: "On a table", line: "The book in the page's own ink, lying on a table with a soft shadow.", scene: <TableScene /> },
  { letter: "D", title: "A fuller web", line: "The gold book with six threads in each half over fainter text.", scene: <WebScene /> },
];

export default function ConnectionsBibleMockup() {
  return (
    <div className="cxa-page mx-auto max-w-7xl px-4 sm:px-6">
      <header className="cxa-head">
        <p className="cx-words">Connections in Scripture · Heading drawing</p>
        <h1>The Bible, in the <em>icon's</em> proportions.</h1>
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
