import { Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

const CONTACT_ADDRESS = "amen@bibleproject.io";

/** Contact form. Sending opens the visitor's own mail app with the message filled in, addressed to CONTACT_ADDRESS. */
export default function ContactPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function send(event: FormEvent) {
    event.preventDefault();
    const subject = name.trim() ? `Message from ${name.trim()}` : "Message from the Bible Project site";
    window.location.href = `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message.trim())}`;
  }

  const field = "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Contact</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Write to us.</h1>
      <p className="mt-4 text-muted">
        Questions, corrections or a word of encouragement — every message is read. You can also write directly to{" "}
        <a href={`mailto:${CONTACT_ADDRESS}`} className="text-accent underline underline-offset-2">
          {CONTACT_ADDRESS}
        </a>
        .
      </p>

      <form onSubmit={send} className="mt-10 space-y-5">
        <label className="block text-sm font-semibold">
          Your name <span className="font-normal text-muted">(optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-semibold">
          Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={7} maxLength={4000} className={field} />
        </label>
        <button
          type="submit"
          disabled={!message.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-page transition-opacity hover:opacity-85 focus:outline-none disabled:opacity-40"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Send message
        </button>
        <p className="text-xs text-muted">Sending opens your email app with the message ready to go.</p>
      </form>
    </div>
  );
}
