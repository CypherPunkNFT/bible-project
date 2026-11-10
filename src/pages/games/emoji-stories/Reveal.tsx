// The reveal (design §10): the verdict in words and colour, the title as a heading that takes focus, each emoji with
// its passage word, the key verse from the BSB, and links to read the story and to the main person's page.
import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bookByCode } from "@/lib/refs";
import { slugOf } from "@/lib/people-slugs";
import { useVerses, verseReference } from "@/lib/verses";
import { ClueWords } from "./Puzzle";
import { readHref, verseIds } from "./passage";
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

const VERDICT_TEXT: Record<Verdict | "shown", string> = {
  right: "Right!",
  close: "Not this time",
  wrong: "Not this time",
  shown: "The answer",
};

export function Reveal({ story, verdict, picked, children }: {
  story: Story;
  verdict: Verdict | "shown";
  picked?: Story | null;
  children?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [story.id]);
  const person = story.people[0];
  return (
    <section className={`es-reveal is-${verdict}`} aria-label="The answer">
      <p className="es-verdict">{VERDICT_TEXT[verdict]}</p>
      {picked && picked.id !== story.id && (
        <p className="es-picked">You picked <em>{picked.title}</em>{verdict === "close" && <span className="es-close-note">: right person, different story</span>}</p>
      )}
      <h2 ref={heading} tabIndex={-1}>{story.title}</h2>
      <ClueWords story={story} />
      <KeyVerse story={story} />
      <p className="es-links">
        <Link to={readHref(story.ref)}>Read the story</Link>
        {person && <Link to={`/people/${slugOf(person.id) ?? person.id}`}>{`More about ${person.name}`}</Link>}
      </p>
      {children}
    </section>
  );
}
