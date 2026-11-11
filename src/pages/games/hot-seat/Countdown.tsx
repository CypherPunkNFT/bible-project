// Hot seat: 3, 2, 1 before the first question (design §6.3), a second each with a tick each. Each digit scales up and
// fades as the next lands (keyed, so the animation runs again); the count itself is state and never waits for it.
// Taps do nothing here, so a double tap on Start can never mark the first question.
import { useEffect, useRef, useState } from "react";
import { beep } from "../charades/sound";

export function Countdown({ sound, onDone }: { sound: boolean; onDone: () => void }) {
  const [count, setCount] = useState(3);
  const latest = useRef({ sound, onDone });
  latest.current = { sound, onDone };
  useEffect(() => {
    if (latest.current.sound) beep("tick");
    const timer = window.setTimeout(() => (count > 1 ? setCount(count - 1) : latest.current.onDone()), 1000);
    return () => window.clearTimeout(timer);
  }, [count]);
  return <div className="hs-countdown" aria-live="assertive">
    <span key={`ring-${count}`} className="hs-count-ring" aria-hidden="true" />
    <span key={count} className="hs-count-digit">{count}</span>
  </div>;
}
