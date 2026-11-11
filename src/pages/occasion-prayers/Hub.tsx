// The hub, /prayers (design 5.3): the heading and introduction, the "What's happening?" filter (local only: what is typed
// is never stored or sent), a calm line to the "when you're…" help pages when crisis words are typed, the six groups of
// link cards, and the links to the neighbouring features. The cards come from the data, so no Bible book loads here.
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { GROUPS, OCCASIONS, occasionPath, type Occasion } from "@/data/occasion-prayers";
import type { UrgentTopic } from "@/data/when-youre/help";
import { plural } from "@/lib/site-format";
import { filterOccasions } from "./filter";
import { SourceLines } from "./OccasionPage";

/** The first words of the featured prayer, for the card. */
function firstWords(text: string, count = 12): string {
  const words = text.split(/\s+/);
  return words.length <= count ? text : `${words.slice(0, count).join(" ").replace(/[,;:.]$/, "")}…`;
}

const URGENT_LINKS: Record<UrgentTopic, string> = {
  "thinking-of-suicide": "Help if you are thinking of ending your life",
  abused: "Help if someone is hurting you",
};

function OccasionCard({ occasion }: { occasion: Occasion }) {
  return (
    <li>
      <Link to={occasionPath(occasion)}>
        <strong>{occasion.label}</strong>
        <span>{firstWords(occasion.prayers[0].text)}</span>
      </Link>
    </li>
  );
}

export function Hub() {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const result = filterOccasions(OCCASIONS, query);
  const shown = new Set(result.occasions.map((occasion) => occasion.slug));
  const count = result.unmatched ? 0 : result.occasions.length;
  return (
    <article className="op-hub">
      <h1>Prayers for Life's Occasions</h1>
      <p className="op-intro">
        Short prayers for the moments that matter, before surgery, a job interview, a new home or a hard conversation, each rooted in Scripture and easy to send to someone you love.
      </p>
      <section className="op-filter" aria-labelledby={`${inputId}-title`}>
        <h2 id={`${inputId}-title`}>What's happening?</h2>
        <label htmlFor={inputId}>Type a word, such as surgery, interview or moving</label>
        <input id={inputId} type="search" autoComplete="off" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="op-count" role="status" aria-live="polite">
          {query.trim() === "" ? "" : count > 0 ? plural(count, "One prayer page matches.", "{n} prayer pages match.") : "No page matches those words, so every page is shown."}
        </div>
      </section>
      {result.urgent.length > 0 && (
        <div className="op-urgent" role="note">
          <p>If you are thinking of ending your life or someone is hurting you, help is here.</p>
          <ul>{result.urgent.map((topic) => <li key={topic}><Link to={`/when-youre/${topic}`}>{URGENT_LINKS[topic]}</Link></li>)}</ul>
        </div>
      )}
      {GROUPS.map((group) => {
        const occasions = OCCASIONS.filter((occasion) => occasion.group === group.id && shown.has(occasion.slug));
        if (!occasions.length) return null;
        return (
          <section key={group.id} className="op-group" aria-labelledby={`op-group-${group.id}`}>
            <h2 id={`op-group-${group.id}`}>{group.title}</h2>
            <ul className="op-grid">{occasions.map((occasion) => <OccasionCard key={occasion.slug} occasion={occasion} />)}</ul>
          </section>
        );
      })}
      <section className="op-more" aria-labelledby="op-else-title">
        <h2 id="op-else-title">Looking for something else?</h2>
        <ul>
          <li><Link to="/when-youre">What the Bible says when you're hurting</Link></li>
          <li><Link to="/life-events">Verses and printable cards for life's big days</Link></li>
          <li><Link to="/sympathy">Words of comfort and sympathy cards</Link></li>
        </ul>
      </section>
      <SourceLines crown={false} />
    </article>
  );
}
