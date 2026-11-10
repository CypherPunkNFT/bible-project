// The forms by book: pick a form, and each of the thirty-nine books shows its share of that book's Hebrew verbs, in canonical order. It is
// a real ordered list with its values written out, so it is its own table view; one hue, because only size is being read.
import { D, findForm, H, percent, thousands } from "./model";

const MAX_SHARE: Record<string, number> = Object.fromEntries(D.forms.map((form) => [form.id, Math.max(...H.counts.books.map((b) => percent(b[form.id] as number, b.total)))]));

export function VerbChart({ formValue, onForm }: { formValue: string | null; onForm: (id: string) => void }) {
  const form = findForm(formValue);
  const genesis = H.counts.books[0], psalms = H.counts.books[18];
  return <div className="hw-chart">
    <p className="hw-kicker">The same forms, book by book</p>
    <ul className="hw-lenses" aria-label="Choose a verb form">
      {D.forms.map((f) => <li key={f.id}><button type="button" aria-pressed={f.id === form.id} onClick={() => onForm(f.id)}>{f.name}</button></li>)}
    </ul>
    <p className="hw-lens-line" aria-live="polite"><b>{form.name}.</b> {form.plain}. {`Genesis ${percent(genesis[form.id] as number, genesis.total)}%, of ${thousands(genesis.total)} verbs.`} {`Psalms ${percent(psalms[form.id] as number, psalms.total)}%, of ${thousands(psalms.total)}.`}</p>
    <ol className="hw-bars">{H.counts.books.map((book) => {
      const count = book[form.id] as number, share = percent(count, book.total);
      return <li key={book.name} title={`${book.name}: ${thousands(count)} of ${thousands(book.total)} Hebrew verbs`}>
        <span className="hw-bar-name">{book.name}</span>
        <span className="hw-bar-track" aria-hidden="true"><span style={{ width: `${MAX_SHARE[form.id] ? (share / MAX_SHARE[form.id]) * 100 : 0}%` }} /></span>
        <span className="hw-bar-val">{share}%</span>
      </li>;
    })}</ol>
    <p className="hw-caption">Each figure is that form's share of the book's Hebrew verbs, by STEP Bible's tags. A long bar shows a book that tells stories or a book that sings, not a better or worse one. Bars are scaled to the largest share for this form. Aramaic verbs in Daniel and Ezra are left out.</p>
  </div>;
}
