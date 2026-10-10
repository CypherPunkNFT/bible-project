import { ArrowRight, ArrowUpRight, BookOpen, Church, GitBranch, GraduationCap, Map, Search, X } from "lucide-react";
import { Link, useLocation, type LinkProps } from "react-router-dom";
const icons = { arrow: ArrowRight, arrowUp: ArrowUpRight, book: BookOpen, church: Church, branch: GitBranch, graduation: GraduationCap, map: Map, search: Search, x: X };
export function Icon({ name }: {
    name: keyof typeof icons;
}) { const Component = icons[name]; return <Component size={18} strokeWidth={1.5} aria-hidden/>; }
export function StudyLink(props: LinkProps) { const location = useLocation(); return <Link {...props} state={{ from: { path: location.pathname + location.search + location.hash, label: location.pathname.includes("academic") ? "Academic Studies" : location.pathname.includes("theology") ? "Scripture & Theology" : "Study hub" } }}/>; }
