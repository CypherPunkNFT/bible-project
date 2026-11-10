// "Send a birthday message" (design 7.3): an optional name, the message as it will be sent (editable), and Share, Copy
// message, Email and, on phones, Text message, with the site's usual fallbacks. The name is never stored, never put in
// an address and sits outside any form, with no name attribute and autocomplete off.
import { useState } from "react";
import { MAX_NAME, MESSAGE_SUBJECT, birthdayMessage, mailtoHref, smsHref, type BirthdayMessage } from "./message";

const isPhone = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("birthday verses: the clipboard refused the message; showing it to copy by hand", error);
    return false;
  }
}

export function MessageBox({ verse }: { verse: Omit<BirthdayMessage, "name"> }) {
  const [name, setName] = useState("");
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "copied" | "manual">("idle");
  const body = edited ?? birthdayMessage({ ...verse, name });
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const share = async () => {
    try {
      await navigator.share({ title: MESSAGE_SUBJECT, text: body });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") console.warn("birthday verses: sharing the message failed", error);
    }
  };
  const copy = async () => setCopied((await copyText(body)) ? "copied" : "manual");
  return (
    <div className="bv-message">
      <label className="bv-field">
        <span>Their name (optional)</span>
        <input type="text" value={name} maxLength={MAX_NAME} autoComplete="off" spellCheck={false}
          onChange={(event) => { setName(event.target.value); setEdited(null); setCopied("idle"); }} />
      </label>
      <label className="bv-field">
        <span>The message</span>
        <textarea value={body} rows={8} onChange={(event) => { setEdited(event.target.value); setCopied("idle"); }} />
      </label>
      <div className="bv-actions" role="group" aria-label="Send the message">
        {canShare && <button type="button" className="bv-button bv-button-main" onClick={share}>Share</button>}
        <button type="button" className="bv-button" onClick={copy}>{copied === "copied" ? "Copied" : "Copy message"}</button>
        <a className="bv-button" href={mailtoHref(MESSAGE_SUBJECT, body)}>Email</a>
        {isPhone() && <a className="bv-button" href={smsHref(body)}>Text message</a>}
      </div>
      {copied === "manual" && (
        <label className="bv-manual">
          <span>Press and hold to copy</span>
          <textarea readOnly value={body} rows={8} ref={(box) => box?.select()} />
        </label>
      )}
      <p className="bv-privacy">Messages are written on your device. Nothing you type is sent or saved.</p>
    </div>
  );
}
