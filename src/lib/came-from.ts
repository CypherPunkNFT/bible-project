/** Where a visitor came from, carried in router state to a page for one thing (a person, later places and topics). */
export interface CameFrom { path: string; label: string }

/** Link state recording the current page as the way back: `<Link to="/people/abraham" state={cameFrom("People & genealogies")}>`. */
export function cameFrom(label: string): { from: CameFrom } {
  return { from: { path: window.location.pathname + window.location.search + window.location.hash, label } };
}

export const isCameFrom = (value: unknown): value is CameFrom =>
  typeof value === "object" && value !== null && typeof (value as CameFrom).path === "string" && (value as CameFrom).path.startsWith("/")
  && typeof (value as CameFrom).label === "string";
