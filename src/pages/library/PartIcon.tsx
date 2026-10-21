import { PART_ICONS, type PartId } from "./part-content";

/** A part's line icon (part-content.ts). */
export function PartIcon({ id, size = 22 }: { id: PartId; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PART_ICONS[id]} />
    </svg>
  );
}
