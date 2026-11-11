// Send (design 8.1), offered only on the items made to give someone: the housewarming blessing and the Scripture
// blessings. A plain message the visitor sees before sending: an optional opening line, the words with the name typed for
// this send only, the source line and the link. The name lives in this component's state and nowhere else.
import { useId, useState } from "react";
import type { BlessingItem, BlessingPage } from "@/data/home-blessings";
import { blessingMessage, cleanName, emailHref, NAME_MAX, OPENINGS, subjectFor, textHref, type Opening } from "./message";

const OPENING_LABELS: Record<Opening, string> = { thinking: OPENINGS.thinking, home: OPENINGS.home, none: "No opening line" };

interface SendProps {
  page: BlessingPage;
  item: BlessingItem;
  verse?: { text: string; reference: string };
  copy: (text: string) => Promise<void>;
}

export function SendPanel({ page, item, verse, copy }: SendProps) {
  const forSomeone = item.kind === "written" && Boolean(item.forSomeone);
  const [name, setName] = useState("");
  const [opening, setOpening] = useState<Opening>(item.id === "for-a-new-home" ? "home" : "none");
  const id = useId();
  const message = blessingMessage(page, item, { name: forSomeone ? name : "", opening, verse });
  const share = async () => {
    try { await navigator.share({ text: message }); }
    catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.warn("home-blessings: the share sheet failed, so the message is copied instead", error);
      void copy(message);
    }
  };
  const openings = (Object.keys(OPENING_LABELS) as Opening[]).filter((key) => key !== "home" || item.id === "for-a-new-home");
  return (
    <div className="hb-message">
      {forSomeone && (
        <label className="hb-field">
          Their name (optional)
          <input type="text" maxLength={NAME_MAX} autoComplete="off" translate="no" dir="auto" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      )}
      <fieldset className="hb-choice">
        <legend>Opening line</legend>
        {openings.map((key) => (
          <label key={key}><input type="radio" name={`${id}-opening`} checked={opening === key} onChange={() => setOpening(key)} /> {OPENING_LABELS[key]}</label>
        ))}
      </fieldset>
      <pre className="hb-preview" translate={forSomeone && cleanName(name) ? "no" : undefined}>{message}</pre>
      <div className="hb-actions">
        {typeof navigator.share === "function" && <button type="button" onClick={() => void share()}>Share…</button>}
        <button type="button" onClick={() => void copy(message)}>Copy message</button>
        <a href={emailHref(subjectFor(item), message)}>Email</a>
        <a className="hb-text-message" href={textHref(message)}>Text message</a>
      </div>
    </div>
  );
}
