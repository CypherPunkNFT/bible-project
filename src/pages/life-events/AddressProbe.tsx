// Test helper: reports every address the router shows, so a test can prove typed names never reach it.
import { useLocation } from "react-router-dom";

export function AddressProbe({ onSeen }: { onSeen: (address: string) => void }) {
  const location = useLocation();
  onSeen(`${location.pathname}${location.search}${location.hash}`);
  return null;
}
