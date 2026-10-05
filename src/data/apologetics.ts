import type { Span } from "../lib/study";
import { STUDIES } from "./apologetics-studies";

export const APOLOGETICS_ANCHOR: Span = [60003015, 60003016];
/** Legacy metadata derives from the same sourced guides as the live library. */
export const FOUNDATIONS = STUDIES.slice(0, 6).map((study) => ({
  id: study.id, label: study.id, title: study.summary, claim: study.answer,
  question: study.title, response: study.reply, ask: study.prompt, refs: study.refs,
}));

export const CONVERSATION_STEPS = [
  { title: "Listen", line: "Understand the person before answering the position.", detail: "Invite them to explain what they believe and why it matters to them. Reflect it back in words they recognise.", prompt: "What has most shaped your understanding of God?", span: [59001019, 59001020] as Span },
  { title: "Clarify", line: "Find the question you are actually discussing.", detail: "Define the important terms, distinguish a claim from its evidence, and take one question at a time.", prompt: "When you say that, what exactly do you mean?", span: [20018013, 20018017] as Span },
  { title: "Give a reason", line: "Connect a clear Christian claim to its grounds.", detail: "Read the passage in context, explain the reasoning, and address the strongest version of the objection. Say when a question needs more study.", prompt: "Could we read the passage together and examine the claim?", span: APOLOGETICS_ANCHOR },
  { title: "Invite", line: "Leave room for a next conversation and a lived response.", detail: "Offer to read a Gospel together, continue investigating a question, or pray if they welcome it. Let patient love accompany the words.", prompt: "Would you like to keep exploring this with me?", span: [51004005, 51004006] as Span },
];

export const ISLAM_STUDY_QUESTIONS = [
  "Who is Jesus?", "God's oneness and the Trinity", "The crucifixion and resurrection",
  "Scripture and its transmission", "Revelation and prophethood", "Sin, grace and salvation",
];
