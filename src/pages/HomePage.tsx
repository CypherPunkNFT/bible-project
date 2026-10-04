import { ArrowRight, GraduationCap, Library, Map, Search } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { HomeLanding } from "@/components/home/HomeLanding";
import { HomeAbout } from "@/components/home/HomeAbout";
import { loadHome } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";

// The Faith page's Names of God (with its fonts and 220 KB of names) loads in its own chunk.
const NamesOfGod = lazy(() => import("@/components/names/NamesOfGod").then((m) => ({ default: m.NamesOfGod })));

const TILES = [
  { to: "/library", title: "Library", text: "Every chapter on the reading chart, your reading marked, and every version — English, the original languages and translations.", icon: Library },
  { to: "/study", title: "Study", text: "Explore Jesus and the Gospels, people, places, miracles, connected passages and the shape of the Bible.", icon: GraduationCap },
  { to: "/study/places", title: "Atlas", text: "1,252 places of the Bible on a satellite map — click a place to read its verses.", icon: Map },
  { to: "/search", title: "Search", text: "Find any word or phrase in any version, and see where in the Bible it falls.", icon: Search },
];

/** The Bible Project's landing page: the opening screen, what the site is and that it is free and open, His names, and the ways in. */
export default function HomePage() {
  const home = useAsync(loadHome, "home");
  const homeData = home.status === "ready" ? home.value : null;

  return (
    <>
      <HomeLanding home={homeData} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeAbout />

        <section aria-labelledby="home-names" className="home-names pb-12 pt-6">
          {/* In the big words' own lettering (Archivo, extra-wide, capitals), centred; no rules above or below. */}
          <div className="mb-6 text-center">
            <h2 id="home-names" className="home-names-title">
              His names
            </h2>
            <p className="home-names-hint">
              Click a word to unfold its names, then a name to read its passages.{" "}
              <Link to="/study/names" className="whitespace-nowrap text-accent underline underline-offset-2">
                Every name
              </Link>
            </p>
          </div>
          <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-2xl bg-surface-2" />}>
            <NamesOfGod labelledBy="home-names" />
          </Suspense>
        </section>

        <section aria-label="Explore" className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map(({ to, title, text, icon: Icon }) => (
            <Link key={to} to={to} className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <Icon className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-3 flex items-center gap-1 font-serif text-xl font-semibold">
                {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
              </h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
