// A topic page's passages (design 5.2 items 5–8): verses to hold on to (the first is the featured verse), passages to
// read slowly, and one to pray. Verse text is loaded from the Berean files as on the sympathy pages; a failure shows
// Retry without hiding the help, the introduction or the note around it.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { WhenTopic } from "@/data/when-youre";
import { useSympathyPassages, type ShownSympathy } from "@/pages/sympathy/useSympathyPassages";
import { passageAnchors, sharedVerseId } from "./anchors";
import { cardDescription } from "./message";
import { SendVerse } from "./SendVerse";

/** Longer than this, a passage to read opens collapsed after two lines (design 5.2 item 7). */
const LONG_READING = 600;

function Passage({ item, topic, id, featured, groupHeading }: { item: ShownSympathy; topic: WhenTopic; id: string; featured: boolean; groupHeading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const role = item.passage.role;
  const long = role === "reading" && item.text.length > LONG_READING;
  return (
    <>
      {groupHeading && item.passage.group && <h3 className="wy-group">{item.passage.group}</h3>}
      <section id={id} className={`wy-passage${featured ? " wy-featured" : ""}`} aria-label={item.reference}>
        {item.passage.believer && <div className="wy-believer">For a believer</div>}
        <blockquote className={`scripture${long && !expanded ? " wy-collapsed" : ""}`} lang="en">{item.text}</blockquote>
        {long && <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read the whole passage"}</button>}
        <div className="wy-reference"><Link to={item.readHref}>{item.reference}</Link></div>
        <p>{item.passage.note}</p>
        {item.passage.context && <p className="wy-context">{item.passage.context}</p>}
        {role !== "reading" && <SendVerse card={cardDescription(topic.slug, topic.heading, item)} />}
      </section>
    </>
  );
}

const SECTIONS = [
  { role: "card", title: "Verses to hold on to" },
  { role: "reading", title: "Read slowly" },
  { role: "blessing", title: "Pray these words" },
] as const;

export function Passages({ topic }: { topic: WhenTopic }) {
  const { state, retry } = useSympathyPassages(`when-youre:${topic.slug}`, topic.passages);
  const { hash } = useLocation();
  const ids = useMemo(() => passageAnchors(topic), [topic]);
  const urgent = topic.help.level === "urgent";
  useEffect(() => {
    // An ordinary page opens at a shared verse once the text has arrived; an urgent page never scrolls past its help.
    if (urgent || state.status !== "ready") return;
    const key = sharedVerseId(hash);
    if (key && ids.includes(key)) document.getElementById(key)?.scrollIntoView({ block: "start" });
  }, [hash, state.status, urgent, ids]);
  if (state.status === "loading") return <div className="wy-loading" role="status">Loading the verses…</div>;
  if (state.status === "error") {
    return <div className="wy-load-error" role="alert">The verses could not be loaded. <button type="button" onClick={retry}>Retry verses</button></div>;
  }
  return (
    <div className="wy-passages">
      {SECTIONS.map(({ role, title }) => {
        let previousGroup: string | undefined;
        let first = true;
        return (
          <section key={role} className={`wy-role wy-role-${role}`} aria-labelledby={`wy-${role}-title`}>
            <h2 id={`wy-${role}-title`}>{title}</h2>
            {role === "blessing" && <div className="wy-pray-line">Pray these words, or put them in your own.</div>}
            {state.value.map((item, index) => {
              if (item.passage.role !== role) return null;
              const featured = role === "card" && first;
              first = false;
              const groupHeading = item.passage.group !== previousGroup;
              previousGroup = item.passage.group;
              return <Passage key={ids[index]} id={ids[index]} topic={topic} item={item} featured={featured} groupHeading={groupHeading} />;
            })}
          </section>
        );
      })}
    </div>
  );
}
