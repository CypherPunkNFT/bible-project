import { ArrowLeft, Check, CloudOff, Download, Fingerprint, Lock, Search, Smartphone, Sparkles, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { studyById } from "@/data/apologetics-library";
import { STUDIES } from "@/data/apologetics-studies";
import { searchStudies } from "@/lib/apologetics-search";
import { studyUrl } from "@/lib/apologetics-links";
import { disableMeaning, enableMeaning, useMeaning } from "@/lib/meaning/store";

/** "Search by what you mean": explains meaning search and lets a visitor turn it on for this device (MEANING_SEARCH.md §2c). */
const MB = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;

function Block({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section id={id} className="mt-14"><h2 className="font-serif text-3xl font-semibold tracking-tight">{title}</h2><div className="mt-4 text-muted">{children}</div></section>;
}

/** Three real questions: what word search finds versus what meaning search finds (meaning results computed on our PC). */
function Demo() {
  const meaning = useMeaning();
  const demo = meaning.manifest?.demo ?? [];
  if (!demo.length) return null;
  return (
    <div className="mt-6 grid gap-4">
      {demo.map((row) => {
        const words = searchStudies(STUDIES, row.question).hits.slice(0, 1).map((hit) => hit.study);
        const meant = studyById(row.studies[0]);
        return (
          <figure key={row.question} className="rounded-2xl border border-line bg-surface p-4">
            <figcaption className="font-serif text-lg text-ink">“{row.question}”</figcaption>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs font-semibold uppercase tracking-wide">By words</p><p className="mt-1 text-sm">{words[0] ? words[0].title : "No study uses those words."}</p></div>
              <div className="rounded-xl border border-accent/40 bg-accent/10 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-accent">By meaning</p>{meant && <Link to={studyUrl(meant.id)} className="mt-1 block text-sm font-semibold text-ink hover:underline">{meant.title}</Link>}</div>
            </div>
          </figure>
        );
      })}
    </div>
  );
}

function Status() {
  const meaning = useMeaning();
  const size = meaning.manifest ? MB(meaning.manifest.bytes) : "about 85 MB";
  const box = "mt-6 rounded-2xl border p-5";
  if (meaning.phase === "checking") return <div className={box + " border-line"} role="status">Checking this device…</div>;
  if (meaning.phase === "unsupported") return <div className={box + " border-line"}><p className="font-semibold text-ink">This device can’t run meaning search.</p><p className="mt-1 text-sm">{meaning.reason} Word search works as before.</p></div>;
  if (meaning.phase === "error") return <div className={box + " border-line"}><p className="font-semibold text-ink">Something went wrong.</p><p className="mt-1 text-sm">{meaning.reason}</p>{meaning.manifest && <button type="button" onClick={() => void enableMeaning()} className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-page">Try again</button>}</div>;
  if (meaning.phase === "downloading") return (
    <div className={box + " border-accent/50"} role="status" aria-live="polite">
      <p className="font-semibold text-ink">Downloading to this device… {Math.round(meaning.progress * 100)}%</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${meaning.progress * 100}%` }} /></div>
      <p className="mt-2 text-xs">{size} in total. You can keep using the site; this happens once.</p>
    </div>
  );
  if (meaning.phase === "ready") return (
    <div className={box + " border-accent/50 bg-accent/5"}>
      <p className="flex items-center gap-2 font-semibold text-ink"><Check size={18} className="text-accent" /> Meaning search is on for this device.</p>
      <p className="mt-1 text-sm">It uses {MB(meaning.storedBytes)} of this browser’s storage and works offline. Try it on the <Link to="/search" className="text-accent underline">Search page</Link>.</p>
      <button type="button" onClick={() => void disableMeaning()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm hover:border-ink"><Trash2 size={15} /> Remove from this device</button>
    </div>
  );
  return (
    <div className={box + " border-accent/50"}>
      <p className="flex items-center gap-2 font-semibold text-ink"><Check size={18} className="text-accent" /> This device can run it.{meaning.phase === "update" && " An improved version is ready."}</p>
      <p className="mt-1 text-sm">One download of {size}, then it runs here, privately, even offline. Wi-Fi is best.</p>
      <button type="button" onClick={() => void enableMeaning()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-page hover:opacity-90"><Download size={16} /> {meaning.phase === "update" ? "Update" : "Turn on"} meaning search · {size}</button>
    </div>
  );
}

export default function MeaningSearchPage() {
  const meaning = useMeaning();
  const counts = meaning.manifest?.counts;
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <header className="pb-4 pt-10">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Search</Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Meaning search</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Search by what you mean.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Not just the words you remember. A small model runs on your own device, so it’s free, private, and works offline.</p>
      </header>
      <Status />

      <Block title="See the difference.">
        <p>Three everyday questions, and the study each kind of search puts first. Nothing to download to see this.</p>
        <Demo />
      </Block>

      <Block title="How it works.">
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            [Fingerprint, "We make fingerprints, once.", "On our own computer, every study and every verse of the World English Bible was turned into a “meaning fingerprint”: 384 numbers that sit close together when the ideas are close."],
            [Download, "Your browser downloads them, once.", "The fingerprints and the small model that makes them (IBM Granite, 47 million parameters) are kept by your browser."],
            [Search, "Your question is matched here.", "Your question becomes a fingerprint on your device and is compared with ours in a fraction of a second. It is never sent anywhere."],
          ].map(([Icon, title, text]) => { const I = Icon as typeof Search; return <li key={title as string} className="rounded-2xl border border-line bg-surface p-4"><I className="text-accent" size={22} /><p className="mt-2 font-semibold text-ink">{title as string}</p><p className="mt-1 text-sm">{text as string}</p></li>; })}
        </ol>
      </Block>

      <Block title="Private, and it works offline.">
        <ul className="grid gap-2">
          <li className="flex gap-2"><Lock size={18} className="mt-0.5 shrink-0 text-accent" /> What you type stays on your device. There is no account and no server doing the searching.</li>
          <li className="flex gap-2"><CloudOff size={18} className="mt-0.5 shrink-0 text-accent" /> After the download it works without internet: on a plane, in a church basement, on a mission trip.</li>
        </ul>
      </Block>

      <Block title="What you need.">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><tbody className="divide-y divide-line">
          <tr><th className="py-2 pr-4 font-semibold text-ink">Device</th><td className="py-2">Most laptops from the last eight years, and most phones and tablets from the last five or six.</td></tr>
          <tr><th className="py-2 pr-4 font-semibold text-ink">Browser</th><td className="py-2">Any current Chrome, Edge, Firefox or Safari. No graphics card needed.</td></tr>
          <tr><th className="py-2 pr-4 font-semibold text-ink">Download</th><td className="py-2">{meaning.manifest ? MB(meaning.manifest.bytes) : "About 85 MB"}, once. Wi-Fi recommended.</td></tr>
          <tr><th className="py-2 pr-4 font-semibold text-ink">Speed</th><td className="py-2">Measured: a few hundredths of a second on a laptop; about a third of a second on a slow phone.</td></tr>
        </tbody></table></div>
        <p className="mt-3 flex items-center gap-2 text-sm"><Smartphone size={16} className="text-accent" /> The box at the top of this page checks your device before offering the download.</p>
      </Block>

      <Block title="What it covers.">
        <p><strong className="text-ink">Now:</strong> the {counts?.studies ?? 25} studies in the question library and all {counts ? counts.bibleVerses.toLocaleString() : "31,098"} verses of the World English Bible. <strong className="text-ink">Next:</strong> study pages, people and places, and more languages.</p>
      </Block>

      <Block title="What it doesn’t do.">
        <p>It finds passages about what you mean; it doesn’t interpret Scripture or give answers, and it can miss. The exact-words search is still on the Search page for precise phrases.</p>
      </Block>

      <Block title="For developers and churches.">
        <p>The fingerprints are made from openly licensed texts and published so anyone can build with them. A downloadable dataset with a short “search it yourself” guide is planned. Only openly licensed texts are included, which is why some library works are not.</p>
      </Block>

      <Block title="Questions.">
        <dl className="grid gap-3 text-sm">
          {[
            ["Does it cost anything?", "No. Not for you, and the searching costs us nothing either: it runs on your device."],
            ["Will it use my mobile data?", `Once, for the download (${meaning.manifest ? MB(meaning.manifest.bytes) : "about 85 MB"}). Searching uses none.`],
            ["Why not an AI that answers questions?", "That may come later, and it would search with this same meaning index. This step finds; it doesn’t answer."],
            ["Can I remove it?", "Yes. When it is on, a “Remove from this device” button appears at the top of this page."],
          ].map(([q, a]) => <div key={q}><dt className="font-semibold text-ink">{q}</dt><dd className="mt-0.5">{a}</dd></div>)}
        </dl>
      </Block>

      <Block title="Credits.">
        <p className="text-sm">Model: IBM <a className="underline" href="https://huggingface.co/ibm-granite/granite-embedding-small-english-r2" rel="noreferrer">granite-embedding-small-english-r2</a> (Apache 2.0), browser build by onnx-community. Engine: <a className="underline" href="https://github.com/huggingface/transformers.js" rel="noreferrer">Transformers.js</a> (Apache 2.0) and ONNX Runtime Web (MIT). Bible text: World English Bible (public domain). <Sparkles size={13} className="inline text-accent" /></p>
      </Block>
    </div>
  );
}
