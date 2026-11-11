// One card of a round (design §10.2–§10.3): the reference, the shown opening, then a gap for every hidden word, as wide
// as the word. The gaps are the game: in Hard and First letters each word lands in its own gap as it is given, in Whole
// words the gaps dim as the typed answer reaches them, and the result fills every gap with its marked word. The card
// waits only for its own book; Pick waits for the decoys' books too, so the right option is never briefly shown alone.
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { plural } from "@/lib/site-format";
import type { Catalog } from "@/lib/types";
import { verseReference } from "@/lib/verses";
import { bookByNum, splitId } from "@/lib/refs";
import type { BoxChange } from "./boxes";
import { wordChoices, type WordChoice } from "./choices";
import { bookWords, loadVocabulary, passageText } from "./load";
import type { Mark, Result } from "./match";
import { hashString, seeded, shuffle, starsFor, type Level, type Passage, type Settings } from "./model";
import { PickEnding } from "./PickEnding";
import { PickWords } from "./PickWords";
import { endingOf } from "./pool-rules";
import { CardResult, type Outcome } from "./Result";
import { TypeLetters } from "./TypeLetters";
import { TypeWords } from "./TypeWords";
import { words, type Word } from "./words";

export interface CardProps {
  catalog: Catalog;
  pool: ReadonlyMap<string, Passage>;
  passage: Passage;
  settings: Settings;
  level: Level;
  seed: number;
  inMyVerses: boolean;
  /** Saves the answer; returns the box change, or false when the round could not take it. */
  onAnswer: (accuracy: number, stars: 0 | 1 | 2 | 3) => BoxChange | null | false;
  onSkip: () => void;
  onToggleAdd: () => void;
  onNext: () => void;
  saving: boolean;
}

interface Ready {
  text: string;
  list: Word[];
  vocabulary?: ReadonlySet<string>;
  endings?: { options: string[]; right: number };
  choices?: (WordChoice | null)[];
}

async function prepare(props: CardProps): Promise<Ready> {
  const { catalog, pool, passage, settings, level, seed } = props;
  const text = await passageText(catalog, passage);
  const list = words(text);
  const ready: Ready = { text, list };
  if (settings.answer === "type") {
    if (settings.style === "words") ready.vocabulary = await loadVocabulary();
    return ready;
  }
  if (level !== "hard") {
    const decoys = passage.decoys[level].map((id) => pool.get(id)!);
    const texts = await Promise.all(decoys.map((decoy) => passageText(catalog, decoy)));
    const options = [endingOf(text, passage.split[level]).text, ...texts.map((decoyText, i) => endingOf(decoyText, decoys[i].split[level]).text)];
    const order = shuffle([0, 1, 2], seeded(seed ^ hashString(passage.id)));
    ready.endings = { options: order.map((i) => options[i]), right: order.indexOf(0) };
    return ready;
  }
  const decoyIds = [...new Set([...passage.decoys.easy, ...passage.decoys.medium])];
  const decoyWords = (await Promise.all(decoyIds.map((id) => passageText(catalog, pool.get(id)!)))).flatMap((decoyText) => words(decoyText));
  const hidden = list.slice(passage.split.hard);
  let book: Word[] = [];
  const choices: (WordChoice | null)[] = [];
  for (let i = 0; i < hidden.length; i++) {
    let choice = wordChoices(hidden, i, { decoys: decoyWords, book }, seed, passage.id);
    if (!choice && book.length === 0) {
      book = await bookWords(catalog, passage);
      choice = wordChoices(hidden, i, { decoys: decoyWords, book }, seed, passage.id);
    }
    choices.push(choice);
  }
  ready.choices = choices;
  return ready;
}

/** A gap as wide as its word, so the verse keeps its shape; `--vc-len` is the word's letter count. */
export function Gap({ word, state = "" }: { word: Pick<Word, "key">; state?: string }) {
  return <span className={`vc-gap${state ? ` ${state}` : ""}`} aria-hidden="true" style={{ "--vc-len": Math.max(2, word.key.length) } as CSSProperties} />;
}

/** The verse while it is being played: the opening, then for each hidden word the word already given (right or
 * missed), the active gap, a gap the typed answer has reached, or a plain gap. */
function PlayVerse({ opening, hidden, given, reach, active }: { opening: string; hidden: readonly Word[]; given: readonly Mark[]; reach: number; active: boolean }) {
  return <p className="vc-verse">
    {opening}
    {hidden.map((word, i) => {
      const mark = given[i];
      if (mark) {
        return <span key={i} className={`vc-fill${mark.verdict === "exact" ? "" : " is-missed"}`}>
          {word.text}{mark.verdict !== "exact" && <span className="sr-only"> (missed)</span>}
        </span>;
      }
      const state = active && i === given.length ? "is-next" : i < reach ? "is-reached" : "";
      return <Gap key={i} word={word} state={state} />;
    })}
  </p>;
}

