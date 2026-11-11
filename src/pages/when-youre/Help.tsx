// Crisis and support help for the "when you're..." pages (design 6): the urgent box, the calm strip, the foot help and
// the quiet line. Every contact is read from the help directory (life.json) by id; none is typed here. Urgent help never
// goes blank: a pending, failed or incomplete directory shows the number-free fallback with Retry (design 6.1).
import { Link } from "react-router-dom";
import type { Contact, Help as HelpEntry } from "@/data/resources";
import { DEVICE_SAFETY, FALLBACK_HELP, URGENT_HELP, type UrgentTopic } from "@/data/when-youre/help";
import type { WhenTopic } from "@/data/when-youre";
import { contactHref, primaryHelpReady } from "./help-contacts";
import type { HelpDirectory } from "./useHelpDirectory";
import { QuickExit } from "./QuickExit";

const KIND_LABELS: Record<string, string> = { phone: "Call", text: "Text", chat: "Chat online", web: "Website", email: "Email" };
const external = { referrerPolicy: "no-referrer" as const, rel: "noopener noreferrer" };

/** One contact as a real link ("Call", "Text" or "Chat online" with the directory's value), with its note beside it. */
function ContactLine({ contact }: { contact: Contact }) {
  const href = contactHref(contact);
  const label = KIND_LABELS[contact.kind.toLowerCase()] ?? contact.kind;
  const showValue = !/^https?:/i.test(contact.value);
  const body = <><span>{label}</span>{showValue && <span className="wy-contact-value">{contact.value}</span>}</>;
  return (
    <li>
      {href ? <a href={href} {...external} target={/^https:/i.test(href) ? "_blank" : undefined}>{body}</a> : body}
      {contact.note && <span className="wy-contact-note">{contact.note}</span>}
    </li>
  );
}

function Contacts({ entry, only }: { entry: HelpEntry; only?: (contact: Contact) => boolean }) {
  return <ul className="wy-contacts">{entry.contact.filter(only ?? (() => true)).map((contact, index) => <ContactLine key={index} contact={contact} />)}</ul>;
}

function Checked({ entry }: { entry: HelpEntry }) {
  return (
    <div className="wy-checked">
      <dl><dt>Checked</dt><dd><time dateTime={entry.checked}>{entry.checked}</time></dd></dl>
      <a href={entry.source} {...external} target="_blank">Source</a>
      <span>Availability can change.</span>
    </div>
  );
}

function Entry({ entry, label }: { entry: HelpEntry; label?: string }) {
  return (
    <div className="wy-help-entry">
      {label && <div className="wy-entry-label">{label}</div>}
      <h3>{entry.name}</h3>
      <div>{entry.summary}</div>
      {entry.faith && <div className="wy-faith">A Christian organisation. Pastoral support and clinical treatment have distinct roles.</div>}
      <Contacts entry={entry} />
      {entry.locator && <a href={entry.locator} {...external} target="_blank">Find local support</a>}
      <Checked entry={entry} />
    </div>
  );
}

function Fallback({ retry }: Pick<HelpDirectory, "retry">) {
  return (
    <div className="wy-fallback">
      <div>{FALLBACK_HELP}</div>
      <Link to="/resources/life">Help for life</Link>
      <button type="button" onClick={retry}>Retry help directory</button>
    </div>
  );
}

const URGENT_LABELS: Record<string, string> = {
  "emergency-911": "US: in immediate danger or unable to stay safe",
  "veterans-crisis-line": "Veterans and service members",
  "childhelp-hotline": "If you are under 18 or a child is being hurt. Childhelp offers support; it is not an emergency or reporting line.",
  "rainn-hotline": "After sexual assault",
  "find-a-helpline": "Outside the US: find a helpline",
};

