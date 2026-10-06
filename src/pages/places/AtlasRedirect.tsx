import { Navigate, useLocation } from "react-router-dom";
import { ATLAS_BASE } from "./routes";

/** Preserve saved collection selections and map links from the old Places URLs. */
export default function AtlasRedirect() {
  const { pathname, search, hash } = useLocation();
  let suffix = pathname.slice("/study/places".length).replace(/\/$/, "");
  if (/^\/mockup(?:\/|$)/.test(suffix)) suffix = suffix.slice("/mockup".length);
  if (["/atlas", "/mockup2", "/mockup3"].includes(suffix)) suffix = "/map";
  if (!suffix && (new URLSearchParams(search).has("place") || new URLSearchParams(search).has("find") || ["#places-map", "#top-places"].includes(hash))) suffix = "/map";
  return <Navigate replace to={`${ATLAS_BASE}${suffix}${search}${hash}`} />;
}
