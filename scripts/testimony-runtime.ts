import { build } from "esbuild";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { readFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";

export const testimonyDatabaseDirectory = () => path.resolve(process.env.TESTIMONY_DB_DIR ?? ".local/testimonies");

/** Same handler and D1 runtime used by Pages, with local-only persistent storage. */
export async function createTestimonyRuntime(directory = testimonyDatabaseDirectory()) {
  await mkdir(directory, { recursive: true });
  const bundle = await build({ entryPoints: ["server/worker.ts"], bundle: true, write: false, format: "esm", platform: "browser", target: "es2022" });
  const runtime = new Miniflare({ ...convertV4MiniflareOptions({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: "2026-10-04", compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "testimonies" }, resourcePersistencePath: directory,
    bindings: { PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL ?? "https://bible-project-4af.pages.dev" },
  }), telemetry: { enabled: false }, logRequests: false });
  try {
  const db = await runtime.getD1Database("DB");
  const exists = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='testimony_accounts'").first();
  await db.exec("CREATE TABLE IF NOT EXISTS testimony_local_migrations(name TEXT PRIMARY KEY)");
  if (exists) await db.prepare("INSERT OR IGNORE INTO testimony_local_migrations(name) VALUES ('0001_testimonies.sql')").run();
  for (const name of (await readdir("migrations")).filter((n) => n.endsWith(".sql")).sort()) {
    if (await db.prepare("SELECT name FROM testimony_local_migrations WHERE name=?").bind(name).first()) continue;
    const sql = await readFile(path.join("migrations", name), "utf8");
    const statements = sql.split("-- statement").slice(1).map((statement) => db.prepare(statement));
    await db.batch([...statements, db.prepare("INSERT INTO testimony_local_migrations(name) VALUES (?)").bind(name)]);
  }
  return runtime;
  } catch (error) { await runtime.dispose(); throw error; }
}
