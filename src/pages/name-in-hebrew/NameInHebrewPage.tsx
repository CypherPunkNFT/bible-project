// /name-in-hebrew: type a name, see it written in Hebrew, Greek and Aramaic (Syriac and square letters). Spelled by
// sound with rules (sounds.ts, transliterate.ts), never by AI; for a Bible name, also as Scripture writes it, with its
// meaning from the site's Biblical baby names (bible-spelling.ts). Everything runs in the browser: the name lives only
// in the address (?name=David, so a result can be shared) and is never stored or sent. README.md beside this file.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { NameDocument } from "@/data/baby-names";
import { useNamesIndex } from "@/pages/baby-names/useBabyNames";
import { bibleCards, findInBible, joinCards, soundCards, wantsSound, wordCards, type Cards, type Found } from "./bible-spelling";
import { cleanName, MAX_NAME } from "./input";
import { NameMeaning } from "./NameMeaning";
import { PrintButton } from "./PrintCard";
import { ScriptCard } from "./ScriptCard";
import { nameSounds } from "./sounds";
import { useNameFiles } from "./useNameFiles";
import { WORD_TEXT } from "./word-texts";
import "@/components/stations/stations.css";
import "./name-in-hebrew.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

export const NAME_IN_HEBREW_PATH = "/name-in-hebrew";
const EXAMPLES = ["David", "Sarah", "John", "Mary", "Jesus", "Peter", "Emma", "Olivia", "Michael", "Grace"];
const EMPTY: Cards = { hebrew: [], greek: [], aramaic: [] };

const tag = (cards: Cards, part: string | undefined): Cards => (part
  ? { hebrew: cards.hebrew.map((s) => ({ ...s, part })), greek: cards.greek.map((s) => ({ ...s, part })), aramaic: cards.aramaic.map((s) => ({ ...s, part })) }
  : cards);

/** The cards for what was found (Scripture's spellings first) and, unless it is a name of God, the spellings by sound. */
function buildCards(found: readonly Found[] | null, documents: ReadonlyMap<string, NameDocument>, sounds: ReturnType<typeof nameSounds>, words: readonly string[]): Cards {
  const several = (found?.length ?? 0) > 1;
  const bible = (found ?? []).map((entry) => {
    const part = several ? entry.typed : undefined;
    if (entry.type === "word") return tag(wordCards(entry.word), part);
    const document = entry.type === "name" ? documents.get(entry.row.s) : undefined;
    return document ? tag(bibleCards(document), part) : EMPTY;
  });
  return joinCards(...bible, !found || wantsSound(found, words) ? soundCards(sounds) : EMPTY);
}

function printMeaning(found: readonly Found[] | null): string {
  const first = found?.[0];
  if (first?.type === "name" && first.row.m !== "Meaning uncertain") return `“${first.row.m}”`;
  if (first?.type === "word") return WORD_TEXT[first.word.keys[0]] ?? "";
  return "";
}

export default function NameInHebrewPage() {
  const [params, setParams] = useSearchParams();
  const clean = useMemo(() => cleanName(params.get("name") ?? ""), [params]);
  const [draft, setDraft] = useState(clean.display);
  useEffect(() => setDraft(clean.display), [clean]);
  const sounds = useMemo(() => nameSounds(clean.words), [clean]);
  const { state: index, retry: retryIndex } = useNamesIndex();
  const found = useMemo(() => (index.status === "ready" && clean.display ? findInBible(index.value, clean.display) : null), [index, clean]);
  const { state: files, retry: retryFiles } = useNameFiles(found);
  const documents = useMemo(() => (files.status === "ready" ? files.value : new Map<string, NameDocument>()), [files]);
  const cards = useMemo(() => buildCards(found, documents, sounds, clean.words), [found, documents, sounds, clean]);

  const show = (event?: FormEvent, example?: string) => {
    event?.preventDefault();
    const next = cleanName(example ?? draft).display;
    setParams(next ? { name: next } : {}, { replace: true });
  };

  return (
    <div className="st-page nh-page mx-auto max-w-5xl px-4 sm:px-6">
      <header>
        <ToolsBackLink />
        <h1>Your name in Hebrew, Greek and Aramaic</h1>
        <p className="nh-lede">Type a name to see it written in Hebrew, in Greek, and in Aramaic, the language Jesus spoke, in Syriac and square letters. If it is a name from the Bible, you also see how Scripture writes it and what it means.</p>
      </header>

      <form className="nh-form" role="search" aria-label="Spell a name" onSubmit={show}>
        <label className="nh-field">
          <span>Your name</span>
          <input type="text" value={draft} maxLength={MAX_NAME * 2} autoComplete="given-name" spellCheck={false} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit" className="nh-go">Show</button>
        <div className="nh-examples" role="group" aria-label="Try one">
          {EXAMPLES.map((example) => <button key={example} type="button" className="nh-chip" translate="no" onClick={() => show(undefined, example)}>{example}</button>)}
        </div>
      </form>

      {clean.dropped && <p className="nh-warning">Only Latin letters (with their accents), spaces, hyphens and apostrophes are spelled, up to 40 letters; the rest was left out.</p>}

      {clean.display && <Result name={clean.display} found={found} cards={cards} indexFailed={index.status === "error"} onRetryIndex={retryIndex}
        filesFailed={files.status === "error"} onRetryFiles={retryFiles} documents={documents} />}

      <Notes />
    </div>
  );
}

