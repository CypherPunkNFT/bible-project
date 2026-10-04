import type { Plugin, Connect } from "vite";
import { createTestimonyRuntime } from "./testimony-runtime";

/** Local development only. Production uses functions/api/testimonies/[[path]].ts. */
export function testimonyApiPlugin(): Plugin {
  const attach = (server: { middlewares: { use: (handler: Connect.NextHandleFunction) => void }; httpServer: { once: (event: string, callback: () => void) => unknown } | null }) => {
    let runtime: ReturnType<typeof createTestimonyRuntime> | undefined;
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/testimonies/")) return next();
      try {
        const chunks: Buffer[] = []; let size = 0;
        for await (const chunk of req) { const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += bytes.length; if (size > 65536) { res.writeHead(413, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "The form is too large." })); return; } chunks.push(bytes); }
        runtime ??= createTestimonyRuntime();
        const headers: Record<string, string> = {}; for (const [name, value] of Object.entries(req.headers)) if (value) headers[name] = Array.isArray(value) ? value.join(", ") : value;
        const response = await (await runtime).dispatchFetch(`http://${req.headers.host}${req.url}`, { method: req.method, headers, ...(size ? { body: Buffer.concat(chunks) } : {}) });
        res.statusCode = response.status; response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        console.error("testimony_local_runtime_unavailable");
        res.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify({ error: "Testimonies are temporarily unavailable. Please try again shortly." }));
        void runtime?.then((instance) => instance.dispose()).catch(() => {});
        runtime = undefined;
      }
    });
    server.httpServer?.once("close", () => { void runtime?.then((instance) => instance.dispose()).catch(() => {}); });
  };
  return { name: "testimony-api", configureServer: attach, configurePreviewServer: attach };
}
