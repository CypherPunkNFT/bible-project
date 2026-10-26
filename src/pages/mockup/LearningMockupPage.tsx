// /learning_mockup and /learning_mockup/<title>: a frozen copy (learning-v1/) of the Learning materials page as it was
// on 24 October 2026, every planned title included, kept for the owner to compare while the real page at
// /resources/learning holds only the workbooks we have.
import LEARNING from "@/data/resources/learning.json";
import type { LearningData } from "@/data/resources";
import LearningV1Page from "./learning-v1/LearningV1Page";
import LearningV1TitlePage from "./learning-v1/TitlePage";

// The JSON import widens the drawings' point pairs to plain arrays; the file is the same one the real page loads.
const data = LEARNING as unknown as LearningData;

export default function LearningMockupPage() {
  return <LearningV1Page data={data} />;
}

export function LearningMockupTitlePage() {
  return <LearningV1TitlePage data={data} />;
}
