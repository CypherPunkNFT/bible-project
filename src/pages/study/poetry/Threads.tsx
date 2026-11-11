// 04 Words that return: three threads. "Please recognise" lights the same Hebrew words, and the Berean's words for them, in
// Genesis 37 and 38; "It was good" lights the seven verdicts on the thirty-one verses of Genesis 1; the Judges refrains sit
// on the book's twenty-one chapters. Every lit word was found by the build in the held text, and every mark opens its verse.
import { plural } from "@/lib/site-format";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, P, wordById, type ThreadRow } from "./model";
import { useOpen } from "./open";
import { Head, Prose, ThreeParts, VersePair } from "./parts";

function Recognize({ rows }: { rows: ThreadRow[] }) {
  const pairs = [rows.slice(0, 2), rows.slice(2, 4)];
  return <div className="hpn-thread-two">
    {pairs.map((two, i) => <div key={i} className="hpn-thread-side">
      <p className="hpn-kicker">{i === 0 ? "Genesis 37 · Jacob and the robe" : "Genesis 38 · Judah and the pledge"}</p>
      {two.map((r) => <VersePair key={r.ref} label={r.ref} lit={r.he} litEn={[r.en]} />)}
    </div>)}
    <svg className="hpn-thread" viewBox="0 0 40 300" preserveAspectRatio="none" aria-hidden="true">
      <path d="M20 10C40 80 0 150 20 220S20 290 20 290" />
    </svg>
  </div>;
}

/** A row of verse ticks with the thread's verses lit; each lit tick opens its verse. */
function Ruler({ marks, length, unit }: { marks: { at: number; label: string; ref: string; strong?: boolean }[]; length: number; unit: string }) {
  const open = useOpen();
  return <div className="hpn-ruler" role="group" aria-label={`${length} ${unit}s, the thread's verses marked`}>
    <div className="hpn-ruler-ticks" aria-hidden="true">{Array.from({ length }, (_, i) => <span key={i} />)}</div>
    {marks.map((m) => <button key={m.ref} type="button" className={`hpn-ruler-mark${m.strong ? " hpn-strong" : ""}`}
      style={{ left: `${((m.at - 0.5) / length) * 100}%` }} data-opener={`ref:${m.ref}`} aria-haspopup="dialog" aria-label={m.ref}
      onClick={() => open(`ref:${m.ref}`)}><span>{m.label}</span></button>)}
  </div>;
}

function Good({ rows }: { rows: ThreadRow[] }) {
  const marks = rows.map((r, i) => ({ at: Number(r.ref.split(":")[1]), label: r.ref.split(":")[1], ref: r.ref, strong: i === rows.length - 1 }));
  return <>
    <Ruler marks={marks} length={31} unit="verse" />
    <p className="hpn-caption"><span>Genesis 1, verse by verse.</span>{" "}
      <span>{`The Berean says “good” in exactly these ${P.threads.verdicts} verses, and the Hebrew has טוב in the same ${P.threads.verdicts}.`}</span>{" "}
      <span>In verse 31 the Hebrew adds מאד, “very”.</span></p>
    <VersePair label="Genesis 1:31" lit={rows[rows.length - 1].he} litEn={["very good"]} />
  </>;
}

function Judges({ rows }: { rows: ThreadRow[] }) {
  const place = (r: ThreadRow) => {
    const [chapter, verse] = r.ref.replace("Judges ", "").split(":").map(Number);
    return { at: chapter + Math.min(verse, 30) / 31 - 0.5, label: `${chapter}:${verse}`, ref: r.ref };
  };
  const evil = rows.filter((r) => r.en.startsWith("evil"));
  const king = rows.filter((r) => r.en.startsWith("no king"));
  return <>
    <p className="hpn-kicker">“Did evil in the sight of the LORD”</p>
    <Ruler marks={evil.map(place)} length={21} unit="chapter" />
    <p className="hpn-kicker">“There was no king in Israel”</p>
    <Ruler marks={king.map(place)} length={21} unit="chapter" />
    <p className="hpn-caption"><span>Judges, chapter by chapter.</span>{" "}
      <span>{`Searching the whole Berean book finds the first line in these ${P.threads.judgesEvil.length} verses only and the second in these ${P.threads.judgesKing.length}.`}</span>{" "}
      <span>The Hebrew holds the same words in each. In 19:1 the Hebrew turns them round: “and a king there was none in Israel”.</span></p>
    <VersePair label="Judges 21:25" lit={king[king.length - 1].he} litEn={["no king in Israel"]} />
  </>;
}

export function Threads({ word, onChange }: { word: string; onChange: (values: Record<string, string | null>) => void }) {
  const item = wordById.get(word)!;
  const rows = P.threads.rows[word] ?? [];
  return <>
    <Head num="04" kicker="Words that return" headline={D.keyWords.headline} lead={D.keyWords.lead} />
    <div className="hpn-words-pick" role="group" aria-label="Three returning words">
      {D.keyWords.items.map((k, i) => <button key={k.id} type="button" className="hpn-kind" aria-pressed={k.id === word} onClick={() => onChange({ word: k.id })}>
        <b>{String(i + 1).padStart(2, "0")}</b><span><Checked text={k.name} /></span><small>{plural(k.examples.length, "{n} verse", "{n} verses")}</small>
      </button>)}
    </div>
    <div className="hpn-word-body" aria-live="polite">
      <p className="hpn-look"><Prose text={item.look} /></p>
      {word === "recognize" && <Recognize rows={rows} />}
      {word === "good" && <Good rows={rows} />}
      {word === "refrains-judges" && <Judges rows={rows} />}
      <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
    </div>
    <p className="hpn-caution"><Prose text={D.keyWords.caution} /></p>
  </>;
}
