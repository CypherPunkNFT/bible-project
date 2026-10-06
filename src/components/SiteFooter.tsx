import { ArrowRight, ArrowUpRight, BookOpen, LibraryBig } from "lucide-react";
import { Link } from "react-router-dom";

const paths = [
  { title: "Spend time in the Word", links: [["Open the reader", "/read"], ["Books & reading progress", "/library"], ["Compare Scripture editions", "/study/versions"], ["Find a passage", "/search"]] },
  { title: "Follow your questions", links: [["Study collections", "/study"], ["People & places", "/study/atlas"], ["Faith & apologetics", "/apologetics"], ["Stories of faith", "/testimonies"]] },
];

export function SiteFooter() {
  return <footer className="relative isolate mt-10 overflow-hidden border-t border-line bg-surface" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(202,161,82,0.10),transparent_60%)]" />
    <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="max-w-lg">
          <Link to="/" className="inline-flex items-center gap-3 font-serif text-xl"><img src="/favicon.svg" alt="" className="h-8 w-8" />Bible Project</Link>
          <h2 className="mt-6 font-serif text-3xl leading-tight sm:text-4xl">Rooted in Scripture.<br /><em className="font-normal text-accent">Open for discovery.</em></h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted">A place to read slowly, ask deeply, and follow the connections. Scripture, study and the voices of Christian history, brought together for a lifetime of learning.</p>
          <Link to="/read" className="mt-6 inline-flex items-center gap-3 rounded-full border border-accent/40 px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"><BookOpen className="h-4 w-4" aria-hidden />Return to the Word<ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-1 gap-8 min-[420px]:grid-cols-2 lg:pt-2">
          {paths.map(group => <div key={group.title}><h3 className="border-b border-line pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{group.title}</h3><ul className="mt-4 space-y-1">{group.links.map(([label, to]) => <li key={to}><Link to={to} className="inline-block py-2 text-sm text-muted transition-colors hover:text-ink focus-visible:text-ink">{label}</Link></li>)}</ul></div>)}
        </nav>
      </div>
      <a href="https://github.com/CypherPunkNFT/bible-project" aria-label="Bible Project on GitHub (open source)" className="mt-10 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"><svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" /></svg>Open source on GitHub</a>
      <Link to="/sources" className="group mb-10 mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-page/50 p-5 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
        <LibraryBig className="h-7 w-7 shrink-0 text-accent" strokeWidth={1.3} aria-hidden />
        <div className="flex-1"><h3 className="font-serif text-xl">A library with a paper trail.</h3><p className="mt-1 text-sm leading-relaxed text-muted">Meet the authors. Explore the collection. Trace each work to its source.</p></div>
        <span className="inline-flex items-center gap-2 text-sm text-accent">Sources & references<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden /></span>
      </Link>
    </div>
  </footer>;
}
