// The time now, for the countdown and for noticing that the day has turned.
import { useEffect, useState } from "react";

/** The time now, ticking every second (so a countdown is right after the tab sleeps, and the day turns at midnight). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
