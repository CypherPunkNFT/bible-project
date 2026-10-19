import { ArrowRight, ChevronUp } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { OldMapIcon } from "@/pages/places/old-maps";
import { atlasDestination } from "@/pages/places/routes";
import BY_PLACE from "./old-maps-by-place.json";

// The folded bar at the foot of a place's panel: "Old maps of <place>" and a count, opening upward into up to four old
// maps of it, earliest first. "Not vital, just fun" (owner, 2026-10-19), so it stays folded until asked for. A place no
// old map names gets nothing. Built by scripts/old-maps-places.py.

interface OldMap { year: number; title: string; maker: string | null; credit: string; url: string; image: string }
interface PlaceMaps { count: number; earliest: number | null; maps: OldMap[] }

const fmt = (n: number) => n.toLocaleString("en-GB");

export function OldMapsFold({ placeId, placeName }: { placeId: string; placeName: string }) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const entry = (BY_PLACE as Record<string, PlaceMaps>)[placeId];
  if (!entry) return null;
  const tab = open ? 0 : -1;

  return (
    <div className="shrink-0 rounded-b-2xl border-t border-line" style={{ ["--fold-tone" as string]: "var(--epistles)" }}>
      <div
        id={drawerId}
        aria-hidden={!open}
        className={cn("grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="min-h-0 overflow-hidden px-4">
          <ul className="grid grid-cols-4 gap-2 pt-3.5">
            {entry.maps.map((map) => (
              <li key={map.image}>
                <a
                  href={map.url}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={tab}
                  title={`${map.year}, ${map.title}${map.maker ? `, by ${map.maker}` : ""}. ${map.credit}`}
                  className="group grid gap-1"
                >
                  <img src={map.image} alt={`${map.title}, ${map.year}`} loading="lazy" className="aspect-square w-full rounded-md border border-transparent object-cover transition-colors group-hover:border-[color:var(--fold-tone)]" />
                  <span className="font-serif text-sm text-[color:var(--fold-tone)]">{map.year}</span>
                </a>
              </li>
            ))}
          </ul>
          <Link to={atlasDestination("old-maps")} tabIndex={tab} className="inline-flex items-center gap-1.5 pb-3 pt-2 text-xs text-[color:var(--fold-tone)] hover:underline">
            {entry.count === 1 ? "1 old map names it" : `${fmt(entry.count)} old maps name it${entry.earliest ? `, from ${entry.earliest}` : ""}`} · Old maps <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-b-2xl bg-[color-mix(in_srgb,var(--fold-tone)_5%,var(--surface))] px-4 py-2.5 text-left text-sm outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--fold-tone)_10%,var(--surface))]"
      >
        <OldMapIcon size={18} className="shrink-0 text-[color:var(--fold-tone)]" />
        <span className="flex-1 font-semibold">Old maps of {placeName}</span>
        <span className="font-medium text-[color:var(--fold-tone)]">{fmt(entry.count)}</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--fold-tone)_12%,transparent)] text-[color:var(--fold-tone)]">
          <ChevronUp className={cn("h-4 w-4 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
        </span>
      </button>
    </div>
  );
}
