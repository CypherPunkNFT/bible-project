import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createTestimonyRuntime } from "./testimony-runtime.ts";

// Local database only. Never creates or modifies a Cloudflare account or hosted database.
const runtime = await createTestimonyRuntime();
try {
  const db = await runtime.getD1Database("DB");
  if (await db.prepare("SELECT id FROM testimony_people LIMIT 1").first()) {
    console.log("The local collection has already started. Use the contributor's private access link.");
  } else {
    const token = randomBytes(32).toString("base64url"), digest = createHash("sha256").update(token).digest("hex");
    // Re-running before the first story replaces only the unused owner invitation.
    await db.prepare("DELETE FROM testimony_invitations WHERE kind='root' AND redeemed_by IS NULL").run();
    await db.prepare("INSERT INTO testimony_invitations(id,token_digest,kind,expires_at) VALUES (?,?,'root',unixepoch()+2592000)").bind(randomUUID(), digest).run();
    await mkdir(".local", { recursive: true });
    const target = path.resolve(".local/testimonies-owner-link.txt");
    await writeFile(target, `Private local owner invitation. Do not share this file.\n\nhttp://127.0.0.1:8931/testimonies/join#code=${token}\n\nThis link starts the local collection. Production receives its own invitation during deployment.\n`, { encoding: "utf8", mode: 0o600 });
    console.log("Local database ready. The private first-story link is saved in " + target);
  }
} finally { await runtime.dispose(); }
