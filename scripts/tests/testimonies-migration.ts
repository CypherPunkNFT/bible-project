import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

// Exercise the upgrade with already-published content and real foreign keys, not only an empty database.
const runtime = new Miniflare({ ...convertV4MiniflareOptions({ modules: true,
  script: "export default { fetch() { return new Response('migration test'); } }",
  compatibilityDate: "2026-10-04", d1Databases: { DB: "migration-test" },
}), telemetry: { enabled: false }, logRequests: false });
try {
  const db = await runtime.getD1Database("DB");
  const migrations = (await readdir("migrations")).filter((name) => name.endsWith(".sql")).sort();
  for (const file of migrations.filter((name) => name < "0004")) {
    await db.batch((await readFile("migrations/" + file, "utf8")).split("-- statement").slice(1).map((sql) => db.prepare(sql)));
  }
  const body = "An existing testimony with its original paragraphs and words. ".repeat(20) + "\n\nThe final paragraph remains intact.";
  const hash = "a".repeat(64);
  await db.batch([
    db.prepare("INSERT INTO testimony_accounts(id,access_digest,role) VALUES ('a',?,'owner')").bind(hash),
    db.prepare("INSERT INTO testimony_people(id,account_id,name) VALUES ('p','a','Legacy author')"),
    db.prepare("INSERT INTO testimony_stories(id,person_id) VALUES ('s','p')"),
    db.prepare("INSERT INTO testimony_revisions(id,story_id,version,title,body,content_digest,consent_version) VALUES ('r','s',1,'An existing story',?,?,'public-sharing-v2')").bind(body,hash),
    db.prepare("INSERT INTO testimony_decisions(revision_id,content_digest,action,provider,policy_version) VALUES ('r',?,'publish','disabled','immediate-v1')").bind(hash),
    db.prepare("UPDATE testimony_stories SET state='public',published_revision_id='r' WHERE id='s'"),
  ]);
  const before = await db.prepare("SELECT first_published_at FROM testimony_stories WHERE id='s'").first();
  const sql = await readFile("migrations/0004_testimony_long_form.sql", "utf8");
  await db.batch(sql.split("-- statement").slice(1).map((statement) => db.prepare(statement)));
  const story = await db.prepare("SELECT * FROM testimony_public_stories WHERE id='p'").first<{ body: string; blurb: string; first_published_at: number }>();
  assert.equal(story?.body, body); assert.equal(story?.blurb, body.slice(0,600));
  assert.equal(story?.first_published_at, before?.first_published_at);
  assert.equal((await db.prepare("SELECT content_digest FROM testimony_decisions WHERE revision_id='r'").first())?.content_digest, hash);
  assert.deepEqual((await db.prepare("PRAGMA foreign_key_check").all()).results, []);
  await assert.rejects(db.prepare("UPDATE testimony_revisions SET body='Changed' WHERE id='r'").run(), /revision_is_immutable/);
  await assert.rejects(db.prepare("UPDATE testimony_stories SET published_revision_id='missing' WHERE id='s'").run(), /matching_publication_decision_required/);
  console.log("PASS long-form migration preserves published text, dates, decisions and database constraints");
} finally { await runtime.dispose(); }
