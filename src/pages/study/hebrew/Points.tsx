// Section 03: why the points matter (the same three letters as three words), a mixer that sets any point under any of four letters, the
// letters that hold a vowel, and the first of the page's popular claims, tested.
import { useId, useState } from "react";
import { D, featuredById, H, syllable, thousands } from "./model";
import { Cite, He, Head, Mixed, Test, ThreeParts, VerseLink } from "./parts";

const LONE = String.fromCodePoint(0x25cc);
const TRIPTYCH = ["davar", "dibber", "dever"];

function Mixer() {
  const [carrierId, setCarrier] = useState(D.carriers[0].id);
  const [vowelId, setVowel] = useState(D.vowels[0].id);
  const name = useId();
  const carrier = D.carriers.find((c) => c.id === carrierId)!, vowel = D.vowels.find((v) => v.id === vowelId)!;
  return <div className="hw-mixer">
    <fieldset className="hw-carriers" dir="rtl"><legend className="hw-kicker">A letter</legend>
      {D.carriers.map((c) => <label key={c.id} className={c.id === carrierId ? "chosen" : ""}>
        <input type="radio" name={`${name}-c`} checked={c.id === carrierId} onChange={() => setCarrier(c.id)} /><span lang="he">{c.glyph}</span>
      </label>)}
    </fieldset>
    <fieldset className="hw-marks"><legend className="hw-kicker">A point</legend>
      {D.vowels.map((v) => <label key={v.id} className={v.id === vowelId ? "chosen" : ""}>
        <input type="radio" name={`${name}-v`} checked={v.id === vowelId} onChange={() => setVowel(v.id)} />
        <span className="hw-lone" lang="he">{LONE}{v.mark}</span><small>{v.name}</small>
      </label>)}
    </fieldset>
    <div className="hw-result" aria-live="polite">
      <p className="hw-syll" lang="he" dir="rtl">{carrier.glyph}{vowel.mark}</p>
      <p className="hw-syll-sound">{syllable(carrier, vowel)}</p>
      <p><b>{vowel.name}.</b> <Mixed text={vowel.line} /></p>
      <p className="hw-count">{`${thousands(H.counts.vowels[vowel.id])} times in the Hebrew text, by this study's count.`}</p>
    </div>
  </div>;
}

export function Points({ onOpen }: { onOpen: (key: string) => void }) {
  const claim = D.claims.vowels;
  return <>
    <Head letter="ג" num="03" kicker="The points" title={<>Same three letters.<em> Three different words.</em></>}
      lead={<>Take the points away and each of these is <He>דבר</He>. Put them back and you have a word, a verb and a plague. Each comes from a verse.</>} />
    <ul className="hw-triptych">{TRIPTYCH.map((id) => {
      const item = featuredById.get(id)!, data = H.featured[id];
      return <li key={id}>
        <button type="button" data-open={`word:${id}`} onClick={() => onOpen(`word:${id}`)}>
          <span className="hw-trip-he" lang="he" dir="rtl">{data.he}</span>
          <span className="hw-trip-sound">{item.sound}</span>
          <b>{item.word}</b>
          <small>{`Under its own dictionary number, ${thousands(data.count)} times`}</small>
        </button>
        <p className="hw-verse-ref"><VerseLink label={data.label} /></p>
      </li>;
    })}</ul>
    <p className="hw-note"><He>מִדֶּבֶר</He> carries the little word for "from" on its front, because that is the shape it has in the psalm.</p>
    <h3 className="hw-sub">Set a point under a letter</h3>
    <Mixer />
    <h3 className="hw-sub">Letters that hold a vowel</h3>
    <ul className="hw-holders">{D.vowelLetters.map((v) => <li key={v.glyph}><span className="hw-lone" lang="he" dir="rtl">{v.glyph.startsWith("ו") ? v.glyph : `${LONE}${v.glyph}`}</span><b>{v.sound}</b><span><Mixed text={v.line} /></span></li>)}</ul>
    <ThreeParts {...D.records.points} />
    <div className="hw-claim">
      <p className="hw-claim-text">{claim.claim}</p>
      <ThreeParts evidence={claim.evidence} inference={claim.inference} limit={claim.limit} />
      <Test kicker="What can the evidence actually say?" question={claim.test.question} options={claim.test.options} />
    </div>
    <Cite ids={["stepTahot", "gkc", "nash", "leningrad"]} />
  </>;
}
