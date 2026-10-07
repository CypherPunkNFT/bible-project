import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { isCameFrom, type CameFrom } from "@/lib/came-from";

/** "Back to …" naming the page the visitor came from; the fallback when they arrived directly (a shared link, a new tab). */
export function BackLink({ fallback }: { fallback: CameFrom }) {
  const state: unknown = useLocation().state;
  const carried = typeof state === "object" && state !== null ? (state as { from?: unknown }).from : undefined;
  const from = isCameFrom(carried) ? carried : fallback;
  return <Link to={from.path} className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent"><ArrowLeft size={15} aria-hidden />Back to {from.label}</Link>;
}
