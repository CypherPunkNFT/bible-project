// The box that shows text to copy by hand when the clipboard refuses (useCopy in text.ts).
import { useEffect, useRef } from "react";

export function CopyBox({ text }: { text: string }) {
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (text) { box.current?.focus(); box.current?.select(); } }, [text]);
  if (!text) return null;
  return (
    <label className="ov-manual">
      <span>Press and hold to copy, or select the text and copy it.</span>
      <textarea ref={box} readOnly value={text} rows={5} />
    </label>
  );
}
