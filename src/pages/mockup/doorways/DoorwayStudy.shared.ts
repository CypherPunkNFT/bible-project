// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { DoorwayVariant } from "./doorway-types";
import { AnnotatedPage, Converging, CrossReferences, Desk, Magnifier } from "./DoorwayStudy";
export const STUDY_DOORWAYS: DoorwayVariant[] = [
  { name: "Four Gospels, one Christ", Art: Converging },
  { name: "Cross-reference arcs", Art: CrossReferences },
  { name: "Annotated page", Art: AnnotatedPage },
  { name: "Magnifier on the text", Art: Magnifier },
  { name: "Desk: Bible and notebook", Art: Desk },
];
