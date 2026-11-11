// The keepsake certificate's fields (design 7). Privacy: the fields sit outside any <form> (Enter can never submit them
// into the address), carry no `name` and no autocomplete, and live only in this component's state: never saved, never
// in the address or the page title, never sent. Print waits until the chosen verse's words have loaded.
import { useMemo, useState } from "react";
import type { CertificateKind, Occasion, OccasionPassage } from "@/data/occasion-verses";
import { CARD_MAX } from "@/pages/life-events/passage";
import type { Paper } from "@/pages/life-events/print-sheet";
import type { CertificateDetails } from "./CertificateSheet";
import { certificateDate } from "./text";
import type { PassageLabel } from "./usePassageWords";

const MAX_TEXT = 80;

const FIELDS: Record<CertificateKind, { first: string; second?: string }> = {
  baptism: { first: "Name of the person baptized" },
  profession: { first: "Name" },
  dedication: { first: "The child's name", second: "The parents' names" },
  wedding: { first: "The bride's name", second: "The groom's name" },
};

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ov-field">
      <span>{label}</span>
      <input type="text" value={value} maxLength={MAX_TEXT} autoComplete="off" spellCheck={false} translate="no" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface MakerProps {
  occasion: Occasion & { certificate: CertificateKind };
  /** The occasion's passages with their labels, and words where loaded. */
  passages: { passage: OccasionPassage; label: PassageLabel; text: string | undefined }[];
  paper: Paper;
  onPaper: (paper: Paper) => void;
  onPrint: ((details: CertificateDetails) => void) | null;
  waiting: string | null;
}

export function CertificateMaker({ occasion, passages, paper, onPaper, onPrint, waiting }: MakerProps) {
  const kind = occasion.certificate;
  const fields = FIELDS[kind];
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [title, setTitle] = useState<"profession" | "confirmation">("profession");
  const [date, setDate] = useState("");
  const [church, setChurch] = useState("");
  const [pastor, setPastor] = useState("");
  // Verses short enough for the sheet: those whose words are known to fit, and those still loading.
  const choices = useMemo(() => passages.filter((item) => item.text === undefined || item.text.length <= CARD_MAX), [passages]);
  const firstCard = choices.find((item) => item.passage.role === "card") ?? choices[0];
  const [verseKey, setVerseKey] = useState(firstCard?.label.key ?? "");
  const chosen = choices.find((item) => item.label.key === verseKey) ?? firstCard;
  const verseReady = chosen?.text !== undefined;

  const print = () => {
    if (!onPrint) return;
    onPrint({
      kind, first: first.trim(), second: second.trim(), title, date: certificateDate(date), church: church.trim(), pastor: pastor.trim(),
      verse: chosen && chosen.text !== undefined ? { text: chosen.text, reference: chosen.label.reference } : null,
    });
  };

  return (
    <section className="ov-certificate" aria-labelledby="ov-certificate-title">
      <h2 id="ov-certificate-title">Print a keepsake certificate</h2>
      <p className="ov-small">Nothing you type here is saved or sent anywhere. It stays on this page until you leave it.</p>
      <div className="ov-fields">
        {kind === "profession" && (
          <fieldset className="ov-choice">
            <legend>Title</legend>
            <label><input type="radio" name="ov-certificate-title" checked={title === "profession"} onChange={() => setTitle("profession")} /> <span>Profession of faith</span></label>
            <label><input type="radio" name="ov-certificate-title" checked={title === "confirmation"} onChange={() => setTitle("confirmation")} /> <span>Confirmation, for churches that confirm</span></label>
          </fieldset>
        )}
        <TextField label={fields.first} value={first} onChange={setFirst} />
        {fields.second && <TextField label={fields.second} value={second} onChange={setSecond} />}
        <label className="ov-field">
          <span>Date</span>
          <input type="date" value={date} autoComplete="off" onChange={(event) => setDate(event.target.value)} />
        </label>
        <TextField label={kind === "wedding" ? "Place" : "Church"} value={church} onChange={setChurch} />
        <TextField label="Pastor's name (optional)" value={pastor} onChange={setPastor} />
        <label className="ov-field">
          <span>Verse</span>
          <select value={chosen?.label.key ?? ""} onChange={(event) => setVerseKey(event.target.value)}>
            {choices.map((item) => <option key={item.label.key} value={item.label.key}>{item.label.reference}</option>)}
          </select>
        </label>
        <fieldset className="ov-choice">
          <legend>Paper</legend>
          {(["letter", "a4"] as const).map((item) => (
            <label key={item}>
              <input type="radio" name="ov-certificate-paper" value={item} checked={paper === item} onChange={() => onPaper(item)} />
              {item === "letter" ? <span>US Letter</span> : <span>A4</span>}
            </label>
          ))}
        </fieldset>
      </div>
      <p className="ov-small">Signature lines are left blank, to sign by hand. In the print dialog switch off Headers and footers.</p>
      {onPrint ? (
        <button type="button" className="ov-primary" disabled={!verseReady || Boolean(waiting)} onClick={print}>
          {!verseReady ? "Waiting for the verse's words…" : waiting ?? "Print certificate"}
        </button>
      ) : <p className="ov-small">To print, open this page in your browser.</p>}
    </section>
  );
}
