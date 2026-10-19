/** Minimal SMTP client for one plain-text message over an already-encrypted socket (implicit TLS, port 465). */
export interface SmtpSocket {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void>;
}
export interface MailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}
export class SmtpError extends Error {}

const encoder = new TextEncoder();
const base64 = (value: string) => btoa(Array.from(encoder.encode(value), (byte) => String.fromCharCode(byte)).join(""));
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const headerText = (value: string) => (/^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${base64(value)}?=`);

export function buildMessage(mail: MailMessage, domain: string): string {
  const headers = [
    `From: ${oneLine(mail.from)}`,
    `To: ${oneLine(mail.to)}`,
    ...(mail.replyTo ? [`Reply-To: ${oneLine(mail.replyTo)}`] : []),
    `Subject: ${headerText(oneLine(mail.subject))}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];
  const body = base64(mail.text.replace(/\r?\n/g, "\r\n")).match(/.{1,76}/g) ?? [];
  return [...headers, "", ...body].join("\r\n");
}

/** Reads SMTP replies; a reply is complete when its last line has a space after the three-digit code. */
function replyReader(readable: ReadableStream<Uint8Array>) {
  const reader = readable.getReader(), decoder = new TextDecoder();
  let buffer = "";
  return async (expected: number, step: string): Promise<string> => {
    while (true) {
      const lines = buffer.split("\r\n");
      const end = lines.findIndex((line) => /^\d{3} /.test(line) || /^\d{3}$/.test(line));
      if (end !== -1) {
        const reply = lines.slice(0, end + 1).join("\n");
        buffer = lines.slice(end + 1).join("\r\n");
        if (Number(lines[end].slice(0, 3)) !== expected)
          throw new SmtpError(`Mail server refused ${step}: expected ${expected}, got "${reply.slice(0, 200)}"`);
        return reply;
      }
      const part = await reader.read();
      if (part.done) throw new SmtpError(`Mail server closed the connection during ${step}.`);
      buffer += decoder.decode(part.value, { stream: true });
    }
  };
}

export async function sendMail(socket: SmtpSocket, login: { user: string; password: string }, mail: MailMessage): Promise<void> {
  const domain = login.user.split("@")[1] ?? "localhost";
  const writer = socket.writable.getWriter(), expect = replyReader(socket.readable);
  const send = (line: string) => writer.write(encoder.encode(line + "\r\n"));
  try {
    await expect(220, "the greeting");
    await send(`EHLO ${domain}`); await expect(250, "EHLO");
    await send("AUTH LOGIN"); await expect(334, "AUTH LOGIN");
    await send(base64(login.user)); await expect(334, "the user name");
    await send(base64(login.password)); await expect(235, "the password");
    await send(`MAIL FROM:<${login.user}>`); await expect(250, "MAIL FROM");
    await send(`RCPT TO:<${mail.to}>`); await expect(250, "RCPT TO");
    await send("DATA"); await expect(354, "DATA");
    await send(`${buildMessage(mail, domain)}\r\n.`); await expect(250, "the message");
    await send("QUIT");
  } finally {
    // The message is already accepted (or the error above is what matters); a failed close changes nothing.
    await socket.close().catch(() => undefined);
  }
}
