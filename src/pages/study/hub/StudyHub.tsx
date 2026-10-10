import { lazy, Suspense } from "react";
import { Icon, StudyLink } from "./shared";
import { HubSearch } from "./HubSearch";
import { PeopleCards } from "./PeopleCards";
import "./hub.css";
const AtlasWindow = lazy(() => import("./AtlasWindow"));
export default function StudyHub() {
    return <div className="study-experience">
  <div className="hub">
    <header className="hub-intro">
      <div className="intro-copy">
        <p className="eyebrow"><span></span> The study hub</p>
        <h1>Go deeper into <em>the Word.</em></h1>
        <p className="intro-lead">Begin with Scripture and its teaching, or explore the history,<br className="wide-break"/> texts and people that illuminate it.</p>
      </div>
    <HubSearch /></header>    <div className="section-rule"><span>Choose your way in</span><span>Scripture, its teaching and its world.</span></div>
    <section className="study-doors" aria-label="Study collections">
      <StudyLink className="study-door scripture-door" to="/study/theology/" aria-labelledby="scripture-title">
        <div className="door-top"><span>01 / Begin with the passage</span><Icon name="book"/></div>
        <div className="door-art scripture-art" aria-hidden="true">
          <svg viewBox="0 0 580 250" fill="none">
            <defs><linearGradient id="page-shade" x1="148" y1="74" x2="418" y2="218" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" stopOpacity=".1"/><stop offset=".6" stopColor="currentColor" stopOpacity=".025"/><stop offset="1" stopColor="currentColor" stopOpacity=".13"/></linearGradient></defs>
            <g className="art-orbits" stroke="currentColor"><ellipse cx="288" cy="132" rx="198" ry="85" opacity=".1"/><ellipse cx="288" cy="132" rx="223" ry="105" opacity=".065"/></g>
            <path d="M92 199H489" stroke="currentColor" opacity=".18"/>
            <g className="book-drawing">
              <path d="M152 77Q220 48 287 79Q349 48 418 77L429 201Q356 174 287 205Q219 174 144 201Z" fill="var(--art-ground)" stroke="currentColor" opacity=".5"/>
              <path d="M160 62Q224 42 287 76Q348 42 410 62L420 191Q351 166 287 198Q223 166 151 191Z" fill="url(#page-shade)" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M287 77V198M280 76L281 192M294 74L294 192" stroke="currentColor" opacity=".35"/>
              <path d="M152 197Q219 172 281 202M293 202Q355 172 421 197M152 202Q220 179 280 207M294 207Q357 177 424 202" stroke="currentColor" opacity=".25"/>
              <path d="M317 69V172L327 163 335 170V63" fill="currentColor" opacity=".18"/>
              <g stroke="currentColor" opacity=".33"><path d="M180 106Q223 98 264 118"/><path d="M306 109Q348 91 391 105"/><path d="M180 113Q223 105 264 125"/><path d="M306 116Q348 98 391 112"/><path d="M180 120Q223 112 264 132"/><path d="M306 123Q348 105 391 119"/><path d="M180 127Q223 119 264 139"/><path d="M306 130Q348 112 391 126"/><path d="M180 134Q223 126 264 146"/><path d="M306 137Q348 119 391 133"/><path d="M180 141Q223 133 264 153"/><path d="M306 144Q348 126 391 140"/><path d="M180 148Q223 140 264 160"/><path d="M306 151Q348 133 391 147"/><path d="M180 155Q223 147 264 167"/><path d="M306 158Q348 140 391 154"/><path d="M180 162Q223 154 264 174"/><path d="M306 165Q348 147 391 161"/></g>
              <text x="183" y="92" className="book-type">IN THE BEGINNING</text>
              <path d="M304 90Q349 74 388 84" stroke="currentColor" opacity=".65"/>
            </g>
            <g stroke="currentColor" opacity=".4"><path d="M107 73H142M423 85H463M288 211V229"/><circle cx="107" cy="73" r="3" fill="var(--art-ground)"/><circle cx="463" cy="85" r="3" fill="var(--art-ground)"/><circle cx="288" cy="230" r="3" fill="var(--art-ground)"/></g>
            <text x="72" y="59" className="art-label">READ</text><text x="441" y="70" className="art-label">UNDERSTAND</text><text x="288" y="249" textAnchor="middle" className="art-label">LIVE THE WORD</text>
          </svg>
        </div>
        <div className="door-copy"><p className="door-question">What does Scripture teach?</p><h2 id="scripture-title">Scripture <span>&amp; Theology</span></h2><p>Read the passages. Follow their connections. Explore what the Bible teaches about God, his people and the life of faith.</p></div>
        <ul className="door-subjects"><li>Passages &amp; books</li><li>Doctrine &amp; themes</li><li>Prayer &amp; Christian life</li></ul>
        <div className="door-action"><span>Explore Scripture &amp; Theology</span><span className="door-arrow"><Icon name="arrow"/></span></div>
      </StudyLink>

      <StudyLink className="study-door academic" to="/study/academic/" aria-labelledby="academic-title">
        <div className="door-top"><span>02 / Follow the sources</span><Icon name="graduation"/></div>
        <div className="door-art academic-art" aria-hidden="true">
          <svg viewBox="0 0 580 250" fill="none">
            <defs><linearGradient id="prism-shade" x1="220" y1="60" x2="324" y2="202" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" stopOpacity=".14"/><stop offset="1" stopColor="currentColor" stopOpacity=".025"/></linearGradient></defs>
            <ellipse cx="291" cy="134" rx="211" ry="92" stroke="currentColor" opacity=".08"/>
            <path d="M85 202H492" stroke="currentColor" opacity=".18"/>
            <g className="folio-drawing">
              <path d="M122 72 215 66 211 178 202 191 115 188Z" fill="var(--art-ground)" stroke="currentColor" strokeWidth="1.1" opacity=".55"/>
              <path d="M124 65 213 69 206 187 114 181Z" fill="var(--art-ground)" stroke="currentColor" strokeWidth="1.2"/>
              <g stroke="currentColor" opacity=".4"><path d="M134 88l18 1"/><path d="M134 93l18 1"/><path d="M134 98l18 1"/><path d="M134 103l18 1"/><path d="M134 108l18 1"/><path d="M134 113l18 1"/><path d="M134 118l18 1"/><path d="M134 123l18 1"/><path d="M134 128l18 1"/><path d="M134 133l18 1"/><path d="M134 138l18 1"/><path d="M134 143l18 1"/><path d="M157 88l18 1"/><path d="M157 93l18 1"/><path d="M157 98l18 1"/><path d="M157 103l18 1"/><path d="M157 108l18 1"/><path d="M157 113l18 1"/><path d="M157 118l18 1"/><path d="M157 123l18 1"/><path d="M157 128l18 1"/><path d="M157 133l18 1"/><path d="M157 138l18 1"/><path d="M157 143l18 1"/><path d="M180 88l18 1"/><path d="M180 93l18 1"/><path d="M180 98l18 1"/><path d="M180 103l18 1"/><path d="M180 108l18 1"/><path d="M180 113l18 1"/><path d="M180 118l18 1"/><path d="M180 123l18 1"/><path d="M180 128l18 1"/><path d="M180 133l18 1"/><path d="M180 138l18 1"/><path d="M180 143l18 1"/></g>
              <path d="M122 160 144 162M151 163 172 164M177 164 196 165" stroke="currentColor" opacity=".35"/>
            </g>
            <g className="prism-drawing">
              <path d="M235 64 292 44 332 75 329 195 272 215 231 180Z" fill="var(--art-ground)" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M235 64 275 96 332 75 329 195 272 215 231 180Z" fill="url(#prism-shade)"/>
              <path d="M235 64 275 96 332 75M275 96 272 215" stroke="currentColor" opacity=".7"/>
              <g stroke="currentColor" opacity=".52"><path d="M242 88l4 2-2 1m-2-3 1 5M283 110l5-2-3 4m-2-2 1 4"/><path d="M250 95l4 2-2 1m-2-3 1 5M292 107l5-2-3 4m-2-2 1 4"/><path d="M258 102l4 2-2 1m-2-3 1 5M301 104l5-2-3 4m-2-2 1 4"/><path d="M266 109l4 2-2 1m-2-3 1 5M310 101l5-2-3 4m-2-2 1 4"/><path d="M242 97l4 2-2 1m-2-3 1 5M283 119l5-2-3 4m-2-2 1 4"/><path d="M250 104l4 2-2 1m-2-3 1 5M292 116l5-2-3 4m-2-2 1 4"/><path d="M258 111l4 2-2 1m-2-3 1 5M301 113l5-2-3 4m-2-2 1 4"/><path d="M266 118l4 2-2 1m-2-3 1 5M310 110l5-2-3 4m-2-2 1 4"/><path d="M242 106l4 2-2 1m-2-3 1 5M283 128l5-2-3 4m-2-2 1 4"/><path d="M250 113l4 2-2 1m-2-3 1 5M292 125l5-2-3 4m-2-2 1 4"/><path d="M258 120l4 2-2 1m-2-3 1 5M301 122l5-2-3 4m-2-2 1 4"/><path d="M266 127l4 2-2 1m-2-3 1 5M310 119l5-2-3 4m-2-2 1 4"/><path d="M242 115l4 2-2 1m-2-3 1 5M283 137l5-2-3 4m-2-2 1 4"/><path d="M250 122l4 2-2 1m-2-3 1 5M292 134l5-2-3 4m-2-2 1 4"/><path d="M258 129l4 2-2 1m-2-3 1 5M301 131l5-2-3 4m-2-2 1 4"/><path d="M266 136l4 2-2 1m-2-3 1 5M310 128l5-2-3 4m-2-2 1 4"/><path d="M242 124l4 2-2 1m-2-3 1 5M283 146l5-2-3 4m-2-2 1 4"/><path d="M250 131l4 2-2 1m-2-3 1 5M292 143l5-2-3 4m-2-2 1 4"/><path d="M258 138l4 2-2 1m-2-3 1 5M301 140l5-2-3 4m-2-2 1 4"/><path d="M266 145l4 2-2 1m-2-3 1 5M310 137l5-2-3 4m-2-2 1 4"/><path d="M242 133l4 2-2 1m-2-3 1 5M283 155l5-2-3 4m-2-2 1 4"/><path d="M250 140l4 2-2 1m-2-3 1 5M292 152l5-2-3 4m-2-2 1 4"/><path d="M258 147l4 2-2 1m-2-3 1 5M301 149l5-2-3 4m-2-2 1 4"/><path d="M266 154l4 2-2 1m-2-3 1 5M310 146l5-2-3 4m-2-2 1 4"/><path d="M242 142l4 2-2 1m-2-3 1 5M283 164l5-2-3 4m-2-2 1 4"/><path d="M250 149l4 2-2 1m-2-3 1 5M292 161l5-2-3 4m-2-2 1 4"/><path d="M258 156l4 2-2 1m-2-3 1 5M301 158l5-2-3 4m-2-2 1 4"/><path d="M266 163l4 2-2 1m-2-3 1 5M310 155l5-2-3 4m-2-2 1 4"/><path d="M242 151l4 2-2 1m-2-3 1 5M283 173l5-2-3 4m-2-2 1 4"/><path d="M250 158l4 2-2 1m-2-3 1 5M292 170l5-2-3 4m-2-2 1 4"/><path d="M258 165l4 2-2 1m-2-3 1 5M301 167l5-2-3 4m-2-2 1 4"/><path d="M266 172l4 2-2 1m-2-3 1 5M310 164l5-2-3 4m-2-2 1 4"/><path d="M242 160l4 2-2 1m-2-3 1 5M283 182l5-2-3 4m-2-2 1 4"/><path d="M250 167l4 2-2 1m-2-3 1 5M292 179l5-2-3 4m-2-2 1 4"/><path d="M258 174l4 2-2 1m-2-3 1 5M301 176l5-2-3 4m-2-2 1 4"/><path d="M266 181l4 2-2 1m-2-3 1 5M310 173l5-2-3 4m-2-2 1 4"/><path d="M242 169l4 2-2 1m-2-3 1 5M283 191l5-2-3 4m-2-2 1 4"/><path d="M250 176l4 2-2 1m-2-3 1 5M292 188l5-2-3 4m-2-2 1 4"/><path d="M258 183l4 2-2 1m-2-3 1 5M301 185l5-2-3 4m-2-2 1 4"/><path d="M266 190l4 2-2 1m-2-3 1 5M310 182l5-2-3 4m-2-2 1 4"/></g>
            </g>
            <g className="scholar-drawing">
              <path d="M360 170Q389 155 415 168Q441 155 470 170L468 200Q440 184 415 199Q391 185 362 200Z" fill="var(--art-ground)" stroke="currentColor" opacity=".7"/>
              <path d="M415 168V199M369 175Q389 164 407 174M370 182Q388 172 407 181M425 174Q442 164 461 176M424 181Q441 171 460 183" stroke="currentColor" opacity=".28"/>
              <circle cx="408" cy="114" r="41" fill="var(--art-ground)" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="408" cy="114" r="35" stroke="currentColor" opacity=".22"/>
              <path d="M408 91c-10 0-15 7-14 17l-5 7 6 2 1 12-7 7m19-45c12 0 19 8 18 19-1 8-6 12-9 14l2 9 10 9M400 100c1-6 9-9 15-5M398 107h4M397 119h6M396 133c9 6 16 7 23 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".65"/>
            </g>
            <g stroke="currentColor" opacity=".35"><path d="M168 57V40H113M285 224V235M429 67 446 47H476"/><circle cx="112" cy="40" r="3"/><circle cx="285" cy="236" r="3"/><circle cx="477" cy="47" r="3"/></g>
            <text x="86" y="25" className="art-label">MANUSCRIPTS</text><text x="285" y="249" textAnchor="middle" className="art-label">HISTORY &amp; ARCHAEOLOGY</text><text x="416" y="32" className="art-label">SCHOLARSHIP</text>
          </svg>
        </div>
        <div className="door-copy"><p className="door-question">What can the sources tell us?</p><h2 id="academic-title">Academic <span>Studies</span></h2><p>Examine the historical world, the surviving texts and the work of scholars. See the evidence, its interpretation and its limits.</p></div>
        <ul className="door-subjects"><li>History &amp; archaeology</li><li>Manuscripts &amp; languages</li><li>Theologians &amp; their works</li></ul>
        <div className="door-action"><span>Explore Academic Studies</span><span className="door-arrow"><Icon name="arrow"/></span></div>
      </StudyLink>
    </section>

    <PeopleCards /><Suspense fallback={<p className="atlas-loading">Loading the Atlas…</p>}><AtlasWindow /></Suspense><section className="hub-closing"><p className="eyebrow">One collection. Many connections.</p><h2>Begin with a question.<br /><em>See where it leads.</em></h2><div><StudyLink to="/study/theology/?area=jesus">Read the Gospels together <Icon name="arrowUp"/></StudyLink><StudyLink to="/study/academic/?area=texts">Explore the surviving texts <Icon name="arrowUp"/></StudyLink></div></section>
    </div></div>;
}
