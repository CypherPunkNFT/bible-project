import { Check, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AboutProject, FounderLetter } from "@/pages/contact/AboutSections";
import { EpistleArt } from "@/pages/contact/EpistleArt";
import "@/pages/contact/contact.css";

const CONTACT_ADDRESS = "amen@bibleguide.io";

type Status = { state: "idle" | "sending" | "sent" } | { state: "error"; message: string };

/** "Grace to you" contact form, then About: 01 the project and its convictions, 02 a letter from the founder (approved mock-up F, 2026-10-20). Messages go through /api/contact to CONTACT_ADDRESS; if sending is unavailable, the visitor's own mail app opens instead. */
export default function ContactPage() {
  return (
    <div className="ct-page">
      <section className="ct-hero">
        <div>
          <p className="cv-eyebrow">A letter · a greeting · a reply</p>
          <h1>Grace to you,<em>and peace.</em></h1>
          <p className="ct-sub">The church grew by letters.<br />Write one to us.</p>
          <p className="ct-lead">
            Questions, corrections, or a word of encouragement. Write below, or to{" "}
            <a href={`mailto:${CONTACT_ADDRESS}`}>{CONTACT_ADDRESS}</a>.
          </p>
          <ContactForm />
        </div>
        <EpistleArt />
      </section>
      <AboutProject />
      <FounderLetter />
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  function openMailApp() {
    const subject = name.trim() ? `Message from ${name.trim()}` : "Message from the Bible Guide site";
    window.location.href = `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message.trim())}`;
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setStatus({ state: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const result = (await response.json().catch(() => ({}))) as { sent?: boolean; error?: string };
      if (response.ok && result.sent) {
        setStatus({ state: "sent" });
        return;
      }
      // Not set up (local preview, or no mail login yet): fall back to the visitor's mail app.
      if (response.status === 404 || response.status === 405 || response.status === 503) {
        setStatus({ state: "idle" });
        openMailApp();
        return;
      }
      setStatus({ state: "error", message: result.error ?? "The message could not be sent just now." });
    } catch {
      setStatus({ state: "error", message: "The message could not be sent — check your connection and try again." });
    }
  }

  const field = "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none";
  const sending = status.state === "sending";

  if (status.state === "sent")
    return (
      <div className="mt-8 max-w-xl rounded-2xl border border-line bg-surface p-6">
        <p className="flex items-center gap-2 font-semibold">
          <Check className="h-5 w-5 text-accent" aria-hidden />
          Thank you — your message has been sent.
        </p>
        <p className="mt-2 text-sm text-muted">{email.trim() ? "We'll reply to the address you gave." : "Leave an email address next time if you'd like a reply."}</p>
      </div>
    );

  return (
    <form onSubmit={send} className="max-w-xl space-y-3.5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Your name <span className="font-normal text-muted">(optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-semibold">
          Your email <span className="font-normal text-muted">(to get a reply)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" className={field} />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Message
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={3} maxLength={4000} className={field} />
      </label>
      {/* Hidden from people; only automated spam fills it in. */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button
        type="submit"
        disabled={!message.trim() || sending}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-page transition-opacity hover:opacity-85 focus:outline-none disabled:opacity-40"
      >
        <Mail className="h-4 w-4" aria-hidden />
        {sending ? "Sending…" : "Send message"}
      </button>
      {status.state === "error" && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {status.message} You can also email {CONTACT_ADDRESS} directly.
        </p>
      )}
    </form>
  );
}
