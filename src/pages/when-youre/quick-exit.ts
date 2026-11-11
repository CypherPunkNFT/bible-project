// The quick exit's address and its double-Escape shortcut (design 6.2), kept apart from the button so both can be tested.
export const EXIT_ADDRESS = "https://www.google.com/";
export const leavePage = () => window.location.replace(EXIT_ADDRESS);

/** A pair of deliberate Escape presses; held/repeating keys never trigger it. */
export function installEscapeExit(target: Window, exit: () => void, now = () => Date.now()): () => void {
  let first: number | null = null;
  const handler = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.repeat) return;
    const time = now();
    if (first !== null && time - first <= 1000) {
      first = null;
      exit();
    } else first = time;
  };
  target.addEventListener("keydown", handler);
  return () => target.removeEventListener("keydown", handler);
}
