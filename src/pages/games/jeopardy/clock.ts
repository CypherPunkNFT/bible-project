// Bible Jeopardy's clock (design 6.5): the seconds left on a clue, counted by the game itself in 200 ms steps, standing
// still while the window is hidden or the host has paused it, and never below zero. The kit's TimerBar only draws it.
import { useEffect, useRef, useState } from "react";

export interface Clock { secondsLeft: number; done: boolean }

/** Counts `seconds` down from the first render; `onDone` fires once, when the clock reaches zero. */
export function useClock(seconds: number, paused = false, onDone?: () => void): Clock {
  const [left, setLeft] = useState(seconds * 1000);
  const done = left <= 0;
  const fired = useRef(false);
  const latest = useRef(onDone);
  latest.current = onDone;
  useEffect(() => {
    if (paused || done) return;
    let before = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const step = document.hidden ? 0 : now - before;
      before = now;
      setLeft((value) => Math.max(0, value - step));
    }, 200);
    return () => window.clearInterval(id);
  }, [paused, done]);
  useEffect(() => {
    if (!done || fired.current) return;
    fired.current = true;
    latest.current?.();
  }, [done]);
  return { secondsLeft: left / 1000, done };
}
