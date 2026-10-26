// MOCK-UP: the children's tests page, at /children_mockup on this computer's preview only, for trying changes before
// they reach the real page at /study/questions/children (owner, 2026-10-26: "make it a real page now"). It is the same
// page (children/ChildrenTests.tsx) with the zoom's ticker, and the four tops for the parents' course at ?course=versions.
// It is direction E, the mix, the one the owner kept on 2026-10-25; the other four directions are in
// ARCHIVE/mockups/children-Views-2026-10-25.tsx. Parts: children/.
import { ChildrenTests } from "../children/ChildrenTests";

export default function ChildrenMockupPage() {
  return <ChildrenTests mockup />;
}
