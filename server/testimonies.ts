import { immediatePublication, MAX_TESTIMONY_BLURB, MAX_TESTIMONY_CHARACTERS, MAX_TESTIMONY_REQUEST_BYTES, validateTestimony, type TestimonyNode, type TestimonySubmission } from "../src/lib/testimonies";
import type { TestimonyAccount } from "../src/lib/testimony-contract";

const COOKIE = "bp_testimony_session";
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const ID = /^[a-zA-Z0-9-]{1,64}$/;
const now = () => Math.floor(Date.now() / 1000);
const iso = (seconds: number | null) => seconds ? new Date(seconds * 1000).toISOString() : "";
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
interface Account { id: string; person_id: string; role: string }
interface Invite { id: string; inviter_id: string | null; kind: string; expires_at: number; revoked_at: number | null; redeemed_by: string | null }
interface StoryRow { id: string; parent_id: string | null; name: string | null; title: string | null; blurb: string | null; body?: string | null; has_full_testimony?: number; theme: string | null; happened_when: string | null; first_published_at: number | null; child_count?: number; version?: number }
const SUMMARY = `p.id,c.parent_id,v.name,v.title,v.blurb,(length(trim(v.body))>0) AS has_full_testimony,v.theme,v.happened_when,v.first_published_at,
 (SELECT count(*) FROM testimony_connections children WHERE children.parent_id=p.id) AS child_count`;
