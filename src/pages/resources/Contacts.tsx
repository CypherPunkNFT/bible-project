// How one way to reach help is shown: a phone number is a tel: link, a text line an sms: link, a web chat or site a
// link, each large enough to tap on a phone. The words come from life.json; only the link is built here.
import { Clock, Globe, Mail, MessageSquareText, Phone, type LucideIcon } from "lucide-react";
import type { Contact, Help } from "@/data/resources";
import { Checked } from "./Shell";
import { dialable, smsHref, wayOf, type Way } from "./contact-links";

const ICONS: Record<Way, LucideIcon> = { call: Phone, text: MessageSquareText, web: Globe, email: Mail, other: Globe };
const VERB: Record<Way, string> = { call: "Call", text: "Text", web: "Website", email: "Email", other: "" };

/** A web address shown by its site name only ("chat.988lifeline.org"); the full address stays in the link. */
const webName = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").split(/[/?#]/)[0];
const sameUrl = (a: string, b: string) => a.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") === b.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function href(way: Way, value: string): string | undefined {
  if (way === "call" && /\d{3}/.test(value)) return `tel:${dialable(value)}`;
  if (way === "text" && /\d{3}/.test(value)) return smsHref(value);
  if (way === "email" && value.includes("@")) return `mailto:${value.trim()}`;
  if (/^https?:\/\//.test(value)) return value;
  return undefined;
}

export function ContactLine({ contact }: { contact: Contact }) {
  const way = wayOf(contact.kind);
  const Icon = ICONS[way];
  const link = href(way, contact.value);
  const shown = /^https?:\/\//.test(contact.value) ? webName(contact.value) : contact.value;
  const verb = /chat/i.test(contact.kind) ? "Chat" : VERB[way];
  const body = <>
    <Icon size={18} aria-hidden="true" />
    <strong>{verb && <span className="sr-only">{verb} </span>}{shown}</strong>
    {(contact.note || verb) && <small>{[verb, contact.note].filter(Boolean).join(" · ")}</small>}
  </>;
  if (!link) return <p className="rs-contact" data-plain={way === "other" || undefined}>{body}</p>;
  const external = link.startsWith("http");
  return <a className="rs-contact" href={link} data-way={way} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{body}</a>;
}

/** When a line answers, set large: some local lines answer only on weekdays. */
export function Hours({ hours }: { hours?: string }) {
  return hours ? <p className="rs-hours"><Clock size={16} aria-hidden="true" /><span><span className="sr-only">Hours: </span>{hours}</span></p> : null;
}

/** Cost and, when the organisation is a ministry (faith: true), the label "Faith-based". */
export function EntryMeta({ entry }: { entry: Help }) {
  if (!entry.cost && entry.faith !== true) return null;
  return <p className="rs-entry-meta">
    {entry.cost && <span><b>Cost</b> · {entry.cost}</span>}
    {entry.faith === true && <span className="rs-faith">Faith-based</span>}
  </p>;
}

/** One national line or place: name and what it is on the left, every way to reach it on the right. */
export function HelpEntry({ entry }: { entry: Help }) {
  return <li className="rs-entry">
    <div>
      <h3>{entry.name}</h3>
      <p className="rs-entry-sum">{entry.summary}</p>
      <EntryMeta entry={entry} />
      <Checked date={entry.checked} source={entry.source} />
    </div>
    <div className="rs-contacts">
      <Hours hours={entry.hours} />
      {entry.contact.map((c) => <ContactLine key={`${c.kind}-${c.value}`} contact={c} />)}
      {entry.locator && !entry.contact.some((c) => sameUrl(c.value, entry.locator!)) && <ContactLine contact={{ kind: "web", value: entry.locator, note: "Find local help" }} />}
    </div>
  </li>;
}
