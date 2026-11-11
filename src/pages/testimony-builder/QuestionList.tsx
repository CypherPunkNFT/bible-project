// The list of all eighteen questions beside the open one (design §3.1 and §9): one numbered list per part, each
// question a button that opens it, marked when answered (in its name too, so the mark is not only a colour), the open
// one marked as the current step. The progress sentence above it is plain text.
import { PARTS, QUESTIONS, isAnswered } from "./questions";
import type { Answers } from "./storage";

interface QuestionListProps {
  answers: Answers;
  openId: string;
  onOpen: (id: string) => void;
}

export function QuestionList({ answers, openId, onOpen }: QuestionListProps) {
  let number = 0;
  return <nav className="tb-list" aria-label="Questions">
    {PARTS.map((part) => <section key={part.key} className="tb-list-part" aria-labelledby={`tb-part-${part.key}`}>
      <h3 id={`tb-part-${part.key}`}>{part.title}</h3>
      <ol>
        {QUESTIONS.filter((question) => question.part === part.key).map((question) => {
          number += 1;
          const done = isAnswered(answers[question.id]);
          const open = question.id === openId;
          return <li key={question.id}>
            <button type="button" className={done ? "tb-list-item is-done" : "tb-list-item"} aria-current={open ? "step" : undefined} onClick={() => onOpen(question.id)}>
              <span className="tb-list-num" aria-hidden="true">{number}</span>
              <span className="tb-list-name">{question.short}{done && <span className="sr-only">, answered</span>}</span>
              {done && <span className="tb-list-mark" aria-hidden="true">✓</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </nav>;
}
