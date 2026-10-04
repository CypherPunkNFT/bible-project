import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Generates files for an operator to apply after production migrations. No network writes.
const origin = new URL(process.env.PUBLIC_SITE_URL ?? "https://bible-project-4af.pages.dev");
if (origin.protocol !== "https:" || origin.username || origin.password || /^(localhost|127\.|\[::1\])/.test(origin.hostname)) throw new Error("Use the public HTTPS website origin.");
const directory = path.resolve(".local/production-owner-" + randomUUID());
await mkdir(directory, { recursive: true });
const token = randomBytes(32).toString("base64url"), hash = createHash("sha256").update(token).digest("hex");
const sql = `-- Creates the owner invitation only for an empty collection. Never replaces an existing invitation.\nINSERT INTO testimony_invitations(id,token_digest,kind,expires_at)\nSELECT '${randomUUID()}','${hash}','root',unixepoch()+2592000\nWHERE NOT EXISTS (SELECT 1 FROM testimony_people) AND NOT EXISTS (SELECT 1 FROM testimony_invitations WHERE kind='root');\n`;
await writeFile(path.join(directory, "owner.sql"), sql, { mode: 0o600 });
await writeFile(path.join(directory, "private-link.txt"), `Private first-owner invitation. Apply the adjacent owner.sql to the production database first.\n\n${origin.origin}/testimonies/join#code=${token}\n\nKeep this link private. It grants owner access when the first story is published.\n`, { mode: 0o600 });
console.log("Private owner setup saved to " + directory + ". No cloud changes made.");