const JOINS = `JOIN testimony_people p ON p.id=b.id LEFT JOIN testimony_connections c ON c.child_id=p.id LEFT JOIN testimony_public_stories v ON v.id=p.id`;
function node(row: StoryRow): TestimonyNode {
  return { id: row.id, parentId: row.parent_id, name: row.name ?? "Story unavailable", title: row.title ?? "This story is no longer public.", blurb: row.blurb ?? "", body: row.body ?? "", hasFullTestimony: Boolean(row.has_full_testimony ?? row.body?.trim()), theme: row.theme ?? "", happenedWhen: row.happened_when ?? "", publishedAt: iso(row.first_published_at), available: row.name !== null, childCount: row.child_count ?? 0 };
}
export async function digest(value: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomToken() { return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function json(value: unknown, status = 200, extra: HeadersInit = {}) {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json; charset=utf-8"); headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer"); headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(value), { status, headers });
}
function publicOrigin(env: Env) {
  const url = new URL(env.PUBLIC_SITE_URL);
  if (url.protocol !== "https:" || url.username || url.password || /^(localhost|127\.|\[::1\])/.test(url.hostname)) throw new HttpError(503, "Sharing is temporarily unavailable.");
  return url.origin;
}
function checkOrigin(request: Request) {
  const origin = request.headers.get("Origin"), url = new URL(request.url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!origin || (origin !== url.origin && !(local && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)))) throw new HttpError(403, "Please submit from this website.");
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") throw new HttpError(403, "Please submit from this website.");
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) throw new HttpError(415, "Please send the form as JSON.");
  const reader = request.body?.getReader(); if (!reader) throw new HttpError(400, "The form is empty.");
  const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > MAX_TESTIMONY_REQUEST_BYTES) { await reader.cancel(); throw new HttpError(413, "The form is too large."); } chunks.push(part.value); } }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes)); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); return parsed as Record<string, unknown>; }
  catch { throw new HttpError(400, "The form could not be read."); }
}
function text(input: Record<string, unknown>, key: string, max = MAX_TESTIMONY_CHARACTERS): string {
  const value = input[key]; if (typeof value !== "string" || value.length > max) throw new HttpError(400, `Check the ${key} field.`); return value.trim();
}
function fields(input: Record<string, unknown>): TestimonySubmission {
  const value = { name: text(input, "name", 60), title: text(input, "title", 120), blurb: text(input, "blurb", MAX_TESTIMONY_BLURB), body: text(input, "body"), theme: text(input, "theme", 40), happenedWhen: text(input, "happenedWhen", 80), publicConsent: input.publicConsent === true };
  const error = validateTestimony(value); if (error) throw new HttpError(400, error); return value;
}
async function limited(env: Env, request: Request, action: string, count: number, subject?: string) {
  const time = now(), window = Math.floor(time / 3600);
  const key = await digest(`${action}:${subject ?? request.headers.get("CF-Connecting-IP") ?? "local"}:${window}`);
  await env.DB.prepare("DELETE FROM testimony_limits WHERE expires_at<?").bind(time).run();
  const row = await env.DB.prepare("INSERT INTO testimony_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(key, (window + 1) * 3600).first<{ count: number }>();
  if (!row || row.count > count) throw new HttpError(429, "Please wait before trying again.");
}
function sessionToken(request: Request) { return request.headers.get("Cookie")?.split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1) ?? ""; }
async function account(env: Env, request: Request, required = true): Promise<Account | null> {
  const token = sessionToken(request);
  const result = TOKEN.test(token) ? await env.DB.prepare(`SELECT a.id,p.id AS person_id,a.role FROM testimony_sessions s JOIN testimony_accounts a ON a.id=s.account_id JOIN testimony_people p ON p.account_id=a.id WHERE s.token_digest=? AND s.expires_at>?`).bind(await digest(token), now()).first<Account>() : null;
  if (!result && required) throw new HttpError(401, "Open your private access link to continue."); return result;
}
function cookie(request: Request, token: string, age = 2592000) {
  return `${COOKIE}=${token}; Path=/api/testimonies; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
async function newSession(env: Env, request: Request, accountId: string) {
  const token = randomToken(); await env.DB.batch([
    env.DB.prepare("DELETE FROM testimony_sessions WHERE expires_at<=?").bind(now()),
    env.DB.prepare("INSERT INTO testimony_sessions(token_digest,account_id,expires_at) VALUES (?,?,?)").bind(await digest(token), accountId, now() + 2592000),
  ]); return cookie(request, token);
}
async function ownStory(env: Env, owner: Account): Promise<TestimonyAccount> {
  const row = await env.DB.prepare(`SELECT p.id,c.parent_id,p.name,r.title,r.blurb,r.body,r.theme,r.happened_when,s.first_published_at,s.state,s.moderation_blocked,r.version
    FROM testimony_people p JOIN testimony_stories s ON s.person_id=p.id JOIN testimony_revisions r ON r.story_id=s.id
    LEFT JOIN testimony_connections c ON c.child_id=p.id WHERE p.id=? ORDER BY r.version DESC LIMIT 1`).bind(owner.person_id).first<StoryRow & { state: TestimonyAccount["state"]; version: number; moderation_blocked: number }>();
  if (!row) throw new HttpError(404, "Your story could not be found.");
  return { person: node(row), state: row.state, version: row.version, owner: owner.role === "owner", blocked: row.moderation_blocked === 1 };
}
async function invitation(env: Env, token: string) {
  if (!TOKEN.test(token)) throw new HttpError(410, "This invitation is unavailable. Ask for a new link.");
  const invite = await env.DB.prepare("SELECT id,inviter_id,kind,expires_at,revoked_at,redeemed_by FROM testimony_invitations WHERE token_digest=?").bind(await digest(token)).first<Invite>();
  if (!invite || invite.revoked_at || invite.redeemed_by || invite.expires_at <= now()) throw new HttpError(410, "This invitation has expired or has already been used. Ask for a new link.");
  if (invite.inviter_id && !await env.DB.prepare("SELECT id FROM testimony_public_stories WHERE id=?").bind(invite.inviter_id).first()) throw new HttpError(410, "This invitation is no longer available.");
  return invite;
}
async function revisionStatements(env: Env, storyId: string, authorId: string, revisionId: string, version: number, value: TestimonySubmission) {
  const contentHash = await digest(JSON.stringify([value.name, value.title, value.blurb, value.body, value.theme, value.happenedWhen]));
  const decision = await immediatePublication.evaluate({ ...value, authorId, revisionId, contentHash });
  if (decision.action !== "publish") throw new HttpError(422, "This story cannot be published yet. Your text has been kept in the form.");
  return [
    env.DB.prepare("INSERT INTO testimony_revisions(id,story_id,version,title,blurb,body,theme,happened_when,content_digest,consent_version) VALUES (?,?,?,?,?,?,?,?,?,'public-sharing-v2')").bind(revisionId, storyId, version, value.title, value.blurb, value.body, value.theme, value.happenedWhen, contentHash),
    env.DB.prepare("INSERT INTO testimony_decisions(revision_id,content_digest,action,provider,policy_version) VALUES (?,?,'publish',?,?)").bind(revisionId, contentHash, decision.provider, decision.policyVersion),
    env.DB.prepare("UPDATE testimony_stories SET state='public',published_revision_id=? WHERE id=?").bind(revisionId, storyId),
  ];
}
async function submit(env: Env, request: Request, input: Record<string, unknown>) {
  const value = fields(input), token = text(input, "invitationToken", 43), access = text(input, "accessToken", 43), requestId = text(input, "requestId", 64);
  if (!TOKEN.test(access) || !ID.test(requestId)) throw new HttpError(400, "Please reload the invitation and try again.");
  const requestHash = await digest(JSON.stringify([token, access, value]));
  const site = publicOrigin(env);
  const replay = await env.DB.prepare("SELECT r.request_digest,p.account_id,r.person_id FROM testimony_receipts r JOIN testimony_people p ON p.id=r.person_id JOIN testimony_accounts a ON a.id=p.account_id WHERE r.request_id=? AND a.access_digest=?").bind(requestId, await digest(access)).first<{ request_digest: string; account_id: string; person_id: string }>();
  if (replay) { if (replay.request_digest !== requestHash) throw new HttpError(409, "This submission has already been used. Reload before submitting different text."); await limited(env, request, "replay", 30, replay.account_id); return json({ personId: replay.person_id, accessUrl: `${site}/testimonies/access#key=${access}` }, 200, { "Set-Cookie": await newSession(env, request, replay.account_id) }); }
  if (await account(env, request, false)) throw new HttpError(409, "You already have a testimony. Open My testimony to edit it, or sign out for another person.");
  await limited(env, request, "submit", 30);
  const invite = await invitation(env, token), accountId = crypto.randomUUID(), personId = crypto.randomUUID(), storyId = crypto.randomUUID();
  const statements = [
    env.DB.prepare("INSERT INTO testimony_accounts(id,access_digest,role) VALUES (?,?,?)").bind(accountId, await digest(access), invite.kind === "root" ? "owner" : "member"),
    env.DB.prepare("INSERT INTO testimony_people(id,account_id,name) VALUES (?,?,?)").bind(personId, accountId, value.name),
    env.DB.prepare("UPDATE testimony_invitations SET redeemed_by=?,redeemed_at=unixepoch() WHERE id=? AND redeemed_by IS NULL AND revoked_at IS NULL AND expires_at>unixepoch()").bind(personId, invite.id),
    // This trigger aborts the entire batch when a simultaneous claimant won the guarded UPDATE.
    env.DB.prepare("INSERT INTO testimony_receipts(request_id,request_digest,invitation_id,person_id) VALUES (?,?,?,?)").bind(requestId, requestHash, invite.id, personId),
  ];
  if (invite.inviter_id) statements.push(env.DB.prepare("INSERT INTO testimony_connections(child_id,parent_id,invitation_id) VALUES (?,?,?)").bind(personId, invite.inviter_id, invite.id));
  statements.push(env.DB.prepare("INSERT INTO testimony_stories(id,person_id) VALUES (?,?)").bind(storyId, personId));
  statements.push(...await revisionStatements(env, storyId, personId, crypto.randomUUID(), 1, value));
  try { await env.DB.batch(statements); } catch { throw new HttpError(409, "The invitation could not be claimed. It may have just been used; your text remains in the form."); }
  return json({ personId, accessUrl: `${site}/testimonies/access#key=${access}` }, 201, { "Set-Cookie": await newSession(env, request, accountId) });
}
async function branch(env: Env, url: URL) {
  let root = url.searchParams.get("root");
  if (root && !ID.test(root)) throw new HttpError(400, "Unknown branch.");
  if (!root) root = (await env.DB.prepare("SELECT p.id FROM testimony_people p LEFT JOIN testimony_connections c ON c.child_id=p.id WHERE c.child_id IS NULL ORDER BY p.created_at,p.id LIMIT 1").first<{ id: string }>())?.id ?? null;
  const total = (await env.DB.prepare("SELECT count(*) AS total FROM testimony_public_stories").first<{ total: number }>())?.total ?? 0;
  if (!root) return json({ nodes: [], ancestors: [], rootId: null, hasMore: false, total });
  const page = Number(url.searchParams.get("page") ?? 0);
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new HttpError(400, "Unknown branch page.");
  const rows = await env.DB.prepare(`WITH RECURSIVE first_children AS (SELECT c.child_id FROM testimony_connections c JOIN testimony_people p ON p.id=c.child_id WHERE c.parent_id=? ORDER BY p.created_at,p.id LIMIT 25 OFFSET ?),
    b(id,depth) AS (SELECT ?,0 UNION ALL SELECT c.child_id,b.depth+1 FROM testimony_connections c JOIN b ON c.parent_id=b.id WHERE b.depth<3 AND (b.depth=0 AND c.child_id IN (SELECT child_id FROM first_children) OR b.depth>0 AND c.child_id IN (SELECT child_id FROM testimony_connections WHERE parent_id=c.parent_id ORDER BY accepted_at,child_id LIMIT 2)))
    SELECT ${SUMMARY} FROM b ${JOINS} ORDER BY b.depth,p.created_at,p.id LIMIT 100`).bind(root, page * 25, root).all<StoryRow>();
  if (!rows.results.length) throw new HttpError(404, "This branch could not be found.");
  const ancestors = await env.DB.prepare(`WITH RECURSIVE b(id,depth) AS (SELECT ?,0 UNION ALL SELECT c.parent_id,b.depth+1 FROM testimony_connections c JOIN b ON c.child_id=b.id WHERE b.depth<49) SELECT ${SUMMARY} FROM b ${JOINS} ORDER BY b.depth DESC`).bind(root).all<StoryRow>();
  return json({ nodes: rows.results.map(node), ancestors: ancestors.results.map(node), rootId: root, hasMore: (rows.results[0].child_count ?? 0) > (page + 1) * 25, total });
}

