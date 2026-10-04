import { BarChart3, BookOpen, GitBranch, GraduationCap, Map, Moon, Search, ShieldCheck, Sun } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SectionStrip } from "@/components/SectionStrip";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/bible", label: "Bible", icon: BookOpen, end: false },
  { to: "/study", label: "Study", icon: GraduationCap, end: false },
  { to: "/testimonies", label: "Testimonies", icon: GitBranch, end: false },
  { to: "/apologetics", label: "Apologetics", icon: ShieldCheck, end: false },
  { to: "/charts", label: "Charts", icon: BarChart3, end: false },
  { to: "/atlas", label: "Atlas", icon: Map, end: false },
  { to: "/search", label: "Search", icon: Search, end: false },
];

export function Layout({ children }: { children: ReactNode }) {
  const [theme, toggleTheme] = useTheme();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <SectionStrip className="h-1" />
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6">
          <Link to="/" className="mr-2 flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="hidden xs:inline">Bible Project</span>
          </Link>
          <nav aria-label="Main" className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    isActive || (to === "/bible" && (location.pathname.startsWith("/read") || location.pathname === "/library"))
                      ? "bg-ink text-page"
                      : "text-muted hover:bg-surface-2 hover:text-ink",
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">{label}</span>
                <span className="sr-only md:hidden">{label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line bg-surface/60" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Every Bible text here is free: all public domain but one openly licensed Hindi text (CC BY-SA). Texts from eBible.org.</p>
          <p>
            Cross references and places from{" "}
            <a className="underline hover:text-ink" href="https://www.openbible.info/" rel="noreferrer">
              OpenBible.info
            </a>{" "}
            (CC-BY). <Link className="underline hover:text-ink" to="/versions">Sources</Link> ·{" "}
            <a className="underline hover:text-ink" href="https://github.com/CYPKNFT/bible-project" rel="noreferrer">
              Code on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
