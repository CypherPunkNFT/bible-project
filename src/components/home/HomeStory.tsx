import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, splitId } from "@/lib/refs";
import { SECTIONS, tone, toneOf } from "@/lib/sections";
import { studyRefLink, type HomeData } from "@/lib/study";

/**
 * The Bible's storyline in ten movements, each placed where it falls between Genesis and Revelation, with Luke 24:27
 * as the thesis: the whole of Scripture speaks of Christ.
 */
export function HomeStory({ home }: { home: HomeData | null }) {
  const catalog = useCatalog();
  const kjv = catalog.translations.find((t) => t.slug === "kjv");

  // Where each chapter sits along the canon (0–1), by chapters in the KJV's 66 books.
  const position = useMemo(() => {
    const canon = catalog.books.filter((b) => b.num <= 66);
    const starts = new Map<number, number>();
    let total = 0;
    for (const b of canon) {
      starts.set(b.num, total);
      total += kjv?.books[b.code]?.length ?? 1;
    }
    return (id: number) => {
      const { num, chapter } = splitId(id);
      return ((starts.get(num) ?? 0) + chapter - 0.5) / total;
    };
  }, [catalog, kjv]);

  const sectionShares = useMemo(() => {
    const canon = catalog.books.filter((b) => b.num <= 66);
    return SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => ({
      id: s.id,
      chapters: canon.filter((b) => b.section === s.id).reduce((sum, b) => sum + (kjv?.books[b.code]?.length ?? 1), 0),
    }));
  }, [catalog, kjv]);

  // Each marker takes the lowest tier where it is at least 3.5% of the bar away from the last marker on that tier.
  const tiers = useMemo(() => {
    if (!home) return [0];
    const lastOnTier: number[] = [];
    return home.movements.map((m) => {
      const x = position(m.span[0]);
      let tier = 0;
      while (lastOnTier[tier] !== undefined && x - lastOnTier[tier] < 0.035) tier++;
      lastOnTier[tier] = x;
      return tier;
    });
  }, [home, position]);

  return (
    <section id="one-story" aria-labelledby="one-story-title" className="scroll-mt-20 py-16 sm:py-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">One story</p>
          <h2 id="one-story-title" className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Sixty-six books. One story. One Lord.
          </h2>
        </div>
        <figure className="border-s-2 border-accent ps-5">
          <blockquote className="min-h-[5.5rem] font-serif text-xl italic leading-relaxed sm:text-2xl">{home ? `“${home.thesis.text}”` : null}</blockquote>
          <figcaption className="mt-2 text-sm text-muted">
            {home && (
              <Link to={studyRefLink(catalog, home.thesis.span)} className="underline decoration-line underline-offset-2 hover:text-accent">
                {home.thesis.ref}
              </Link>
            )}{" "}
            — the risen Christ, on the road to Emmaus
          </figcaption>
        </figure>
      </div>

      {home && (
        <>
          {/* The canon as one bar, coloured by the reading chart's sections, each movement pinned above where it falls.
              Markers that would overlap (three in Genesis; the Gospels and Acts) step up a tier. */}
          <div className="mt-14 hidden md:block" aria-hidden>
            <div className="relative" style={{ height: `${(Math.max(...tiers) + 1) * 34 + 12}px` }}>
              {home.movements.map((m, i) => (
                <a
                  key={m.key}
                  href={`#movement-${m.key}`}
                  tabIndex={-1}
                  className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${Math.min(99, Math.max(1, position(m.span[0]) * 100))}%`, zIndex: 10 - tiers[i] }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-bold text-page shadow transition hover:scale-110">{i + 1}</span>
                  <span className="w-px bg-line" style={{ height: `${tiers[i] * 34 + 6}px` }} />
                </a>
              ))}
            </div>
            <div className="flex h-2 overflow-hidden rounded-full">
              {sectionShares.map((s) => (
                <span key={s.id} style={{ flexGrow: s.chapters, background: tone(s.id).tab }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Genesis</span>
              <span>Revelation</span>
            </div>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {home.movements.map((m, i) => {
              const book = bookByNum(catalog, splitId(m.span[0]).num);
              const colors = tone(book ? toneOf(book.code, book.section) : "history");
              return (
                <li key={m.key} id={`movement-${m.key}`} className="group relative flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                  <span className="h-1.5" style={{ background: colors.tab }} aria-hidden />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-sans text-xs font-semibold tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-1 font-serif text-xl font-semibold leading-snug">{m.title}</h3>
                    <p className="mt-1 text-sm text-muted">{m.line}</p>
                    <blockquote className="mt-4 flex-1 font-serif text-[0.95rem] italic leading-relaxed text-ink/85">“{m.text}”</blockquote>
                    <Link
                      to={studyRefLink(catalog, m.span)}
                      aria-label={`${m.title} — read ${m.ref}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:text-accent"
                    >
                      {m.ref} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {!home && <div className="mt-10 h-96 animate-pulse rounded-2xl bg-surface-2" />}
    </section>
  );
}
