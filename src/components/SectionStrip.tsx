import { SECTIONS, sectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";

/** The reading chart's seven colours as one thin band — the site's signature. */
export function SectionStrip({ className, includeApocrypha = false }: { className?: string; includeApocrypha?: boolean }) {
  const shown = SECTIONS.filter((s) => includeApocrypha || s.id !== "apocrypha");
  return (
    <div className={cn("flex w-full", className)} aria-hidden>
      {shown.map((s) => (
        <span key={s.id} className="flex-1" style={{ background: sectionColor(s.id) }} />
      ))}
    </div>
  );
}

export function SectionDot({ id, className }: { id: Parameters<typeof sectionColor>[0]; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ background: sectionColor(id) }} />;
}
