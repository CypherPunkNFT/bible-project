// A number that only pulses when it grows (the streak flame, a score that pops up a step): the hook hands back a count
// of growths, which the component uses as a key so the animation runs again only then, never on a plain redraw.
import { useEffect, useRef, useState } from "react";

export function useGrew(count: number): number {
  const previous = useRef(count);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (count > previous.current) setPulse((n) => n + 1);
    previous.current = count;
  }, [count]);
  return pulse;
}
