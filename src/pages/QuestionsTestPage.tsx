// The test page the questions page's banner opens, at /study/questions/test.
// One page: the header and the test (questions/test/TestPage.tsx), drawn from what the address carries
// (questions/test/selection.ts). The parts live in questions/test/.
import { useMemo } from "react";
import { useQuestionStore, type QuestionStore } from "./questions/question-store";
import { useSelection } from "./questions/test/selection";
import { TestPage } from "./questions/test/TestPage";
import "./questions-page.css";
import "./test-page.css";
import "./test-stage.css";
import "./test-options.css";

export default function QuestionsTestPage() {
  // Every row's list layer draws the pool and its counts (questions/question-store.ts).
  const { store, failed } = useQuestionStore(() => [["list", "all"]], "test");
  if (failed) return <p className="tp-status" role="alert">The questions could not be loaded: <span>{failed}</span></p>;
  if (!store) return <p className="tp-status">Loading the questions…</p>;
  return <TestBody store={store} />;
}

function TestBody({ store }: { store: QuestionStore }) {
  const chosen = useSelection(store);
  const bank = store.bank;
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  return <div className="tp"><TestPage {...chosen} bank={bank} bookNames={bookNames} active /></div>;
}
