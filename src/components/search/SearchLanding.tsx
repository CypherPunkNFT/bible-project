import { ArrowRight, Download, MapPin, MessageCircleQuestion, Sparkles, TextSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryCard } from "@/components/topics/TopicCards";
import { AP_BASE } from "@/lib/apologetics-links";
import { useCatalog } from "@/lib/catalog";
import { loadTopicIndex } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import { enableMeaning, useMeaning } from "@/lib/meaning/store";

/** What the Search page shows before a search: example questions, what can be searched, meaning search, topics to browse. */
const EXAMPLES = [
  "Why does God allow suffering?",
  "God is faithful when I am afraid",
  "Who decided which books belong in the Bible?",
  "I keep doubting whether I am really saved",
  "the stone which the builders rejected",
  "Jerusalem",
];

const MB = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;

function MeaningCard() {
  const meaning = useMeaning();
  if (meaning.phase === "checking" || meaning.phase === "unsupported" || meaning.phase === "error") return null;
  return (
    <section className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-5 sm:p-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"><Sparkles size={14} /> Meaning search</p>
      {meaning.phase === "ready" ? (
        <>
          <h2 className="mt-2 font-serif text-2xl font-semibold">On for this device. Ask in your own words.</h2>
          <p className="mt-1 text-sm text-muted">Questions find the studies and verses that mean the same thing, even with different words. It runs here; nothing you type is sent anywhere.</p>
        </>
      ) : meaning.phase === "downloading" ? (
        <>
          <h2 className="mt-2 font-serif text-2xl font-semibold">Setting up… {Math.round(meaning.progress * 100)}%</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${meaning.progress * 100}%` }} /></div>
        </>
      ) : (
        <>
          <h2 className="mt-2 font-serif text-2xl font-semibold">Search by what you mean, not just the words you remember.</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">“God is faithful when I am afraid” finds Psalm 56:11, “I will not be afraid”. A small model runs on your own device: free, private, and no internet needed once it’s set up.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void enableMeaning()} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-page hover:opacity-90"><Download size={16} /> {meaning.phase === "update" ? "Update" : "Turn on"}{meaning.manifest ? ` · ${MB(meaning.manifest.bytes)} once` : ""}</button>
            <Link to="/search/meaning" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">How it works <ArrowRight size={14} /></Link>
          </div>
        </>
      )}
    </section>
  );
}

export function SearchLanding({ onAsk }: { onAsk: (query: string) => void }) {
  const catalog = useCatalog();
  const kinds = [
    { icon: MessageCircleQuestion, title: "Studies", text: "25 guided answers to hard questions, from suffering to the Trinity.", to: `${AP_BASE}/questions` },
    { icon: Sparkles, title: "Verses by meaning", text: "31,098 verses of the World English Bible, matched by what they say.", to: "/search/meaning" },
    { icon: MapPin, title: "Places", text: "1,252 places on the atlas, from Ur to Rome.", to: "/study/atlas/map" },
    { icon: TextSearch, title: "Exact words", text: `Any word or phrase in ${catalog.translations.length} versions, with where it falls in the Bible.`, to: "/versions" },
  ];
  return (
    <div className="mt-8">
      <section aria-labelledby="try-asking">
        <h2 id="try-asking" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Try asking</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => <li key={example}><button type="button" onClick={() => onAsk(example)} className="rounded-full border border-line bg-surface px-3.5 py-2 text-sm hover:border-accent hover:text-accent">{example}</button></li>)}
        </ul>
      </section>

      <MeaningCard />

      <section aria-labelledby="what-you-can-search" className="mt-10">
        <h2 id="what-you-can-search" className="font-serif text-2xl font-semibold">What you can search</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {kinds.map(({ icon: Icon, title, text, to }) => (
            <li key={title}><Link to={to} className="flex h-full gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent"><Icon size={22} className="mt-0.5 shrink-0 text-accent" /><span><span className="block font-semibold">{title}</span><span className="mt-0.5 block text-sm text-muted">{text}</span></span></Link></li>
          ))}
        </ul>
      </section>

      <TopicBrowser />
    </div>
  );
}

/** The topic taxonomy in two levels: each category with its subcategories (scripts/build-topics.py). */
function TopicBrowser() {
  const index = useAsync(loadTopicIndex, "topic-index");
  if (index.status !== "ready") return null;
  const total = Object.keys(index.value.topics).length;
  return (
    <section aria-labelledby="browse-topics" className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="browse-topics" className="font-serif text-2xl font-semibold">Or browse by topic</h2>
        <Link to="/topics" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">All {formatNumber(total)} topics <ArrowRight size={14} /></Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {index.value.categories.map((category) => <li key={category.id}><CategoryCard category={category} compact /></li>)}
      </ul>
    </section>
  );
}
