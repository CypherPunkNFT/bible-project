// The test page the questions page's banner opens, at /study/questions/test.
// One page: the header and the test (questions/test/TestPage.tsx), drawn from what the address carries
// (questions/test/selection.ts). The parts live in questions/test/.
import { useMemo } from "react";
import { type QuestionBank } from "@/lib/data";
import { useQuestionBank } from "./questions/useQuestionBank";
import { useSelection } from "./questions/test/selection";
import { TestPage } from "./questions/test/TestPage";
import "./questions-page.css";
import "./test-page.css";
import "./test-stage.css";
import "./test-options.css";

export default function QuestionsTestPage() {
  const { bank, failed } = useQuestionBank();
  if (failed) return <p className="tp-status" role="alert">The questions could not be loaded: {failed}</p>;
  if (!bank) return <p className="tp-status">Loading the questions…</p>;
  return <TestBody bank={bank} />;
}

function TestBody({ bank }: { bank: QuestionBank }) {
  const chosen = useSelection(bank);
  const bookNames = useMemo(() => Object.fromEntries(bank.books.map((b) => [b.code, b.name])), [bank]);
  return <div className="tp"><TestPage {...chosen} bank={bank} bookNames={bookNames} active /></div>;
}
