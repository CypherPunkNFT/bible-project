// Small pieces every sympathy page shares: the loading and failure lines, the explainer, "Explore more" and the source line.
import { Link } from "react-router-dom";
import { FUNERAL_PATH, SYMPATHY_PATH, sympathySetBySlug, sympathySetPath, type SympathySet } from "@/data/sympathy";
import type { AsyncState } from "@/lib/useAsync";

export function LoadState({ state, retry }: { state: AsyncState<unknown>; retry: () => void }) {
  if (state.status === "loading") return <p className="sy-status" role="status">Loading the verses…</p>;
  if (state.status === "error") {
    return <p className="sy-status sy-failed" role="alert">The verses could not be loaded. Check your connection and try again. <button type="button" className="sy-small-button" onClick={retry}>Retry</button></p>;
  }
  return null;
}

export function Explainer({ explainer }: { explainer: NonNullable<SympathySet["explainer"]> }) {
  return (
    <section className="sy-explainer" aria-labelledby="sy-explainer-title">
      <h2 id="sy-explainer-title">{explainer.title}</h2>
      {explainer.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
    </section>
  );
}

export function ExploreMore({ set, funeral = true }: { set?: SympathySet; funeral?: boolean }) {
  const related = (set?.related ?? []).map(sympathySetBySlug).filter((item): item is SympathySet => Boolean(item));
  return (
    <section className="sy-more" aria-labelledby="sy-more-title">
      <h2 id="sy-more-title">Explore more</h2>
      <ul>
        {(set?.topics ?? []).map((topic) => <li key={topic.slug}><Link to={`/topics/${topic.slug}`}>{`Topic: ${topic.title}`}</Link></li>)}
        {funeral && <li><Link to={FUNERAL_PATH}>Bible readings for a funeral</Link></li>}
        {related.map((item) => <li key={item.slug}><Link to={sympathySetPath(item)}>{item.heading}</Link></li>)}
        <li><Link to="/resources/life">Grief support near you</Link></li>
        {set?.slug === "" && <li><Link to="/when-youre/grieving">When you're grieving yourself</Link></li>}
        {set?.slug === "" && <li><Link to="/prayers/before-a-funeral">Prayers before a funeral</Link></li>}
        {set?.slug !== "" && <li><Link to={SYMPATHY_PATH}>All sympathy pages</Link></li>}
      </ul>
    </section>
  );
}

export function SourceLine() {
  return <p className="sy-source">Scripture quotations are from the Berean Standard Bible (public domain).</p>;
}
