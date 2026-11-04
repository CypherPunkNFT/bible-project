// Section 02: four questions, each put to all twelve readers in date order. One question at a time on purpose: forty-eight cells at once
// would be the dense comparison block the site has ruled out. Each answer opens that reader's record.
import { D, type Question } from "./model";
import { Head } from "./parts";

export function Questions({ question, onQuestion, onOpen }: { question: Question; onQuestion: (id: string) => void; onOpen: (id: string) => void }) {
  return <>
    <Head num="02" kicker="Four questions" title={<>Same verses.<em> Different questions.</em></>}
      lead="What does it change to ask something else of the passage? Choose a question, and read the twelve answers down the column." />
    <div className="hc-asks" role="group" aria-label="Choose a question">{D.questions.map((q, i) => <button key={q.id} type="button" aria-pressed={q.id === question.id} onClick={() => onQuestion(q.id)}><b>0{i + 1}</b>{q.label}</button>)}</div>
    <p className="hc-reads" aria-live="polite">{question.reads}</p>
    <ol className="hc-answers">{D.readers.map((reader) => <li key={reader.id}>
      <button type="button" aria-haspopup="dialog" data-opener={`answer:${reader.id}`} onClick={() => onOpen(reader.id)}>
        <span className="hc-answer-who"><b aria-hidden="true">{reader.mark}</b><strong>{reader.name}</strong><small>{reader.when}</small></span>
        <span className="hc-answer-text">{reader.answers[question.id]}</span>
      </button>
    </li>)}</ol>
    <p className="hc-caption">Each answer is this site's summary of what was read, and answers only what that reader's text addresses. Some did not ask this question, and those answers say so.</p>
  </>;
}
