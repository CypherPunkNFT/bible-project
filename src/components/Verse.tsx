// Every Bible verse the site shows goes through this component: a verse id or range in, the current Bible's wording out
// (src/lib/verses.ts). The wording is marked translate="no" so the page translator leaves it alone. A verse the Bible
// does not number shows its reference and a short note, never a guess and never silently another language.
import { Fragment, type ReactNode } from "react";
import { useCatalog } from "@/lib/catalog";
import { bibleName, useCurrentBible, useVerses, verseIdOf, verseReference, type ResolvedPassage, type ResolvedVerse, type VerseSpec } from "@/lib/verses";

/** Words a page puts around a quotation are the page's; a verse can open or close on its own quotation mark. */
const withoutOuterQuotes = (text: string) => text.replace(/^[“"‘'「『]+/, "").replace(/[”"’'」』]+$/, "");

export function VerseMissing({ id, reason }: { id: number; reason?: string }) {
  const catalog = useCatalog();
  return <span className="verse-missing text-[0.85em] not-italic text-muted"><span>{verseReference(catalog, id)}</span>{" "}<span>{reason ?? "not in this Bible"}</span></span>;
}

const missingReason = (passage: ResolvedPassage) => (passage.bible.numbering === "english" ? "not in this Bible" : "numbered differently in this Bible");

type VerseProps = VerseSpec & {
  /** Only where a page is about one version's own wording. Everywhere else the current Bible is the point. */
  bible?: string;
  /** Print each verse's number before it (`chapter` adds the chapter). */
  numbered?: boolean | "chapter";
  /** At most this many verses, then "…". */
  max?: number;
  unquoted?: boolean;
  className?: string;
  /** Show the words some other way (a cut, a marked word). Called once per verse the Bible has. */
  render?: (text: string, verse: ResolvedVerse) => ReactNode;
};

function verseProps(props: VerseProps): VerseSpec {
  if ("id" in props) return { id: props.id };
  if ("ids" in props) return { ids: props.ids };
  return { from: props.from, to: props.to };
}

export function Verse(props: VerseProps) {
  const { bible, numbered, max, unquoted, className, render } = props;
  const state = useVerses(verseProps(props), { bible, max });
  if (state.status === "loading") return <span className={className} aria-busy="true" />;
  if (state.status === "error") {
    const id = "id" in props ? props.id : "ids" in props ? props.ids[0] : props.from;
    return <VerseMissing id={id} reason="could not be loaded" />;
  }
  const passage = state.value;
  const label = (verse: ResolvedVerse) => (numbered === "chapter" ? `${verse.chapter}:${verse.verse}` : String(verse.verse));
  return (
    <span className={className} lang={passage.bible.lang} dir={passage.bible.dir} translate="no">
      {passage.verses.map((verse, index) => (
        <Fragment key={verse.id}>
          {index > 0 && " "}
          {verse.text === null ? <span translate="yes"><VerseMissing id={verse.id} reason={missingReason(passage)} /></span> : <>
            {numbered ? <sup>{label(verse)}</sup> : null}
            {render ? render(unquoted ? withoutOuterQuotes(verse.text) : verse.text, verse) : unquoted ? withoutOuterQuotes(verse.text) : verse.text}
          </>}
        </Fragment>
      ))}
      {passage.truncated && " …"}
    </span>
  );
}

/** A verse a study file names by book, chapter and verse. */
export function VerseAt({ verse, render }: { verse: { code: string; chapter: number; verse: number }; render?: VerseProps["render"] }) {
  const catalog = useCatalog();
  return <Verse id={verseIdOf(catalog, verse.code, verse.chapter, verse.verse)} render={render} />;
}

/** The short name of the Bible the page is quoting, for captions. */
export function BibleAbbr() {
  const bible = useCurrentBible();
  return <span translate="no">{bible.abbr}</span>;
}

/** The name of the Bible the page is quoting, for captions. */
export function BibleName() {
  const bible = useCurrentBible();
  return <span translate="no">{bibleName(bible)}</span>;
}
