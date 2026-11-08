// One loss page (design 5.2): heading, introduction (the page's search description, so it is the first long paragraph),
// the help strip on the suicide page only, the passages, any explainer, the card maker, a link to the writing guide,
// links onward and the source line.
import { useState } from "react";
import { Link } from "react-router-dom";
import { SYMPATHY_PATH, type SympathySet } from "@/data/sympathy";
import { CardMaker } from "./CardMaker";
import { HelpStrip } from "./HelpStrip";
import { PassageList } from "./PassageList";
import { Explainer, ExploreMore, LoadState, SourceLine } from "./parts";
import { scrollToMaker } from "./scroll";
import { useSympathyPassages } from "./useSympathyPassages";

export function SetPage({ set }: { set: SympathySet }) {
  const { state, retry } = useSympathyPassages(set.slug, set.passages);
  const [chosen, setChosen] = useState<{ key: string; count: number } | null>(null);
  const use = (key: string) => {
    setChosen((current) => ({ key, count: (current?.count ?? 0) + 1 }));
    scrollToMaker();
  };
  const passages = state.status === "ready" ? state.value : null;
  return (
    <article className="sy-page mx-auto max-w-5xl px-4 sm:px-6">
      <nav className="sy-crumbs" aria-label="Breadcrumb"><Link to={SYMPATHY_PATH}>Sympathy</Link><span aria-hidden="true"> / </span><span>{set.short}</span></nav>
      <h1>{set.heading}</h1>
      <p className="sy-intro">{set.intro}</p>
      {set.helpStrip && <HelpStrip />}
      <LoadState state={state} retry={retry} />
      {passages && <PassageList items={passages} onUse={use} />}
      {set.explainer && <Explainer explainer={set.explainer} />}
      <CardMaker label={set.slug} passages={passages} failed={state.status === "error"} defaults={set.card} chosen={chosen} />
      <section className="sy-write-link" aria-labelledby="sy-write-title">
        <h2 id="sy-write-title">What to write</h2>
        <p>Not sure what to say? <Link to={`${SYMPATHY_PATH}#what-to-write`}>Read the short guide to what to write in a sympathy card, and what to leave out.</Link></p>
      </section>
      <ExploreMore set={set} />
      <SourceLine />
    </article>
  );
}
