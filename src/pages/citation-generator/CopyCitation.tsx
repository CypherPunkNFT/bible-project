// Copying a citation: with its italics where the browser allows (a word processor keeps them), else as plain text,
// else a box to copy by hand, as the countdowns' share panel does (src/pages/countdowns/SharePanel.tsx).
import { useEffect, useState } from "react";

/** Copies `plain` (and `html`, where the browser takes it); false when the clipboard is blocked. */
async function copyRich(plain: string, html: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      })]);
      return true;
    }
  } catch (error) {
    console.warn("citation generator: the clipboard refused the formatted citation; copying it as plain text", error);
  }
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(plain);
    return true;
  } catch (error) {
    console.warn("citation generator: the clipboard refused the citation; showing it to copy by hand", error);
    return false;
  }
}

/** A Copy button that says Copied for a moment, and shows the text to copy by hand when the clipboard is blocked. */
export function CopyCitation({ plain, html, label, name }: { plain: string; html: string; label: string; name: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  useEffect(() => {
    if (state !== "copied") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);
  // A new citation is a new thing to copy.
  useEffect(() => setState("idle"), [plain]);
  return (
    <span className="cg-copy">
      <button type="button" className="cg-copy-button" aria-label={`${state === "copied" ? "Copied" : label}: ${name}`} onClick={async () => setState((await copyRich(plain, html)) ? "copied" : "manual")}>
        {state === "copied" ? "Copied" : label}
      </button>
      {state === "manual" && <label className="cg-manual">
        <span>Your browser blocked copying. Select this and copy it:</span>
        <textarea readOnly value={plain} rows={Math.min(6, plain.split("\n").length + 1)} ref={(box) => box?.select()} />
      </label>}
    </span>
  );
}
