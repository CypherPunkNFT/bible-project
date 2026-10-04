import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { createTestimonyRuntime } from "../testimony-runtime.ts";
import type { TestimonyAccount, TestimonyBranch, TestimonyInvite, TestimonyReport } from "../../src/lib/testimony-contract.ts";
import "./testimonies-migration.ts";

await mkdir("e2e/.output", { recursive: true });
const directory = await mkdtemp(path.resolve("e2e/.output/api-test-"));
let runtime = await createTestimonyRuntime(directory);
const origin = "http://127.0.0.1:8934", token = () => randomBytes(32).toString("base64url");
const value = (name: string) => ({ name, title: "A testimony for runtime verification", blurb: "A short introduction to this automated test testimony.", body: "This is an automated test story stored only in an isolated local test database. It verifies that a person's testimony is published and connected through an actual accepted invitation.", theme: "Hope", happenedWhen: "Spring 2022", publicConsent: true });
async function call<T = Record<string, unknown>>(route: string, method = "GET", data?: unknown, cookie?: string, requestOrigin: string | null = origin) {
  const response = await runtime.dispatchFetch(origin + "/api/testimonies/" + route, { method, headers: { ...(requestOrigin ? { Origin: requestOrigin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(data !== undefined ? { "Content-Type": "application/json" } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
  return { status: response.status, data: await response.json() as T, cookie: response.headers.get("Set-Cookie")?.split(";")[0], headers: response.headers };
}
const payload = (invitationToken: string, name: string) => ({ ...value(name), invitationToken, accessToken: token(), requestId: randomUUID() });
async function newInvite(cookie: string) {
  const result = await call<TestimonyInvite>("invitations", "POST", {}, cookie); assert.equal(result.status, 201);
  assert.equal(new URL(result.data.url).origin, "https://bible-project-4af.pages.dev");
  assert.equal(new URL(result.data.url).pathname, "/testimonies/join");
  return { ...result.data, token: new URLSearchParams(new URL(result.data.url).hash.slice(1)).get("code")! };
}
let checks = 0;
function passed(description: string) { checks++; console.log("PASS " + description); }
try {
  const db = await runtime.getD1Database("DB"), rootCode = token();
  await db.prepare("INSERT INTO testimony_invitations(id,token_digest,kind,expires_at) VALUES (?,?,'root',unixepoch()+1000)").bind(randomUUID(), createHash("sha256").update(rootCode).digest("hex")).run();
  const rootSubmission = payload(rootCode, "Runtime root");
  assert.equal((await call("submissions", "POST", { ...rootSubmission, publicConsent: false })).status, 400);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM testimony_people").first<{ count: number }>())?.count, 0);
  const root = await call<{ personId: string; accessUrl: string }>("submissions", "POST", rootSubmission);
  assert.equal(root.status, 201); assert.ok(root.cookie); assert.match(root.headers.get("Set-Cookie")!, /HttpOnly; SameSite=Lax/);
  assert.equal((await call<TestimonyAccount>("me", "GET", undefined, root.cookie)).data.owner, true);
  passed("publication requires a confirmed publish action and creates an owned root atomically");

  assert.equal((await call("invitations", "POST", { inviterId: root.data.personId })).status, 401);
  const invitation = await newInvite(root.cookie);
  for (let index = 0; index < 2; index++) assert.equal((await call("invitations/inspect", "POST", { token: invitation.token })).status, 200);
  const childSubmission = payload(invitation.token, "Runtime child");
  const child = await call<{ personId: string }>("submissions", "POST", { ...childSubmission, parentId: "forged", publishedAt: "1900-01-01" });
  assert.equal(child.status, 201); assert.ok(child.cookie);
  const childStory = await call<{ parentId: string; publishedAt: string }>("stories/" + child.data.personId);
  assert.equal(childStory.data.parentId, root.data.personId); assert.ok(new Date(childStory.data.publishedAt).getFullYear() > 2020);
  assert.equal((await call("submissions", "POST", payload(invitation.token, "Another claimant"))).status, 410);
  passed("public URLs use the website; inspection is read-only; claimed parent and date come from the server");

  const replay = await call("submissions", "POST", childSubmission); assert.equal(replay.status, 200);
  assert.equal((await call("submissions", "POST", { ...childSubmission, title: "Different submission content" })).status, 409);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM testimony_people").first<{ count: number }>())?.count, 2);
  passed("lost-response retries are idempotent and changed retries do not overwrite a story");

  const raceInvite = await newInvite(root.cookie);
  const raced = await Promise.all([call("submissions", "POST", payload(raceInvite.token, "Race one")), call("submissions", "POST", payload(raceInvite.token, "Race two"))]);
  assert.equal(raced.filter((r) => r.status === 201).length, 1); assert.ok(raced.some((r) => r.status === 409 || r.status === 410));
  assert.equal((await db.prepare("SELECT count(*) AS count FROM testimony_accounts").first<{ count: number }>())?.count, 3);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM testimony_people").first<{ count: number }>())?.count, 3);
  passed("simultaneous claims leave one contributor and no orphan account");

  const revoked = await newInvite(root.cookie);
  assert.equal((await call("invitations/" + revoked.id, "DELETE", undefined, child.cookie)).status, 404);
  assert.equal((await call("invitations/" + revoked.id, "DELETE", undefined, root.cookie)).status, 200);
  assert.equal((await call("invitations/inspect", "POST", { token: revoked.token })).status, 410);
  const expired = await newInvite(root.cookie);
  await db.prepare("UPDATE testimony_invitations SET created_at=unixepoch()-100,expires_at=unixepoch()-1 WHERE id=?").bind(expired.id).run();
  assert.equal((await call("invitations/inspect", "POST", { token: expired.token })).status, 410);
  passed("revocation belongs to the inviter and expired invitations cannot be accepted");

  assert.equal((await call("invitations", "POST", {}, root.cookie, "https://untrusted.example")).status, 403);
  assert.equal((await call("invitations", "POST", {}, root.cookie, null)).status, 403);
  assert.equal((await call("submissions", "POST", { body: "x".repeat(1048577) })).status, 413);
  assert.equal((await call("submissions", "POST", [])).status, 400);
  passed("cross-site writes, missing origins, oversized requests and malformed forms are rejected");

  const grandInvite = await newInvite(child.cookie);
  const longBody = "transformation ".repeat(5000) + "\n\nA final paragraph with Unicode: 🙏 χάρις 恩典.";
  const grandSubmission = { ...payload(grandInvite.token, "Runtime grandchild"), body: longBody };
  const grand = await call<{ personId: string }>("submissions", "POST", grandSubmission); assert.equal(grand.status, 201);
  assert.equal((await call<{ body: string }>("stories/" + grand.data.personId)).data.body, longBody);
  assert.equal((await call<TestimonyAccount>("me", "GET", undefined, grand.cookie)).data.person.blurb, grandSubmission.blurb);
  assert.equal((await call("my-story", "POST", { ...value("Runtime grandchild"), body: "x".repeat(100001), version: 1 }, grand.cookie)).status, 400);
  assert.equal((await call("my-story", "POST", { ...grandSubmission, blurb: "An updated short introduction, separate from the full testimony.", version: 1 }, grand.cookie)).status, 200);
  assert.equal((await call<{ body: string }>("stories/" + grand.data.personId)).data.body, longBody);
  const shortInvite = await newInvite(grand.cookie!);
  const short = await call<{ personId: string }>("submissions", "POST", { ...payload(shortInvite.token, "Short story"), body: "" }); assert.equal(short.status, 201);
  assert.equal((await call<{ hasFullTestimony: boolean }>("stories/" + short.data.personId)).data.hasFullTestimony, false);
  passed("5,000-word stories publish and edit intact; a blurb alone is valid and oversized stories are rejected");
  const current = (await call<TestimonyAccount>("me", "GET", undefined, child.cookie)).data;
  assert.equal((await call("my-story", "POST", { ...value("Updated child"), version: 99 }, child.cookie)).status, 409);
  assert.equal((await call("my-story", "POST", { ...value("Updated child"), version: current.version, personId: root.data.personId }, child.cookie)).status, 200);
  const updated = (await call<TestimonyAccount>("me", "GET", undefined, child.cookie)).data;
  assert.equal(updated.person.publishedAt, childStory.data.publishedAt); assert.equal(updated.person.name, "Updated child");
  assert.equal((await call<{ name: string }>("stories/" + root.data.personId)).data.name, "Runtime root");
  passed("edits enforce ownership and revision versions and preserve the original shared date");

  await call("withdraw", "POST", {}, child.cookie);
  assert.equal((await call("stories/" + child.data.personId)).status, 404);
  const hidden = (await call<TestimonyBranch>("branches?root=" + root.data.personId)).data;
  assert.equal(hidden.nodes.find((n) => n.id === child.data.personId)?.name, "Story unavailable");
  assert.equal(hidden.nodes.find((n) => n.id === child.data.personId)?.theme, "");
  assert.ok(hidden.nodes.some((n) => n.id === grand.data.personId && n.available));
  assert.equal((await call("my-story", "POST", { ...value("Updated child"), version: updated.version }, child.cookie)).status, 200);
  passed("withdrawal removes identity and text while descendants remain connected; authors can republish");

  assert.equal((await call("reports", "POST", { personId: child.data.personId, reason: "Automated test report" })).status, 201);
  assert.equal((await call("reports", "GET", undefined, child.cookie)).status, 404);
  const report = (await call<TestimonyReport[]>("reports", "GET", undefined, root.cookie)).data[0];
  assert.equal((await call("reports/" + report.id, "POST", { hide: true }, root.cookie)).status, 200);
  const blocked = (await call<TestimonyAccount>("me", "GET", undefined, child.cookie)).data;
  assert.equal(blocked.blocked, true);
  assert.equal((await call("my-story", "POST", { ...value("Updated child"), version: blocked.version }, child.cookie)).status, 403);
  passed("private reports reach the owner and owner-hidden stories cannot immediately republish");

  const access = await call("session", "POST", { token: childSubmission.accessToken }); assert.equal(access.status, 200); assert.ok(access.cookie);
  assert.equal((await call<TestimonyAccount>("me", "GET", undefined, access.cookie)).data.person.id, child.data.personId);
  await call("session", "DELETE", undefined, access.cookie);
  assert.equal((await call("me", "GET", undefined, access.cookie)).data, null);
  const rotation = await call<{ url: string }>("access-link", "POST", {}, child.cookie); assert.equal(rotation.status, 200);
  assert.equal((await call("session", "POST", { token: childSubmission.accessToken })).status, 401);
  assert.notEqual((await call("submissions", "POST", childSubmission)).status, 200);
  const replacement = new URLSearchParams(new URL(rotation.data.url).hash.slice(1)).get("key");
  assert.equal((await call("session", "POST", { token: replacement })).status, 200);
  passed("private access works across sessions; sign-out and replacement revoke old access, including replay");

  const publicData = await call<TestimonyBranch>("branches");
  assert.equal(publicData.headers.get("Cache-Control"), "no-store");
  const serialized = JSON.stringify(publicData.data);
  for (const privateField of ["access_digest", "token_digest", "account_id", "consent_version", childSubmission.accessToken, invitation.token, "Automated test report"]) assert.ok(!serialized.includes(privateField));
  assert.ok(publicData.data.nodes.every((n) => n.body === ""));
  passed("public branch responses exclude private keys, reports and full story bodies");

  await runtime.dispose(); runtime = await createTestimonyRuntime(directory);
  const persisted = await call<TestimonyBranch>("branches"); assert.equal(persisted.status, 200); assert.ok(persisted.data.nodes.some((n) => n.id === grand.data.personId));
  assert.equal((await call<{ body: string }>("stories/" + grand.data.personId)).data.body, longBody);
  passed("stories and invitation ancestry survive a complete runtime restart");
  console.log(`${checks} runtime integration checks passed. Isolated database: ${directory}`);
} finally { await runtime.dispose(); }
