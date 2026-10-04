import { Navigate, useLocation } from "react-router-dom";

const CHART_PATHS = { references: "/study/references", structure: "/study/structure", words: "/study/gospels", "words-of-jesus": "/study/gospels", versions: "/study/versions" };
const ANCHORS = { references: "references", structure: "structure", words: "words", versions: "versions", arcs: "references", matrix: "references", sections: "structure", sizes: "structure", chapters: "structure", jesus: "words", speech: "words", timeline: "versions", coverage: "versions" } as const;

export default function StudyRedirect() {
  const location = useLocation();
  const hash = location.hash.slice(1);
  if (location.pathname === "/atlas") return <Navigate replace to={"/study/places" + location.search + location.hash} />;
  if (location.pathname === "/study/harmony") return <Navigate replace to={"/study/gospels" + (location.hash || "#harmony")} />;
  const key = location.pathname.split("/")[2] ?? new URLSearchParams(location.search).get("collection") ?? ANCHORS[hash as keyof typeof ANCHORS];
  const target = CHART_PATHS[key as keyof typeof CHART_PATHS];
  return <Navigate replace to={(target ?? "/study") + (target ? location.hash : "")} />;
}
