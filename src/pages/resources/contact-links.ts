// Turning a contact from life.json into a link: which way it is reached (call, text, web, email) and its tel:/sms: target.

export type Way = "call" | "text" | "web" | "email" | "other";

export function wayOf(kind: string): Way {
  const k = kind.toLowerCase();
  if (/phone|call|tel|voice|line/.test(k)) return "call";
  if (/text|sms/.test(k)) return "text";
  if (/chat|web|site|url|online/.test(k)) return "web";
  if (/mail/.test(k)) return "email";
  return "other";
}

/** "1-800-273-8255" -> "+18002738255"-style digits for tel:; keeps a leading plus. */
export const dialable = (value: string) => value.trim().replace(/(?!^\+)[^\d]/g, "");

/** sms: target for "988", "741741" or "HOME to 741741" (keyword in the body). */
export function smsHref(value: string) {
  const keyword = value.match(/^\s*["“]?([A-Za-z]+)["”]?\s+to\s+([\d\s-]+)\s*$/i);
  if (keyword) return `sms:${dialable(keyword[2])}?&body=${encodeURIComponent(keyword[1])}`;
  return `sms:${dialable(value)}`;
}
