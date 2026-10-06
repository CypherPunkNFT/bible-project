import { ArrowUpRight, BookOpen, Download, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";

export const REPOSITORY = "https://github.com/CypherPunkNFT/bible-project";

const POINTS = [
  {
    icon: BookOpen,
    title: "What it is",
    text: "The whole Bible in every free version we can find: the King James, Geneva, Tyndale, Douay-Rheims, the Hebrew and Greek originals, the Latin Vulgate, and translations in twelve more languages, from Spanish and Chinese to Hindi and Russian. You can read them side by side, with charts, an atlas of its places, and study pages.",
  },
  {
    icon: Gift,
    title: "Why it was built",
    text: "So anyone, anywhere, can read Scripture in its many historic versions and see how it fits together, without paying, signing up or being sold to.",
  },
  {
    icon: Download,
    title: "Free for everyone",
    text: "Use it, share it, download it, take it apart. The code is MIT-licensed, the Bible texts are public domain (one Hindi text is openly licensed and credited), and every source is listed with its licence. Build your own copy, or something new from it.",
  },
];

/** The GitHub mark (path from Simple Icons, CC0); lucide no longer ships brand logos. */
function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** After the landing screen: what this site is, why it exists, and that all of it is free and open. */
export function HomeAbout() {
  const catalog = useCatalog();
  return (
    <section aria-labelledby="home-about" className="py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">About this site</p>
        <h2 id="home-about" className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          A free Bible library, open to everyone.
        </h2>
        <p className="mt-3 text-muted">
          {catalog.translations.length} versions, no accounts, no ads, no paywall. Nothing here is locked away, including the code.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-line bg-surface p-5">
            <Icon className="h-6 w-6 text-accent" aria-hidden />
            <h3 className="mt-3 font-serif text-xl font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={REPOSITORY}
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-page transition hover:opacity-90"
        >
          <GithubMark /> Get the code on GitHub <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
        <Link to="/versions" className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2.5 text-sm hover:bg-surface-2">
          Every source and its licence
        </Link>
      </div>
    </section>
  );
}
