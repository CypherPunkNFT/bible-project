import { BookOpen, Church, GitBranch, GraduationCap, HandHeart, Map, Moon, Search, ShieldCheck, Sun, UsersRound } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SectionStrip } from "@/components/SectionStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const COMMUNITY = { to: "/testimonies", label: "Testimonies", icon: GitBranch };

const NAV = [
  { to: "/bible", label: "Bible", icon: BookOpen, end: false },
  { to: "/study", label: "Study", icon: GraduationCap, end: false },
  { to: "/apologetics", label: "Apologetics", icon: ShieldCheck, end: false },
  { to: "/teachers", label: "Teachers", icon: UsersRound, end: false },
  { to: "/resources", label: "Resources", icon: HandHeart, end: false },
  { to: "/study/atlas", label: "Atlas", icon: Map, end: false },
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
          <nav aria-label="Main" className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    (isActive && !(to === "/study" && location.pathname.startsWith("/study/atlas"))) || (to === "/bible" && (location.pathname.startsWith("/read") || location.pathname === "/library"))
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
            <span aria-hidden className="mx-1.5 h-5 w-px shrink-0 bg-line" />
            <NavLink
              to={COMMUNITY.to}
              className={({ isActive }) =>
                cn(
                  "relative flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm text-accent transition-opacity hover:opacity-80",
                  isActive && "font-semibold",
                )
              }
            >
              <COMMUNITY.icon className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">{COMMUNITY.label}</span>
              <span className="sr-only md:hidden">{COMMUNITY.label}</span>
            </NavLink>
          </nav>
          <NavLink
            to="/search"
            aria-label="Search"
            title="Search"
            className={({ isActive }) =>
              cn(
                "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                isActive ? "border-ink bg-ink text-page" : "border-line text-muted hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            <Search className="h-4 w-4" aria-hidden />
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-switch"
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Dark mode"
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            <span>{theme === "dark" ? <Moon className="h-3.5 w-3.5" aria-hidden /> : <Sun className="h-3.5 w-3.5" aria-hidden />}</span>
          </button>
          <a
            href="https://churchfamily.io"
            target="_blank"
            rel="noopener"
            title="ChurchFamily — a church community site (opens in a new tab)"
            className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 text-sm text-accent transition-colors hover:bg-surface-2 focus:outline-none sm:px-3"
          >
            <Church className="h-4 w-4" aria-hidden />
            <span className="hidden lg:inline">ChurchFamily</span>
            <span className="sr-only lg:hidden">ChurchFamily (opens in a new tab)</span>
          </a>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
