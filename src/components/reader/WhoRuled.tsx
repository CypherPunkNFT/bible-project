import { ArrowUpRight, BookOpen, CalendarDays, Crown, Hourglass, ScrollText, TextQuote, Users } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { glowFor } from "@/components/people-pages/kinds";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import type { Translation } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { chapterWho, isEmpty, loadWhoRuled, reignWords, reignYears, verseRuns, type ChapterWho, type Reason, type Span, type Statement, type WhoItem } from "@/lib/who-ruled";
import "./who-ruled.css";

const CARD_ID = "who-ruled-when";
const STRIP_RULERS = 4;
const STRIP_PROPHETS = 2;
const SHOWN_RUNS = 10;

interface Props {
  translation: Translation;
  bookCode: string;
  bookNum: number;
  bookName: string;
  chapter: number;
}

/** This chapter's rulers and prophets, or null while loading, outside the 66 books, or when the text ties none to it. */
function useChapterWho(bookCode: string, bookNum: number, chapter: number): ChapterWho | null {
  const inCanon = bookNum <= 66 && Number.isFinite(chapter);
  const book = useAsync(() => (inCanon ? loadWhoRuled(bookCode) : Promise.resolve(null)), `who-ruled:${bookCode}`);
  if (!inCanon || book.status !== "ready" || !book.value) return null;
  const who = chapterWho(book.value, chapter);
  return isEmpty(who) ? null : who;
}

/** Where a verse span opens: this chapter's own verse in place (?v=), else the passage shaded in this version or the KJV. */
function useRefHref(translation: Translation, bookCode: string, chapter: number) {
  const catalog = useCatalog();
  const { pathname } = useLocation();
  const [search] = useSearchParams();
  return ([start, end]: Span): string => {
    const a = splitId(start);
    const b = splitId(end);
    const code = bookByNum(catalog, a.num)?.code ?? "GEN";
    if (code === bookCode && a.chapter === chapter) {
      const next = new URLSearchParams(search);
      next.set("v", String(a.verse));
      next.delete("hl");
      return `${pathname}?${next}`;
    }
    const slug = translation.numbering === "english" && translation.books[code] ? translation.slug : "kjv";
    const last = b.num === a.num && b.chapter === a.chapter ? b.verse : 999;
    return `/read/${slug}/${code}/${a.chapter}?hl=${a.verse}-${last}`;
  };
}

const dotStyle = (item: WhoItem) => (item.ruler ? ({ "--dot": glowFor(item.ruler.kind, item.ruler.realm).replace("var(--pp-judge)", "var(--pp-judge, var(--epistles))") } as CSSProperties) : undefined);

/** One plain sentence for a chip's tooltip: why this person is here. */
function reasonSummary(item: WhoItem, catalog: ReturnType<typeof useCatalog>): string {
  return item.reasons
    .map((r) => {
      if (r.kind === "dated") return `Dated by ${formatRange(catalog, r.span[0], r.span[1])}`;
      if (r.kind === "title") return "Named in the psalm's title";
      if (r.kind === "named") return `Named in ${r.verses.length === 1 ? "verse" : "verses"} ${verseRuns(r.verses).map(([x, y]) => (x === y ? x : `${x}–${y}`)).join(", ")}`;
      if (r.kind === "during") return `Within Scripture's account of ${reignWords(item.ruler)}`;
      if (r.kind === "heading") return `In the book's heading (${formatRange(catalog, r.span[0], r.span[1])})`;
      return "The prophet the book is named for";
    })
    .join(" · ");
}

/** The line under the chapter heading: the era, then a chip for each ruler and prophet, each opening their page. */
export function WhoRuledStrip({ bookCode, bookNum, chapter }: Pick<Props, "bookCode" | "bookNum" | "chapter">) {
  const who = useChapterWho(bookCode, bookNum, chapter);
  if (!who || (!who.rulers.length && !who.prophets.length)) return null;
  return <StripChips who={who} />;
}

/**
 * The chips that fit: one line on wide screens, two on phones. Chips that do not fit are hidden (the card lists everyone)
 * in this order: later rulers, later prophets, the second ruler, the first prophet; the first ruler always shows.
 */
