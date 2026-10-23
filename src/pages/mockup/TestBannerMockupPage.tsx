// MOCK-UP (/test_banner_mockup, local preview only): versions of the questions page's "Ready to test yourself?"
// banner, with the three settings where the button was and the button appearing once all three are chosen (owner,
// 2026-10-23). The versions live in questions/BannerVersions.tsx. Styles: test-banner-mockup.css.
import type { ComponentType } from "react";
import { GridBanner, GridMiddleBanner, SentenceBanner } from "./questions/BannerVersions";
import "./questions-page.css";
import "./questions/test-banner.css";
import "./test-setup.css";
import "./test-banner-mockup.css";

const VERSIONS: { name: string; note: string; Version: ComponentType }[] = [
  { name: "Theme boxes, button under", note: "The three settings in the theme shelves' box design: one grid of fine lines, each box with its mark in a soft round tint, its name and a line, glowing faintly when pointed at or chosen. The button comes out centred under the boxes.", Version: GridBanner },
  { name: "Theme boxes, button in the middle", note: "The same boxes, with the button in the middle of the banner, between the words and the boxes.", Version: GridMiddleBanner },
  { name: "The sentence", note: "The test said as one sentence with three blanks. Each opens a short list; the button comes out when the sentence is complete.", Version: SentenceBanner },
];

export default function TestBannerMockupPage() {
  return <div className="qp tbm">
    <header className="tbm-head">
      <p className="qp-eyebrow"><span></span>Mock-up · the questions page</p>
      <h1>Three ways to <em>a test of your own</em></h1>
      <p>The settings sit where the button was, all unchosen. Choose all three and the button comes out. Each version shows the banner as it reads with David chosen.</p>
      <nav aria-label="The versions">{VERSIONS.map(({ name }, i) => <a key={name} href={`#version-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {VERSIONS.map(({ name, note, Version }, i) => <div key={name} id={`version-${i + 1}`} className="tbm-version">
      <div className="tbm-label"><span>Version {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
      <Version />
    </div>)}
  </div>;
}
