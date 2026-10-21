import { Check, Lock, PencilLine, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { CORRECTION_LABELS, CORRECTION_SUBJECT, composeCorrection, type Correction } from "@/lib/corrections";
import "./correction.css";

const CONTACT_ADDRESS = "amen@bibleproject.io";

type Status = { state: "idle" | "sending" | "sent" } | { state: "error"; message: string };

/** The page's name: its main heading, else its tab title without the site name. */
function pageTitle(): string {
  const heading = document.querySelector("main h1, h1")?.textContent?.replace(/\s+/g, " ").trim();
  return (heading || document.title.replace(/\s*[·|–—-]\s*Bible Project\s*$/i, "")).trim().slice(0, 200);
}

/**
 * A small floating button on every page that opens a correction form. The page it was opened on is
 * captured and shown locked; the correction is emailed through /api/contact with the subject
 * "Content correction: <label>", or opens the visitor's mail app when sending is unavailable.
 */
export function CorrectionButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState({ path: "", title: "" });
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // A new page closes the form, so a correction can never be sent with the wrong page.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  function toggle() {
    if (!open) setPage({ path: location.pathname + location.search + location.hash, title: pageTitle() });
    setOpen(!open);
  }

  const lifted = location.pathname.startsWith("/listen/asv"); // keeps clear of the phone audio player
  return (
    <div className={`correction${lifted ? " correction--lifted" : ""}`}>
      {open && (
        <div ref={panel} className="correction-panel" role="dialog" aria-labelledby="correction-title">
          <CorrectionForm page={page} onClose={() => setOpen(false)} />
        </div>
      )}
      <button ref={button} type="button" className="correction-button" aria-expanded={open} aria-label="Suggest a correction" onClick={toggle}>
        {open ? <X aria-hidden /> : <PencilLine aria-hidden />}
        <span>{open ? "Close" : "Suggest a correction"}</span>
      </button>
    </div>
  );
}

function CorrectionForm({ page, onClose }: { page: { path: string; title: string }; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const correction: Correction = { label, page: page.path, title: page.title, message, email };

  function openMailApp() {
    const mail = composeCorrection(correction, window.location.origin);
    window.location.href = `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.text)}`;
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setStatus({ state: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "correction", label, page: page.path, title: page.title, message, email, website }),
      });
      const result = (await response.json().catch(() => ({}))) as { sent?: boolean; error?: string };
      if (response.ok && result.sent) return setStatus({ state: "sent" });
      // Not set up (local preview, or no mail login yet): fall back to the visitor's mail app.
      if (response.status === 404 || response.status === 405 || response.status === 503) {
        setStatus({ state: "idle" });
        return openMailApp();
      }
      setStatus({ state: "error", message: result.error ?? "The correction could not be sent just now." });
    } catch {
      setStatus({ state: "error", message: "The correction could not be sent. Check your connection and try again." });
    }
  }

  if (status.state === "sent")
    return (
      <div className="correction-sent">
        <Check aria-hidden />
        <h2 id="correction-title">Thank you.</h2>
        <p>Your correction has been sent. {email.trim() ? "We'll reply to the address you gave." : ""}</p>
        <button type="button" className="correction-link" onClick={onClose}>Close</button>
      </div>
    );

  const sending = status.state === "sending";
  return (
    <form onSubmit={send}>
      <p className="correction-eyebrow">{CORRECTION_SUBJECT}</p>
      <h2 id="correction-title">Suggest a <em>correction.</em></h2>

      <div className="correction-field">
        <span className="correction-label">Page</span>
        <div className="correction-page" title="The page you are on. It is sent with your correction and cannot be changed.">
          <Lock aria-hidden />
          <span><strong>{page.title || "This page"}</strong><small>{page.path}</small></span>
        </div>
      </div>

      <fieldset className="correction-field">
        <legend className="correction-label">What kind of correction?</legend>
        <div className="correction-chips">
          {CORRECTION_LABELS.map((option) => (
            <label key={option} className="correction-chip">
              <input type="radio" name="correction-label" value={option} checked={label === option} onChange={() => setLabel(option)} required />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="correction-field">
        <span className="correction-label">What should it say?</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} maxLength={4000} placeholder="Quote what is wrong and what it should say. A source helps." />
      </label>

      <label className="correction-field">
        <span className="correction-label">Your email <small>(optional, for a reply)</small></span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" />
      </label>
      {/* Hidden from people; only automated spam fills it in. */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="correction-actions">
        <button type="submit" className="correction-send" disabled={!label || !message.trim() || sending}>{sending ? "Sending…" : "Send correction"}</button>
        {status.state === "error" && <p role="alert">{status.message} You can also email {CONTACT_ADDRESS}.</p>}
      </div>
    </form>
  );
}
