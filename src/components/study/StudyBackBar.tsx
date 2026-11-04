import type { ReactNode } from "react";
import type { CameFrom } from "@/lib/came-from";
import { StudyBackLink } from "./StudyBackLink";

/** The top row of a study opened from a card: the back button, then the study's name, as on the Structure page.
 *  `fallback` is where the button goes when the visitor did not arrive from a card. */
export function StudyBackBar({ label, fallback }: { label: ReactNode; fallback?: CameFrom }) {
  return <div className="study-back-bar"><StudyBackLink fallback={fallback} /><strong>{label}</strong></div>;
}
