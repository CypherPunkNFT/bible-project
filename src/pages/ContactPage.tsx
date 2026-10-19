import { Check, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ContactArt } from "@/pages/contact/ContactArt";
import "@/pages/contact/contact.css";

const CONTACT_ADDRESS = "amen@bibleproject.io";

type Status = { state: "idle" | "sending" | "sent" } | { state: "error"; message: string };

/** Contact form, then About (the project, and who builds it). Messages go through /api/contact to CONTACT_ADDRESS; if sending is unavailable, the visitor's own mail app opens instead. */
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid items-center gap-8 pt-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Contact
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Write to us. <span className="block italic text-accent">Every word is read.</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Questions, corrections or a word of encouragement. You can also write directly to{" "}
            <a href={`mailto:${CONTACT_ADDRESS}`} className="text-accent underline underline-offset-2">
              {CONTACT_ADDRESS}
            </a>
            .
          </p>
          <ContactForm />
        </div>
        <div className="mx-auto w-full max-w-[220px] lg:order-last lg:max-w-[460px]">
          <ContactArt />
        </div>
      </section>
      <About />
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
    const subject = name.trim() ? `Message from ${name.trim()}` : "Message from the Bible Project site";
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
    <form onSubmit={send} className="mt-6 max-w-xl space-y-3.5">
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

function About() {
  const label = "font-mono text-xs uppercase tracking-[0.18em] text-muted";
  return (
    <section id="about" aria-labelledby="about-title" className="mt-9 border-t border-line pb-20 pt-7">
      <p id="about-title" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        About
      </p>
      <div className="mt-5 grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <p className={label}>01 — Bible Project</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">The wisdom of the faith, gathered in one open place.</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Bible Project brings the history, knowledge and wisdom of Christianity together in one source: the Scriptures in many
            versions and languages, the people and places of the Bible, the creeds, the teachers of the church and the hard
            questions, each linked to the next. It is free, and fully open to the public.
          </p>
        </div>
        <div>
          <p className={label}>02 — Who builds it</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Lucas Campbell Saint Laurent</h2>
          <p className="mt-1 text-sm font-semibold text-accent">Founder and sole developer</p>
          <p className="mt-4 leading-relaxed text-muted">
            Bible Project is the work of one person. Lucas founded it and is its only developer. He lives in Jacksonville,
            Florida, serves on the greet team at his church, and leads RedeemerForge, a faith-based youth programme. He builds
            this for the glory of God, so that the history, knowledge and wisdom of Christianity can be gathered in one place
            and given freely to anyone who wants it.
          </p>
        </div>
      </div>
      <figure className="mt-12 rounded-2xl border border-line bg-surface px-6 py-7 text-center sm:px-10">
        <blockquote className="font-serif text-xl italic leading-snug sm:text-2xl">
          “Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.”
        </blockquote>
        <figcaption className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">1 Corinthians 10:31 · KJV · Soli Deo gloria</figcaption>
      </figure>
    </section>
  );
}
