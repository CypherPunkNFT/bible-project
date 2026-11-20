import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Plugin } from "vite";
import { buildContent, PROJECT_ROOT } from "./compile.ts";
import { buildSourceDirectory } from "../source-directory.ts";

/** The source directory, then its split (scripts/split-data/sources.ts) at once, so the split is never older than the
 *  directory the build ships. Run as its own process: the split's data sets import page code this config cannot load. */
function buildSourceDirectoryAndSplit(): void {
  buildSourceDirectory(PROJECT_ROOT);
  execFileSync(process.execPath, ["--experimental-strip-types", "scripts/split-data.ts", "sources"], { cwd: PROJECT_ROOT, stdio: "inherit" });
}

/** JSON documents are the source; the frontend imports only validated, compiled projections. */
export function studyContentPlugin(): Plugin {
  return {
    name: "study-documents",
    buildStart() { buildContent(PROJECT_ROOT); buildSourceDirectoryAndSplit(); },
    configureServer(server) {
      const directories = ["content/apologetics", "content/library"].map((directory) => path.resolve(PROJECT_ROOT, directory));
      server.watcher.add(directories);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const changed = (_event: string, file: string) => {
        if (!directories.some((directory) => path.resolve(file).startsWith(directory + path.sep))) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try { buildContent(PROJECT_ROOT); buildSourceDirectoryAndSplit(); server.ws.send({ type: "full-reload" }); }
          catch (error) { server.ws.send({ type: "error", err: { message: "Study documents: " + (error as Error).message, stack: "", plugin: "study-documents" } }); }
        }, 60);
      };
      server.watcher.on("all", changed);
      server.httpServer?.once("close", () => { clearTimeout(timer); server.watcher.off("all", changed); });
    },
  };
}
