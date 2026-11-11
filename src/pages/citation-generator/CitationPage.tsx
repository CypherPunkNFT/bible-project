// /citation-generator: any Bible reference written correctly in MLA, APA, Chicago, Turabian and SBL, for any version
// the site serves, each line with a Copy button. Worked out in the browser from the site's catalogue, no AI and no
// server: the reference, version and style live in the address (?ref=, &v=, &style=) so a citation can be shared, and
// the printed-Bible details are never stored or sent. Parsing: parse.ts; the styles: styles.ts. README.md beside this file.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { groupVersions } from "@/lib/languages";
import { CopyCitation } from "./CopyCitation";
import { buildNameIndex, MAX_REFERENCE, parseReference, type Reference } from "./parse";
import { citeIn, htmlText, plainText, STYLES, type PrintedBible, type StyleId } from "./styles";
import "@/components/stations/stations.css";
import "./citation-generator.css";

export const CITATION_PATH = "/citation-generator";
const DEFAULT_REFERENCE = "John 3:16";
const DEFAULT_VERSION = "bsb";
const EXAMPLES = ["John 3:16", "Romans 8:28-39", "Psalm 23", "1 Cor 13:4-7, 13", "Genesis 1:1-2:3", "Jude 24-25", "Ps 23; 91:1-4"];

const isStyle = (value: string | null): value is StyleId => STYLES.some((style) => style.id === value);

/** The reader's address for the reference's first passage, in the version it is cited from. */
function readerHref(slug: string, code: string, reference: Reference): string {
  const first = reference.passages[0];
  const chapter = reference.singleChapter ? 1 : first.chapter;
  const verses = first.verse === null ? "" : first.endChapter === first.chapter && first.endVerse !== first.verse ? `?hl=${first.verse}-${first.endVerse}` : `?hl=${first.verse}`;
  return `/read/${slug}/${code}/${chapter}${verses}`;
}

