// Sharing a day or a link (design 7.5, 7.6), on the sympathy pattern: the share sheet where there is one, then Copy, and
// a box to copy by hand when the clipboard is blocked; Email and (on phones) Text links. A cancelled share shows nothing.
import { useState } from "react";
import { mailtoHref, smsBodyHref } from "./message";

const isPhone = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** Copies text, or reports that the clipboard is blocked so the caller can show it to copy by hand. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("countdowns: the clipboard refused the text; showing it to copy by hand", error);
    return false;
  }
}

/** Copy button with its own fallback box. */
export function CopyButton({ text, label, done = "Copied" }: { text: string; label: string; done?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  return (
    <span className="cd-copy">
      <button type="button" className="cd-button" onClick={async () => setState((await copyText(text)) ? "copied" : "manual")}>
        {state === "copied" ? done : label}
      </button>
      {state === "manual" && <ManualCopy text={text} />}
    </span>
  );
}

function ManualCopy({ text }: { text: string }) {
  return (
    <label className="cd-manual">
      <span>Press and hold to copy</span>
      <textarea readOnly value={text} rows={Math.min(8, text.split("\n").length + 1)} ref={(box) => box?.select()} />
    </label>
  );
}

export function SharePanel({ subject, body, disabledReason }: { subject: string; body: string; disabledReason: string | null }) {
  const [manual, setManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  if (disabledReason) return <p className="cd-quiet" role="status">{disabledReason}</p>;
  const share = async () => {
    try {
      await navigator.share({ title: subject, text: body });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") console.warn("countdowns: sharing failed", error);
    }
  };
  const copy = async () => {
    const ok = await copyText(body);
    setCopied(ok);
    setManual(!ok);
  };
  return (
    <div className="cd-share" aria-label="Share this day" role="group">
      {canShare && <button type="button" className="cd-button cd-button-main" onClick={share}>Share</button>}
      <button type="button" className="cd-button" onClick={copy}>{copied ? "Copied" : "Copy the message"}</button>
      <a className="cd-button" href={mailtoHref(subject, body)}>Email</a>
      {isPhone() && <a className="cd-button" href={smsBodyHref(body)}>Text</a>}
      {manual && <ManualCopy text={body} />}
    </div>
  );
}
