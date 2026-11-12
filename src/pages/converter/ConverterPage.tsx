// /converter: the biblical converter (docs/features/biblical-converter/design.md). Built in the tools hub's design (the
// games' hero and numbered shelves, games.css): the converter (01), measurements people look up (02), every unit with
// its source (03), and where the numbers come from (04). Nothing is sent or stored: the page works in the browser
// from its own tables, and loads only the Berean verses a reader opens.
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { formatNumber } from "@/lib/site-format";
import { GameArtImage } from "@/pages/games/art/parts";
import { CONVERTER_ART } from "./converter-art";
import { Converter } from "./Converter";
import { EXAMPLES } from "./examples";
import { Examples } from "./ExampleList";
import { DEFAULT_WAGE } from "./modern";
import { BIBLE_UNITS } from "./units";
import { UnitTables } from "./UnitTables";
import "@/pages/games/games.css";
import "./converter.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

export default function ConverterPage() {
  return <Routes>
    <Route index element={<ConverterHome />} />
    <Route path="*" element={<Navigate replace to="/converter" />} />
  </Routes>;
}

function Shelf({ id, index, title, text, children }: { id: string; index: string; title: string; text: string; children: ReactNode }) {
  return <section className="gm-shelf cv-shelf" id={id} aria-labelledby={`${id}-title`}>
    <div className="gm-shelf-head">
      <span className="gm-shelf-num" aria-hidden="true">{index}</span>
      <div><h2 id={`${id}-title`}>{title}</h2><p>{text}</p></div>
    </div>
    {children}
  </section>;
}

function ConverterHome() {
  const [wage, setWage] = useState(DEFAULT_WAGE);
  const { hash, search } = useLocation();
  // A link into the converter (#convert) or to an example (#example-…) lands on it.
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView?.({ block: "start" }); }, [hash, search]);
  const estimates = BIBLE_UNITS.filter((unit) => unit.confidence === "estimate").length;
  return <div className="st-page gm-page cv-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <ToolsBackLink />
        <h1>Biblical converter:<br /><span>cubits, shekels and talents today.</span></h1>
        <p className="gm-lede">How big was Noah's ark? What was a talent worth? Turn the Bible's lengths, weights, money and measures into today's units, with the Berean's own notes as the source and every estimate marked.</p>
        <StationStats items={[["Bible units", BIBLE_UNITS.length], ["Examples", EXAMPLES.length], ["Estimates marked", estimates]]} />
        <nav className="gm-jump" aria-label="On this page">
          <a href="#convert">Convert</a>
          <a href="#examples">Measurements in the Bible</a>
          <a href="#units">Every unit</a>
          <a href="#sources">Sources</a>
        </nav>
      </div>
      <div className="gm-hero-figure"><GameArtImage art={CONVERTER_ART} className="gm-hero-art" /></div>
    </header>

    <Shelf id="convert" index="01" title="Convert" text="Choose what to convert, type an amount and pick a unit, from the Bible or from today.">
      <Converter wage={wage} onWage={setWage} />
    </Shelf>
    <Shelf id="examples" index="02" title="Measurements in the Bible" text="The sizes people ask about, worked out with the same units, beside the verse in the Berean.">
      <Examples wage={wage} />
    </Shelf>
    <Shelf id="units" index="03" title="Every unit" text="Each unit's size today, how it relates to the others, how sure the size is, and the note it comes from.">
      <UnitTables wage={wage} />
    </Shelf>
    <Shelf id="sources" index="04" title="Where these numbers come from" text="What the tool relies on, and where scholars give different sizes.">
      <Sources />
    </Shelf>
  </div>;
}

function Sources() {
  return <div className="cv-sources">
    <p><strong>The Berean Standard Bible's own footnotes.</strong> Most modern sizes here are the ones the Berean prints under its verses (for example, under Genesis 6:15, the ark was "approximately 450 feet long"). Each unit's table row quotes its note word for word and links to the verse, so every number can be checked against the Bible text this site quotes.</p>
    <p><strong>Ratios Scripture itself gives.</strong> Twenty gerahs make a shekel (Exodus 30:13), a beka is half a shekel (Exodus 38:26), the omer is a tenth of an ephah (Exodus 16:36), the ephah and the bath are the same size and a tenth of a homer (Ezekiel 45:11), and Ezekiel's measuring reed is six long cubits, each a cubit and a handbreadth (Ezekiel 40:5).</p>
    <p><strong>Where sizes are estimates.</strong> Ancient measures were never as exact as ours, and some are known only roughly. Units marked "Scholarly estimate" are ones where the Berean's own notes disagree (the bath and the cor), where the size rests on tradition (the Sabbath day's journey), on stones found in digs (the pim), or on an assumption this tool states (the money below).</p>
    <p><strong>Money is counted in work, not in metal.</strong> A denarius was a labourer's pay for a day (Matthew 20:2), so the tool shows what a sum was worth in days of work, then pays that work at a day's wage today, which you can set. The silver in a coin is worth only a few dollars now and says little about what it bought. A Greek talent is counted as 6,000 days, the Berean's <q>about twenty years' wages</q> at about 300 working days a year. Old Testament silver was weighed, not coined, and is valued at the shekel's New Testament worth of four days' wages, an estimate, since silver bought more in earlier times.</p>
    <p><strong>Today's dollars are a guide.</strong> {`The day's wage starts at ${formatNumber(DEFAULT_WAGE, { style: "currency", currency: "USD", maximumFractionDigits: 0 })} (8 hours at $15). Change it to what a day's work earns where you live; a link you share opens with the reader's own wage, not yours.`}</p>
    <p className="cv-quiet">Scripture quotations are from the Berean Standard Bible (public domain). Nothing you type here leaves your browser or is saved.</p>
  </div>;
}
