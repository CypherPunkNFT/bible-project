import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { preview } from "vite";
import { createTestimonyRuntime } from "./testimony-runtime.ts";
import { ROOT_ACCESS, ROOT_INVITATION } from "../e2e/testimony-fixtures.ts";
import { TESTIMONY_DEMO } from "../src/data/testimony-demo.ts";

await mkdir("e2e/.output", { recursive: true });
process.env.TESTIMONY_DB_DIR = await mkdtemp(path.resolve("e2e/.output/browser-db-"));
const runtime = await createTestimonyRuntime();
const db = await runtime.getD1Database("DB");
const origin = "http://127.0.0.1:8934";
const sessions = new Map<string, string>();
async function post(route: string, body: unknown, cookie = "") {
  const result = await runtime.dispatchFetch(origin + "/api/testimonies/" + route, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(body) });
  if (!result.ok) throw new Error("Fixture setup failed: " + route + " " + result.status + " " + await result.text());
  return result;
}
try {
  await db.prepare("INSERT INTO testimony_invitations(id,token_digest,kind,expires_at,created_at) VALUES (?,?, 'root', ?, ?)").bind(randomUUID(), createHash("sha256").update(ROOT_INVITATION).digest("hex"), Math.floor(Date.now() / 1000) + 3600, Math.floor(Date.now() / 1000)).run();
  for (const node of TESTIMONY_DEMO) {
    let token = ROOT_INVITATION;
    if (node.parentId) {
      const invitation = await (await post("invitations", {}, sessions.get(node.parentId))).json() as { url: string };
      token = new URLSearchParams(new URL(invitation.url).hash.slice(1)).get("code")!;
    }
    const result = await post("submissions", { ...node, publicConsent: true, invitationToken: token, accessToken: node.parentId ? randomBytes(32).toString("base64url") : ROOT_ACCESS, requestId: randomUUID() });
    sessions.set(node.id, result.headers.get("set-cookie")!.split(";")[0]);
  }
} finally { await runtime.dispose(); }
const server = await preview({ preview: { port: 8934, strictPort: true } });
server.printUrls();
