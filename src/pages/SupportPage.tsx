// /support: the redesigned page with the questions as tiles (owner's choice, 2026-10-25). Page: legal/SupportView.tsx;
// answers: legal/support-content.tsx; the other layouts stay at /support_mockup.
import { SupportView } from "@/pages/legal/SupportView";
import { Tiles } from "@/pages/legal/SupportQuestions";

export default function SupportPage() {
  return <SupportView questions={<Tiles />} />;
}
