import { ArrowRight, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { studyById, topicById } from "@/data/apologetics-library";
import { STUDIES } from "@/data/apologetics-studies";
import { searchStudies } from "@/lib/apologetics-search";
import { studyUrl } from "@/lib/apologetics-links";
import { useCatalog } from "@/lib/catalog";
import { loadPlaces } from "@/lib/data";
import { preferMeaning, useMeaning } from "@/lib/meaning/store";
import type { useMeaningResults } from "@/lib/meaning/useMeaningResults";
import { sectionColor } from "@/lib/sections";
import type { Place } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";

const MB = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;

/** "Meaning search: on" badge, or the invitation to turn it on, beside the search box. */
export function MeaningBadge() {
  const meaning = useMeaning();
  if (meaning.phase === "ready") return <Link to="/search/meaning" className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"><Sparkles size={13} /> Meaning search is on · manage</Link>;
  if (meaning.phase === "unsupported" || meaning.phase === "checking") return null;
  return <Link to="/search/meaning" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink"><Sparkles size={13} /> Search by what you mean{meaning.phase === "update" ? " (update ready)" : ""} <ArrowRight size={12} /></Link>;
}

function SectionHead({ title, note, link }: { title: string; note?: string; link?: { to: string; label: string } }) {
  return <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-serif text-2xl font-semibold">{title}{note && <span className="ml-2 align-middle text-xs font-normal text-muted">{note}</span>}</h2>{link && <Link to={link.to} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{link.label} <ArrowUpRight size={14} /></Link>}</div>;
}

/** Question-library studies: by meaning for real questions when switched on, otherwise by keyword. */
export function StudiesSection({ query, meaning }: { query: string; meaning: ReturnType<typeof useMeaningResults> }) {
  const byMeaning = meaning.status === "done" && meaning.results && preferMeaning(query);
  const keyword = searchStudies(STUDIES, query).hits.map((hit) => hit.study.id);
  const ids = (byMeaning ? meaning.results!.studies.map((s) => s.id) : keyword).slice(0, 4);
  if (!ids.length && meaning.status !== "loading") return null;
  return (
    <section aria-labelledby="search-studies" className="mt-10">
      <div id="search-studies"><SectionHead title="Studies" note={byMeaning ? "by meaning" : "by words"} link={{ to: `/apologetics/questions?q=${encodeURIComponent(query)}`, label: "All in the question library" }} /></div>
      {meaning.status === "loading" && preferMeaning(query) ? <p className="text-sm text-muted" role="status">Finding studies by meaning…</p> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ids.map((id) => { const study = studyById(id); if (!study) return null; const topic = topicById(study.topic); return (
            <li key={id}><Link to={studyUrl(id)} className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-accent">
              <span className="text-xs uppercase tracking-wide text-muted">{topic?.title}</span>
              <span className="mt-1 block font-serif text-lg font-semibold">{study.title}</span>
              <span className="mt-1 block text-sm text-muted">{study.summary}</span>
            </Link></li>
          ); })}
        </ul>
      )}
    </section>
  );
}

/** World English Bible verses closest in meaning; an invitation when meaning search is off. */
export function VersesSection({ query, meaning }: { query: string; meaning: ReturnType<typeof useMeaningResults> }) {
  const catalog = useCatalog();
  const state = useMeaning();
  if (meaning.status === "off") {
    if (state.phase === "unsupported" || state.phase === "checking" || state.phase === "error") return null;
    return (
      <section className="mt-10 rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-5">
        <p className="flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-accent" /> Find verses by what they mean</p>
        <p className="mt-1 text-sm text-muted">“{query}” as an idea, not just as words: meaning search finds the verses that say it, even in other words. It runs on your own device after a one-time download{state.manifest ? ` of ${MB(state.manifest.bytes)}` : ""}.</p>
        <Link to="/search/meaning" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">Learn how and turn it on <ArrowRight size={14} /></Link>
      </section>
    );
  }
  return (
    <section aria-labelledby="search-verses" className="mt-10">
      <div id="search-verses"><SectionHead title="Verses about this" note="by meaning · World English Bible" /></div>
      {meaning.status === "loading" && <p className="text-sm text-muted" role="status">Comparing with 31,098 verses on this device…</p>}
      {meaning.status === "error" && <p className="text-sm text-muted">Meaning search could not run this time. The word results below still work.</p>}
      {meaning.status === "done" && meaning.results && (
        <ol className="divide-y divide-line">
          {meaning.results.verses.map((verse) => {
            const [code, ref] = verse.id.split(" ");
            const [chapter, number] = ref.split(":");
            const book = catalog.books.find((b) => b.code === code);
            return (
              <li key={verse.id} className="py-3">
                <Link to={`/read/web/${code}/${chapter}?v=${number}`} className="group block">
                  <span className="flex items-center gap-2 text-sm font-semibold group-hover:text-accent">{book && <span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(book.section) }} aria-hidden />}{book?.name ?? code} {ref}</span>
                  <span className="mt-1 block font-serif">{verse.text}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Atlas places whose name matches a word of the query. */
export function PlacesSection({ query }: { query: string }) {
  const places = useAsync(loadPlaces, "places");
  if (places.status !== "ready") return null;
  const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  const hits: Place[] = places.value.filter((place) => words.some((word) => place.name.toLowerCase().split(/[\s-]+/).some((part) => part.startsWith(word)))).sort((a, b) => b.verses.length - a.verses.length).slice(0, 8);
  if (!hits.length) return null;
  return (
    <section aria-labelledby="search-places" className="mt-10">
      <div id="search-places"><SectionHead title="Places" note="on the atlas" /></div>
      <ul className="flex flex-wrap gap-2">
        {hits.map((place) => <li key={place.id}><Link to={`/study/atlas/map?place=${place.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-accent"><MapPin size={14} className="text-accent" />{place.name}<span className="text-xs text-muted">{formatNumber(place.verses.length)} verses</span></Link></li>)}
      </ul>
    </section>
  );
}
