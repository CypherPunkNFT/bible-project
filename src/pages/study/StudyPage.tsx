import { ArrowRight, BookMarked, Crown, Flame, Mail, Map, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { tone, type Tone } from "@/lib/sections";

const RESOURCES: { to: string; title: string; text: string; tone: Tone; icon: typeof Map; source: string }[] = [
  { to: "/study/harmony", title: "Harmony of the Gospels", text: "185 events in the life of Christ, with where each Gospel tells them — open one to read the four side by side.", tone: "gospels", icon: BookMarked, source: "A. T. Robertson, 1922" },
  { to: "/study/miracles", title: "Miracles in the Bible", text: "The 35 miracles of Jesus, and the miracles worked through Moses, Elijah, Elisha, Peter, Paul and others.", tone: "acts", icon: Sparkles, source: "Robertson; Torrey's Topical Textbook" },
  { to: "/study/letters", title: "New Testament letters", text: "The shape of all 21 letters, section by section — who wrote each, and to whom.", tone: "epistles", icon: Mail, source: "Berean Standard Bible headings" },
  { to: "/study/people", title: "People in the Bible", text: "3,130 people — who they were, their families, and every verse that names them.", tone: "history", icon: Users, source: "STEP Bible (CC BY 4.0)" },
  { to: "/study/prophets", title: "Prophets in the Bible", text: "From Moses to Agabus, in order of the kings they served under — the writing prophets marked.", tone: "prophets", icon: Flame, source: "STEP Bible; dated by Scripture" },
  { to: "/study/names", title: "Names of God", text: "302 names and titles of the Father, the Son and the Holy Spirit, each with its verses.", tone: "revelation", icon: Crown, source: "the Faith page's list" },
  { to: "/atlas", title: "Places in the Bible", text: "1,252 places on the map, each with the verses that name it.", tone: "poetry", icon: Map, source: "OpenBible.info (CC BY)" },
];

export default function StudyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <header className="pb-8 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Study</p>
        <h1 className="mt-1 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Tables and guides for reading the whole Bible.</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Each one is rebuilt from free, public sources — old reference books in the public domain and open data — and every reference opens the reader.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map(({ to, title, text, tone: t, icon: Icon, source }) => (
          <li key={to}>
            <Link to={to} className="group flex h-full overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="flex w-14 shrink-0 items-start justify-center pt-5" style={{ background: tone(t).tab, color: tone(t).tabInk }}>
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="flex flex-col p-5">
                <span className="flex items-center gap-1 font-serif text-xl font-semibold">
                  {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
                <span className="mt-1 text-sm text-muted">{text}</span>
                <span className="mt-3 text-xs text-muted/80">From {source}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
