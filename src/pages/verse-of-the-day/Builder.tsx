// "Put it on your church's website" (docs/features/verse-widget/design.md 7.2, item 3): the choices, a live preview
// drawn by the real script, and the snippet in three tabs. Nothing is saved: leaving the page forgets the choices, and
// the snippet is the record.
import { useState, type CSSProperties, type ReactNode } from "react";
import { hardToReadOn } from "./contrast";
import { WidgetBox, type ShownDay } from "./Preview";
import {
  cleanAccent, DEFAULT_OPTIONS, frameHeight, iframeSnippet, LINK_SNIPPET_HTML, LINK_SNIPPET_TEXT, previewAttributes, scriptSnippet,
  type WidgetOptions,
} from "./snippet";

/** Link colours from the site's palette: Gospels purple, Prophets blue, Poetry teal, History terracotta, Revelation crimson, accent gold. */
const SWATCHES = ["#6b38a3", "#22599f", "#18716a", "#a14d28", "#b3263c", "#8a5a12"];

type Tab = "script" | "frame" | "link";
type Backdrop = "white" | "dark" | "own";

interface Choice<T extends string> { value: T; label: ReactNode }

function ChoiceRow<T extends string>({ label, value, choices, onChoose }: { label: string; value: T; choices: Choice<T>[]; onChoose: (value: T) => void }) {
  return (
    <div className="vd-choice" role="group" aria-label={label}>
      <span className="vd-choice-label" aria-hidden="true">{label}</span>
      <span className="vd-choice-buttons">
        {choices.map((choice) => (
          <button key={choice.value} type="button" className="vd-button" aria-pressed={value === choice.value} onClick={() => onChoose(choice.value)}>{choice.label}</button>
        ))}
      </span>
    </div>
  );
}

function AccentRow({ accent, onAccent }: { accent: string | null; onAccent: (accent: string | null) => void }) {
  const [typed, setTyped] = useState(accent ?? "");
  const own = accent !== null && !SWATCHES.includes(accent);
  const choose = (value: string | null) => { onAccent(value); setTyped(value ?? ""); };
  return (
    <div className="vd-choice" role="group" aria-label="Link colour">
      <span className="vd-choice-label" aria-hidden="true">Link colour</span>
      <span className="vd-choice-buttons">
        <button type="button" className="vd-button" aria-pressed={accent === null} onClick={() => choose(null)}>Same as the text</button>
        {SWATCHES.map((swatch) => (
          <button key={swatch} type="button" className="vd-swatch" aria-pressed={accent === swatch} aria-label={swatch} title={swatch}
            style={{ "--vd-swatch": swatch } as CSSProperties} onClick={() => choose(swatch)} />
        ))}
        <label className={`vd-own${own ? " vd-own-on" : ""}`}>
          <span>Your own colour</span>
          <input type="color" value={cleanAccent(accent) && accent!.length === 7 ? accent! : "#6b38a3"} onChange={(event) => choose(event.target.value)} />
          <input type="text" className="vd-hex" value={typed} maxLength={7} spellCheck={false} aria-label="Colour as a hex code" translate="no"
            onChange={(event) => { setTyped(event.target.value); const clean = cleanAccent(event.target.value); if (clean) onAccent(clean); }} />
        </label>
      </span>
    </div>
  );
}

/** Copy, then "Copied" for two seconds; where copying is refused, the box is selected and a line says how. */
function CopyBox({ text, rows, label }: { text: string; rows: number; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const [box, setBox] = useState<HTMLTextAreaElement | null>(null);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("this browser offers no clipboard");
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch (error) {
      console.warn("verse of the day: copying was refused; showing the code to copy by hand", error);
      box?.select();
      setState("manual");
    }
  };
  return (
    <div className="vd-copy">
      <textarea ref={setBox} className="vd-code" readOnly translate="no" rows={rows} value={text} aria-label={label} onFocus={(event) => event.target.select()} />
      <div className="vd-copy-row">
        <button type="button" className="vd-button vd-button-main" onClick={copy}>{state === "copied" ? "Copied" : "Copy"}</button>
        {state === "manual" && <span className="vd-quiet" role="status">Press Ctrl+C, or long-press and choose Copy</span>}
      </div>
    </div>
  );
}

