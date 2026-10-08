import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import type { Connect, Plugin } from "vite";

// The design review board's local half (Pages/README.md "Design review board"). It exists ONLY on the local dev and
// preview servers — never in the production build, which has no server — so on the live site the board finds no data
// and shows "not found".
// - GET  /review-data/<file>.json  the inventory, check results, screenshot manifest and decisions (content/design-review/)
// - GET  /review-data/shots/<path> one screenshot (design/review/, kept out of git and out of every release)
// - POST /review-api/decision      record the owner's decision: {template, variant, viewport, theme, status, note, ...}
// - POST /review-api/undo          remove one decision by id (used to take a test decision back out)
// Every write is committed on its own (only content/design-review/decisions.json) with a plain message.

const SITE = path.resolve(__dirname, "../..");
const CONTENT = path.join(SITE, "content", "design-review");
const SHOTS = path.join(SITE, "design", "review");
const DECISIONS = path.join(CONTENT, "decisions.json");
const DATA_FILES = new Set(["templates.json", "checks.json", "shots.json", "decisions.json"]);
const IMAGE_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
const VIEWPORTS = new Set(["all", "desktop", "phone"]);
const THEMES = new Set(["all", "light", "dark"]);
const STATUSES = new Set(["accepted", "needs-changes"]);
const MAX_BODY = 64 * 1024;

export interface Decision {
  id: string;
  template: string;
  variant: string;
  viewport: string;
  theme: string;
  status: "accepted" | "needs-changes";
  note: string;
  at: string;
  commit: string;
  sourceHash: string;
  shotHashes: Record<string, string>;
}

interface DecisionFile { schema: 1; note: string; decisions: Decision[] }

const EMPTY: DecisionFile = {
  schema: 1,
  note: "The owner's design decisions, written by the review board on the local preview (/review). Only the owner records these; an AI never marks anything accepted. Read before changing a page template.",
  decisions: [],
};

