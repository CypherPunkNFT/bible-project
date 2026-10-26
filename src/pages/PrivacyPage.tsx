import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export const CONTACT_ADDRESS = "amen@bibleguide.io";
export const UPDATED = "25 October 2026";

const mail = <a href={`mailto:${CONTACT_ADDRESS}`} className="text-accent underline-offset-4 hover:underline">{CONTACT_ADDRESS}</a>;

export const SUMMARY = [
  "You need no account to read, study or listen.",
  "No ads, no analytics and no tracking. Nothing is sold or shared for marketing.",
  "Your settings and progress stay in your browser or on your phone.",
  "We receive only what you choose to send: a message, a correction, or a testimony you publish.",
];

/** Every claim here was checked against the code on 2026-10-25 (server/contact.ts, server/testimonies.ts, the browser-storage keys, App/src/lib/site-content.ts); change the text when the behaviour changes. */
export const SECTIONS: { title: string; body: ReactNode[] }[] = [
  { title: "Who we are", body: [
    <>Bible Guide is a program of Redeemer Forge, Inc., a Florida not-for-profit corporation, which is responsible for the personal information described here. Write to us about privacy at {mail}.</>,
  ] },
  { title: "Visiting the website", body: [
    "The site is delivered by Cloudflare, our hosting provider. Like any web host, Cloudflare handles your internet (IP) address and basic details of each request in order to deliver pages and protect the site from attacks. We add no analytics, advertising or tracking of our own.",
    "Maps, map images and fonts come from our own files.",
  ] },
  { title: "What is saved in your own browser", body: [
    "To remember your place, the site keeps a few things in your browser: your theme and reader settings, your reading progress and last chapter, where you stopped in the audio Bible, your results on the Bible questions, notes you keep in the apologetics notebook, a few display preferences, and the files meaning search downloads from our site.",
    "While you write a testimony, your draft and your private access link are kept in that browser tab until you close it.",
    "None of this is sent to us. You can clear it at any time in your browser's settings.",
  ] },
  { title: "Videos and recordings", body: [
    "Pages with videos show them from YouTube in its privacy-enhanced mode. When you open such a page, YouTube (Google) receives your internet address, and Google's privacy policy applies.",
    "The audio Bible, read by LibriVox volunteers, streams from the Internet Archive (archive.org) when you press play, and its privacy policy applies. Links to other websites lead to sites with their own policies.",
  ] },
  { title: "Messages and corrections", body: [
    "The contact form sends your message, with your name and email address if you give them, to our mailbox, which Zoho Mail hosts. The \"Suggest a correction\" button sends your note, the page it is about, and your email address if you give it.",
    "We use these only to read and reply. They stay in our mailbox until they are no longer needed, and we delete them sooner if you ask.",
    "To stop abuse, the site counts how many messages come from each connection in an hour, using a one-way code made from your internet address and the hour. The code is used only for counting and is deleted after it expires.",
  ] },
  { title: "Testimonies", body: [
    "Testimonies are shared by invitation. You choose the name, title and story you publish, and they appear publicly as soon as you share them. Your approximate town, region and country, worked out from your internet connection and rounded to about 10 kilometres, are kept with your story and place it on the public map.",
    "We do not keep your internet address, email address or device details. Your private access link signs you in with a cookie that lasts 30 days and is removed when you sign out. When you edit your story, its earlier versions are kept.",
    "You can withdraw your story at any time. Your name, text and place on the map leave public view, and your spot in the chain of invitations shows only \"Story unavailable\". To have your story, its earlier versions and its location deleted entirely, email us. We keep stories until you ask us to delete them.",
    "Anyone can report a published story. A report holds only the reason given, and we use reports to review stories and, where needed, hide them.",
  ] },
  { title: "The Bible Guide app", body: [
    "The Bible Guide app for iPhone and Android (coming soon) has no account, no ads, no analytics and no tracking. The Bible texts are built into the app and work without internet.",
    "Study pages such as people, topics and creeds download from bibleguide.io the first time you open them, and the app checks bibleguide.io for updated content when it starts. Those requests reach our host, Cloudflare, as described above. Listen plays videos from YouTube and recordings from archive.org.",
    "Bookmarks, notes, reading progress, settings and downloaded pages are kept on your phone and are not sent to us. Deleting the app removes them, though your phone's own backup (iCloud or Google) may include them.",
  ] },
  { title: "Children", body: [
    "Bible Guide is for everyone, including families. We do not knowingly collect personal information from children under 13. Children should send a message or share a testimony only with a parent's permission. If you believe a child has sent us personal information, email us and we will delete it.",
  ] },
  { title: "Who we share it with", body: [
    "We do not sell or rent personal information, and we do not share it for advertising. The only companies that handle it are the services that run Bible Guide: Cloudflare (hosting and the testimony database) and Zoho (email). They process it on our behalf and are bound to protect it, and they may store it in the United States and other countries. We also share it where the law requires us to.",
  ] },
  { title: "Your choices", body: [
    <>Email {mail} to ask what we hold about you, to correct it, or to delete it. You can withdraw a testimony yourself at any time, and clear what your browser saved in its settings.</>,
  ] },
  { title: "Changes to this policy", body: [
    "If what we collect changes, we will update this page and the date at the top.",
  ] },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Privacy</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted">Last updated {UPDATED}</p>
      <p className="mt-6 text-lg leading-8 text-muted">Bible Guide is free, has no ads and does not track you. This page says exactly what the website and the Bible Guide app collect, and why.</p>
      <ul className="mt-8 space-y-3 rounded-2xl border border-line bg-surface p-6">
        {SUMMARY.map(line => <li key={line} className="flex gap-3 text-sm leading-7"><span aria-hidden className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{line}</li>)}
      </ul>
      {SECTIONS.map(section => (
        <section key={section.title} className="mt-12">
          <h2 className="border-b border-line pb-3 font-serif text-2xl">{section.title}</h2>
          {section.body.map((paragraph, index) => <p key={index} className="mt-4 leading-8 text-muted">{paragraph}</p>)}
        </section>
      ))}
      <p className="mt-12 text-sm text-muted">Need help with something else? See <Link to="/support" className="text-accent underline-offset-4 hover:underline">Support</Link>.</p>
    </div>
  );
}