function Result({ name, found, cards, indexFailed, onRetryIndex, filesFailed, onRetryFiles, documents }: {
  name: string; found: readonly Found[] | null; cards: Cards; indexFailed: boolean; onRetryIndex: () => void;
  filesFailed: boolean; onRetryFiles: () => void; documents: ReadonlyMap<string, NameDocument>;
}) {
  return (
    <section className="nh-result" aria-labelledby="nh-result-title">
      <h2 id="nh-result-title" className="nh-name"><bdi translate="no">{name}</bdi></h2>
      <div role="status" aria-live="polite">
        {indexFailed && <p className="nh-warning">We couldn't check the Bible's names just now, so only the spellings by sound are shown. <button type="button" className="nh-link" onClick={onRetryIndex}>Try again</button></p>}
        {filesFailed && <p className="nh-warning">The Bible's own spelling couldn't be loaded just now. <button type="button" className="nh-link" onClick={onRetryFiles}>Try again</button></p>}
      </div>
      {found && <NameMeaning found={found} documents={documents} />}
      <p className="nh-approximate" role="note">Spelled by sound, so it is approximate. Hebrew, Greek and Aramaic have sounds English lacks and lack some English has, and most names can fairly be written more than one way. A spelling by sound may happen to spell a real word; it does not carry that word's meaning. Before a tattoo or an engraving, ask someone who reads the language.</p>
      <div className="nh-cards">
        <ScriptCard title="Hebrew" script="hebrew" spellings={cards.hebrew} />
        <ScriptCard title="Greek" script="greek" spellings={cards.greek} />
        <ScriptCard title="Aramaic" script="aramaic" spellings={cards.aramaic} />
      </div>
      <PrintButton name={name} cards={cards} meaning={printMeaning(found)} />
    </section>
  );
}

function Notes() {
  return (
    <aside className="nh-notes">
      <h2>How it spells</h2>
      <ul>
        <li>By sound: the name is read the way English usually says it, then written with the letters each language uses for those sounds, by fixed rules, not by AI. Hebrew and Greek follow how they write foreign names today; Aramaic uses its 22 old letters.</li>
        <li>Hebrew and Aramaic read from right to left. Under each spelling its letters are listed one by one, first letter first.</li>
        <li>For a Bible name, “In the Bible” is how the Hebrew Old Testament or the Greek New Testament writes it, from Strong's Concordance. A New Testament name also shows the Hebrew name it comes from: James comes from Jacob, Mary from Miriam.</li>
        <li>Aramaic and Hebrew share one alphabet, so a Hebrew name keeps its letters in Aramaic. Where the Bible itself gives an Aramaic name (Cephas for Peter, Tabitha), that name is shown.</li>
        <li>Meanings come from the site's Biblical baby names, with how sure each one is. Names that aren't spelled the Bible's way get no meaning, rather than a made-up one.</li>
        <li>Everything happens in your browser. Nothing you type is stored or sent anywhere.</li>
      </ul>
      <p className="nh-credit">Hebrew and Greek spellings: Strong's Concordance (Open Scriptures edition). Scripture references are to the Berean Standard Bible (public domain). Syriac letters: Noto Sans Syriac (SIL Open Font License).</p>
    </aside>
  );
}