/** The help box at the top of the two urgent pages, and of the hub's results when a crisis word is typed (design 6.2). */
export function UrgentHelp({ topic, directory }: { topic: UrgentTopic; directory: HelpDirectory }) {
  const abused = topic === "abused";
  return (
    <section className="wy-help wy-urgent" aria-label={abused ? "Help right now: being hurt at home" : "Help right now: thoughts of suicide"}>
      <h2>{abused ? "Your safety comes first" : "You don't have to face this alone"}</h2>
      <div>{abused ? "If you are in immediate danger, contact local emergency services if it is safe to do so." : "Talk to someone now, any time, day or night."}</div>
      <div>These contacts serve the United States; help for other countries is listed too.</div>
      {!primaryHelpReady(directory.entries, abused) && <Fallback retry={directory.retry} />}
      {URGENT_HELP[topic].map((id) => {
        const entry = directory.entries.get(id);
        if (!entry) return null;
        return (
          <div key={id} className="wy-urgent-entry">
            {URGENT_LABELS[id] && <div className="wy-entry-label">{URGENT_LABELS[id]}</div>}
            <h3>{entry.name}</h3>
            <Contacts entry={entry} />
            <Checked entry={entry} />
          </div>
        );
      })}
      {!abused && <div>If you can, tell someone near you how you're feeling right now.</div>}
      {abused && <><QuickExit /><div className="wy-device">{DEVICE_SAFETY}</div></>}
      <Link to="/resources/life">All help for life</Link>
    </section>
  );
}

/** The calm strip under the introduction on the four "line" pages (design 6.3). */
export function HelpStrip({ topic, directory }: { topic: Pick<WhenTopic, "slug">; directory: HelpDirectory }) {
  const crisis = directory.entries.get("988-lifeline");
  const samhsa = directory.entries.get("samhsa-helpline");
  const abroadLink = directory.entries.get("find-a-helpline")?.contact.find((contact) => /^https:\/\//i.test(contact.value));
  const ready = crisis && contactHref(crisis.contact.find((contact) => contact.kind === "phone") ?? { kind: "", value: "" });
  return (
    <aside className="wy-help wy-strip" aria-label="Help if you are struggling">
      {topic.slug === "addiction" && samhsa && (
        <div className="wy-strip-row">
          <div>For help with drugs or alcohol, the SAMHSA National Helpline (US) gives free, confidential treatment referral and information, any time. It is not an emergency or counselling line.</div>
          <Contacts entry={samhsa} only={(contact) => contact.kind === "phone" && !contact.note?.includes("TTY")} />
        </div>
      )}
      <div className="wy-strip-row">
        <div>If you're thinking about ending your life, you can call or text the US crisis line, any time, day or night.</div>
        {ready ? <Contacts entry={crisis} only={(contact) => contact.kind === "phone" || contact.kind === "text"} /> : <Fallback retry={directory.retry} />}
      </div>
      {abroadLink && <a className="wy-abroad" href={abroadLink.value} {...external} target="_blank">Outside the US: find a helpline</a>}
    </aside>
  );
}

const FOOT_LABELS: Record<string, string> = {
  "afsp-suicide-loss-groups": "If someone you love died by suicide",
  "domestic-violence-hotline": "If you are afraid of your spouse",
  "findtreatment-gov": "For clinical treatment near you",
};

/** "If you need someone to talk to" (design 6.4): the page's own entries, in order, with their checked dates. */
export function FootHelp({ topic, directory }: { topic: Pick<WhenTopic, "help">; directory: HelpDirectory }) {
  return (
    <section className="wy-foot-help" aria-labelledby="wy-foot-title">
      <h2 id="wy-foot-title">If you need someone to talk to</h2>
      {topic.help.entries.map((id) => {
        const entry = directory.entries.get(id);
        return entry ? <Entry key={id} entry={entry} label={FOOT_LABELS[id]} /> : null;
      })}
      {(topic.help.extra ?? []).map((link) => <div key={link.href} className="wy-foot-extra"><Link to={link.href}>{link.label}</Link></div>)}
      <div className="wy-foot-links">
        <Link to="/resources/life">More help near you, and help outside the United States</Link>
      </div>
    </section>
  );
}

/** The quiet crisis line on every page (design 6.5): calm, small, and never alarming. */
export function QuietHelp({ directory }: { directory: HelpDirectory }) {
  const crisis = directory.entries.get("988-lifeline");
  return (
    <aside className="wy-help wy-quiet" aria-label="Crisis help">
      <div>In immediate danger, use your local emergency number. If you're in crisis in the US, call or text the crisis line:</div>
      {crisis ? <Contacts entry={crisis} only={(contact) => contact.kind === "phone" || contact.kind === "text"} /> : <Fallback retry={directory.retry} />}
      <Link to="/resources/life">Find help near you, including outside the United States</Link>
    </aside>
  );
}
