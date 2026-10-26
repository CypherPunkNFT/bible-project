// MOCK-UP COPY of HomePage.tsx, opened at /home_mockup on this computer's preview only (see mockup-routes.tsx); never on the
// live site. Changes are tried here first; once approved they are carried into HomePage.tsx and this copy is refreshed.
// Differs from HomePage.tsx: the Academic Studies drawing is "The Long Copy"; the five doorways are Bible, Study,
// Apologetics, Atlas and Resources, evenly spaced inside their frame (home-mockup.css).
import { ArrowRight, ArrowUpRight, BookMarked, BookOpen, GitBranch, Globe, Headphones, Landmark, LayoutGrid, LifeBuoy, Map, MessageCircle, NotebookPen, Pause, Play, Users } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { lastReadPath } from "@/lib/last-read";
import { CollectionArtwork, HomeArtwork, OpenBible, QuestionOrbit } from "@/components/home/HomeArtwork";
import { BibleScene, FeatureBlock, StudyScene } from "@/components/home/HomeFeatureArt";
import { CHAPTER_COUNT, ChaptersScene, ListenScene } from "@/components/home/HomeBibleScenes";
import { AtlasScene, TheologyScene } from "@/components/home/HomeStudyScenes";
import { LongCopyScene } from "@/components/home/mockups/AcademicMockups";
import { SectionBanner } from "@/components/home/HomeBanner";
import { FellowshipScene } from "@/components/home/HomeResourceScenes";
import { LancetsScene } from "@/components/home/mockups/OverviewMockupsMore";
import { DeskScene } from "@/components/home/mockups/LearningMockups";
import { WayfinderScene } from "@/components/home/mockups/LifeMockups";
import { DebateScene, FieldArt, WorldviewsScene } from "@/components/home/HomeApologeticsScenes";
import { HOME_FIELDS, HOME_PREVIEWS, HOME_STUDIES, HOME_TOPICS } from "@/components/home/collection-data";
import "@/components/home/home-hub.css";
import "@/components/home/home-landing-options.css";
import "../home/home-mockup.css";
import { HomeGuide } from "../home/HomeGuide";
import { HomeMore } from "../home/HomeMore";

/** Mock-up: the five doorways are the site's five parts; Topics lives inside Study, and Resources joins. */
const HOME_PATHS = [
  { title: "Bible", to: "/bible", subtitle: "Read & compare", color: "epistles" },
  { title: "Study", to: "/study", subtitle: "See the connections", color: "gospels" },
  { title: "Apologetics", to: "/apologetics", subtitle: "Explore the questions", color: "history" },
  { title: "Atlas", to: "/study/atlas", subtitle: "Enter the world", color: "poetry" },
  { title: "Resources", to: "/resources", subtitle: "Study, gather, find help", color: "resource-life" },
] as const;

const tint = (color: string) => ({ "--home-color": `var(--${color})` } as CSSProperties);

function SectionHeading({ number, level = "h2", label, title, children, to, action }: { number?: string; level?: "h2" | "h3"; label: string; title: ReactNode; children: ReactNode; to: string; action: string }) {
  const Heading = level;
  return <header className="home-section-heading"><div><p className="home-eyebrow">{number && <span>{number}</span>}{label}</p><Heading>{title}</Heading><p>{children}</p></div><Link className="home-text-link" to={to}>{action}<ArrowUpRight size={17} aria-hidden /></Link></header>;
}

