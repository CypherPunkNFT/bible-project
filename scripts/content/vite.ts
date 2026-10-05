import path from "node:path";
import type { Plugin } from "vite";
import { buildContent, PROJECT_ROOT } from "./compile.ts";

/** JSON documents are the source; the frontend imports only validated, compiled projections. */
export function studyContentPlugin(): Plugin {
  return {
    name: "study-documents",
    buildStart() { buildContent(PROJECT_ROOT); },
    configureServer(server) {
      const directory = path.resolve(PROJECT_ROOT, "content/apologetics");
      server.watcher.add(directory);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const changed = (_event: string, file: string) => {
        if (!path.resolve(file).startsWith(directory + path.sep)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try { buildContent(PROJECT_ROOT); server.ws.send({ type: "full-reload" }); }
          catch (error) { server.ws.send({ type: "error", err: { message: "Study documents: " + (error as Error).message, stack: "", plugin: "study-documents" } }); }
        }, 60);
      };
      server.watcher.on("all", changed);
      server.httpServer?.once("close", () => { clearTimeout(timer); server.watcher.off("all", changed); });
    },
  };
}
