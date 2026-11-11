// The reveal (design §10): the title as a heading that takes focus, the key verse from the BSB, and links to read the
// story and to the main person's page. The verdict's words live in the feedback band in Practice and the Daily (this
// section only writes them in a room, where there is no band), and the emoji's passage words sit under the tiles of
// the row above (ClueWords is kept for a reveal shown without its row, in the round-end fold-outs).
import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bookByCode } from "@/lib/refs";
import { slugOf } from "@/lib/people-slugs";
import { useVerses, verseReference } from "@/lib/verses";
import { ClueWords } from "./Puzzle";
import { readHref, verseIds } from "./passage";
import { VERDICT_TEXT } from "./rules";
import type { Verdict } from "./share";
import type { Story } from "./types";

function KeyVerse({ story }: { story: Story }) {
  const catalog = useCatalog();
  const ids = verseIds(catalog, story.key);
  if (ids) return <KeyVerseText ids={ids} />;
  const [book, ...rest] = story.key.split(" ");
  return (
    <blockquote className="es-verse">
      <p>The verse could not be loaded.</p>
      <footer>{[bookByCode(catalog, book)?.name ?? book, ...rest].join(" ")} · <span translate="no">BSB</span></footer>
    </blockquote>
  );
}

function KeyVerseText({ ids }: { ids: { from: number; to: number } }) {
  const catalog = useCatalog();
  const state = useVerses(ids, { bible: "bsb" });
  return (
    <blockquote className="es-verse">
      {state.status === "error" ? <p>The verse could not be loaded.</p> : <p><Verse bible="bsb" from={ids.from} to={ids.to} /></p>}
      <footer>{verseReference(catalog, ids.from, ids.to)} · <span translate="no">BSB</span></footer>
    </blockquote>
  );
}

export function Reveal({ story, verdict, picked, children, words = true, showVerdict = true, focus = true }: {
  story: Story;
  verdict: Verdict | "shown";
  picked?: Story | null;
  children?: ReactNode;
  /** Write the passage words here (a reveal with no emoji row above it). */
  words?: boolean;
  /** Write the verdict here (a room, which has no feedback band). */
  showVerdict?: boolean;
  /** Move focus to the title (false when a saved game is being restored, so a reload never jumps). */
  focus?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focus) heading.current?.focus({ preventScroll: true }); }, [story.id, focus]);
  const person = story.people[0];
  return (
    <section className={`es-reveal is-${verdict}`} aria-label="The answer">
      {showVerdict && <p className="es-verdict">{VERDICT_TEXT[verdict]}</p>}
      {picked && picked.id !== story.id && (
        <p className="es-picked">You picked <em>{picked.title}</em>{verdict === "close" && <span className="es-close-note">: right person, different story</span>}</p>
      )}
      <h2 ref={heading} tabIndex={-1}>{story.title}</h2>
      {words && <ClueWords story={story} />}
      <KeyVerse story={story} />
      <p className="es-links">
        <Link to={readHref(story.ref)}>Read the story</Link>
        {person && <Link to={`/people/${slugOf(person.id) ?? person.id}`}>{`More about ${person.name}`}</Link>}
      </p>
      {children}
    </section>
  );
}
