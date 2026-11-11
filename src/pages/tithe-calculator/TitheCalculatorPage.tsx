// /tithe-calculator: the tithe and giving calculator (docs/features/tithe-calculator/design.md). Built in the tools hub's
// design (the games' hero and numbered shelves, games.css), like /converter: the calculator (01), other percentages
// (02), what the Bible says about giving (03) and how the page keeps what is typed private (04). Nothing typed is
// sent or stored: it lives in this page's state and is gone when the page is closed or reloaded.
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { GameArtImage } from "@/pages/games/art/parts";
import { Calculator, PercentTable } from "./Calculator";
import { START, parseAmount, parsePercent, type Entry } from "./giving";
import { Scripture } from "./Scripture";
import { TITHE_ART } from "./tithe-art";
import "@/pages/games/games.css";
import "./tithe-calculator.css";

function Shelf({ id, index, title, text, children }: { id: string; index: string; title: string; text: string; children: ReactNode }) {
  return <section className="gm-shelf tc-shelf" id={id} aria-labelledby={`${id}-title`}>
    <div className="gm-shelf-head">
      <span className="gm-shelf-num" aria-hidden="true">{index}</span>
      <div><h2 id={`${id}-title`}>{title}</h2><p>{text}</p></div>
    </div>
    {children}
  </section>;
}

export default function TitheCalculatorPage() {
  const [entry, setEntry] = useState<Entry>(START);
  const amount = parseAmount(entry.amountText);
  const percent = parsePercent(entry.percentText);
  return <div className="st-page gm-page tc-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <p className="st-kick"><Link to="/tools">Tools</Link></p>
        <h1>Tithe and giving calculator:<br /><span>a tenth, or the share you choose.</span></h1>
        <p className="gm-lede">Type what you earn and how often, and see what a tithe, or any percentage you choose, comes to each week, each month and each year. It all happens on this page: nothing you type is sent anywhere or saved.</p>
        <nav className="gm-jump" aria-label="On this page">
          <a href="#calculate">Calculate</a>
          <a href="#percentages">Other percentages</a>
          <a href="#scripture">What the Bible says</a>
          <a href="#private">Private by design</a>
        </nav>
      </div>
      <div className="gm-hero-figure"><GameArtImage art={TITHE_ART} className="gm-hero-art" /></div>
    </header>

    <Shelf id="calculate" index="01" title="Calculate" text="Your income, how often it comes, and the percentage you want to give.">
      <Calculator entry={entry} onEntry={setEntry} amount={amount} percent={percent} />
    </Shelf>
    <Shelf id="percentages" index="02" title="Other percentages" text="The same income at other percentages, side by side.">
      <PercentTable entry={entry} amount={amount} percent={percent} />
    </Shelf>
    <Shelf id="scripture" index="03" title="What the Bible says about giving" text="What the Baptist Faith and Message says, the two ways Baptists read the tithe, and the passages both turn to, in the Berean Standard Bible.">
      <Scripture />
    </Shelf>
    <Shelf id="private" index="04" title="Private by design" text="What this page does with what you type.">
      <div className="tc-prose-block">
        <p>Everything is worked out in your browser. Your income, the percentage and the currency are never sent anywhere, never put in the page's address, and never saved in your browser's storage or in cookies. Closing or reloading the page clears them. There is no account and no tracking.</p>
        <p>Opening one of the passages above asks this site for that book of the Berean Standard Bible, the same file the Bible reader uses. Nothing you typed goes with it.</p>
        <p className="tc-quiet">Scripture quotations are from the Berean Standard Bible (public domain).</p>
      </div>
    </Shelf>
  </div>;
}
