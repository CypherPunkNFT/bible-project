// Development only: renders one link-preview design at exactly 1200 × 630 (see og.html). Not part of the site build.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import "@/components/home/home-hub.css";
import { OG_DESIGNS, OgCard } from "./OgCards";
import "./og.css";

const params = new URLSearchParams(window.location.search);
const design = OG_DESIGNS.find((d) => d.id === params.get("design")) ?? OG_DESIGNS[0];
document.documentElement.dataset.theme = design.theme;

const root = document.getElementById("og-root");
if (!root) throw new Error("og: #og-root element missing from og.html");
createRoot(root).render(
  <StrictMode>
    <nav className="og-picker" aria-label="Designs">
      {OG_DESIGNS.map((d) => <a key={d.id} href={`?design=${d.id}`} aria-current={d.id === design.id ? "page" : undefined}>{d.name}</a>)}
    </nav>
    <OgCard id={design.id} />
  </StrictMode>,
);
