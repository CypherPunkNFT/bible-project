// /worship-slides: any verse or passage of the Berean Standard Bible as clean slides for a service, a small group or a
// livestream, downloaded as pictures (PNG) or a PowerPoint file. Everything is drawn in the browser from fixed templates
// (templates.ts): no AI, no generated pictures, no server, nothing stored. The reference and the choices live only in
// the address (?ref=Psalm+23&layout=left), so a set of slides can be sent as a link. README.md beside this file.
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { plural } from "@/lib/site-format";
import { useAsync } from "@/lib/useAsync";
import { buildNameIndex, MAX_REFERENCE, parseReference } from "@/pages/citation-generator/parse";
import { Choices } from "./Choices";
import { canvasMeasure } from "./draw";
import { fileStem, pictureNames, picturesZip, saveFile, slidePicture, useFontsReady } from "./export";
import { layoutSlide } from "./layout";
import { BIBLE, loadPassage, MAX_VERSES } from "./load";
import { readChoices, readReference, writeParams, type Choices as ChoiceSet } from "./options";
import { makeDeck, PPTX_TYPE } from "./pptx";
import { SlideGrid, type GridSlide } from "./SlideGrid";
import { makeSlides } from "./slides";
import { byId, FONTS, SHAPES, SIZES, THEMES } from "./templates";
import "@/components/stations/stations.css";
import "./worship-slides.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

const EXAMPLES = ["Psalm 23", "Isaiah 40:28-31", "John 1:1-5", "Romans 8:31-39", "1 Corinthians 13:4-8", "Philippians 4:4-7"];

type Task = "pptx" | "pictures" | "picture" | null;

