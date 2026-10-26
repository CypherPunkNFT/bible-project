import { ArrowRight, LifeBuoy, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const CONTACT_ADDRESS = "amen@bibleguide.io";

const link = (to: string, label: string) => <Link to={to} className="text-accent underline-offset-4 hover:underline">{label}</Link>;

export const QUESTIONS: { question: string; answer: ReactNode }[] = [
  { question: "Is Bible Guide free?", answer: "Yes. The website and the app are free, with no ads, no subscription and no account." },
  { question: "I found a mistake. How do I report it?", answer: <>Press "Suggest a correction" on that page and describe what is wrong; the page address is sent with it. Or write to us with the page address.</> },
  { question: "Does the app work without internet?", answer: "The Bible itself does, in every version the app carries. Study pages download the first time you open them and then work offline. The audio Bible can be downloaded book by book from its page on bibleguide.io and played without a connection; videos need one." },
  { question: "Where are my bookmarks and notes?", answer: "On your own device. They are not shared between devices, and deleting the app or clearing your browser removes them." },
  { question: "How do I delete my testimony?", answer: "Open your private access link and choose Delete my testimony. Your name, story, its earlier versions and its place on the map are deleted for good." },
  { question: "What information do we collect?", answer: <>Very little, and nothing for advertising. The {link("/privacy", "Privacy Policy")} says exactly what and why.</> },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Support</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">How can we help?</h1>
      <p className="mt-6 text-lg leading-8 text-muted">Help with the Bible Guide website and app. If your question is not answered here, write to us.</p>
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:gap-6">
        <Mail className="h-7 w-7 shrink-0 text-accent" strokeWidth={1.4} aria-hidden />
        <div className="flex-1">
          <h2 className="font-serif text-xl">Email us</h2>
          <a href={`mailto:${CONTACT_ADDRESS}`} className="mt-1 inline-block text-accent underline-offset-4 hover:underline">{CONTACT_ADDRESS}</a>
        </div>
        <Link to="/contact" className="inline-flex items-center gap-2 text-sm text-accent">Or use the contact form<ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
      <section className="mt-12">
        <h2 className="border-b border-line pb-3 font-serif text-2xl">Common questions</h2>
        <dl>
          {QUESTIONS.map(item => (
            <div key={item.question} className="border-b border-line py-5">
              <dt className="font-medium">{item.question}</dt>
              <dd className="mt-2 leading-8 text-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-line p-6 sm:flex-row sm:items-center sm:gap-6">
        <LifeBuoy className="h-7 w-7 shrink-0 text-accent" strokeWidth={1.4} aria-hidden />
        <p className="flex-1 leading-7 text-muted">In danger now? Call 911. Thinking of suicide or in crisis? Call or text 988. More free help lines and places: {link("/resources/life", "Help for life")}.</p>
      </div>
    </div>
  );
}
