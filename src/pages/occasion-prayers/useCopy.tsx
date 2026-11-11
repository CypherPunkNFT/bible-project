// Copy to the clipboard, with the fallback the design asks for where the clipboard is blocked (design 6.1, 8).
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Copy to the clipboard; where the clipboard is blocked, show the text selected with "Press and hold to copy". */
export function useCopy(): { copy: (text: string) => Promise<void>; status: string; manual: ReactNode } {
  const [status, setStatus] = useState("");
  const [manualText, setManualText] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (manualText !== null) { area.current?.focus(); area.current?.select(); } }, [manualText]);
  const copy = async (text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setManualText(null);
      setStatus("Copied");
    } catch {
      setManualText(text);
    }
  };
  const manual = manualText === null ? null : (
    <label className="op-manual">Press and hold to copy<textarea ref={area} readOnly value={manualText} /></label>
  );
  return { copy, status, manual };
}