function StripChips({ who }: { who: ChapterWho }) {
  const catalog = useCatalog();
  const phone = useMediaQuery("(max-width: 640px)");
  const navRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(0);
  const rulers = who.rulers.slice(0, STRIP_RULERS);
  const prophets = who.prophets.slice(0, STRIP_PROPHETS);
  const key = [...rulers, ...prophets].map((i) => i.id).join(",");
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const fit = () => {
      const chips = [...nav.querySelectorAll<HTMLElement>("[data-chip]")];
      const more = nav.querySelector<HTMLElement>("[data-more]");
      if (!chips.length || !more) return;
      chips.forEach((chip) => (chip.hidden = false));
      const first = nav.firstElementChild as HTMLElement;
      const row = chips[0].offsetHeight + 8;
      const limit = first.offsetTop + (phone ? 1 : 0) * row + row / 2;
      const order = chips.slice().sort((a, b) => Number(b.dataset.chip) - Number(a.dataset.chip));
      let count = 0;
      for (const chip of order) {
        if (more.offsetTop <= limit || chip.dataset.chip === "0") break;
        chip.hidden = true;
        count++;
      }
      setHidden(count);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [key, phone]);
  // Hide priority, higher goes first: rulers after the second, prophets after the first, the second ruler, the first prophet.
  const rank = (kind: "ruler" | "prophet", i: number) => (kind === "ruler" ? (i === 0 ? 0 : i === 1 ? 2 : 10 + i) : i === 0 ? 1 : 5 + i);
  const more = who.rulers.length - rulers.length + who.prophets.length - prophets.length + hidden;
  return (
    <nav ref={navRef} aria-label="Who ruled when: this chapter's rulers and prophets" className="wr wr-strip font-sans" data-testid="who-ruled-strip">
      {who.era && (
        <span className="wr-era">
          <Hourglass className="h-3 w-3" aria-hidden /> {who.era}
        </span>
      )}
      {rulers.map((item, i) => {
        const years = reignYears(item.ruler);
        return (
          <Link key={item.id} data-chip={rank("ruler", i)} to={item.href} className="wr-chip" title={`${item.name}${item.ruler ? `, ${item.ruler.title}` : ""}. ${reasonSummary(item, catalog)}.${years ? ` Reign ${years} (${item.ruler!.dates!.label}).` : ""}`}>
            <span className="wr-dot" style={dotStyle(item)} aria-hidden />
            <b>{item.name}</b>
            {item.ruler && <span className="wr-title">{item.ruler.title}</span>}
            {years && <span className="wr-years">{years}</span>}
          </Link>
        );
      })}
      {prophets.map((item, i) => (
        <Link key={item.id} data-chip={rank("prophet", i)} to={item.href} className="wr-chip" title={`${item.name}, prophet. ${reasonSummary(item, catalog)}.`}>
          <ScrollText className="wr-prophet-mark" aria-hidden />
          <b>{item.name}</b>
          <span className="wr-title">Prophet</span>
        </Link>
      ))}
      <button type="button" data-more className="wr-more" onClick={() => document.getElementById(CARD_ID)?.scrollIntoView({ block: "start" })}>
        {more > 0 ? `+${more} more` : "Why these?"}
      </button>
    </nav>
  );
}