function contrastNote(options: WidgetOptions): string | null {
  if (!options.accent) return null;
  if (options.style === "plain") return "On the plain look, check this colour against your own page in the preview.";
  const hard = hardToReadOn(options.accent, options.theme);
  if (hard.length === 2) return "This colour is hard to read on both light and dark cards.";
  if (hard[0] === "light") return "This colour is hard to read on a light card.";
  if (hard[0] === "dark") return "This colour is hard to read on a dark card.";
  return null;
}

function backdropStyle(backdrop: Backdrop, own: { background: string; text: string }, width: number): CSSProperties {
  const colours = backdrop === "white" ? { background: "#ffffff", color: "#1f1b16" } : backdrop === "dark" ? { background: "#16161a", color: "#ecebe6" } : { background: own.background, color: own.text };
  return { ...colours, maxWidth: `${width}px` };
}

export function Builder() {
  const [options, setOptions] = useState<WidgetOptions>(DEFAULT_OPTIONS);
  const [tab, setTab] = useState<Tab>("script");
  const [backdrop, setBackdrop] = useState<Backdrop>("white");
  const [own, setOwn] = useState({ background: "#f3efe6", text: "#2a2620" });
  const [width, setWidth] = useState(420);
  const [longest, setLongest] = useState<ShownDay | null>(null);
  const [longestState, setLongestState] = useState<"off" | "loading" | "on" | "failed">("off");
  const set = <K extends keyof WidgetOptions>(name: K) => (value: WidgetOptions[K]) => setOptions((current) => ({ ...current, [name]: value }));
  const frame = tab === "frame";
  const shown: WidgetOptions = frame && options.font === "site" ? { ...options, font: "serif" } : options;
  const note = contrastNote(options);

  const toggleLongest = async () => {
    if (longestState === "on") { setLongestState("off"); return; }
    if (longest) { setLongestState("on"); return; }
    setLongestState("loading");
    try {
      const response = await fetch("/widget/v1/pool.json");
      const pool = (await response.json()) as { longest?: ShownDay };
      if (!pool.longest) throw new Error("pool.json has no longest day");
      setLongest(pool.longest);
      setLongestState("on");
    } catch (error) {
      console.warn("verse of the day: the longest verse could not be loaded", error);
      setLongestState("failed");
    }
  };

  return (
    <div className="vd-builder">
      <div className="vd-choices">
        <ChoiceRow label="Look" value={options.style} onChoose={set("style")} choices={[{ value: "plain", label: <span>Plain</span> }, { value: "card", label: <span>Card</span> }]} />
        {options.style === "card" && (
          <ChoiceRow label="Colours" value={options.theme} onChoose={set("theme")}
            choices={[{ value: "auto", label: <span>Match the visitor's device</span> }, { value: "light", label: <span>Light</span> }, { value: "dark", label: <span>Dark</span> }]} />
        )}
        {frame && options.style === "plain" && (
          <ChoiceRow label="Text in the frame" value={options.frameText} onChoose={set("frameText")}
            choices={[{ value: "light", label: <span>Dark text, for a light page</span> }, { value: "dark", label: <span>Light text, for a dark page</span> }]} />
        )}
        <AccentRow accent={options.accent} onAccent={set("accent")} />
        {note && <p className="vd-warning" role="status">{note}</p>}
        <ChoiceRow label="Font" value={shown.font} onChoose={set("font")}
          choices={[...(frame ? [] : [{ value: "site" as const, label: <span>Your website's</span> }]), { value: "serif", label: <span>Serif</span> }, { value: "sans", label: <span>Sans</span> }]} />
        <ChoiceRow label="Size" value={options.size} onChoose={set("size")} choices={[{ value: "standard", label: <span>Standard</span> }, { value: "compact", label: <span>Compact</span> }]} />
        <ChoiceRow label="Heading" value={options.heading} onChoose={set("heading")}
          choices={[{ value: "verse-of-the-day", label: <span>Verse of the day</span> }, { value: "todays-verse", label: <span>Today's verse</span> }, { value: "none", label: <span>None</span> }]} />
        <ChoiceRow label="Align" value={options.align} onChoose={set("align")} choices={[{ value: "start", label: <span>Left</span> }, { value: "center", label: <span>Centre</span> }]} />
      </div>

      <div className="vd-preview">
        <h3>Preview</h3>
        <div className="vd-preview-controls">
          <ChoiceRow label="Preview on" value={backdrop} onChoose={setBackdrop}
            choices={[{ value: "white", label: <span>White page</span> }, { value: "dark", label: <span>Dark page</span> }, { value: "own", label: <span>Your colours</span> }]} />
          {backdrop === "own" && (
            <div className="vd-own-colours">
              <label><span>Page colour</span> <input type="color" value={own.background} onChange={(event) => setOwn({ ...own, background: event.target.value })} /></label>
              <label><span>Text colour</span> <input type="color" value={own.text} onChange={(event) => setOwn({ ...own, text: event.target.value })} /></label>
            </div>
          )}
          <label className="vd-width"><span>Width</span>
            <input type="range" min={260} max={640} step={10} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
            <output>{`${width} pixels`}</output>
          </label>
          <label className="vd-longest">
            <input type="checkbox" checked={longestState === "on"} onChange={toggleLongest} disabled={longestState === "loading"} />
            <span>Show the longest verse</span>
          </label>
          {longestState === "failed" && <span className="vd-quiet" role="status">The longest verse could not be loaded.</span>}
        </div>
        <WidgetBox className="vd-preview-box" style={backdropStyle(backdrop, own, width)} attributes={previewAttributes(shown)} day={longestState === "on" ? longest : null} />
      </div>

      <div className="vd-tabs" role="tablist" aria-label="Choose how to add it">
        <button type="button" role="tab" id="vd-tab-script" aria-selected={tab === "script"} aria-controls="vd-panel" onClick={() => setTab("script")}>Most websites (recommended)</button>
        <button type="button" role="tab" id="vd-tab-frame" aria-selected={tab === "frame"} aria-controls="vd-panel" onClick={() => setTab("frame")}>If your website does not allow scripts</button>
        <button type="button" role="tab" id="vd-tab-link" aria-selected={tab === "link"} aria-controls="vd-panel" onClick={() => setTab("link")}>Just a link</button>
      </div>
      <div className="vd-panel" id="vd-panel" role="tabpanel" aria-labelledby={`vd-tab-${tab}`}>
        {tab === "script" && <CopyBox text={scriptSnippet(options)} rows={6} label="Code to paste into your website" />}
        {tab === "frame" && (
          <>
            <CopyBox text={iframeSnippet(options)} rows={5} label="Frame code to paste into your website" />
            <p className="vd-quiet">{`Recommended height: ${frameHeight(options)} pixels. On Wix, set the Embed HTML element to this height.`}</p>
            {options.style === "plain" && <p className="vd-quiet">On a dark page, choose the Card look.</p>}
          </>
        )}
        {tab === "link" && (
          <>
            <CopyBox text={LINK_SNIPPET_HTML} rows={2} label="Link code to paste into your website" />
            <p className="vd-quiet">For a website builder that only takes a link, use this line:</p>
            <CopyBox text={LINK_SNIPPET_TEXT} rows={1} label="Link as plain text" />
          </>
        )}
      </div>
    </div>
  );
}
