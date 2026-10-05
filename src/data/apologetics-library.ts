/** Runtime adapter only. Author all library content in content/apologetics. */
import { STUDIES, SOURCES, TOPICS } from "../generated/apologetics";
import type { ApStudy } from "./apologetics-types";
export { STUDIES, SOURCES, TOPICS, PATHS, WORLDVIEWS, DEBATES, PRACTICE, AP_EDITORIAL } from "../generated/apologetics";
export type { ApSource, ApStudy, ApCitation, TopicId } from "./apologetics-types";

export const studyById = (id: string) => STUDIES.find((study) => study.id === id);
export const sourceById = (id: string) => SOURCES.find((source) => source.id === id)!;
export const topicById = (id: string) => TOPICS.find((topic) => topic.id === id);
export const studyMinutes = (study: ApStudy) => Math.max(2, Math.ceil([study.answer, ...study.reasoning, study.conclusion, ...study.sections.map((section) => section.body), study.reply, study.limit].join(" ").split(/\s+/).length / 180));
