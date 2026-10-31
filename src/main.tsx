import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startPageTranslator } from "./lib/page-translator";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("main: #root element missing from index.html");

// English starts at once; a translated language waits for its page strings so the first paint is not English.
void startPageTranslator().then(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
