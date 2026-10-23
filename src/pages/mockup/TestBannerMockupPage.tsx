// MOCK-UP (/test_banner_mockup, local preview only): four versions of the questions page's "Ready to test yourself?"
// banner, with the three settings where the button was and the button appearing once all three are chosen (owner,
// 2026-10-23). The versions live in questions/BannerVersions.tsx. Styles: test-banner-mockup.css.
import type { ComponentType } from "react";
import { RowsBanner, SentenceBanner, StepsBanner, TilesBanner } from "./questions/BannerVersions";
import "./questions-page.css";
import "./questions/test-banner.css";
import "./test-setup.css";
import "./test-banner-mockup.css";

const VERSIONS: { name: string; note: string; Version: ComponentType }[] = [
  { name: "Three rows", note: "The three settings stacked where the button was, each a row of buttons under its name. Nothing is chosen at first; the button slides out under them once all three are.", Version: RowsBanner },
  { name: "One at a time", note: "One question at a time. Each answer folds into a small chip that opens it again, and the button comes out after the third.", Version: StepsBanner },
  { name: "Icon tiles", note: "Square tiles with the number, the rising bars or the age group's icon drawn large. A tick marks each row as it is chosen.", Version: TilesBanner },
  { name: "The sentence", note: "The test said as one sentence with three blanks. Each opens a short list; the button comes out when the sentence is complete.", Version: SentenceBanner },
];

export default function TestBannerMockupPage() {
  return <div className="qp tbm">
    <header className="tbm-head">
      <p className="qp-eyebrow"><span></span>Mock-up · the questions page</p>
      <h1>Four ways to <em>a test of your own</em></h1>
      <p>The settings sit where the button was, all unchosen. Choose all three and the button comes out. Each version shows the banner as it reads with David chosen.</p>
      <nav aria-label="The four versions">{VERSIONS.map(({ name }, i) => <a key={name} href={`#version-${i + 1}`}><span>{i + 1}</span>{name}</a>)}</nav>
    </header>
    {VERSIONS.map(({ name, note, Version }, i) => <div key={name} id={`version-${i + 1}`} className="tbm-version">
      <div className="tbm-label"><span>Version {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
      <Version />
    </div>)}
  </div>;
}
