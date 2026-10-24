import { BookOpen, Church, GitBranch, GraduationCap, HandHeart, Mail, Menu, Moon, Search, ShieldCheck, Sun, UsersRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SectionStrip } from "@/components/SectionStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import "./site-navigation.css";
import "./site-page-transitions.css";
import { usePageArrival } from "@/components/usePageArrival";
import { useLongMemoryTransition } from "@/components/people-pages/useLongMemoryTransition";

const COMMUNITY = { to: "/testimonies", label: "Testimonies", icon: GitBranch, end: false };
const CONTACT = { to: "/contact", label: "Contact", icon: Mail, end: false };

const NAV = [
  { to: "/bible", label: "Bible", icon: BookOpen, end: false },
  { to: "/study", label: "Study", icon: GraduationCap, end: false },
  { to: "/apologetics", label: "Apologetics", icon: ShieldCheck, end: false },
  { to: "/teachers", label: "Teachers", icon: UsersRound, end: false },
  { to: "/resources", label: "Resources", icon: HandHeart, end: false },
];

// Everything the mobile header hides behind the hamburger must stay reachable here.
const MOBILE_MENU_LINKS = [...NAV, COMMUNITY, CONTACT];

export function Layout({ children }: { children: ReactNode }) {
  const [theme, toggleTheme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const memoryTransition = useLongMemoryTransition();
  usePageArrival();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header data-site-header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <SectionStrip className="h-1" />
        <div className="site-header-row mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" className="mr-auto flex shrink-0 items-center gap-2 whitespace-nowrap font-serif text-lg font-semibold tracking-tight sm:mr-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span>Bible Guide</span>
          </Link>
          <nav aria-label="Main" className="site-navigation no-scrollbar hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "site-nav-item relative flex shrink-0 items-center gap-1.5 px-3 text-sm transition-colors",
                    isActive || (to === "/bible" && (location.pathname.startsWith("/read") || location.pathname === "/library" || location.pathname === "/listen" || location.pathname.startsWith("/listen/")))
                      ? "site-nav-selected"
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
                  "site-nav-item relative flex shrink-0 items-center gap-1.5 px-3 text-sm text-accent transition-opacity hover:opacity-80",
                  isActive && "site-nav-selected",
                )
              }
            >
              <COMMUNITY.icon className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">{COMMUNITY.label}</span>
              <span className="sr-only md:hidden">{COMMUNITY.label}</span>
            </NavLink>
          </nav>
          <NavLink
            to="/contact"
            aria-label="Contact"
            title="Contact"
            className={({ isActive }) =>
              cn(
                "hidden h-[34px] w-[34px] shrink-0 place-items-center rounded-full border transition-colors focus:outline-none sm:grid",
                isActive ? "border-ink bg-ink text-page" : "border-line text-muted hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            <Mail className="h-4 w-4" aria-hidden />
          </NavLink>
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
            className="hidden h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 text-sm text-accent transition-colors hover:bg-surface-2 focus:outline-none sm:flex sm:px-3"
          >
            <Church className="h-4 w-4" aria-hidden />
            <span className="hidden lg:inline">ChurchFamily</span>
            <span className="sr-only lg:hidden">ChurchFamily (opens in a new tab)</span>
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none sm:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav-menu" aria-label="Mobile" className="border-t border-line bg-page sm:hidden">
            <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-1 px-4 py-3 sm:px-6">
              {MOBILE_MENU_LINKS.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive ? "bg-surface-2 font-semibold text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
              <li>
                <a
                  href="https://churchfamily.io"
                  target="_blank"
                  rel="noopener"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-accent transition-colors hover:bg-surface-2"
                >
                  <Church className="h-4 w-4 shrink-0" aria-hidden />
                  ChurchFamily
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>
        )}
      </header>
      <main id="main" className="flex-1" onClickCapture={memoryTransition}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
