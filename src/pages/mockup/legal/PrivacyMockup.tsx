// MOCK-UP: the Privacy page's three policy layouts, at /privacy_mockup on this computer's preview only, switched by the
// pill at the bottom (?v=a|b|c). The owner chose A, Codex, for /privacy (2026-10-25); the page itself is
// legal/PrivacyView.tsx, shared with /privacy.
import { useSearchParams } from "react-router-dom";
import type { PolicyVersion } from "@/pages/legal/PolicyViews";
import { PrivacyView } from "@/pages/legal/PrivacyView";
import { VersionPill } from "./VersionPill";

const VERSIONS: { id: PolicyVersion; name: string }[] = [
  { id: "a", name: "Codex" },
  { id: "b", name: "Rail" },
  { id: "c", name: "Folded" },
];

export default function PrivacyMockup() {
  const [params] = useSearchParams();
  const version = VERSIONS.find((v) => v.id === params.get("v"))?.id ?? "a";
  return (
    <PrivacyView version={version} supportTo="/support_mockup">
      <VersionPill label="Policy layout" versions={VERSIONS} current={version} />
    </PrivacyView>
  );
}
