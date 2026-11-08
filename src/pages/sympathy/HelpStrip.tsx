// The calm help strip on the suicide page (design 5.4), in the site's green help style, never red. Every number and link
// is read from the help directory's checked data (life.json); none is typed here. An entry missing from the data leaves
// its line out, and a directory that cannot load leaves the whole strip out rather than taking the page down with it.
import { MessageSquareText, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { loadResource, type Help, type LifeData } from "@/data/resources";
import { dialable, smsHref, wayOf } from "@/pages/resources/contact-links";

const CRISIS = "988-lifeline";
const ABROAD = "find-a-helpline";
const SUICIDE_LOSS = "afsp-suicide-loss-groups";

interface StripLines {
  call: string | null;
  text: string | null;
  abroad: string | null;
  groups: string | null;
}

/** What the strip can say from the directory's entries; null wherever the data does not give it. */
function stripLines(data: LifeData): StripLines {
  const entries = new Map<string, Help>(data.groups.flatMap((group) => group.entries).map((entry) => [entry.id, entry]));
  const crisis = entries.get(CRISIS);
  const contact = (entry: Help | undefined, way: string) => entry?.contact.find((item) => wayOf(item.kind) === way)?.value ?? null;
  return {
    call: contact(crisis, "call"),
    text: contact(crisis, "text"),
    abroad: contact(entries.get(ABROAD), "web"),
    groups: entries.get(SUICIDE_LOSS)?.locator ?? contact(entries.get(SUICIDE_LOSS), "web"),
  };
}

export function HelpStrip() {
  const [lines, setLines] = useState<StripLines | null>(null);
  useEffect(() => {
    let live = true;
    loadResource("life")
      .then((data) => { if (live && data) setLines(stripLines(data)); })
      .catch((error: unknown) => console.warn("sympathy: the help directory (life.json) could not be read; the help strip is left out", error));
    return () => { live = false; };
  }, []);
  if (!lines || (!lines.call && !lines.text && !lines.abroad && !lines.groups)) return null;
  const both = lines.call && lines.text && dialable(lines.call) === dialable(lines.text);
  const sentence = both ? `If you're struggling yourself, you can call or text ${lines.call}, any time, day or night.`
    : lines.call ? `If you're struggling yourself, you can call ${lines.call}, any time, day or night.`
    : lines.text ? `If you're struggling yourself, you can text ${lines.text}, any time, day or night.` : null;
  return (
    <aside className="sy-help" aria-label="Help if you are struggling">
      {sentence && <p>{sentence}</p>}
      {(lines.call || lines.text) && (
        <p className="sy-help-links">
          {lines.call && <a href={`tel:${dialable(lines.call)}`}><Phone size={16} strokeWidth={1.6} aria-hidden="true" />{`Call ${lines.call}`}</a>}
          {lines.text && <a href={smsHref(lines.text)}><MessageSquareText size={16} strokeWidth={1.6} aria-hidden="true" />{`Text ${lines.text}`}</a>}
        </p>
      )}
      {lines.abroad && <p><a href={lines.abroad} target="_blank" rel="noopener noreferrer">Outside the US: find a helpline</a></p>}
      {lines.groups && <p><a href={lines.groups} target="_blank" rel="noopener noreferrer">Groups for people who have lost someone to suicide</a></p>}
    </aside>
  );
}