function send(response: import("node:http").ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function readDecisions(): DecisionFile {
  if (!fs.existsSync(DECISIONS)) return structuredClone(EMPTY);
  const parsed = JSON.parse(fs.readFileSync(DECISIONS, "utf8")) as DecisionFile;
  if (!Array.isArray(parsed.decisions)) throw new Error(`${DECISIONS}: expected a "decisions" list, found ${typeof parsed.decisions}`);
  return parsed;
}

/** Write via a temporary file and a rename, so a crash never leaves half a decisions file. */
function writeDecisions(file: DecisionFile) {
  fs.mkdirSync(CONTENT, { recursive: true });
  const temp = `${DECISIONS}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(file, null, 2) + "\n", "utf8");
  fs.renameSync(temp, DECISIONS);
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: SITE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Commit only the decisions file (other chats' staged work is left alone: a path-limited commit). Another chat's git
 *  command can hold the index lock for a moment, so retry; if it still fails the file is saved and the error returned. */
function commitDecisions(message: string): string | null {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      git(["add", "--", DECISIONS]);
      git(["commit", "-m", message, "--only", "--", DECISIONS]);
      return null;
    } catch (error) {
      const text = String((error as { stderr?: string }).stderr ?? error);
      if (/nothing to commit|no changes added/.test(text)) return null;
      if (attempt === 4) return `saved, but not committed: ${text.slice(0, 300)}`;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
    }
  }
  return null;
}

function readBody(request: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error(`request body over ${MAX_BODY} bytes`)); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch (error) { reject(new Error(`body is not JSON: ${String(error)}`)); }
    });
    request.on("error", reject);
  });
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const hashes = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([k, v]) => typeof v === "string" && k.length < 200).map(([k, v]) => [k, String(v).slice(0, 64)]));
};

/** Validate one decision from the browser; the server sets the id, time and commit itself. */
function toDecision(body: Record<string, unknown>): Decision | string {
  const template = text(body.template, 80), variant = text(body.variant, 80);
  if (!/^[a-z0-9-]+$/.test(template) || !/^[a-z0-9-]+$/.test(variant)) return `template and variant must be ids (got "${template}", "${variant}")`;
  if (!VIEWPORTS.has(String(body.viewport))) return `viewport must be all, desktop or phone (got "${String(body.viewport)}")`;
  if (!THEMES.has(String(body.theme))) return `theme must be all, light or dark (got "${String(body.theme)}")`;
  if (!STATUSES.has(String(body.status))) return `status must be accepted or needs-changes (got "${String(body.status)}")`;
  const note = text(body.note, 4000).trim();
  if (body.status === "needs-changes" && !note) return "a 'needs changes' decision needs a note saying what is wrong";
  let commit = "";
  try { commit = git(["rev-parse", "--short=8", "HEAD"]); } catch (error) { console.error("design review: could not read the commit", error); }
  return {
    id: randomUUID(), template, variant, viewport: String(body.viewport), theme: String(body.theme),
    status: body.status as Decision["status"], note, at: new Date().toISOString(), commit,
    sourceHash: text(body.sourceHash, 64), shotHashes: hashes(body.shotHashes),
  };
}

const VIEW_WORDS: Record<string, string> = { all: "all views", desktop: "desktop", phone: "phone", light: "light", dark: "dark" };
const describe = (d: Decision, name: string) =>
  `Design review: owner ${d.status === "accepted" ? "accepted" : "asked for changes to"} ${name} (${d.viewport === "all" && d.theme === "all" ? "all views" : [VIEW_WORDS[d.viewport], VIEW_WORDS[d.theme]].filter((w) => w !== "all views").join(", ")})${d.note ? `: ${d.note.slice(0, 120)}` : ""}`;

function api(): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = (request.url ?? "").split("?")[0];
    if (url.startsWith("/review-data/")) {
      let relative: string;
      try { relative = decodeURIComponent(url.slice("/review-data/".length)); } catch { return send(response, 404, { error: `malformed address ${url}` }); }
      if (DATA_FILES.has(relative)) {
        const file = path.join(CONTENT, relative);
        if (!fs.existsSync(file)) return relative === "decisions.json" ? send(response, 200, EMPTY) : send(response, 404, { error: `not generated yet: content/design-review/${relative}` });
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        return pipeline(fs.createReadStream(file), response, (error) => { if (error) { console.error(`design review: could not send ${file}`, error); response.destroy(); } });
      }
      if (relative.startsWith("shots/")) {
        const file = path.resolve(SHOTS, relative.slice("shots/".length));
        if (!file.startsWith(SHOTS + path.sep) || !IMAGE_TYPES[path.extname(file)] || !fs.existsSync(file)) return send(response, 404, { error: `no screenshot ${relative}` });
        response.setHeader("Content-Type", IMAGE_TYPES[path.extname(file)]);
        response.setHeader("Cache-Control", "no-cache");
        return pipeline(fs.createReadStream(file), response, (error) => { if (error) { console.error(`design review: could not send ${file}`, error); response.destroy(); } });
      }
      return send(response, 404, { error: `unknown review file ${relative}` });
    }
    if (url !== "/review-api/decision" && url !== "/review-api/undo") return next();
    if (request.method !== "POST") return send(response, 405, { error: "POST only" });
    // The page and this server share an origin; refuse a write from any other site open in the same browser.
    const origin = String(request.headers.origin ?? "");
    if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(response, 403, { error: `writes only from the local preview, not ${origin}` });
    readBody(request).then((body) => {
      if (!body || typeof body !== "object") return send(response, 400, { error: "expected a JSON object" });
      const record = body as Record<string, unknown>;
      const file = readDecisions();
      if (url === "/review-api/undo") {
        const id = text(record.id, 64);
        const found = file.decisions.find((d) => d.id === id);
        if (!found) return send(response, 404, { error: `no decision with id ${id}` });
        file.decisions = file.decisions.filter((d) => d.id !== id);
        writeDecisions(file);
        const warning = commitDecisions(`Design review: removed a decision on ${found.template} / ${found.variant} (${found.status}, ${found.at})`);
        return send(response, 200, { ok: true, removed: id, warning });
      }
      const decision = toDecision(record);
      if (typeof decision === "string") return send(response, 400, { error: decision });
      file.decisions.push(decision);
      writeDecisions(file);
      const warning = commitDecisions(describe(decision, text(record.label, 160) || `${decision.template} / ${decision.variant}`));
      return send(response, 200, { ok: true, decision, warning });
    }).catch((error: unknown) => {
      console.error("design review: write failed", error);
      send(response, 500, { error: `could not record the decision: ${String(error)}` });
    });
  };
}

export function designReviewPlugin(): Plugin {
  return {
    name: "design-review",
    configureServer(server) { server.middlewares.use(api()); },
    configurePreviewServer(server) { server.middlewares.use(api()); },
  };
}
