// One collapsible row on /resources/life: a national line, a place in a city, or a city's phone line. Closed it shows the
// name, the ways to reach it, one sentence and the cost, with its first call/text buttons ready; it opens in place for
// the rest of the summary, the address, the hours, every number and link, and the page it was checked on.
import { ChevronDown, Clock, Globe, Mail, MapPin, MessageCircle, MessageSquareText, Phone, type LucideIcon } from "lucide-react";
import { useLayoutEffect, useRef, type CSSProperties, type PointerEventHandler } from "react";
import type { Contact, Help } from "@/data/resources";
import { firstSentence, hostOf, hrefOf, quickActions, restOf, sameUrl, subtitle, tone, WAY_WORD, wayOf, type Way } from "./format";

const STROKE = 1.6;
const ICONS: Record<Way, LucideIcon> = { call: Phone, text: MessageSquareText, chat: MessageCircle, web: Globe, email: Mail, other: Globe };

export function ContactLink({ contact }: { contact: Contact }) {
  const way = wayOf(contact.kind), href = hrefOf(contact), Icon = ICONS[way];
  const shown = /^https?:\/\//.test(contact.value) ? hostOf(contact.value) : contact.value;
  const words = [WAY_WORD[way], contact.note].filter(Boolean).join(" · ");
  const body = <><Icon size={18} strokeWidth={STROKE} aria-hidden="true" /><strong>{shown}</strong>{words && <small>{words}</small>}</>;
  if (!href) return <p className="lf-contact">{body}</p>;
  const external = href.startsWith("http");
  return <a className="lf-contact" data-way={way} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{body}</a>;
}

export function QuickButtons({ entry, max }: { entry: Help; max: number }) {
  const quick = quickActions(entry, max);
  if (!quick.length) return null;
  return <div className="lf-quick-row">{quick.map((q) => {
    const Icon = q.way === "call" ? Phone : MessageSquareText;
    return <a key={q.href} className="lf-quick" data-way={q.way} href={q.href}><Icon size={16} strokeWidth={STROKE} aria-hidden="true" /><span>{q.label}</span></a>;
  })}</div>;
}

/** Everything a row shows once opened. */
function Detail({ entry: e, address }: { entry: Help & { address?: string }; address?: boolean }) {
  const rest = restOf(e.summary);
  const walkIn = address && e.address && !/^No walk-in/.test(e.address);
  const noWalkIn = address && e.address && /^No walk-in/.test(e.address);
  return <div>
    {rest && <p className="lf-rest">{rest}</p>}
    {walkIn && <p className="lf-addr"><MapPin size={16} strokeWidth={STROKE} aria-hidden="true" /><span>{e.address}</span></p>}
    {noWalkIn && <p className="lf-addr lf-muted"><MapPin size={16} strokeWidth={STROKE} aria-hidden="true" /><span>{e.address!.replace(/; reach it by phone, text or online/, "")}</span></p>}
    {e.hours && <p className="lf-hours"><Clock size={16} strokeWidth={STROKE} aria-hidden="true" /><span><span className="sr-only">Hours: </span>{e.hours}</span></p>}
    <div className="lf-contacts">
      {e.contact.map((c) => <ContactLink key={`${c.kind}-${c.value}-${c.note ?? ""}`} contact={c} />)}
      {e.locator && !e.contact.some((c) => sameUrl(c.value, e.locator!)) && <ContactLink contact={{ kind: "web", value: e.locator, note: "Find local help" }} />}
    </div>
    <p className="lf-checked">Checked {e.checked} on <a href={e.source} target="_blank" rel="noreferrer">{hostOf(e.source)}</a>{e.faith === true && <> · <span className="lf-faith">Faith-based</span></>}</p>
  </div>;
}

interface RowProps {
  entry: Help & { address?: string };
  /** The kind of help, for the row's colour. */
  kind: string;
  open: boolean;
  onToggle: () => void;
  /** How many call/text buttons stay on the closed row (0 for none). */
  quick: number;
  /** "wide": the buttons sit beside the words (national lines); "stack": under them (the city list). */
  layout: "wide" | "stack";
  /** The pin's number on the city map. */
  n?: number;
  sub?: string;
  address?: boolean;
  lit?: boolean;
  hidden?: boolean;
  onPointerEnter?: PointerEventHandler;
  onPointerLeave?: PointerEventHandler;
}

export function LifeRow({ entry: e, kind, open, onToggle, quick, layout, n, sub, address, lit, hidden, onPointerEnter, onPointerLeave }: RowProps) {
  // React 18 has no inert prop: a closed row's body is made inert here, so its links are out of the tab order.
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (body.current) body.current.inert = !open; }, [open]);
  const chev = <span className="lf-chev" aria-hidden="true"><ChevronDown size={18} strokeWidth={STROKE} /></span>;
  return <li className="lf-row" data-layout={layout} data-id={e.id} data-cat={kind} data-open={open || undefined} data-lit={lit || undefined} hidden={hidden}
    style={{ "--c": tone(kind) } as CSSProperties} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
    <button type="button" className="lf-row-head" aria-expanded={open} onClick={onToggle}>
      {n != null && <b className="lf-num" aria-hidden="true">{n}</b>}
      <span className="lf-name">{e.name}</span>
      <span className="lf-sub">{sub ?? subtitle(e)}</span>
      <span className="lf-sum">{firstSentence(e.summary)}</span>
      <span className="lf-cost" data-none={e.cost ? undefined : ""}>{e.cost ? <b>{e.cost}</b> : "Cost not stated on its page"}{e.faith === true && <i className="lf-faith">Faith-based</i>}</span>
      {layout === "stack" && chev}
    </button>
    {quick > 0 && <QuickButtons entry={e} max={quick} />}
    {layout === "wide" && <button type="button" className="lf-chev-btn" tabIndex={-1} aria-hidden="true" onClick={onToggle}>{chev}</button>}
    <div className="lf-body" ref={body}><Detail entry={e} address={address} /></div>
  </li>;
}
