import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { lastReadPath } from "@/lib/last-read";
import { bookByCode } from "@/lib/refs";
import { SECTIONS, tone } from "@/lib/sections";
import type { HomeData } from "@/lib/study";
import "./home.css";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
});

/** "Romans 8" from "/read/kjv/ROM/8" — for the Continue button. */
function continueLabel(path: string | null, catalog: ReturnType<typeof useCatalog>): string | null {
  const [, , , code, chapter] = path?.split("/") ?? [];
  const book = code ? bookByCode(catalog, code) : undefined;
  return book && chapter ? `${book.name} ${chapter}` : null;
}

/**
 * The opening screen: "In the beginning was the Word" (John 1:1) over the first words of the Hebrew and Greek
 * Bibles, a slow light behind it (John 1:5), and the reading chart's seven colours as the horizon from Genesis to
 * Revelation.
 */
export function HomeLanding({ home }: { home: HomeData | null }) {
  const catalog = useCatalog();
  const last = lastReadPath();
  const lastLabel = continueLabel(last, catalog);

  return (
    <section aria-labelledby="home-title" className="home-landing relative isolate flex flex-col">
      <div className="home-glow -z-10" aria-hidden />
      <span className="home-watermark home-watermark--hebrew -z-10" aria-hidden lang="he" dir="rtl">
        בְּרֵאשִׁית
      </span>
      <span className="home-watermark home-watermark--greek -z-10" aria-hidden lang="grc">
        Ἐν ἀρχῇ
      </span>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <motion.p {...rise(0)} className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Genesis 1:1 · John 1:1
        </motion.p>
        <h1 id="home-title" className="mt-4 max-w-5xl font-serif text-[2.75rem] font-semibold leading-[1.02] tracking-tight xs:text-6xl sm:text-7xl lg:text-8xl">
          <motion.span {...rise(0.1)} className="block">
            In the beginning
          </motion.span>
          <motion.span {...rise(0.25)} className="block">
            was <span className="italic text-accent">the Word.</span>
          </motion.span>
        </h1>
        <motion.p {...rise(0.45)} className="mt-6 min-h-[3.5rem] max-w-2xl font-serif text-lg italic leading-relaxed text-ink/80 sm:text-xl">
          {home ? (
            <>
              “…{home.hero.word.text.replace(/^In the beginning was the Word,\s*/, "")}”{" "}
              <span className="whitespace-nowrap font-sans text-sm not-italic text-muted">— {home.hero.word.ref}</span>
            </>
          ) : null}
        </motion.p>
        <motion.p {...rise(0.6)} className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
          One story from Genesis to Revelation. Read it in {catalog.translations.length} free versions — from Wycliffe and the King James to the Hebrew and Greek —
          and see how its sixty-six books point to one Lord.
        </motion.p>
        <motion.div {...rise(0.75)} className="mt-8 flex flex-wrap gap-3">
          {last && lastLabel ? (
            <Link to={last} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-page transition hover:opacity-90">
              <BookOpen className="h-4 w-4" aria-hidden /> Continue: {lastLabel}
            </Link>
          ) : (
            <Link to="/read/kjv/JHN/1" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-page transition hover:opacity-90">
              <BookOpen className="h-4 w-4" aria-hidden /> Begin with John 1
            </Link>
          )}
          <Link to="/study" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-6 py-3 font-semibold backdrop-blur transition hover:bg-surface">
            Explore the study <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>

      <motion.div {...rise(0.9)} className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6">
        <div className="home-horizon" aria-hidden>
          {SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => (
            <span key={s.id} className="flex-1" style={{ background: tone(s.id).tab }} />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center text-xs text-muted sm:justify-between">
          <span className="hidden sm:inline">In the beginning God created</span>
          <a href="#one-story" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-accent">
            One story <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </a>
          <span className="hidden sm:inline">Behold, I make all things new</span>
        </div>
      </motion.div>
    </section>
  );
}
