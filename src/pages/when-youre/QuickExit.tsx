import { useEffect } from "react";
import { installEscapeExit, leavePage } from "./quick-exit";

export function QuickExit() {
  useEffect(() => installEscapeExit(window, leavePage), []);
  return <button className="wy-exit" type="button" onClick={leavePage}>Leave this page <span>(or press Escape twice)</span></button>;
}
