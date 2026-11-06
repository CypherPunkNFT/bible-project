import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { cameFrom, isCameFrom } from "@/lib/came-from";
import { personPath } from "@/lib/people-pages-index";
import { readyKey } from "@/components/people-pages/usePeoplePageSlide";
import { studyRefLink, type Person } from "@/lib/study";
import { fillVerses, useCurrentBible } from "@/lib/verses";
import { watchShadowRoot } from "@/lib/page-translator";
import { mountMoses } from "./runtime.js";
import styles from "./moses.css?inline";
import topicStyles from "./chapter-topics.css?inline";
import wordStyles from "./word-open.css?inline";

/** The approved cinematic design, within the site's real routing and header.
 * A shadow root isolates its typography/illustrations from generic study styles.
 * The runtime belongs to this mount and releases observers/listeners on departure. */
export default function MosesPage({ person }: { person: Person }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const catalog = useCatalog();
  const bible = useCurrentBible();
  const navigate = useNavigate();
  const { state } = useLocation();
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const shadow = element.shadowRoot ?? element.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = styles + topicStyles + wordStyles;
    const surface = document.createElement("article");
    surface.className = "moses-surface dir-merged";
    surface.setAttribute("aria-label", "Moses: his life, leadership and word");
    shadow.replaceChildren(style, surface);
    watchShadowRoot(shadow); // the page translator does not enter a shadow root unless it is handed one
    const theme = () => { element.dataset.theme = document.documentElement.dataset.theme ?? "light"; };
    theme();
    const observer = new MutationObserver(theme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const from: unknown = (state as { from?: unknown } | null)?.from;
    const back = isCameFrom(from) ? from : { path: "/study/people", label: "People & genealogies" };
    const oldTitle = document.title;
    document.title = "Moses · Bible Guide";
    const dispose = mountMoses(surface, {
      person, back, personPath,
      fillVerses: (data) => fillVerses(data, catalog, bible.slug),
      bibleAbbr: bible.abbr,
      refHref: (span) => studyRefLink(catalog, span),
      navigate: (href) => navigate(href, { state: href === back.path ? undefined : cameFrom("Moses") }),
      onReady: () => { element.dataset.peopleReady = readyKey({ kind: "person", id: person.id }); },
      onError: (reason) => { console.error("Moses page could not load", reason); setError(true); },
    });
    return () => { dispose(); observer.disconnect(); shadow.replaceChildren(); document.title = oldTitle; };
  }, [person, catalog, bible, navigate, state]);
  return <>
    {error && <p role="alert" className="mx-auto max-w-7xl p-6">Moses’ page could not load. <Link className="underline" to="/study/people">Return to People & genealogies</Link>.</p>}
    {/* The translator swaps this page's text inside its drawing surface (watchShadowRoot above), so it is not marked English; its drawings still read left to right until the right-to-left layout work. */}
    <div ref={host} className="people-page-slide" dir="ltr" />
  </>;
}