function PreviewMarquee() {
  const [paused, setPaused] = useState(false);
  const [copies, setCopies] = useState(2);
  const viewport = useRef<HTMLDivElement>(null);
  const firstGroup = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = viewport.current;
    const group = firstGroup.current;
    if (!frame || !group) return;
    const measure = () => {
      const width = group.getBoundingClientRect().width;
      if (!width) return;
      // Keep one complete sequence beyond the visible width at every animation phase.
      setCopies(Math.max(2, Math.ceil(frame.clientWidth / width) + 1));
      frame.style.setProperty("--home-marquee-shift", `${-width}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);
  // Mouse drag: hold the strip's scroll animation, move it by hand, and let it carry on from there on release.
  // Touch keeps the native scrolling it already has; a drag never counts as a click on a card.
  const drag = useRef<{ x: number; time: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const trackAnimation = () => viewport.current?.querySelector(".home-marquee-track")?.getAnimations()[0];
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const animation = trackAnimation();
    if (event.pointerType !== "mouse" || event.button !== 0 || !animation) return;
    drag.current = { x: event.clientX, time: Number(animation.currentTime ?? 0), moved: false };
    dragged.current = false;
    if (viewport.current) viewport.current.dataset.dragging = "true";
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current, animation = trackAnimation(), width = firstGroup.current?.getBoundingClientRect().width;
    if (!state || !animation || !width) return;
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) > 4) { state.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
    if (!state.moved) return;
    const duration = Number(animation.effect?.getComputedTiming().duration ?? 0);
    if (!duration) return;
    const time = state.time - (dx / width) * duration;
    animation.currentTime = ((time % duration) + duration) % duration;
  };
  const endDrag = () => {
    dragged.current = drag.current?.moved ?? false;
    drag.current = null;
    if (viewport.current) delete viewport.current.dataset.dragging;
  };
  const swallowDragClick = (event: ReactMouseEvent) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragged.current = false;
  };
  const togglePaused = () => {
    const next = !paused;
    if (!next && viewport.current) viewport.current.scrollLeft = 0;
    setPaused(next);
  };
  return <section className="home-preview-strip" aria-label="A glimpse of the collections">
    <div className="home-strip-heading"><span>A glimpse of what awaits</span><button type="button" onClick={togglePaused} aria-pressed={paused} aria-label={paused ? "Play collection previews" : "Pause collection previews"}>{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? "Play" : "Pause"}</span></button></div>
    <div className="home-marquee" ref={viewport} data-paused={paused} onTouchStart={() => setPaused(true)} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClickCapture={swallowDragClick} onMouseDown={(event) => { if (event.button === 0) event.preventDefault(); }} onDragStart={(event) => event.preventDefault()}><div className="home-marquee-track">
      {Array.from({ length: copies }, (_, copy) => <div className="home-marquee-group" ref={copy === 0 ? firstGroup : undefined} key={copy} aria-hidden={copy > 0 ? true : undefined}>
        {HOME_PREVIEWS.map((item) => <Link key={item.to} to={item.to} tabIndex={copy ? -1 : undefined} className="home-preview" style={tint(item.color)} aria-label={item.label}><div><HomeArtwork kind={item.art} /></div><p>{item.label}<ArrowUpRight size={13} aria-hidden /></p><strong>{item.title}</strong></Link>)}
      </div>)}
    </div></div>
  </section>;
}

export default function HomePageMockup2() {
  const [open, setOpen] = useState([false, false, false, false]);
  // Each banner's pointed ends run at 45 degrees, so their depth is half the banner's height: kept current as it resizes.
  useLayoutEffect(() => {
    const shapes = [...document.querySelectorAll<HTMLElement>(".home-banner-shape")];
    const observer = new ResizeObserver(() => shapes.forEach((shape) => shape.style.setProperty("--tip", `${(shape.firstElementChild as HTMLElement).offsetHeight / 2}px`)));
    shapes.forEach((shape) => observer.observe(shape));
    return () => observer.disconnect();
  }, []);
  const toggle = (part: number) => setOpen((now) => now.map((value, i) => (i === part ? !value : value)));
  // The guide's answers glide the page down to that part, then open it once the banner has arrived.
  const choose = (part: number) => {
    document.getElementById(`home-part-${part + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => setOpen((now) => now.map((value, i) => (i === part ? true : value))), 650);
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLanding = searchParams.get("landing");
  const landingOptions = ["outline", "gallery", "rail"] as const;
  const comparing = landingOptions.some((option) => option === requestedLanding);
  const landing = comparing ? requestedLanding : "outline";
  const opening = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = document.querySelector("body header");
    if (!header) return;
    const measure = () => opening.current?.style.setProperty("--home-header-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const catalog = useCatalog();
  const last = lastReadPath();
  const [, , slug, code, chapter] = last?.split("/") ?? [];
  const version = catalog.translations.find((item) => item.slug === slug && item.books[code]?.includes(chapter));
  const book = catalog.books.find((item) => item.code === code);
  const resume = version && last ? last : "/read/kjv/JHN/1";
  const resumeLabel = version ? `Continue: ${book?.name ?? code} ${chapter}` : "Begin with John 1";
  const languages = new Set(catalog.translations.map((item) => item.lang)).size;

  return <div className="home-hub" data-landing={landing} data-banners="inset" data-shape="point">
    <div className="home-opening" ref={opening}>
    {comparing && <nav className="home-landing-options home-wrap" aria-label="Landing designs">
      {landingOptions.map((option, index) => <button key={option} type="button" aria-pressed={landing === option} onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set("landing", option); return next; }, { preventScrollReset: true })}><span>0{index + 1}</span>{option === "outline" ? "Outlined boxes" : option === "gallery" ? "Open gallery" : "Illustrated rail"}</button>)}
    </nav>}
    <section className="home-hero home-wrap" aria-labelledby="home-title">
      <div className="home-hero-copy"><p className="home-eyebrow"><span className="home-live-dot" />The Bible, open to you</p><h1 id="home-title">One Word.<br /><em>A world to<br className="home-hero-break" /> discover.</em></h1><p className="home-hero-lead">Read the Scriptures. Follow the connections.<br />Bring your questions. See the bigger story.</p><div className="home-hero-actions"><Link className="home-button" to={resume}><BookOpen size={17} aria-hidden />{resumeLabel}<ArrowRight size={17} aria-hidden /></Link></div><p className="home-hero-foot">Free to explore. Open to everyone.<span>{catalog.translations.length} Bible versions · {languages} languages</span></p></div>
      <div className="home-hero-art" aria-label="Scripture at the heart of the collection">
        <div className="home-art-orbit home-art-orbit-one" aria-hidden /><div className="home-art-orbit home-art-orbit-two" aria-hidden /><div className="home-art-crosshair" aria-hidden />
        <Link to="/bible" className="home-hero-book" aria-label="Explore the Bible"><OpenBible /></Link>
        <span className="home-hero-coordinate home-coordinate-top" aria-hidden>READ · UNDERSTAND · EXPLORE</span><span className="home-hero-coordinate home-coordinate-bottom" aria-hidden>ONE WORD. MANY WAYS IN.</span>
      </div>
    </section>

    <nav id="explore" className="home-doorways home-wrap home-doorways-even" aria-label="Explore the five collections">{HOME_PATHS.map((item) => <Link to={item.to} key={item.title} style={tint(item.color)}><div className="home-doorway-art"><CollectionArtwork kind={item.title} /></div><div className="home-doorway-copy"><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUpRight size={16} aria-hidden /></div></Link>)}</nav>
    </div>
    <PreviewMarquee />
    <HomeGuide onChoose={choose} layout="side" boxed contactList number="01" />

    <div className="home-banner-shape" id="home-part-1" style={{ "--home-color": "var(--epistles)" } as CSSProperties}><SectionBanner ringOnce number="01" name="The Bible" line="One Word, read, heard and explored" tone="epistles" verse="“The grass withereth, the flower fadeth: but the word of our God shall stand for ever.”" reference="Isaiah 40:8" to="/read/kjv/ISA/40?hl=8" page="/bible" emblem="word" glint={["read", "heard", "explored"]} open={open[0]} onToggle={() => toggle(0)} flip={false} terms={[{ items: ["Law", "History", "Poetry", "Prophets", "Gospels", "Epistles", "Revelation"] }]} /></div>

    <div className="home-collapse" data-open={open[0] || undefined}><div>
    <div className="home-wrap">
      <section className="home-section" aria-label="Bible preview" style={tint("epistles")}>
        <FeatureBlock kicker={<><span>01</span>The Bible</>} title={<>It begins with <em>the Word.</em></>}
          art={<BibleScene versions={catalog.translations.length} languages={languages} />} artTo="/bible" artLabel="Explore the Bible"
          facts={["66 books", `${catalog.translations.length} versions`, `${languages} languages`, "343,545 cross-references"]}
          cta={{ to: resume, label: "Read the Bible", note: resumeLabel, icon: <BookOpen size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Sixty-six books, written across some fifteen centuries by shepherds, kings, prophets and apostles, telling one story: God making himself known. Read it here in the version you love, set it beside another, or listen to it read aloud.</p>
          <p>The reader is made for slow, attentive reading. Open any chapter in one of {catalog.translations.length} versions across {languages} languages and lay a second version beside it, line by line. Choose a verse to see the passages that echo it elsewhere in Scripture, and the places a chapter names on the map.</p>
          <p>It remembers where you stopped, so each visit picks up where the last one ended. There is nothing to sign up for and nothing to pay: the whole Bible, open to anyone.</p>
        </FeatureBlock>
        <FeatureBlock reverse tone="history" level="h3" kicker="Audio Bible" title={<>Hear <em>the Word.</em></>}
          art={<ListenScene />} artTo="/listen" artLabel="Listen to the Bible"
          facts={["Genesis to Revelation", "American Standard Version", "Read by Ron Altman", "Musical readings from Streetlights"]}
          cta={{ to: "/listen", label: "Listen to the Bible", note: "The whole Bible, read aloud", icon: <Headphones size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Scripture was heard long before most people could read it: spoken in the assembly, sung in the temple, read aloud to the churches. Here you can listen to the complete American Standard Version from Genesis to Revelation, read in full by Ron Altman, and the player keeps your place on this device.</p>
          <p>For something more musical, selected books from Streetlights set Scripture to rhythm: the letters, the poetry of Psalms, the wisdom of Proverbs and the vivid imagery of Revelation, given room to resonate.</p>
          <p>Listen on a walk, on the drive to work, or with the text open beside you. The recording and its text are in the public domain, freely given and freely heard.</p>
        </FeatureBlock>
        <FeatureBlock tone="poetry" level="h3" kicker="Chapter by chapter" title={<>Every chapter, <em>a doorway.</em></>}
          art={<ChaptersScene />} artTo="/library" artLabel="Explore chapters"
          facts={[`${CHAPTER_COUNT.toLocaleString("en-US")} chapters`, "31,102 verses", "Progress, book by book"]}
          cta={{ to: "/library", label: "Explore chapters", note: "The whole Bible at a glance", icon: <LayoutGrid size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>See the whole Bible at once: {CHAPTER_COUNT.toLocaleString("en-US")} chapters laid end to end, from the fifty chapters of Genesis to the single page of Jude. Choose a version, find a book, and open any chapter straight from the map of the whole.</p>
          <p>As you read, the library marks the chapters you have finished, book by book, so you can see how much of the story you have walked through and where you might go next.</p>
        </FeatureBlock>
      </section>
    </div>
    </div></div>

    <div className="home-banner-shape" id="home-part-2" style={{ "--home-color": "var(--gospels)" } as CSSProperties}><SectionBanner ringOnce number="02" name="Study" line="The passage, and the world behind it" tone="gospels" verse="“Search the scriptures… they are they which testify of me.”" reference="John 5:39" to="/read/kjv/JHN/5?hl=39" page="/study" emblem="lens" open={open[1]} onToggle={() => toggle(1)} flip={true} terms={[{ items: ["Theological", "Scholarly", "World atlas", "Topics"] }]} /></div>

    <div className="home-collapse" data-open={open[1] || undefined}><div>
    <div className="home-wrap">
      <section className="home-section" aria-label="Study preview" style={tint("gospels")}>
        <FeatureBlock kicker={<><span>02</span>Study</>} title={<>There is more <em>to see.</em></>} art={<StudyScene />} artTo="/study" artLabel="Explore every study"
          facts={["Gospel harmony", "Cross-references", "Books & literary forms", "The names of God"]} cta={{ to: "/study", label: "Explore every study" }}>
          <p>A study is a guided way of looking at Scripture. Set the four Gospels side by side, trace a reference from one book to another, see the whole Bible laid out by book and kind, or follow the names by which God makes himself known.</p>
          <p className="hf-why"><strong>Why it matters.</strong> Read alone, a verse is a sentence. Read beside its parallels and echoes, it joins a conversation that runs from Genesis to Revelation, and details you have read a hundred times begin to stand out.</p>
        </FeatureBlock>
        <div className="home-study-grid">{HOME_STUDIES.map((item) => <Link key={item.to} to={item.to} className="home-study-card" style={tint(item.color)}><div className="home-card-meta"><span>{item.note.split(" · ")[0]}</span><ArrowUpRight size={17} /></div><div className="home-study-art"><HomeArtwork kind={item.art} /></div><h3>{item.title}</h3><p>{item.text}</p><div className="home-card-bottom"><span>{item.note}</span><ArrowRight size={16} /></div></Link>)}</div>
        <FeatureBlock reverse tone="epistles" level="h3" kicker="Scripture & Theology" title={<>Read it. Understand it. <em>Live it.</em></>}
          art={<TheologyScene />} artTo="/study/theology" artLabel="Explore Scripture and theology"
          facts={["Books of the Bible", "Jesus Christ", "God & Christian faith", "The Christian life", "People of Scripture"]}
          cta={{ to: "/study/theology", label: "Explore theology", note: "Begin with the passage", icon: <BookMarked size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Begin with the passage. The theological side of Study follows what Scripture itself teaches: the books of the Bible read in their context, the life and words of Jesus Christ, who God is and how he saves, and what it means to live as his people.</p>
          <p>Each subject gathers its passages, guided studies and charts in one place, from the parables and miracles to the creeds and hymns the church has confessed and sung for centuries, so a question you bring to one verse can be followed through the whole of Scripture.</p>
        </FeatureBlock>
        <FeatureBlock tone="history" level="h3" kicker="Academic Studies" title={<>Enter the world. <em>Weigh the evidence.</em></>}
          art={<LongCopyScene />} artTo="/study/academic" artLabel="Explore the academic studies"
          facts={["History & archaeology", "Manuscripts & canon", "Languages & translation", "Ancient cultures", "Church history"]}
          cta={{ to: "/study/academic", label: "Explore the evidence", note: "Follow the sources", icon: <Landmark size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Behind every passage stands a real world. The scholarly side of Study examines it: the history and archaeology of the lands of the Bible, the manuscripts through which its words have come down to us, the languages it was written in and the choices translators make, and the daily life of the people who first heard it.</p>
          <p>Every study keeps what survives apart from what is concluded about it. You see the inscription or the manuscript, who made it and when, how scholars read it, and the limits of what it can tell us.</p>
        </FeatureBlock>
        <FeatureBlock reverse tone="poetry" level="h3" kicker="Atlas" title={<>Real places. <em>An unfolding story.</em></>}
          art={<AtlasScene />} artTo="/study/atlas/map" artLabel="Explore the map"
          facts={["Interactive map", "Ancient cities", "Gospel events"]}
          cta={{ to: "/study/atlas", label: "Enter the Atlas", note: "The world behind the Word", icon: <Map size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Look beyond a name on the page. The Atlas sets the biblical story on the ground where it happened: the coast and the hill country, the Jordan running down to the Dead Sea, and the roads between the towns.</p>
          <p>Find a place on the map to read every passage that names it, enter the ancient cities to see what stood there, or follow the events of the Gospels across Galilee and Judea.</p>
        </FeatureBlock>
        <div className="home-subsection" style={tint("prophets")}>
          <SectionHeading level="h3" label="Topics" title={<>Follow a subject.<br /><em>Find its Scriptures.</em></>} to="/topics" action="Explore all topics">From the nature of God to the things of daily life. A subject leads to passages; the passages invite you to read.</SectionHeading>
          <div className="home-topics-grid">{HOME_TOPICS.map((item) => <Link to={item.to} key={item.to} className="home-topic-card" style={tint(item.color)}><HomeArtwork kind={item.art} /><div><h3>{item.title}</h3><p>{item.text}</p><ArrowUpRight size={21} /></div></Link>)}</div>
          <nav className="home-topic-trail" aria-label="Subjects to explore"><span>Begin with a word</span>{[["Grace", "grace"], ["Prayer", "prayer"], ["Faith", "faith"], ["Love of God", "love-of-god"], ["Hope", "hope"], ["Heaven", "heaven"]].map(([name, id]) => <Link key={id} to={`/topics/${id}`}>{name}<ArrowUpRight size={12} /></Link>)}</nav>
        </div>
      </section>
    </div>
    </div></div>

    <div className="home-banner-shape" id="home-part-3" style={{ "--home-color": "var(--prophets)" } as CSSProperties}><SectionBanner ringOnce number="03" name="Apologetics" line="Faith seeking understanding" tone="prophets" verse={"“Be ready always to give an answer\nto every man that asketh you a reason\nof the hope that is in you.”"} reference="1 Peter 3:15" to="/read/kjv/1PE/3?hl=15" page="/apologetics" emblem="scales" open={open[2]} onToggle={() => toggle(2)} flip={false} terms={[{ items: ["Worldviews", "Debates", "Evidence", "Historic texts"] }]} /></div>

    <div className="home-collapse" data-open={open[2] || undefined}><div>
    <div className="home-wrap">
      <section className="home-section home-apologetics" aria-label="Apologetics preview" style={tint("accent")}>
        <div><p className="home-eyebrow"><span>03</span>Apologetics</p><h2>Bring your<br /><em>hardest questions.</em></h2><p>Faith invites careful thought. Explore the reasons for Christian hope, read historic voices, and learn to speak with conviction and gentleness.</p><Link className="home-button" to="/apologetics">A reason for the hope<ArrowUpRight size={17} /></Link><div className="home-question-links"><Link to="/apologetics/topics/jesus">Who is Jesus?<ArrowUpRight size={14} /></Link><Link to="/apologetics/topics/bible">Can I trust Scripture?<ArrowUpRight size={14} /></Link><Link to="/apologetics/topics/doubt">What do I do with doubt?<ArrowUpRight size={14} /></Link></div></div>
        <div className="home-apologetics-visual"><QuestionOrbit /><div className="home-apologetics-paths"><Link to="/apologetics/paths">Learning paths<ArrowRight size={14} /></Link><Link to="/apologetics/texts">Historic texts<ArrowRight size={14} /></Link><Link to="/apologetics/practice">Practice & conversation<ArrowRight size={14} /></Link></div></div>
      </section>
      <div className="home-ap-more" style={tint("accent")}>
        <SectionHeading level="h3" label="Connected fields · A shared foundation" title={<>There is more <em>to explore.</em></>} to="/apologetics/questions" action="The question library">Six fields of questions, each with its studies, its sources and a question to begin with.</SectionHeading>
        <div className="home-study-grid home-field-grid">{HOME_FIELDS.map((field, i) => <Link key={field.to} to={field.to} className="home-study-card" style={tint(field.color)}><div className="home-card-meta"><span>0{i + 1} / Connected field</span><ArrowUpRight size={17} /></div><div className="home-study-art"><FieldArt index={i} /></div><h3>{field.title}</h3><p>{field.text}</p><div className="home-card-bottom"><em>{field.question}</em><ArrowRight size={16} /></div></Link>)}</div>
        <FeatureBlock reverse tone="prophets" level="h3" kicker="Across beliefs" title={<>Understand deeply. <em>Witness clearly.</em></>}
          art={<WorldviewsScene />} artTo="/apologetics/worldviews" artLabel="Explore the worldviews"
          facts={["Christianity & Islam", "Secular thought", "Buddhism", "Hinduism"]}
          cta={{ to: "/apologetics/worldviews", label: "Explore worldviews", note: "Four starting points", icon: <Globe size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Start with a person, not a label. Four collections set the Christian faith beside Islam, secular thought, Buddhism and Hinduism, with each tradition’s own texts open beside Scripture: the Qur’an, early Buddhist discourses, the Bhagavad Gita, and the positive claims people make for a life without religious belief.</p>
          <p>Each one works through the questions that matter, such as who Jesus is and how we are forgiven, and lets the real differences stand clearly. They are focused introductions: ask your neighbour which texts and teachers they trust, and let them tell you what they believe.</p>
        </FeatureBlock>
        <FeatureBlock tone="history" level="h3" kicker="The debate room" title={<>Ideas meet <em>in the open.</em></>}
          art={<DebateScene />} artTo="/apologetics/debates" artLabel="Enter the debate room"
          facts={["Recorded exchanges", "Transcript sources", "Questions to follow the reasoning"]}
          cta={{ to: "/apologetics/debates", label: "Enter the debate room", note: "Listen closely. Think carefully.", icon: <MessageCircle size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Great questions deserve a careful hearing. The debate room gathers recorded exchanges between Christian thinkers and their critics, among them “Does God exist?”, “Hoax or history?” and “The God Delusion debate”, each with its sources and questions that help you follow the reasoning.</p>
          <p>Watch a claim take shape, hear the strongest challenge to it, and slow down enough to tell a persuasive performance from a sound argument.</p>
        </FeatureBlock>
      </div>
    </div>
    </div></div>

    <div className="home-banner-shape" id="home-part-4" style={{ "--home-color": "var(--resource-life)" } as CSSProperties}><SectionBanner ringOnce number="04" name="Resources" line="Help for the road" tone="resource-life" verse={"“Bear ye one another’s burdens,\nand so fulfil the law of Christ.”"} reference="Galatians 6:2" to="/read/kjv/GAL/6?hl=2" page="/resources" emblem="lamp" open={open[3]} onToggle={() => toggle(3)} flip={true} terms={[{ items: ["Learning materials", "Fellowship", "Help for life"] }]} /></div>

    <div className="home-collapse" data-open={open[3] || undefined}><div>
    <div className="home-wrap">
      <section className="home-section" aria-label="Resources preview" style={tint("resource-life")}>
        <FeatureBlock kicker={<><span>04</span>Resources</>} title={<>Help for the road, <em>close at hand.</em></>}
          art={<LancetsScene />} artTo="/resources" artLabel="Explore the resources"
          facts={["Learning materials", "Fellowships", "Help for life"]}>
          <p>Some help is meant to be held. Resources gathers what the site offers beyond the page: workbooks, lessons and activity pages to study with, for every reader from little ones to leaders; free national fellowships that gather believers to pray and study the word together; and help for the hardest moments of life.</p>
          <p className="hf-why"><strong>Why it matters.</strong> Scripture is meant to be lived among others. A workbook gives a group somewhere to begin, a fellowship gives it company, and in a hard season a hotline, food, pregnancy care or grief care close by can be the first step toward help.</p>
        </FeatureBlock>
        <FeatureBlock reverse tone="epistles" level="h3" kicker="Learning materials" title={<>Study it <em>together.</em></>}
          art={<DeskScene />} artTo="/resources/learning" artLabel="Browse the learning materials"
          facts={["7 audiences", "9 kinds of material", "A4 & US Letter PDFs"]}
          cta={{ to: "/resources/learning", label: "Browse learning materials", note: "From little ones to leaders", icon: <NotebookPen size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Workbooks, lessons and activity pages for every reader, from little ones to leaders, written from the site’s reviewed pages. Each one follows the shape Scripture itself gives its story, with the passage to read, its key verses in the King James Version, and questions with room to write.</p>
          <p>The first workbook is ready to print: Moses: three forties, eight sessions over forty-two pages. Around it a catalogue of forty-one titles is taking shape, from read-aloud stories and memory-verse cards to family devotionals and leader guides.</p>
        </FeatureBlock>
        <FeatureBlock tone="gospels" level="h3" kicker="Fellowships" title={<>Gather around <em>the Word.</em></>}
          art={<FellowshipScene />} artTo="/resources/fellowships" artLabel="Find a fellowship"
          facts={["Bible study", "Students & youth", "Prayer", "Find a local church"]}
          cta={{ to: "/resources/fellowships", label: "Find a fellowship", note: "Free and national", icon: <Users size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>Faith grows in company. Fellowships lists free national ministries that gather believers to pray and to study the word together: Bible study fellowships such as Bible Study Fellowship, Community Bible Study and Precept; student and discipleship ministries such as InterVarsity, The Navigators, Cru and Young Life; and prayer gatherings such as Moms in Prayer.</p>
          <p>If you are looking for a congregation, it also points to church directories, among them 9Marks and The Gospel Coalition, to help you find a local church. Every listing was last checked in October 2026.</p>
        </FeatureBlock>
        <FeatureBlock reverse tone="resource-life" level="h3" kicker="Help for life" title={<>Help for <em>the hardest moments.</em></>}
          art={<WayfinderScene />} artTo="/resources/life" artLabel="Find help for life"
          facts={["Crisis help", "Pregnancy & healing", "Food & families", "Grief & recovery", "15 city maps"]}
          cta={{ to: "/resources/life", label: "Find help", note: "Right now, and close to home", icon: <LifeBuoy size={22} strokeWidth={1.4} aria-hidden />, bookmark: true }}>
          <p>When life breaks open, help should be easy to find. Help for life gathers national hotlines and services for the moments that matter most: crisis help right now, pregnancy help, healing after an abortion, support for babies, children and families, food, grief care, and addiction and recovery.</p>
          <p>Beside the national lines, local maps show places in fifteen cities, from Miami and Atlanta to Dallas and Oklahoma City, so help can be found close to home. We would rather leave a place out than list one that is no longer open.</p>
        </FeatureBlock>
      </section>
      <section id="about" className="home-about-band" aria-label="An open invitation"><div><p className="home-eyebrow">An open invitation</p><h2>A lifetime of discovery.<br /><em>Freely shared.</em></h2><p>Scripture to read. Questions to explore. Sources you can follow. Built so anyone can begin, and keep going.</p><div className="home-about-links"><Link to="/sources">Sources & references<ArrowUpRight size={14} /></Link><a href="https://github.com/CypherPunkNFT/bible-project" target="_blank" rel="noreferrer">Open source<ArrowUpRight size={14} /></a></div></div><Link className="home-testimonies" to="/testimonies"><GitBranch size={28} strokeWidth={1.3} /><span className="home-eyebrow">Testimonies</span><h3>The story continues<br />in ordinary lives.</h3><p>Explore the testimony collection and the invitation to share your story.</p><span className="home-card-action">Explore testimonies<ArrowRight size={16} /></span></Link></section>
      <div className="home-final"><BookOpen size={22} strokeWidth={1.2} aria-hidden /><p>“Thy word is a lamp unto my feet,<br />and a light unto my path.”</p><Link to="/read/kjv/PSA/119?hl=105">Psalm 119:105<ArrowUpRight size={12} /></Link></div>
    </div>
    </div></div>
    <HomeMore resourcesTab numbered trial />
  </div>;
}
