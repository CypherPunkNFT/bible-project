// The countdown to the next puzzle, shown on the home card and the Daily Five's summary.
import { formatNumber } from "@/lib/site-format";
import { msUntilMidnight } from "./daily";

export function Countdown({ now }: { now: Date }) {
  const left = Math.max(0, Math.floor(msUntilMidnight(now) / 60_000));
  const hours = formatNumber(Math.floor(left / 60));
  const minutes = formatNumber(left % 60);
  return <p className="mq-countdown">{`Next puzzle in ${hours} h ${minutes} min`}</p>;
}