export default function WorshipSlidesPage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const reference = readReference(params);
  const choices = useMemo(() => readChoices(params), [params]);
  const [typed, setTyped] = useState(reference);
  useEffect(() => setTyped(reference), [reference]);

  const bible = useMemo(() => catalog.translations.find((translation) => translation.slug === BIBLE), [catalog]);
  const index = useMemo(() => buildNameIndex(catalog.books), [catalog]);
  const parsed = useMemo(() => (reference && bible ? parseReference(reference, bible, catalog.books, catalog.equivalent, index) : null), [reference, bible, catalog, index]);
  const [attempt, setAttempt] = useState(0);
  const passage = useAsync(
    () => (parsed?.ok ? loadPassage(catalog, parsed.reference) : Promise.resolve(null)),
    `worship-slides:${parsed?.ok ? reference : ""}:${attempt}`,
  );

  const theme = byId(THEMES, choices.theme);
  const font = byId(FONTS, choices.font);
  const shape = byId(SHAPES, choices.shape);
  const size = byId(SIZES, choices.size);
  const fontsReady = useFontsReady(font);

  const loaded = passage.status === "ready" ? passage.value : null;
  const slides = useMemo(() => {
    if (!loaded || !parsed?.ok) return [];
    const facts = { bookName: parsed.reference.name, wholeChapters: parsed.reference.passages.map((item) => item.verse === null), singleChapterBook: parsed.reference.singleChapter };
    return makeSlides(loaded.verses, facts, { per: choices.per, budget: size.budget, title: choices.title });
  }, [loaded, parsed, choices.per, choices.title, size.budget]);

  // Measured again once the fonts arrive, so the wrapping matches the letters drawn.
  const measure = useMemo(() => canvasMeasure(document.createElement("canvas").getContext("2d")), [fontsReady, font]); // eslint-disable-line react-hooks/exhaustive-deps
  const layouts = useMemo(() => slides.map((slide) => layoutSlide(slide, {
    layout: choices.layout, font, width: shape.width, height: shape.height, size: size.px, numbers: choices.numbers, footer: choices.footer,
  }, measure)), [slides, choices.layout, choices.numbers, choices.footer, font, shape, size.px, measure]);
  const references = slides.map((slide) => (slide.kind === "title" ? slide.heading : slide.reference));
  const gridSlides: GridSlide[] = layouts.map((layout, i) => ({ key: `${i}:${references[i]}`, layout, reference: references[i] }));
  const deckName = slides[0]?.kind === "title" ? slides[0].heading : parsed?.ok ? parsed.reference.name : "Slides";

  const [task, setTask] = useState<Task>(null);
  const [failed, setFailed] = useState(false);
  // Any change of passage or choice makes a running download stale; it stops at the next slide.
  const generation = useRef(0);
  const settingsKey = `${reference}|${JSON.stringify(choices)}|${fontsReady}`;
  useEffect(() => { generation.current += 1; setTask(null); }, [settingsKey]);

  const change = (nextReference: string, nextChoices: ChoiceSet) => setParams(writeParams(nextReference, nextChoices), { replace: true });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempt(0);
    change(typed.slice(0, MAX_REFERENCE).trim(), choices);
  };

  const run = async (kind: Exclude<Task, null>, work: (stillWanted: () => boolean) => Promise<void>) => {
    const mine = ++generation.current;
    const stillWanted = () => generation.current === mine;
    setTask(kind);
    setFailed(false);
    try {
      await work(stillWanted);
    } catch (error) {
      console.error(`worship slides: the ${kind} download could not be made`, error);
      if (stillWanted()) setFailed(true);
    } finally {
      if (stillWanted()) setTask(null);
    }
  };
  const pictureSettings = { theme, font, width: shape.width, height: shape.height };
  const stem = fileStem(deckName);
  const savePowerPoint = () => run("pptx", async () => {
    const parts = makeDeck(slides, layouts, { theme, font, shape, numbers: choices.numbers, title: deckName });
    saveFile(new Blob(parts as BlobPart[], { type: PPTX_TYPE }), `${stem}.pptx`);
  });
  const savePictures = () => run("pictures", async (stillWanted) => {
    const zip = await picturesZip(layouts, pictureNames(references), pictureSettings, stillWanted);
    if (zip) saveFile(zip, `${stem}-pictures.zip`);
  });
  const savePicture = (i: number) => run("picture", async () => {
    const canvas = document.createElement("canvas");
    try {
      saveFile(await slidePicture(canvas, layouts[i], pictureSettings), pictureNames(references)[i]);
    } finally {
      canvas.width = 0;
    }
  });

  return (
    <div className="st-page ws-page mx-auto max-w-5xl px-4 sm:px-6">
      <header>
        <ToolsBackLink />
        <h1>Worship slide maker</h1>
        <p className="ws-lede">Turn any verse or passage of the Berean Standard Bible into clean slides for a service, a small group or a livestream. Choose a layout, a font and a background, then download the slides as pictures or as a PowerPoint file.</p>
      </header>

      <form className="ws-form" onSubmit={submit}>
        <label htmlFor="ws-reference">Verse or passage</label>
        <div className="ws-form-row">
          <input id="ws-reference" type="text" value={typed} maxLength={MAX_REFERENCE} placeholder="Psalm 23, or John 3:16-18" autoComplete="off" spellCheck={false} onChange={(event) => setTyped(event.target.value)} />
          <button type="submit" className="ws-go">Make slides</button>
        </div>
        <div className="ws-examples">
          <span>Try</span>
          {EXAMPLES.map((example) => <button key={example} type="button" className="ws-example" onClick={() => change(example, choices)}>{example}</button>)}
        </div>
      </form>

      <Choices choices={choices} onChange={(next) => change(reference, next)} />

      <section className="ws-result" aria-live="polite">
        {!reference && <p className="ws-status">Type a verse or passage above, or try one of the examples.</p>}
        {parsed && !parsed.ok && <p className="ws-problem">{parsed.error}</p>}
        {parsed?.ok && passage.status === "loading" && <p className="ws-status">Reading the passage…</p>}
        {parsed?.ok && passage.status === "error" && (
          <p className="ws-problem">The passage could not be loaded. Check your connection and try again. <button type="button" className="ws-retry" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p>
        )}
        {loaded && !loaded.verses.length && <p className="ws-problem">The Berean Standard Bible has no verses in this passage. Check the chapter and verse numbers.</p>}
        {loaded && loaded.cut && <p className="ws-status">{plural(MAX_VERSES, "This passage is long, so only its first {n} verse is used. Make a second set of slides for the rest.", "This passage is long, so only its first {n} verses are used. Make a second set of slides for the rest.")}</p>}
        {slides.length > 0 && (
          <>
            <div className="ws-downloads">
              <p className="ws-count">{plural(slides.length, "{n} slide", "{n} slides")}</p>
              <button type="button" className="ws-download" disabled={task !== null} onClick={() => void savePowerPoint()}>Download PowerPoint</button>
              <button type="button" className="ws-download" disabled={task !== null} onClick={() => void savePictures()}>Download all pictures (zip)</button>
            </div>
            {task === "pictures" && <p className="ws-status">Making the pictures…</p>}
            {failed && <p className="ws-problem">The download could not be made. Try again, or use fewer verses.</p>}
            <SlideGrid slides={gridSlides} theme={theme} font={font} width={shape.width} height={shape.height} drawKey={settingsKey} busy={task !== null} onSave={(i) => void savePicture(i)} />
          </>
        )}
      </section>

      <aside className="ws-notes">
        <h2>Good to know</h2>
        <ul>
          <li>Everything is made in your own browser from the site's copy of the Berean Standard Bible. Nothing you type is stored or sent anywhere, and the address holds your choices, so you can bookmark the slides or send the link.</li>
          <li>The PowerPoint file keeps every verse as text you can still edit. It uses Georgia or Arial, which every computer has, so its letters look a little different from the pictures.</li>
          <li>The see-through background makes pictures with nothing behind the words, to lay over a camera picture in livestream software. In PowerPoint it shows as black.</li>
          <li>A long verse is split across two slides at the end of a sentence. A passage of more than 250 verses is cut at 250.</li>
          <li>The Berean Standard Bible is in the public domain, so the slides are free to show, print and share.</li>
        </ul>
      </aside>
    </div>
  );
}
