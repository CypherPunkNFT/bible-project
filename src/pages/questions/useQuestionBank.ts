import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";

/** The question bank in the reader's language (read again after a change of language), and why it failed, if it did. */
export function useQuestionBank(): { bank: QuestionBank | null; failed: string | null } {
  const loaded = useAsync(loadQuestionBank, "questions/bank");
  if (loaded.status === "ready") return { bank: loaded.value, failed: null };
  if (loaded.status === "loading") return { bank: null, failed: null };
  return { bank: null, failed: loaded.error instanceof Error ? loaded.error.message : String(loaded.error) };
}
