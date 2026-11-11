// The open question (design §3.1 and §9): its part and place, the question as the answer box's label, the guidance and
// the example, the box (a growing textarea, or one line for the name, title and when), the counter near the limit, and
// Previous and Next. Next on the last question reads "Read your testimony" and goes to the sheet. The heading takes
// focus when the question changes by a button, never on first load.
import { forwardRef, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { counterLine, placeLine } from "./lines";
import { PARTS, QUESTIONS, type Question } from "./questions";

interface QuestionFormProps {
  question: Question;
  index: number;
  value: string;
  readOnly: boolean;
  onChange: (text: string) => void;
  onMove: (id: string) => void;
  /** Takes the reader to the sheet after the last question. */
  onFinish: () => void;
}

/** Whether a question asks for Scripture in the person's own hand: a note under it points to the reader. */
const asksForVerse = (question: Question): boolean => question.id === "passage" || question.id === "verse";

export const QuestionForm = forwardRef<HTMLHeadingElement, QuestionFormProps>(function QuestionForm({ question, index, value, readOnly, onChange, onMove, onFinish }, headingRef) {
  const part = PARTS.find((candidate) => candidate.key === question.part);
  const previous = QUESTIONS[index - 1];
  const next = QUESTIONS[index + 1];
  const counter = counterLine(value, question);
  const box = useRef<HTMLTextAreaElement>(null);
  // The example starts open on a wide screen and folded on a phone, where it would push the box below the fold.
  const [wide] = useState(() => typeof window.matchMedia === "function" && window.matchMedia("(min-width: 48rem)").matches);
  const ids = { box: `tb-answer-${question.id}`, guidance: `tb-guidance-${question.id}`, counter: `tb-counter-${question.id}` };

  // Where field-sizing is not known, the box grows with its text.
  useEffect(() => {
    const element = box.current;
    if (!element || "fieldSizing" in element.style) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return <div className="tb-question">
    <p className="tb-place"><span>{part?.title}</span><span aria-hidden="true"> · </span><span>{placeLine(index)}</span></p>
    <h3 className="tb-question-title" ref={headingRef} tabIndex={-1}><label htmlFor={ids.box}>{question.text}</label></h3>
    <div className="tb-guidance" id={ids.guidance}>
      {question.guidance.map((line) => <p key={line}>{line}</p>)}
      {asksForVerse(question) && <p className="tb-quiet">Check any wording in the <Link to="/read">Bible reader</Link>, which shows the Berean Standard Bible.</p>}
    </div>
    {question.example && <details className="tb-example" open={wide} key={`${question.id}-${wide}`}>
      <summary>See an example</summary>
      {question.kind === "line"
        ? <p className="tb-example-text">{question.example.join(" · ")}</p>
        : question.example.map((line) => <p key={line} className="tb-example-text">{line}</p>)}
    </details>}
    {question.kind === "long"
      ? <textarea ref={box} id={ids.box} className="tb-box" value={value} rows={8} maxLength={question.limit} dir="auto" readOnly={readOnly}
        aria-describedby={counter ? `${ids.guidance} ${ids.counter}` : ids.guidance} onChange={(event) => onChange(event.target.value)} />
      : <input id={ids.box} className="tb-line" type="text" value={value} maxLength={question.limit} dir="auto" readOnly={readOnly} autoComplete="off" spellCheck
        aria-describedby={counter ? `${ids.guidance} ${ids.counter}` : ids.guidance} onChange={(event) => onChange(event.target.value)} />}
    <p id={ids.counter} className="tb-counter" role="status">{counter ?? ""}</p>
    <div className="tb-nav">
      <button type="button" className="tb-secondary" disabled={!previous} onClick={() => previous && onMove(previous.id)}>Previous</button>
      {next
        ? <button type="button" className="tb-primary" onClick={() => onMove(next.id)}>Next</button>
        : <button type="button" className="tb-primary" onClick={onFinish}>Read your testimony</button>}
    </div>
  </div>;
});
