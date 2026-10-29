import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { GROUP_COLOR, groupOf, languageName, VERSION_GROUPS } from "@/lib/languages";
import type { BookInfo, Translation } from "@/lib/types";

/** Each language's own name for itself, shown above its English name. */
const NATIVE: Record<string, string> = {
  en: "English", enm: "Englisch", he: "עברית", grc: "Ἑλληνική", la: "Latina", es: "Español", ar: "العربية",
  "zh-Hans": "中文", fr: "Français", de: "Deutsch", hi: "हिन्दी", pt: "Português", ru: "Русский", ja: "日本語",
  vi: "Tiếng Việt", fa: "فارسی", it: "Italiano",
};

/** How the first figure names each group: "17 English · 7 original & ancient · 13 translations". */
const GROUP_WORDS = { english: "English", original: "original & ancient", translations: "translations" };

/** Where an edition opens: its first book at its first chapter. */
const readerPath = (t: Translation) => {
  const book = Object.keys(t.books)[0];
  return `/read/${t.slug}/${book}/${t.books[book][0]}`;
};

/** The languages of the library, each with its editions to open, beside a column of figures about the whole. */
export function LanguageShelf({ editions, books }: { editions: Translation[]; books: BookInfo[] }) {
  const languages = useMemo(() => VERSION_GROUPS.flatMap((group) => {
    const members = editions.filter((t) => groupOf(t.lang).id === group.id);
    const codes = [...group.langs, ...new Set(members.map((t) => t.lang).filter((code) => !group.langs.includes(code)))];
    return codes.map((code) => ({ code, group, versions: members.filter((t) => t.lang === code).sort((a, b) => a.year - b.year) }))
      .filter((language) => language.versions.length);
  }), [editions]);

  const figures = useMemo(() => {
    if (!editions.length) return [];
    const byYear = [...editions].sort((a, b) => a.year - b.year);
    const oldest = byYear[0];
    const newest = byYear[byYear.length - 1];
    const rtl = editions.filter((t) => t.dir === "rtl");
    const apocrypha = new Set(books.filter((b) => b.section === "apocrypha").map((b) => b.code));
    const withApocrypha = editions.filter((t) => Object.keys(t.books).some((code) => apocrypha.has(code)));
    const fullest = Math.max(...editions.map((t) => Object.keys(t.books).length));
    return [
      [String(editions.length), "editions to read", VERSION_GROUPS.map((g) => `${editions.filter((t) => groupOf(t.lang).id === g.id).length} ${GROUP_WORDS[g.id]}`).join(" · ")],
      [String(languages.length), "languages", "from the Hebrew and Greek first written to the languages of today's readers"],
      [String(oldest.year), "the oldest edition", oldest.name],
      [String(newest.year), "the newest", newest.name],
      [String(rtl.length), "read right to left", [...new Set(rtl.map((t) => languageName(t.lang)))].join(", ")],
      [String(withApocrypha.length), "include the Apocrypha", `up to ${fullest} books in one edition`],
    ] as const;
  }, [editions, books, languages.length]);

  return <div className="ed-shelf">
    <dl className="ed-facts">{figures.map(([value, label, detail]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><dd className="ed-fact-detail">{detail}</dd></div>)}</dl>
    <ul className="ed-languages">
      {languages.map(({ code, group, versions }) => <li key={code} style={{ "--group": GROUP_COLOR[group.id] } as CSSProperties}>
        <div className="ed-language-name">
          <strong lang={code} dir="auto">{NATIVE[code] ?? languageName(code)}</strong>
          <span>{NATIVE[code] && NATIVE[code] !== languageName(code) ? `${languageName(code)} · ` : ""}{versions.length} {versions.length === 1 ? "edition" : "editions"}</span>
        </div>
        <div className="ed-language-editions">{versions.map((t) => <Link key={t.slug} to={readerPath(t)} title={`${t.name} (${t.year}). Read this edition.`}><b>{t.abbr}</b><span>{t.year}</span></Link>)}</div>
      </li>)}
    </ul>
  </div>;
}
