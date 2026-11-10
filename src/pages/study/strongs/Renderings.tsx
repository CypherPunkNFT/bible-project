// Section 02: the central comparison. Six numbers, each with the English the King James tags put over it; choosing a rendering opens
// its one sample verse in the record sheet. Then the same fact from the other side: one English word, several numbers.
import { VerseAt } from "@/components/Verse";
import { Link } from "react-router-dom";
import { D, readerHref, SN, type Word } from "./model";
import { Cite, Head, Lemma, ThreeParts } from "./parts";
import { formatNumber } from "@/lib/site-format";

const fmt = (n: number) => formatNumber(n);
const LINES: Record<string, string> = {
  H7307: "Moving air, or a person's inner life, or God's Spirit.",
  H1697: "Spoken words, and the events and affairs words are about.",
  H5315: "The self and the living creature, far more than one English word.",
  G3056: "Word, and what words do: a saying, a message, an account.",
  G1411: "Ability and power, and the works that show it.",
  G2424: "One English word here, and more than one person.",
};

function WordCard({ word, index, onOpen }: { word: Word; index: number; onOpen: (word: string, label: string) => void }) {
  const most = word.rows.reduce((top, r) => Math.max(top, r.count), 1);
  return <li className="sn-card">
    <p className="sn-card-kind"><span>{word.lang === "hebrew" ? "Hebrew" : "Greek"} · {word.id}</span><span>0{index + 1} / 0{SN.words.length}</span></p>
    <h3><Lemma lang={word.lang}>{word.lemma}</Lemma> <i>{word.translit}</i></h3>
    <p className="sn-card-line">{LINES[word.id]}</p>
    <ul className="sn-bars" aria-label={`King James tags for ${word.id}, by English word`}>
      {word.rows.map((r) => <li key={r.label}><button type="button" onClick={() => onOpen(word.id, r.label)} aria-label={`${r.label}: ${r.count} of ${word.total} tags. Read a sample verse.`}>
        <span className="sn-bar-label">{r.label}</span><span className="sn-bar-track"><i style={{ width: `${Math.max(1.5, (r.count / most) * 100)}%` }} /></span><b>{fmt(r.count)}</b>
      </button></li>)}
    </ul>
    <p className="sn-card-foot">{word.other > 0 ? `${fmt(word.total)} tags, ${fmt(word.other)} of them other English words` : `${fmt(word.total)} tags`}<span> · Choose a word to read a verse →</span></p>
  </li>;
}

function OneEnglishWord() {
  const { numbers, john21 } = SN.love;
  return <div className="sn-love">
    <div><p className="sn-kicker">The other way round</p>
      <h3>One English word.<em> Several numbers.</em></h3>
      <p>{`Going from English back to the number works the same way. In the New Testament the King James's “love” and its forms sit over at least ${fmt(numbers.length)} Greek numbers: ${numbers.map((n) => `${n.id} (${n.count})`).join(", ")}. This counts every tag whose English is a form of the word.`}</p>
      <p className="sn-caption">The Berean also gives “love” in all three questions below. The tags show two Greek verbs. Readers of the Greek differ on whether the change marks a difference in meaning or is a matter of style. The number shows that two words are there. It cannot settle what the change means, and this study does not choose.</p></div>
    <ol className="sn-john">{john21.map((row) => <li key={row.verse}><p className="sn-ref"><Link to={readerHref("JHN", 21, row.verse)}>{`John 21:${row.verse}`}</Link></p><p><VerseAt verse={{ code: "JHN", chapter: 21, verse: row.verse }} /></p><p className="sn-tagrow">King James tags on “love”: {row.numbers.map((n, i) => <b key={i}>{n}</b>)}</p></li>)}</ol>
  </div>;
}

export function Renderings({ onOpen }: { onOpen: (word: string, label: string) => void }) {
  const record = D.records[1];
  return <>
    <Head num="02" kicker="The central comparison" title={<>One number.<em> Many English words.</em></>}
      lead="Here is what the King James put over six numbers. Bar length compares words within a card only. This is a selection, chosen for its spread: not the commonest words, and not a census." />
    <ul className="sn-cards">{SN.words.map((word, i) => <WordCard key={word.id} word={word} index={i} onOpen={onOpen} />)}</ul>
    <ThreeParts evidence={record.evidence} inference={record.inference} limit={record.limit} />
    <Cite ids={[...record.sources, "kjvTags", "stepLexicons"]} />
    <OneEnglishWord />
  </>;
}