/** The card below the text: every ruler and prophet the chapter is tied to, each with the verses that tie them. */
export function WhoRuledCard({ translation, bookCode, bookNum, bookName, chapter }: Props) {
  const catalog = useCatalog();
  const who = useChapterWho(bookCode, bookNum, chapter);
  const refHref = useRefHref(translation, bookCode, chapter);
  if (!who) return null;
  const ref = (span: Span) => (
    <Link className="wr-ref" to={refHref(span)}>
      {formatRange(catalog, span[0], span[1])}
    </Link>
  );
  const verseHref = (verse: number) => refHref([bookNum * 1_000_000 + chapter * 1000 + verse, bookNum * 1_000_000 + chapter * 1000 + verse]);
  const opens = /^Song\b/.test(bookName) ? `The ${bookName} opens` : `The book of ${bookName} opens`;
  return (
    <section id={CARD_ID} aria-labelledby={`${CARD_ID}-title`} className="wr wr-card font-sans" data-testid="who-ruled-card">
      <h2 id={`${CARD_ID}-title`}>
        <Crown className="h-3.5 w-3.5" aria-hidden /> Who ruled when{who.era && <span className="font-normal normal-case tracking-normal"> · {who.era}</span>}
      </h2>
      {statementsOf(who).map((s, i) => (
        <p key={i} className="wr-heading">
          <CalendarDays className="me-1.5 inline h-3.5 w-3.5 align-[-2px] text-[var(--wr)]" aria-hidden />
          {s.title ? `Psalm ${chapter}'s title` : "Dated by Scripture"}: <q>{s.quote}</q>
          {s.span && !s.title && <> ({ref(s.span)})</>}
          {s.why && <span className="wr-note">{s.why}</span>}
          {s.note && <span className="wr-note">{s.note}</span>}
        </p>
      ))}
      {who.headings.map((h, i) => (
        <p key={i} className="wr-heading">
          <BookOpen className="me-1.5 inline h-3.5 w-3.5 align-[-2px] text-[var(--wr)]" aria-hidden />
          {opens}: <q>{h.quote}</q> ({ref(h.span)})
          {h.note && <span className="wr-note">{h.note}</span>}
        </p>
      ))}
      {who.none.map((n, i) => (
        <p key={i} className="wr-heading">
          <BookOpen className="me-1.5 inline h-3.5 w-3.5 align-[-2px] text-[var(--wr)]" aria-hidden />
          {n.note ?? "The book names no king."}
        </p>
      ))}
      {who.rulers.length > 0 && (
        <ul className="wr-list" aria-label="Rulers">
          {who.rulers.map((item) => (
            <Person key={item.id} item={item} ref_={ref} verseHref={verseHref} />
          ))}
        </ul>
      )}
      {who.prophets.length > 0 && (
        <>
          <h3>Prophets</h3>
          <ul className="wr-list" aria-label="Prophets">
            {who.prophets.map((item) => (
              <Person key={item.id} item={item} ref_={ref} verseHref={verseHref} prophet />
            ))}
          </ul>
        </>
      )}
      {who.related.map((r, i) => (
        <p key={i} className="wr-quiet">
          Elsewhere: <q>{r.quote}</q> ({ref(r.span)}){r.note && <> {r.note}</>}
        </p>
      ))}
      <div className="wr-foot">
        <span className="text-muted">Only what the text says: each name with the verses that tie it to this chapter.</span>
        <Link className="wr-open" to="/study/people?view=rulers">
          <Users className="h-3.5 w-3.5" aria-hidden /> Open in Rulers through time <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

/** Each dating statement once (Luke 3:1 dates five rulers): the ones that name rulers, then the ones that name none. */
function statementsOf(who: ChapterWho): Statement[] {
  const seen = new Map<string, Statement>();
  for (const item of who.rulers)
    for (const r of item.reasons) {
      if (r.kind === "dated" && !seen.has(r.quote)) seen.set(r.quote, { span: r.span, quote: r.quote, why: r.why, note: r.note });
      if (r.kind === "title" && !seen.has(r.quote)) seen.set(r.quote, { quote: r.quote, note: r.note, title: true });
    }
  for (const s of who.statements) if (!seen.has(s.quote)) seen.set(s.quote, s);
  return [...seen.values()];
}

function Person({ item, ref_, verseHref, prophet = false }: { item: WhoItem; ref_: (span: Span) => ReactNode; verseHref: (verse: number) => string; prophet?: boolean }) {
  const years = reignYears(item.ruler);
  const prophetsOfReign = !prophet && item.inTime && item.ruler?.prophets;
  return (
    <li className="wr-item">
      <div className="wr-item-head">
        <Link to={item.href} className="wr-name">
          {prophet ? <ScrollText className="wr-prophet-mark" aria-hidden /> : <span className="wr-dot" style={dotStyle(item)} aria-hidden />}
          {item.name}
        </Link>
        <span className="wr-title">{prophet ? "Prophet" : item.ruler?.title}</span>
        {years && (
          <span className="wr-years" title={item.ruler!.dates!.label}>
            {years} <small>· {item.ruler!.dates!.label}</small>
          </span>
        )}
      </div>
      <ul className="wr-reasons">
        {item.reasons.map((reason, i) => (
          <li key={i}>
            <ReasonLine reason={reason} item={item} ref_={ref_} verseHref={verseHref} />
          </li>
        ))}
        {prophetsOfReign ? (
          <li>
            <ScrollText aria-hidden />
            <span>
              <Link className="wr-ref" to={item.href}>
                {prophetsOfReign === 1 ? "The prophet" : `${prophetsOfReign} prophets`} of {reignWords(item.ruler)}
              </Link>{" "}
              on {item.ruler!.sex === "F" ? "her" : "his"} page
            </span>
          </li>
        ) : null}
      </ul>
    </li>
  );
}

function ReasonLine({ reason, item, ref_, verseHref }: { reason: Reason; item: WhoItem; ref_: (span: Span) => ReactNode; verseHref: (verse: number) => string }) {
  switch (reason.kind) {
    case "dated":
      return (
        <>
          <CalendarDays aria-hidden />
          <span>Dated by Scripture ({ref_(reason.span)}, above)</span>
        </>
      );
    case "title":
      return (
        <>
          <TextQuote aria-hidden />
          <span>Named in the psalm's title (above)</span>
        </>
      );
    case "named": {
      const runs = verseRuns(reason.verses);
      return (
        <>
          <TextQuote aria-hidden />
          <span>
            Named in {reason.verses.length === 1 ? "verse" : "verses"}{" "}
            {runs.slice(0, SHOWN_RUNS).map(([a, b], i) => (
              <span key={a}>
                {i > 0 && ", "}
                <Link className="wr-ref" to={verseHref(a)}>
                  {a === b ? a : `${a}–${b}`}
                </Link>
              </span>
            ))}
            {runs.length > SHOWN_RUNS && <span className="text-muted"> and {runs.length - SHOWN_RUNS} more</span>}
          </span>
        </>
      );
    }
    case "during":
      return (
        <>
          <Hourglass aria-hidden />
          <span>
            This chapter falls within Scripture's account of {reignWords(item.ruler)} ({ref_(reason.span)})
          </span>
        </>
      );
    case "heading":
      return (
        <>
          <BookOpen aria-hidden />
          <span>Named in the book's heading ({ref_(reason.span)})</span>
        </>
      );
    default:
      return (
        <>
          <BookOpen aria-hidden />
          <span>The prophet whose words this book records</span>
        </>
      );
  }
}
