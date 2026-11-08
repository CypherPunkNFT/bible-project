// For the sympathy page tests (test-kit.tsx): reports every address the router is at, and how it got there (PUSH, REPLACE).
import { useLocation, useNavigationType } from "react-router-dom";

export function VisitProbe({ onVisit }: { onVisit: (visit: { address: string; how: string }) => void }) {
  const location = useLocation();
  const how = useNavigationType();
  onVisit({ address: `${location.pathname}${location.search}${location.hash}`, how });
  return null;
}
