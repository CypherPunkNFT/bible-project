// How a title reaches the shelf (mock-up A): the four steps that made the Moses workbook, which every planned title
// must pass before it is ready.
import { SecHead } from "./parts";

const STEPS: [string, string][] = [
  ["Choose the pages", "Only the site’s reviewed pages: a person’s story, a study, a Topics category."],
  ["Write from them", "Summaries in plain words, questions whose answers are in the verses they name."],
  ["Check every word", "Every reference must exist and every quotation must match the King James text, or nothing is built."],
  ["Print and shelve", "A4 and US Letter with the same page numbers, a cover, and a row in the catalogue."],
];

export function Steps({ num }: { num: string }) {
  return <section className="lm-sec" aria-labelledby="lm-steps-title">
    <SecHead num={num} id="lm-steps-title" title={<>How a title <em>reaches the shelf</em></>}
      lead="The same four steps made the Moses workbook. A planned title becomes ready only after all four." />
    <ol className="lm-steps">{STEPS.map(([b, p], i) => <li key={b}><span>0{i + 1}</span><b>{b}</b><p>{p}</p></li>)}</ol>
  </section>;
}
