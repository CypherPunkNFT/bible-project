// MOCK-UP (/test_banner_mockup, local preview only): versions of the questions page's "Ready to test yourself?"
// banner, with the three settings where the button was and the button appearing once all three are chosen (owner,
// 2026-10-23). The versions live in questions/BannerVersions.tsx. Styles: test-banner-mockup.css.
import type { ComponentType } from "react";
import { GridBanner, SentenceBanner } from "./questions/BannerVersions";
import "../questions-page.css";
import "../questions/test-banner.css";
import "../test-setup.css";
import "./test-banner-mockup.css";

const VERSIONS: { name: string; note: string; Version: ComponentType }[] = [
  { name: "Theme boxes", note: "The three settings in the theme shelves' box design: each box with its mark in a soft round tint, its name and a line, glowing faintly when pointed at or chosen; lines under the boxes only. The button sits under the words on the left.", Version: GridBanner },
  { name: "The sentence", note: "The test said as one sentence with three blanks. Each opens a short list; the button opens the test when the sentence is complete.", Version: SentenceBanner },
];

export default function TestBannerMockupPage() {
  return <div className="qp tbm">
    <header className="tbm-head">
      <p className="qp-eyebrow"><span></span>Mock-up · the questions page</p>
      <h1>Two ways to <em>a test of your own</em></h1>
      <p>The settings sit on the right, all unchosen, and the button asks for them. Choose all three and it opens the test. Each version shows the banner as it reads with David chosen.</p>
      <nav aria-label="The versions">{VERSIONS.map(({ name }, i) => <a key={name} href={`#version-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {VERSIONS.map(({ name, note, Version }, i) => <div key={name} id={`version-${i + 1}`} className="tbm-version">
      <div className="tbm-label"><span>Version {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
      <Version />
    </div>)}
  </div>;
}
