// "Today" as a day number in the visitor's own time zone (design 6.3, "Midnight while the page is open"): worked out
// again when the tab becomes visible and on a timer just after local midnight, so a phone left open overnight shows the
// new day in the morning. Only "today" marks move; a day page being read never changes under the reader.
import { useEffect, useState } from "react";
import { dayNumber, msUntilMidnight, today } from "./calendar";

export const todayNumber = (): number => dayNumber(today(new Date()));

export function useToday(): number {
  const [todayN, setTodayN] = useState(todayNumber);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setTodayN(todayNumber());
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilMidnight(new Date()) + 1000);
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    timer = setTimeout(refresh, msUntilMidnight(new Date()) + 1000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return todayN;
}
