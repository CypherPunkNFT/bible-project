// One of the three cards (Hebrew, Greek, Aramaic): each spelling with where it comes from, the letters one by one with
// their names, and a Copy button. Spellings, letter names and names are never translated (translate="no"): they are
// what the visitor came to copy. The Aramaic card shows Syriac first and the same spelling in square letters under it.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { CHOSEN_BIBLE } from "@/lib/last-read";
import { bookByCode, formatRange } from "@/lib/refs";
import type { Spelling } from "./bible-spelling";
import { greekLetters, hebrewLetters, syriacLetters, type Letter } from "./transliterate";

export type Script = "hebrew" | "greek" | "aramaic";

function kindLabel(spelling: Spelling, script: Script): string {
  switch (spelling.kind) {
    case "bible": return "In the Bible";
    case "also": return "In the Bible, for another person of this name";
    case "behind": return `The Hebrew name behind it: ${spelling.name ?? ""}`;
    case "aramaic-name": return `The Aramaic name in the Bible: ${spelling.name ?? ""}`;
    case "letters": return "The Hebrew letters, in Aramaic script";
    case "word": return "The Bible word";
    case "sound":
      if (script === "hebrew") return "By sound, as Hebrew writes names today";
      if (script === "greek") return "By sound, as Greek writes names today";
      return "By sound, in Aramaic letters";
  }
}

/** "JHN 1:42" -> the reader at that verse, labelled as the site writes references. */
function VerseLink({ reference }: { reference: string }) {
  const catalog = useCatalog();
  const match = /^(\w{3}) (\d+):(\d+)$/.exec(reference);
  const book = match ? bookByCode(catalog, match[1]) : undefined;
  if (!match || !book) return null;
  const id = book.num * 1_000_000 + Number(match[2]) * 1000 + Number(match[3]);
  return <Link className="nh-ref" to={`/read/bsb/${match[1]}/${match[2]}?hl=${match[3]}`} state={CHOSEN_BIBLE}>{formatRange(catalog, id, id)}</Link>;
}

function Letters({ letters }: { letters: readonly Letter[] }) {
  if (letters.length < 2) return null;
  return (
    <ol className="nh-letters" aria-label="Letter by letter, first letter first" translate="no">
      {letters.map((letter, index) => <li key={`${index}-${letter.glyph}`}><bdi className="nh-letter">{letter.glyph}</bdi> {letter.name}</li>)}
    </ol>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return null;
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => setCopied(true), (error: unknown) => console.warn("name-in-hebrew: copying failed", error));
  };
  return <button type="button" className="nh-copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button>;
}

const LANG: Record<Script, string> = { hebrew: "he", greek: "el", aramaic: "syc" };

function SpellingRow({ spelling, script }: { spelling: Spelling; script: Script }) {
  const main = script === "aramaic" ? spelling.syriac ?? spelling.text : spelling.text;
  const lang = script === "greek" && spelling.kind !== "sound" ? "grc" : LANG[script];
  const letters = script === "hebrew" ? hebrewLetters(main) : script === "greek" ? greekLetters(main) : syriacLetters(main);
  return (
    <li className={`nh-spelling nh-${spelling.kind}`}>
      <p className="nh-kind">{kindLabel(spelling, script)}{spelling.part && <span translate="no"> ({spelling.part})</span>}</p>
      <div className="nh-word-row">
        <bdi className={`nh-word nh-word-${script}`} lang={lang} dir={script === "greek" ? "ltr" : "rtl"} translate="no">{main}</bdi>
        <CopyButton text={main} />
      </div>
      {script === "aramaic" && spelling.text && <p className="nh-square"><span>Square letters:</span> <bdi lang="arc" dir="rtl" translate="no">{spelling.text}</bdi></p>}
      <Letters letters={letters} />
      {(spelling.strongs || spelling.ref) && <p className="nh-source">
        {spelling.strongs && <span translate="no">{`Strong's ${spelling.strongs}`}</span>}
        {spelling.ref && <VerseLink reference={spelling.ref} />}
      </p>}
    </li>
  );
}

export function ScriptCard({ title, script, spellings }: { title: string; script: Script; spellings: readonly Spelling[] }) {
  return (
    <section className={`nh-card nh-card-${script}`} aria-label={title}>
      <h3>{title}</h3>
      {spellings.length
        ? <ul>{spellings.map((spelling, index) => <SpellingRow key={`${spelling.kind}-${index}`} spelling={spelling} script={script} />)}</ul>
        : <p className="nh-empty">Nothing to spell in these letters.</p>}
    </section>
  );
}
