// Copy to the clipboard, with the fallback the design asks for where the clipboard is blocked (design 8.1). The pattern of
// the prayers feature's useCopy, with this feature's class names.
import { useEffect, useRef, useState, type ReactNode } from "react";

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
    } catch (error) {
      console.warn("home-blessings: the clipboard refused the text, so it is shown to copy by hand", error);
      setManualText(text);
    }
  };
  const manual = manualText === null ? null : (
    <label className="hb-manual">Press and hold to copy<textarea ref={area} readOnly value={manualText} /></label>
  );
  return { copy, status, manual };
}