export async function handleTestimonies(request: Request, env: Env): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    const url = new URL(request.url), path = url.pathname.replace(/^\/api\/testimonies\/?/, ""), method = request.method;
    if (method !== "GET") checkOrigin(request);
    if (method === "GET" && path === "health") { await env.DB.prepare("SELECT 1 FROM testimony_accounts LIMIT 1").first(); return json({ ready: true }); }
    if (method === "GET" && path === "settings") return json({ siteUrl: publicOrigin(env) });
    if (method === "GET" && path === "branches") return await branch(env, url);
    if (method === "GET" && path.startsWith("stories/")) {
      const row = await env.DB.prepare("SELECT * FROM testimony_public_stories WHERE id=?").bind(path.slice(8)).first<StoryRow>();
      if (!row) throw new HttpError(404, "This story is not currently public."); return json(node(row));
    }
    if (method === "GET" && path === "me") { const owner = await account(env, request, false); return json(owner ? await ownStory(env, owner) : null); }
    if (method === "POST" && path === "invitations/inspect") {
      await limited(env, request, "inspect", 120); const invite = await invitation(env, text(await body(request), "token", 43));
      const inviter = invite.inviter_id ? await env.DB.prepare("SELECT name FROM testimony_public_stories WHERE id=?").bind(invite.inviter_id).first<{ name: string }>() : null;
      return json({ name: inviter?.name ?? "The first branch", personId: invite.inviter_id, root: invite.kind === "root" });
    }
    if (method === "POST" && path === "submissions") return await submit(env, request, await body(request));
    if (method === "POST" && path === "session") {
      await limited(env, request, "access", 30); const token = text(await body(request), "token", 43);
      if (!TOKEN.test(token)) throw new HttpError(401, "That private access link is invalid.");
      const owner = await env.DB.prepare("SELECT id FROM testimony_accounts WHERE access_digest=?").bind(await digest(token)).first<{ id: string }>();
      if (!owner) throw new HttpError(401, "That private access link is invalid or has been replaced.");
      return json({ signedIn: true }, 200, { "Set-Cookie": await newSession(env, request, owner.id) });
    }
    if (method === "POST" && path === "reports") {
      await limited(env, request, "report", 10); const input = await body(request), personId = text(input, "personId", 64), reason = text(input, "reason", 2000);
      if (reason.length < 3) throw new HttpError(400, "Please describe the concern.");
      if (!await env.DB.prepare("SELECT id FROM testimony_public_stories WHERE id=?").bind(personId).first()) throw new HttpError(404, "This story is not currently public.");
      await env.DB.prepare("INSERT INTO testimony_reports(id,person_id,reason) VALUES (?,?,?)").bind(crypto.randomUUID(), personId, reason).run(); return json({ received: true }, 201);
    }
    const owner = await account(env, request) as Account;
    if (method === "DELETE" && path === "session") {
      await env.DB.prepare("DELETE FROM testimony_sessions WHERE token_digest=?").bind(await digest(sessionToken(request))).run(); return json({ signedOut: true }, 200, { "Set-Cookie": cookie(request, "", 0) });
    }
    if (method === "POST" && path === "access-link") {
      await limited(env, request, "rotate", 10, owner.id); const token = randomToken(), site = publicOrigin(env);
      await env.DB.batch([env.DB.prepare("UPDATE testimony_accounts SET access_digest=? WHERE id=?").bind(await digest(token), owner.id), env.DB.prepare("DELETE FROM testimony_sessions WHERE account_id=? AND token_digest<>?").bind(owner.id, await digest(sessionToken(request)))]);
      return json({ url: `${site}/testimonies/access#key=${token}` });
    }
    if (method === "GET" && path === "invitations") {
      const rows = await env.DB.prepare("SELECT id,created_at,expires_at,redeemed_by,revoked_at FROM testimony_invitations WHERE inviter_id=? ORDER BY created_at DESC LIMIT 50").bind(owner.person_id).all<{ id: string; created_at: number; expires_at: number; redeemed_by: string | null; revoked_at: number | null }>();
      return json(rows.results.map((r) => ({ id: r.id, createdAt: iso(r.created_at), expiresAt: iso(r.expires_at), used: !!r.redeemed_by, revoked: !!r.revoked_at })));
    }
    if (method === "POST" && path === "invitations") {
      await limited(env, request, "invite", 25, owner.id);
      if (!await env.DB.prepare("SELECT id FROM testimony_public_stories WHERE id=?").bind(owner.person_id).first()) throw new HttpError(409, "Publish your testimony before inviting someone.");
      const token = randomToken(), id = crypto.randomUUID(), expires = now() + 2592000, site = publicOrigin(env);
      await env.DB.prepare("INSERT INTO testimony_invitations(id,token_digest,inviter_id,kind,expires_at) VALUES (?,?,?,'personal',?)").bind(id, await digest(token), owner.person_id, expires).run();
      return json({ id, url: `${site}/testimonies/join#code=${token}`, expiresAt: iso(expires) }, 201);
    }
    if (method === "DELETE" && path.startsWith("invitations/")) {
      const result = await env.DB.prepare("UPDATE testimony_invitations SET revoked_at=unixepoch() WHERE id=? AND inviter_id=? AND redeemed_by IS NULL").bind(path.slice(12), owner.person_id).run();
      if (!result.meta.changes) throw new HttpError(404, "That invitation could not be revoked."); return json({ revoked: true });
    }
    if (method === "POST" && path === "my-story") {
      await limited(env, request, "edit", 30, owner.id); const input = await body(request), value = fields(input), version = input.version;
      const story = await env.DB.prepare("SELECT id FROM testimony_stories WHERE person_id=?").bind(owner.person_id).first<{ id: string }>();
      const current = await ownStory(env, owner);
      if (current.blocked) throw new HttpError(403, "This story has been hidden by the site owner and cannot be republished.");
      if (!story || version !== current.version) throw new HttpError(409, "Your story changed in another window. Reload before editing.");
      const writes = [env.DB.prepare("UPDATE testimony_people SET name=? WHERE id=?").bind(value.name, owner.person_id), ...await revisionStatements(env, story.id, owner.person_id, crypto.randomUUID(), current.version + 1, value)];
      try { await env.DB.batch(writes); } catch { throw new HttpError(409, "Your story changed in another window. Reload before editing."); }
      return json({ personId: owner.person_id });
    }
    if (method === "POST" && path === "withdraw") {
      await env.DB.batch([env.DB.prepare("UPDATE testimony_stories SET state='withdrawn' WHERE person_id=?").bind(owner.person_id), env.DB.prepare("UPDATE testimony_invitations SET revoked_at=unixepoch() WHERE inviter_id=? AND redeemed_by IS NULL").bind(owner.person_id)]);
      return json({ withdrawn: true });
    }
    if (owner.role === "owner" && method === "GET" && path === "reports") {
      const rows = await env.DB.prepare("SELECT r.id,r.person_id,r.reason,r.created_at,p.name,COALESCE(v.title,'Story unavailable') AS title FROM testimony_reports r JOIN testimony_people p ON p.id=r.person_id LEFT JOIN testimony_public_stories v ON v.id=r.person_id WHERE r.resolved_at IS NULL ORDER BY r.created_at LIMIT 50").all<{ id: string; person_id: string; reason: string; created_at: number; name: string; title: string }>();
      return json(rows.results.map((r) => ({ id: r.id, personId: r.person_id, reason: r.reason, createdAt: iso(r.created_at), name: r.name, title: r.title })));
    }
    if (owner.role === "owner" && method === "POST" && path.startsWith("reports/")) {
      const input = await body(request), report = await env.DB.prepare("SELECT person_id FROM testimony_reports WHERE id=?").bind(path.slice(8)).first<{ person_id: string }>();
      if (!report) throw new HttpError(404, "That report could not be found.");
      const writes = [env.DB.prepare("UPDATE testimony_reports SET resolved_at=unixepoch() WHERE id=?").bind(path.slice(8))];
      if (input.hide === true) writes.push(env.DB.prepare("UPDATE testimony_stories SET state='withdrawn',moderation_blocked=1 WHERE person_id=?").bind(report.person_id), env.DB.prepare("UPDATE testimony_invitations SET revoked_at=unixepoch() WHERE inviter_id=? AND redeemed_by IS NULL").bind(report.person_id));
      await env.DB.batch(writes); return json({ resolved: true });
    }
    throw new HttpError(404, "That action could not be found.");
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    // Never log bodies, invitation/access tokens, cookie values, or the request URL.
    console.error(JSON.stringify({ event: "testimony_request_failed", requestId, method: request.method }));
    return json({ error: "Testimonies are temporarily unavailable. Please try again shortly.", requestId }, 503);
  }
}
