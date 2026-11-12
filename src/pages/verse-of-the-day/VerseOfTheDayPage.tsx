// /verse-of-the-day (docs/features/verse-widget/design.md 7): today's verse, drawn by the real widget, and the builder
// where a church gets the code for its own website. The page says nothing about today until the browser has worked it
// out, so a search engine's ready-made copy never names a stale date or verse.
import { useState } from "react";
import { cardPagePath, keyFromReadPath } from "@/lib/verse-card/links";
import { Builder } from "./Builder";
import { WidgetBox, type ShownDay } from "./Preview";
import "./verse-of-the-day.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

const TODAY_ATTRIBUTES = { "data-style": "card" };

interface Platform { id: string; name: string; description: string; help?: { href: string; text: string } }

const PLATFORMS: Platform[] = [
  {
    id: "wordpress", name: "WordPress",
    description: "Add a Custom HTML block where you want the verse, or a Custom HTML widget in a sidebar, and paste the code. On WordPress.com this needs a paid plan with plugins switched on. On the free plan, use Just a link.",
    help: { href: "https://wordpress.org/documentation/article/custom-html/", text: "WordPress help: the Custom HTML block" },
  },
  {
    id: "squarespace", name: "Squarespace",
    description: "Add a Code block, set it to HTML and paste the code. This needs the Core, Plus or Advanced plan, or the older Business or Commerce plan. On Personal, use Just a link.",
    help: { href: "https://support.squarespace.com/hc/en-us/articles/206543167-Code-blocks", text: "Squarespace help: code blocks" },
  },
  {
    id: "wix", name: "Wix",
    description: "Choose Add, then Embed code, then Embed HTML. Choose Code, paste the frame code from the second tab, and set the height the tab recommends.",
    help: { href: "https://dev.wix.com/docs/develop-websites/articles/wix-editor-elements/other-elements/html-i-frame-element/working-with-the-html-iframe-element", text: "Wix help: the HTML iframe element" },
  },
  {
    id: "church", name: "Church website platforms",
    description: "On Subsplash, Nucleus, The Church Co, Clover, Tithe.ly Sites and others, look for a Custom code, Embed or HTML block and paste the first code. If nothing shows, try the frame code.",
  },
  { id: "own", name: "Your own site", description: "Paste the code into the page's HTML where you want the verse." },
];

function PasteSteps() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="vd-rows">
      {PLATFORMS.map((platform) => (
        <li key={platform.id}>
          <button type="button" className="vd-row" aria-expanded={open === platform.id} aria-controls={`vd-steps-${platform.id}`}
            onClick={() => setOpen(open === platform.id ? null : platform.id)}>{platform.name}</button>
          <div id={`vd-steps-${platform.id}`} className="vd-steps" hidden={open !== platform.id}>
            <p>{platform.description}</p>
            {platform.help && <p><a href={platform.help.href} target="_blank" rel="noopener noreferrer">{platform.help.text}</a></p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function VerseOfTheDayPage() {
  const [today, setToday] = useState<ShownDay | null>(null);
  return (
    <article className="vd-page mx-auto max-w-4xl px-4 sm:px-6">
      <ToolsBackLink />
      <h1>Bible verse of the day</h1>
      <WidgetBox className="vd-today" attributes={TODAY_ATTRIBUTES} onDay={setToday} />
      {today && <p className="vd-chapter"><a href={today.read}>Read the chapter</a>{keyFromReadPath(today.read) && <> · <a href={cardPagePath(keyFromReadPath(today.read)!)}>Make a card of this verse</a></>}</p>}
      <p className="vd-intro">Every day a new verse from the Berean Standard Bible, the same for everyone, changing at midnight where you are.</p>

      <section aria-labelledby="vd-builder-title">
        <h2 id="vd-builder-title">Put it on your church's website</h2>
        <p className="vd-lead">Choose how it should look, then copy a few lines of code into your website. It is free, with no account, and the verse changes by itself every day.</p>
        <Builder />
      </section>

      <section aria-labelledby="vd-paste-title">
        <h2 id="vd-paste-title">Where to paste it</h2>
        <PasteSteps />
      </section>

      <section aria-labelledby="vd-privacy-title">
        <h2 id="vd-privacy-title">Privacy, in plain words</h2>
        <ul className="vd-list">
          <li>No cookies, no sign-up, no account and no key.</li>
          <li>No tracking: Bible Guide keeps no record of which websites show the verse or who sees it, and the links carry nothing that identifies your church or your visitors.</li>
          <li>Nothing from any other company is loaded: no fonts, no analytics, no adverts.</li>
          <li>The widget asks bibleguide.io for one small file a day, and tells it nothing about the page it is on.</li>
          <li>Like every website, bibleguide.io is delivered by its host, Cloudflare, which sees a visitor's internet address in order to send the file. Bible Guide does not collect or keep these.</li>
        </ul>
        <p className="vd-quiet">Because it sets no cookies and stores nothing in the visitor's browser, the widget needs no cookie consent. A visitor's browser does contact Cloudflare to fetch the file; a website that avoids every outside request can use Just a link instead.</p>
      </section>

      <details className="vd-web">
        <summary>For your web person</summary>
        <p>The widget loads two files from bibleguide.io: the script at /widget/v1/verse.js and the day's verse at /widget/v1/days/, by the visitor's own date. The frame version is the page /widget/v1/frame.</p>
        <p>If your site has a Content Security Policy, allow these lines:</p>
        <pre translate="no">{"script-src https://bibleguide.io\nconnect-src https://bibleguide.io\nframe-src https://bibleguide.io"}</pre>
        <p>Options, as data- attributes on the div or in the frame's address: style (plain or card), theme (auto, light or dark), accent (a colour such as #6b38a3), font (site, serif or sans), size (standard or compact), heading (verse-of-the-day, todays-verse or none) and align (start or center).</p>
        <p>Every address under /widget/v1/ keeps working with the same options for as long as the site exists; a change that would break an old snippet will come as /widget/v2/ beside it.</p>
        <p>The script is small, has no dependencies and is readable at its address: <a href="/widget/v1/verse.js" target="_blank" rel="noopener">verse.js</a>. It looks for its divs once, when the page loads; a div your own JavaScript adds later is drawn only if the script line comes after it.</p>
      </details>

      <section aria-labelledby="vd-questions-title">
        <h2 id="vd-questions-title">Questions</h2>
        <dl className="vd-questions">
          <dt>Is it free?</dt>
          <dd>Yes, always, with no account.</dd>
          <dt>Which Bible does it quote?</dt>
          <dd>The Berean Standard Bible, in English.</dd>
          <dt>Can we choose the verses?</dt>
          <dd>Not in this version. The verse is the same for every church on the same day, so a congregation shares it.</dd>
          <dt>It shows only two links. What went wrong?</dt>
          <dd>The two links mean the script could not run. Try the frame code in the second tab, or check whether your website's plan allows code.</dd>
        </dl>
      </section>
    </article>
  );
}
