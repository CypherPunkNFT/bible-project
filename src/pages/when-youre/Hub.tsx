// The hub, /when-youre (design 5.3): the heading and introduction, the quiet crisis line, the "How are you feeling?"
// filter (local only: what is typed is never stored or sent), the three groups of link cards and the links for someone
// you love. An unknown address shows this hub with one gentle line and a noindex mark, never "page not found" (5.1).
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { GROUPS, WHEN_TOPICS, WHEN_YOURE_PATH, type WhenTopic } from "@/data/when-youre";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { plural } from "@/lib/site-format";
import { passageReference } from "@/pages/life-events/passage";
import { filterTopics } from "./filter";
import { QuietHelp, UrgentHelp } from "./Help";
import { SourceLine } from "./TopicPage";
import { useHelpDirectory } from "./useHelpDirectory";
import { useFeatureHead } from "./useFeatureHead";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

function TopicCard({ topic }: { topic: WhenTopic }) {
  const catalog = useCatalog();
  const featured = topic.passages[0];
  const reference = passageReference(featured, (book) => bookByNum(catalog, book)?.name ?? "");
  return (
    <li>
      <Link to={`${WHEN_YOURE_PATH}/${topic.slug}`}>
        <strong>{topic.label}</strong>
        <span>{reference}</span>
      </Link>
    </li>
  );
}

export function Hub({ unknown = false }: { unknown?: boolean }) {
  const directory = useHelpDirectory();
  const [query, setQuery] = useState("");
  const inputId = useId();
  useFeatureHead(null, unknown);
  const result = filterTopics(WHEN_TOPICS, query);
  const shown = new Set(result.topics.map((topic) => topic.slug));
  const count = result.unmatched ? 0 : result.topics.length;
  return (
    <article className="wy-hub">
      <ToolsBackLink />
      <h1>What the Bible Says When You're…</h1>
      {unknown && (
        <div className="wy-unknown" role="status">
          We couldn't find that page. Here is everything we have; if you are in danger, the help is at the top.
        </div>
      )}
      <p className="wy-intro">Whatever you're going through, the Bible has words for it. Choose what's closest to how you feel.</p>
      <QuietHelp directory={directory} />
      <section className="wy-filter" aria-labelledby={`${inputId}-title`}>
        <h2 id={`${inputId}-title`}>How are you feeling?</h2>
        <label htmlFor={inputId}>Type a word, such as worried, alone or tired</label>
        <input id={inputId} type="search" autoComplete="off" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="wy-count" role="status" aria-live="polite">
          {query.trim() === "" ? "" : count > 0 ? plural(count, "One page matches.", "{n} pages match.") : "No page matches those words, so every page is shown."}
        </div>
      </section>
      {result.urgent.map((topic) => <UrgentHelp key={topic} topic={topic} directory={directory} />)}
      {GROUPS.map((group) => {
        const topics = WHEN_TOPICS.filter((topic) => topic.group === group.id && shown.has(topic.slug));
        if (!topics.length) return null;
        return (
          <section key={group.id} className="wy-group-list" aria-labelledby={`wy-group-${group.id}`}>
            <h2 id={`wy-group-${group.id}`}>{group.title}</h2>
            <ul className="wy-grid">{topics.map((topic) => <TopicCard key={topic.slug} topic={topic} />)}</ul>
          </section>
        );
      })}
      <section className="wy-more" aria-labelledby="wy-loved-title">
        <h2 id="wy-loved-title">For someone you love</h2>
        <ul>
          <li><Link to="/sympathy">Comforting someone who is grieving</Link></li>
          <li><Link to={`${WHEN_YOURE_PATH}/caregiving`}>Caring for someone who is ill</Link></li>
          <li><Link to="/prayers">Prayers for life's occasions</Link></li>
          <li><Link to="/resources/life">Help for life: support near you</Link></li>
        </ul>
      </section>
      <SourceLine />
    </article>
  );
}