export default function CitationPage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const [printed, setPrinted] = useState<PrintedBible>({ publisher: "", place: "", year: "" });
  const index = useMemo(() => buildNameIndex(catalog.books), [catalog]);
  const groups = useMemo(() => groupVersions(catalog.translations), [catalog]);

  const typed = (params.get("ref") ?? DEFAULT_REFERENCE).slice(0, MAX_REFERENCE);
  const version = catalog.translations.find((t) => t.slug === params.get("v")) ?? catalog.translations.find((t) => t.slug === DEFAULT_VERSION) ?? catalog.translations[0];
  const styleParam = params.get("style");
  const style: StyleId = isStyle(styleParam) ? styleParam : "mla";
  const update = (changes: Record<string, string>) => setParams({ ref: typed, v: version.slug, style, ...changes }, { replace: true });

  const parsed = useMemo(() => parseReference(typed, version, catalog.books, catalog.equivalent, index), [typed, version, catalog, index]);
  const today = useMemo(() => new Date(), []);
  const entries = parsed.ok ? citeIn(style, parsed.reference, version, printed, today) : [];
  const styleInfo = STYLES.find((s) => s.id === style)!;
  const heldCode = parsed.ok ? (version.books[parsed.reference.code] ? parsed.reference.code : catalog.equivalent[parsed.reference.code]) : "";
  const allPlain = entries.map((entry) => `${entry.label}: ${plainText(entry.runs)}`).join("\n");
  const allHtml = entries.map((entry) => `<p>${entry.label}: ${htmlText(entry.runs)}</p>`).join("");

  return (
    <div className="st-page cg-page mx-auto max-w-5xl px-4 sm:px-6">
      <header>
        <Link to="/tools" className="st-kick">Tools</Link>
        <h1>Bible citation generator</h1>
        <p className="cg-lede">Type a Bible reference, pick the version you read and the style your school or publisher asks for, and copy the citation, written the way MLA, APA, Chicago, Turabian or SBL wants it.</p>
      </header>

      <form className="cg-form" aria-label="Your reference" onSubmit={(event) => event.preventDefault()}>
        <label className="cg-field cg-reference">
          <span>Reference</span>
          <input type="text" value={typed} maxLength={MAX_REFERENCE} autoComplete="off" spellCheck={false} placeholder="John 3:16" translate="no" onChange={(event) => update({ ref: event.target.value })} />
        </label>
        <label className="cg-field">
          <span>Version</span>
          <select value={version.slug} onChange={(event) => update({ v: event.target.value })}>
            {groups.flatMap(({ group, sections }) => sections.map((section) => (
              <optgroup key={`${group.id}-${section.lang ?? "all"}`} label={section.label ?? group.title}>
                {section.versions.map((t) => <option key={t.slug} value={t.slug}>{t.name}{section.label ? "" : ` (${t.abbr})`}</option>)}
              </optgroup>
            )))}
          </select>
        </label>
        <div className="cg-examples" role="group" aria-label="Try one">
          {EXAMPLES.map((example) => <button key={example} type="button" className="cg-chip" translate="no" aria-pressed={example === typed} onClick={() => update({ ref: example })}>{example}</button>)}
        </div>
        <fieldset className="cg-styles">
          <legend>Style</legend>
          {STYLES.map((s) => (
            <label key={s.id} className="cg-style">
              <input type="radio" name="cg-style" value={s.id} checked={s.id === style} onChange={() => update({ style: s.id })} />
              <span translate="no">{s.name}</span>
            </label>
          ))}
        </fieldset>
        <details className="cg-printed">
          <summary>Read it in a printed Bible? Add its details</summary>
          <p>Leave these empty to cite the version as read on Bible Guide. They stay on this page and are not saved.</p>
          <div className="cg-printed-fields">
            <label className="cg-field"><span>Publisher</span><input type="text" value={printed.publisher} maxLength={80} placeholder="Crossway" onChange={(event) => setPrinted({ ...printed, publisher: event.target.value })} /></label>
            <label className="cg-field"><span>City (Chicago and Turabian only)</span><input type="text" value={printed.place} maxLength={60} placeholder="Wheaton, IL" onChange={(event) => setPrinted({ ...printed, place: event.target.value })} /></label>
            <label className="cg-field"><span>Year printed</span><input type="text" inputMode="numeric" value={printed.year} maxLength={4} placeholder="2016" onChange={(event) => setPrinted({ ...printed, year: event.target.value.replace(/\D/g, "") })} /></label>
          </div>
        </details>
      </form>

      <section className="cg-result" aria-labelledby="cg-result-title" aria-live="polite">
        <p className="cg-label">{styleInfo.edition}</p>
        <h2 id="cg-result-title"><span translate="no">{styleInfo.name}</span> citation for <span translate="no">{typed.trim() || "your reference"}</span></h2>
        {!parsed.ok && <p className="cg-error" role="alert">{parsed.error}</p>}
        {parsed.ok && <>
          {version.numbering !== "english" && <p className="cg-warning">{`The ${version.name} numbers some chapters and verses differently from most English Bibles (many of the Psalms, for example). Check the reference in the version itself before you cite it.`}</p>}
          <dl className="cg-entries">
            {entries.map((entry) => (
              <div key={entry.key} className="cg-entry">
                <dt>{entry.label}</dt>
                <dd>
                  <p className="cg-citation" translate="no">{entry.runs.map((run, i) => (typeof run === "string" ? run : <i key={i}>{run.italic}</i>))}</p>
                  <CopyCitation plain={plainText(entry.runs)} html={htmlText(entry.runs)} label="Copy" name={entry.label} />
                  {entry.hint && <p className="cg-hint">{entry.hint}</p>}
                </dd>
              </div>
            ))}
          </dl>
          <div className="cg-actions">
            <CopyCitation plain={allPlain} html={allHtml} label="Copy all" name={`every ${styleInfo.name} line`} />
            <Link to={readerHref(version.slug, heldCode, parsed.reference)} className="cg-read">{`Read it in the ${version.name}`}</Link>
          </div>
        </>}
      </section>

      <aside className="cg-notes">
        <h2>Using these citations</h2>
        <ul>
          <li>Book abbreviations belong only inside citations. In your own sentences write the book's name in full (“In John 3:16, Jesus says…”), and never start a sentence with an abbreviation.</li>
          <li>The book names stay in English for every version, because these are English-language styles. The version keeps its own title.</li>
          <li>The year is the version's year as listed on the site's <Link to="/versions">Versions page</Link>. APA dates a version from before 1950 “n.d.” on the site and gives its first year as the original publication.</li>
          <li>Copying keeps the italics when you paste into Word, Google Docs or Pages. Somewhere that takes plain text, put the version's title in italics yourself.</li>
          <li>Verses are not checked one by one: make sure the chapter really has the verses you cite.</li>
          <li>Schools and journals sometimes change these styles a little. When your teacher or publisher says otherwise, follow them.</li>
          <li>Worked out in your own browser. Nothing you type is stored or sent anywhere; the reference sits in the address so you can bookmark or share it.</li>
        </ul>
      </aside>
    </div>
  );
}
