/** Compatibility metadata, derived from the document collection. */
import { STUDIES, AP_EDITORIAL } from "../generated/apologetics";
export { APOLOGETICS_ANCHOR, CONVERSATION_STEPS, ISLAM_STUDY_QUESTIONS } from "../generated/apologetics";
export const FOUNDATIONS = AP_EDITORIAL.foundations.map((id) => {
  const study = STUDIES.find((entry) => entry.id === id)!;
  return { id: study.id, label: study.id, title: study.summary, claim: study.answer, question: study.title, response: study.reply, ask: study.prompt, refs: study.refs };
});