export function Card(props: CardProps) {
  const { catalog, passage, settings, level } = props;
  const [ready, setReady] = useState<Ready | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [given, setGiven] = useState<Mark[]>([]);
  const [reach, setReach] = useState(0);
  const reference = verseReference(catalog, passage.from, passage.to);

  useEffect(() => { // the site's floating correction button steps aside on a small phone while a card is open
    document.body.classList.add("vc-playing");
    return () => document.body.classList.remove("vc-playing");
  }, []);

  useEffect(() => {
    let live = true;
    setFailed(false);
    prepare(props).then((value) => { if (live) setReady(value); }).catch((error) => {
      console.warn(`Verse completion: ${passage.id} could not load:`, error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [passage.id, attempt]); // eslint-disable-line react-hooks/exhaustive-deps -- one load per card and per Try again

  const split = passage.split[level];
  const hidden = useMemo(() => ready?.list.slice(split) ?? [], [ready, split]);

  const finish = (result: Pick<Result, "marks" | "extras" | "accuracy" | "perfect">, extra: Partial<Outcome> = {}) => {
    const stars = starsFor(result.accuracy);
    const change = props.onAnswer(result.accuracy, stars);
    if (change === false) return;
    setOutcome({ ...result, stars, change, ...extra });
  };
  const fromMarks = (marks: Mark[]) => {
    const credit = marks.reduce((sum, mark) => sum + mark.credit, 0);
    const all = hidden.map((_, i) => marks[i] ?? { verdict: "missing" as const, credit: 0 });
    return { marks: all, extras: [], accuracy: hidden.length ? (100 * credit) / hidden.length : 0, perfect: false };
  };
  /** "I don't know" reveals the passage and scores the card 0 stars; letters already typed still show (§3). */
  const dontKnow = (marks: Mark[] = []) => finish({ ...fromMarks(marks), accuracy: 0 }, { dontKnow: true });

  if (failed) {
    return <section className="vc-card" aria-labelledby="vc-ref">
      <h2 id="vc-ref" className="vc-ref">{reference}</h2>
      <p className="vc-note" role="alert">This verse couldn't load.</p>
      <div className="vc-actions">
        <button type="button" className="vc-primary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        <button type="button" className="vc-secondary" onClick={props.onSkip} disabled={props.saving}>Skip</button>
      </div>
    </section>;
  }
  if (!ready) {
    return <section className="vc-card" aria-labelledby="vc-ref" aria-busy="true">
      <h2 id="vc-ref" className="vc-ref">{reference}</h2>
      <p className="vc-loading">Loading the verse…</p>
    </section>;
  }
  if (outcome) {
    return <CardResult catalog={catalog} passage={passage} reference={reference} text={ready.text} list={ready.list} split={split}
      outcome={outcome} typed={settings.answer === "type" && settings.style === "words"} endings={ready.endings} chosen={chosen}
      inMyVerses={props.inMyVerses} onToggleAdd={props.onToggleAdd} onNext={props.onNext} />;
  }
  const opening = ready.text.slice(0, ready.list[split].start);
  const unavailable = ready.choices?.some((choice) => choice === null);
  const pick = settings.answer === "pick";
  const fillsInPlace = (pick && level === "hard") || (!pick && settings.style === "letters");
  return <section className="vc-card is-play" aria-labelledby="vc-ref">
    <h2 id="vc-ref" className="vc-ref">{reference}</h2>
    <PlayVerse opening={opening} hidden={hidden} given={given} reach={reach} active={fillsInPlace && !unavailable} />
    <p className="sr-only">{plural(hidden.length, "{n} word to complete", "{n} words to complete")}</p>
    {unavailable ? <div>
      <p className="vc-note">This verse can't be played word by word.</p>
      <button type="button" className="vc-secondary" onClick={props.onSkip} disabled={props.saving}>Skip</button>
    </div>
      : pick && ready.endings ? <PickEnding options={ready.endings.options} right={ready.endings.right} chosen={chosen}
        onChoose={(i) => { setChosen(i); const right = i === ready.endings!.right; finish({ marks: hidden.map(() => ({ verdict: right ? "exact" : "wrong", credit: right ? 1 : 0 })), extras: [], accuracy: right ? 100 : 0, perfect: false }); }} />
        : pick && ready.choices ? <PickWords hidden={hidden} choices={ready.choices as WordChoice[]} onProgress={setGiven} onDone={(marks) => finish(fromMarks(marks))} />
          : settings.style === "letters" ? <TypeLetters hidden={hidden} onProgress={setGiven} onDone={(marks) => finish(fromMarks(marks))} onDontKnow={dontKnow} />
            : <TypeWords context={{ hidden, opening: ready.list.slice(0, split), reference: referenceParts(catalog, passage), vocabulary: ready.vocabulary! }}
              onReach={setReach} onDone={(result, hinted) => finish(result, { hints: hinted.size, hinted })} onDontKnow={() => dontKnow()} />}
    {pick && !unavailable && <button type="button" className="vc-link vc-dont" onClick={() => dontKnow()}>I don't know</button>}
  </section>;
}

/** The parts of the passage's reference a player might type: "Psalms", 23, 1. */
function referenceParts(catalog: Catalog, passage: Passage) {
  const from = splitId(passage.from);
  return { book: bookByNum(catalog, from.num)?.name ?? "", chapter: from.chapter, verse: from.verse, last: splitId(passage.to).verse };
}
