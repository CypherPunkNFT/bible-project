import type { Contact, Help } from "@/data/resources";
import { dialable, smsHref, wayOf } from "@/pages/resources/contact-links";

/** Keywords live in directory notes. Show those notes beside the link; never infer or prefill a keyword. */
export function contactHref(contact: Contact): string | null {
  switch (wayOf(contact.kind)) {
    case "call": return `tel:${dialable(contact.value)}`;
    case "text": return smsHref(contact.value);
    case "email": return `mailto:${contact.value}`;
    case "web": return /^https:\/\//i.test(contact.value) ? contact.value : null;
    default: return null;
  }
}

const has = (entry: Help | undefined, kind: "call" | "text" | "chat" | "web"): boolean =>
  Boolean(entry?.contact.some((contact) => contactHref(contact) && (kind === "chat" ? /chat/i.test(contact.kind) : wayOf(contact.kind) === kind)));

/** Missing one primary contact keeps the full fallback, even when optional rows are present. */
export function primaryHelpReady(entries: ReadonlyMap<string, Help>, abused: boolean): boolean {
  const primary = entries.get(abused ? "domestic-violence-hotline" : "988-lifeline");
  return has(primary, "call") && has(primary, "text") && has(primary, "chat")
    && has(entries.get("emergency-911"), "call") && has(entries.get("find-a-helpline"), "web");
}
