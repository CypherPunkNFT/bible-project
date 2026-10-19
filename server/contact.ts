import { connect } from "cloudflare:sockets";
import { sendMail, SmtpError } from "./smtp";

/** Secrets set in the Cloudflare Pages project settings (never in wrangler.jsonc). */
interface ContactEnv extends Env {
  CONTACT_SMTP_USER?: string;
  CONTACT_SMTP_PASSWORD?: string;
  CONTACT_SMTP_HOST?: string;
}

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;
const MAX_REQUEST_BYTES = 16_000;
const SENDS_PER_HOUR = 5;

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

function fromThisSite(request: Request): boolean {
  const origin = request.headers.get("Origin"), url = new URL(request.url);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname) && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin ?? "");
  return (origin === url.origin || local) && request.headers.get("Sec-Fetch-Site") !== "cross-site";
}

function field(input: Record<string, unknown>, key: string, max: number): string {
  const value = input[key] ?? "";
  if (typeof value !== "string" || value.length > max) throw new RangeError(`The ${key} field is too long.`);
  return value.trim();
}

/** Counts sends per visitor per hour in the existing testimony_limits table. */
async function underLimit(env: ContactEnv, request: Request): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000), window = Math.floor(now / 3600);
  const visitor = request.headers.get("CF-Connecting-IP") ?? "local";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`contact:${visitor}:${window}`));
  const key = [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const row = await env.DB.prepare("INSERT INTO testimony_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count")
    .bind(key, (window + 1) * 3600).first<{ count: number }>();
  return Boolean(row && row.count <= SENDS_PER_HOUR);
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Use the contact form to send a message." }, 405);
  if (!fromThisSite(request)) return json({ error: "Please send from this website." }, 403);
  if (!env.CONTACT_SMTP_USER || !env.CONTACT_SMTP_PASSWORD) return json({ error: "Sending from the site is not set up yet." }, 503);
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_REQUEST_BYTES) return json({ error: "The message is too long." }, 413);

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse((await request.text()).slice(0, MAX_REQUEST_BYTES));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("not an object");
    input = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "The form could not be read." }, 400);
  }

  let name: string, email: string, message: string, website: string;
  try {
    name = field(input, "name", 80); email = field(input, "email", 200); message = field(input, "message", 4000); website = field(input, "website", 200);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
  if (website) return json({ sent: true }); // hidden field only bots fill in; drop quietly
  if (!message) return json({ error: "Please write a message." }, 400);
  if (email && !EMAIL.test(email)) return json({ error: "That email address does not look right." }, 400);
  if (!(await underLimit(env, request))) return json({ error: "Please wait a while before sending another message." }, 429);

  const host = env.CONTACT_SMTP_HOST || "smtp.zoho.com";
  const safeName = name.replace(/["\\<>]/g, "");
  try {
    const socket = connect({ hostname: host, port: 465 }, { secureTransport: "on", allowHalfOpen: false });
    await sendMail(socket, { user: env.CONTACT_SMTP_USER, password: env.CONTACT_SMTP_PASSWORD }, {
      from: `"Bible Project contact form" <${env.CONTACT_SMTP_USER}>`,
      to: env.CONTACT_SMTP_USER,
      replyTo: email ? (safeName ? `"${safeName}" <${email}>` : email) : undefined,
      subject: `Contact form: ${name || email || "a visitor"}`,
      text: `${message}\n\n—\nFrom: ${name || "(no name given)"}\nEmail: ${email || "(none given)"}\nSent from the contact page.`,
    });
    return json({ sent: true });
  } catch (error) {
    console.error("contact: sending failed via", host, error instanceof SmtpError ? error.message : error);
    return json({ error: "The message could not be sent just now." }, 502);
  }
}
