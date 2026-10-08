// Development only: compiles the link-preview designs (og.html) on their own into .local/og-dist, never into the site.
//   node node_modules/vite/bin/vite.js build -c src/dev/og/vite.og.config.ts
import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const website = path.resolve(import.meta.dirname, "../../..");

export default defineConfig({
  root: website,
  plugins: [react()],
  publicDir: false, // the page needs only the logo, copied by scripts/og-image.mjs; the site's public/ is large
  resolve: { alias: { "@": path.join(website, "src") } },
  build: {
    outDir: path.join(website, ".local/og-dist"),
    emptyOutDir: true,
    rollupOptions: { input: path.join(website, "src/dev/og/og.html") },
  },
});
