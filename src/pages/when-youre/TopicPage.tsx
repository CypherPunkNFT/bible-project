// One "when you're..." page, top to bottom as design 5.2 orders it: heading, urgent help (two pages only), the
// introduction (the first long paragraph, so it becomes the search description), the calm strip (four pages), the
// passages, the person, the pastoral note, the foot help, links onward, the quiet crisis line and the source line.
import type { MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { topicBySlug, WHEN_YOURE_PATH, type WhenTopic } from "@/data/when-youre";
import type { UrgentTopic } from "@/data/when-youre/help";
import { passageAnchors, sharedVerseId } from "./anchors";
import { FootHelp, HelpStrip, QuietHelp, UrgentHelp } from "./Help";
import { Passages } from "./Passages";
import { useHelpDirectory, type HelpDirectory } from "./useHelpDirectory";
import { useFeatureHead } from "./useFeatureHead";

/** On an urgent page a shared link never scrolls past the help; this explicit link, after it, goes to the verse. */
function SharedVerseLink({ topic }: { topic: WhenTopic }) {
  const { hash } = useLocation();
  const key = sharedVerseId(hash);
  if (!key || !passageAnchors(topic).includes(key)) return null;
  const go = (event: MouseEvent) => {
    event.preventDefault();
    document.getElementById(key)?.scrollIntoView({ block: "start" });
  };
  return <div className="wy-shared-link"><a href={`#${key}`} onClick={go}>Go to the shared verse</a></div>;
}

function Person({ person }: { person: NonNullable<WhenTopic["person"]> }) {
  return (
    <section className="wy-person" aria-labelledby="wy-person-title">
      <h2 id="wy-person-title">Someone who felt this way</h2>
      <p>{person.line}</p>
      <Link to={`/people/${person.id}`}>Read their story</Link>
    </section>
  );
}

function ExploreMore({ topic }: { topic: WhenTopic }) {
  const related = topic.related.map(topicBySlug).filter((item): item is WhenTopic => Boolean(item));
  return (
    <section className="wy-more" aria-labelledby="wy-more-title">
      <h2 id="wy-more-title">Explore more</h2>
      <h3>Related pages</h3>
      <ul>{related.map((item) => <li key={item.slug}><Link to={`${WHEN_YOURE_PATH}/${item.slug}`}>{item.heading}</Link></li>)}</ul>
      {topic.elsewhere && <ul>{topic.elsewhere.map((link) => <li key={link.href}><Link to={link.href}>{link.title}</Link></li>)}</ul>}
      <h3>Bible topics</h3>
      <ul>{topic.topics.map((item) => <li key={item.slug}><Link to={`/topics/${item.slug}`}>{item.title}</Link></li>)}</ul>
      <ul>
        <li><Link to={WHEN_YOURE_PATH}>Every page: what the Bible says when you're hurting</Link></li>
        <li><Link to="/resources/life">Help for life</Link></li>
      </ul>
    </section>
  );
}

export function SourceLine() {
  return <p className="wy-source">Scripture quotations are from the Berean Standard Bible (public domain).</p>;
}

export function TopicView({ topic, directory }: { topic: WhenTopic; directory: HelpDirectory }) {
  const level = topic.help.level;
  return (
    <article className="wy-topic">
      <nav className="wy-crumbs" aria-label="Breadcrumb">
        <Link to={WHEN_YOURE_PATH}>What the Bible says when you're…</Link>
        <span aria-hidden="true"> / </span>
        <span>{topic.label}</span>
      </nav>
      <h1>{topic.heading}</h1>
      {level === "urgent" && <UrgentHelp topic={topic.slug as UrgentTopic} directory={directory} />}
      {level === "urgent" && <SharedVerseLink topic={topic} />}
      <p className="wy-intro">{topic.intro}</p>
      {level === "line" && <HelpStrip topic={topic} directory={directory} />}
      <Passages topic={topic} />
      {topic.person && <Person person={topic.person} />}
      <section className="wy-note" aria-labelledby="wy-note-title">
        <h2 id="wy-note-title">A word for you</h2>
        {topic.note.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </section>
      {(level === "line" || level === "foot") && <FootHelp topic={topic} directory={directory} />}
      <ExploreMore topic={topic} />
      <QuietHelp directory={directory} />
      <SourceLine />
    </article>
  );
}

export function TopicPage({ topic }: { topic: WhenTopic }) {
  const directory = useHelpDirectory();
  useFeatureHead(topic.searchTitle);
  return <TopicView topic={topic} directory={directory} />;
}
