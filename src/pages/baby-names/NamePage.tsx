// One name's page, /baby-names/<slug> (design 4.1): heading, facts, the opening paragraph (always the first long
// paragraph, so it becomes the search description), what the name means and where that comes from, everyone who bore
// it with their key verses, every verse that names it, related names. Sections with nothing in them are left out.
// Short pages (design 4.3) look the same but say noindex while shown.
import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { BABY_NAMES_PATH, nameSlug, namePath, type NameBearer, type NameDocument, type NameLink, type NameOriginal, type NamesIndex } from "@/data/baby-names";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import { plural } from "@/lib/site-format";
import { useAsync } from "@/lib/useAsync";
import NotFoundPage from "@/pages/NotFoundPage";
import { EveryVerse, QuotedVerses } from "./NameVerses";
import { loadNameDocument, useNamesIndex } from "./useBabyNames";

const FULL_CARDS = 3;
const CARD_LIMIT = 5;
const GENDER_LINE = { boy: "Boy's name", girl: "Girl's name", both: "Boy's and girl's name", unknown: "Name (gender not stated in the Bible)" } as const;
const TESTAMENT_LINE = { ot: "Old Testament", nt: "New Testament", both: "Old and New Testaments" } as const;
const originalLanguage = (original: NameOriginal) => {
  // "other": Strong's says only "of foreign origin/derivation", so the page names the script, not a language.
  const language = original.language === "other" ? "a foreign name" : original.language;
  const script = original.script === "grc" ? "Greek" : "Hebrew";
  if (original.language === "other") return `${script}, ${language}`;
  return original.script === "grc" && language !== "Greek" ? `Greek, from ${language}` : language;
};
const NEW_BABY = [
  { to: "/life-events/new-baby", label: "Verses for a new baby" },
  { to: "/life-events/expecting", label: "Verses for expecting parents" },
  { to: "/life-events/baby-dedication", label: "Verses for a baby dedication" },
];

/** Where an address lands (design 5.1): the page itself, a redirect (capitals, another spelling), or not found. */
function resolveSlug(index: NamesIndex, slug: string): { page: string } | { redirect: string; spelling?: string } | null {
  const target = nameSlug(slug);
  if (index.names.some((row) => row.s === target)) return target === slug ? { page: target } : { redirect: target };
  const alias = index.aliases[target];
  return alias ? { redirect: alias[0], spelling: alias[1] } : null;
}

export function NameRoute({ slug }: { slug: string }) {
  const { state, retry } = useNamesIndex();
  if (state.status === "loading") return <Frame><p role="status">Loading…</p></Frame>;
  if (state.status === "error") return <Frame><Failed retry={retry} /></Frame>;
  const found = resolveSlug(state.value, slug);
  if (!found) return <NotFoundPage />;
  if ("redirect" in found) return <Navigate to={namePath(found.redirect)} replace state={found.spelling ? { spelling: found.spelling } : undefined} />;
  return <NameLoader slug={found.page} />;
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="bn-page bn-name mx-auto max-w-4xl px-4 sm:px-6">{children}</div>;
}

function Failed({ retry }: { retry: () => void }) {
  return <p role="alert">This name could not be loaded. <button type="button" className="underline" onClick={retry}>Try again</button></p>;
}

function NameLoader({ slug }: { slug: string }) {
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(() => loadNameDocument(slug), `baby-names:${slug}:${attempt}`);
  if (state.status === "loading") return <Frame><p role="status">Loading…</p></Frame>;
  if (state.status === "error") return <Frame><Failed retry={() => setAttempt((value) => value + 1)} /></Frame>;
  return <NamePage name={state.value} />;
}

/** Short pages ask search engines not to index them, and take the tag away when the visitor leaves. */
function useNoIndex(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const meta = Object.assign(document.createElement("meta"), { name: "robots", content: "noindex,follow" });
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [active]);
}

export function NamePage({ name }: { name: NameDocument }) {
  useNoIndex(!name.full);
  const spelling = (useLocation().state as { spelling?: string } | null)?.spelling;
  return (
    <Frame>
      <nav className="bn-crumbs" aria-label="Breadcrumb"><Link to={BABY_NAMES_PATH}>Baby names</Link><span aria-hidden="true"> › </span><span translate="no">{name.name}</span></nav>
      <h1><span translate="no">{name.name}</span><span className="sr-only">:</span> <span className="bn-subtitle">Meaning in the Bible</span></h1>
      <FactLine name={name} />
      <p className="bn-opening">{name.opening}</p>
      {spelling && spelling.toLowerCase() !== name.name.toLowerCase() && <div className="bn-notice">{`${spelling} is another spelling of ${name.name}; this page uses the Berean Standard Bible's spelling.`}</div>}
      {name.caution && <div className="bn-caution" role="note">{name.caution}</div>}
      {name.usedToday && <div className="bn-today">{name.usedToday}</div>}
      {name.note && <NameNote note={name.note} />}
      <Meanings name={name} />
      <Bearers name={name} />
      <Places name={name} />
      {name.verses.length > 0 && (
        <section className="bn-section" aria-labelledby="bn-verses-title">
          <h2 id="bn-verses-title">Every verse that names <span translate="no">{name.name}</span> <span className="bn-count-inline">· {name.verses.length}</span></h2>
          <EveryVerse ids={name.verses} />
        </section>
      )}
      <Related name={name} />
      <section className="bn-section" aria-labelledby="bn-baby-title">
        <h2 id="bn-baby-title">For a new baby</h2>
        <ul className="bn-links" role="list">{NEW_BABY.map((item) => <li key={item.to}><Link to={item.to}>{item.label}</Link></li>)}</ul>
      </section>
      <Sources name={name} />
    </Frame>
  );
}

function FactLine({ name }: { name: NameDocument }) {
  const people = name.bearers.length;
  return (
    <div className="bn-facts">
      <span>{GENDER_LINE[name.gender]}</span>
      {name.originals.slice(0, 2).map((original) => (
        <span key={original.strongs}>{originalLanguage(original)} <span lang={original.script} dir={original.script === "he" ? "rtl" : undefined} className="bn-original">{original.word}</span> ({original.translit})</span>
      ))}
      <span>{TESTAMENT_LINE[name.testament]}</span>
      {people > 0 && <span>{plural(people, "{n} person", "{n} people")}</span>}
      <span>{plural(name.verses.length, "{n} verse", "{n} verses")}</span>
      {name.ranks?.girls && <span>{`#${name.ranks.girls} for girls in the US, ${name.ranks.year}`}</span>}
      {name.ranks?.boys && <span>{`#${name.ranks.boys} for boys in the US, ${name.ranks.year}`}</span>}
    </div>
  );
}

function NameNote({ note }: { note: NonNullable<NameDocument["note"]> }) {
  return (
    <aside className="bn-note">
      <p>{note.text}</p>
      {note.links.length > 0 && <ul className="bn-links" role="list">{note.links.map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}</ul>}
    </aside>
  );
}

function Meanings({ name }: { name: NameDocument }) {
  if (!name.originals.length) return null;
  const several = name.originals.length > 1;
  return (
    <section className="bn-section" aria-labelledby="bn-meaning-title">
      <h2 id="bn-meaning-title">What the name means</h2>
      {name.originals.map((original) => <MeaningBlock key={original.strongs} original={original} bearers={several ? name.bearers.filter((b) => original.people.includes(b.id)) : []} />)}
    </section>
  );
}

/** Hitchcock's 1869 meaning, shown closed and only when it differs from the headline (design 3.1); never the headline. */
const hitchcockLine = (original: NameOriginal): string =>
  original.hitchcock && !original.hitchcock.toLowerCase().includes(original.meaning.headline.toLowerCase()) ? original.hitchcock : "";

function MeaningBlock({ original, bearers }: { original: NameOriginal; bearers: NameBearer[] }) {
  const catalog = useCatalog();
  const { meaning } = original;
  const hitchcock = hitchcockLine(original);
  return (
    <div className="bn-meaning">
      {bearers.length > 0 && <h3>{bearers.map((b) => b.description.replace(/\.$/, "")).join("; ")}</h3>}
      <div className="bn-headline"><span>{meaning.source === "none" ? meaning.headline : `“${meaning.headline}”`}</span> <span className={`bn-badge bn-badge-${meaning.label}`}>{meaning.labelText}</span></div>
      {meaning.explanation && <p>{meaning.explanation}{meaning.cite && <span className="bn-cite">{` Source: ${meaning.cite}.`}</span>}</p>}
      {!meaning.explanation && meaning.cite && <p className="bn-cite">{`Source: ${meaning.cite}.`}</p>}
      {meaning.bibleNote && (
        <div className="bn-bible-note">
          <div>{`The Berean Standard Bible's note at ${formatRange(catalog, meaning.bibleNote.verse, meaning.bibleNote.verse)} explains the name: it means “${meaning.bibleNote.text}”.`}</div>
          <QuotedVerses ids={[meaning.bibleNote.verse]} />
        </div>
      )}
      {meaning.wordplay && <div className="bn-wordplay">{`Wordplay, noted by the Berean at ${formatRange(catalog, meaning.wordplay.verse, meaning.wordplay.verse)}: ${meaning.wordplay.text}`}</div>}
      <dl className="bn-word">
        <dt>Original word</dt><dd><span lang={original.script} dir={original.script === "he" ? "rtl" : undefined} className="bn-original">{original.word}</span> ({original.translit}), {originalLanguage(original)}</dd>
        {meaning.strongsText && <><dt>{`Strong's ${original.strongs}`}</dt><dd>{meaning.strongsText}</dd></>}
        {meaning.root && <><dt>Root word</dt><dd><span lang={meaning.root.strongs.startsWith("G") ? "grc" : "he"} dir={meaning.root.strongs.startsWith("G") ? undefined : "rtl"} className="bn-original">{meaning.root.word}</span> {`(${meaning.root.translit}, Strong's ${meaning.root.strongs})`}</dd></>}
      </dl>
      {hitchcock && <details className="bn-older"><summary>Older dictionary meaning</summary><p>{`Hitchcock's Bible Names Dictionary (1869) gives “${hitchcock}”. Many of its meanings are guesses from older scholarship, so this page does not use it for the meaning above.`}</p></details>}
    </div>
  );
}

function Bearers({ name }: { name: NameDocument }) {
  // Jesus and Immanuel have dedicated notes linking to the Gospels and His person page (design 3.2).
  // Keep other bearers, including Jesus Justus, distinct from that special treatment.
  const bearers = name.note ? name.bearers.filter((bearer) => bearer.id !== "jesus-isa-7-14") : name.bearers;
  if (!bearers.length) return null;
  const cards = bearers.length > CARD_LIMIT ? bearers.slice(0, FULL_CARDS) : bearers;
  const rows = bearers.slice(cards.length);
  return (
    <section className="bn-section" aria-labelledby="bn-bearers-title">
      <h2 id="bn-bearers-title"><span translate="no">{name.name}</span> in the Bible</h2>
      {cards.map((bearer) => <BearerCard key={bearer.id} bearer={bearer} name={name.slug === "jesus" ? bearer.listedName : name.name} />)}
      {rows.length > 0 && (
        <ul className="bn-bearer-rows" role="list">
          {rows.map((bearer) => (
            <li key={bearer.id}><span>{bearer.description}</span> <span className="bn-muted">{plural(bearer.totalVerses, "{n} verse", "{n} verses")}</span> <Link to={`/people/${bearer.id}`}>Their story</Link></li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BearerCard({ bearer, name }: { bearer: NameBearer; name: string }) {
  const others = bearer.alsoCalled;
  return (
    <article className="bn-bearer">
      <h3>{bearer.description}</h3>
      {others.length > 0 && (
        <div className="bn-muted">Also called {others.map((other, i) => <span key={other.name}>{i > 0 && ", "}{other.slug ? <Link to={namePath(other.slug)} translate="no">{other.name}</Link> : <span translate="no">{other.name}</span>}</span>)}</div>
      )}
      {bearer.opening && bearer.opening !== bearer.description && <p>{bearer.opening}</p>}
      <QuotedVerses ids={bearer.keyVerses} />
      <Link to={`/people/${bearer.id}`} className="bn-story-link">{`Read ${name}'s full story`}</Link>
    </article>
  );
}

function Places({ name }: { name: NameDocument }) {
  if (!name.places.length) return null;
  return (
    <section className="bn-section" aria-labelledby="bn-places-title">
      <h2 id="bn-places-title">The place called <span translate="no">{name.name}</span></h2>
      <ul className="bn-bearer-rows" role="list">
          {name.places.map((place) => <li key={place.id}><span translate="no">{place.name}</span>, a {place.type} <span className="bn-muted">{plural(place.verses, "{n} verse", "{n} verses")}</span> <Link to={`/atlas?place=${encodeURIComponent(place.id)}#places-map`}>{`${place.name} in the atlas`}</Link></li>)}
      </ul>
    </section>
  );
}

function LinkGroup({ title, links }: { title: string; links: NameLink[] }) {
  if (!links.length) return null;
  return (
    <div className="bn-related-group">
      <h3>{title}</h3>
      <ul className="bn-links" role="list">{links.map((link) => <li key={link.slug}><Link to={namePath(link.slug)} translate="no">{link.name}</Link></li>)}</ul>
    </div>
  );
}

function Related({ name }: { name: NameDocument }) {
  const { otherTestament, alsoSpelled, sameRoot } = name.related;
  // A name already linked in an earlier group is not offered again under "similar meaning".
  const listed = new Set([...otherTestament, ...alsoSpelled, ...sameRoot].map((link) => link.slug));
  const sameTheme = name.related.sameTheme.filter((link) => !listed.has(link.slug));
  if (!otherTestament.length && !alsoSpelled.length && !sameRoot.length && !sameTheme.length) return null;
  return (
    <section className="bn-section" aria-labelledby="bn-related-title">
      <h2 id="bn-related-title">Related names</h2>
      <LinkGroup title="The same name in the other Testament" links={otherTestament} />
      <LinkGroup title="Also spelled" links={alsoSpelled} />
      <LinkGroup title="Names from the same root" links={sameRoot} />
      <LinkGroup title="Names with a similar meaning" links={sameTheme} />
    </section>
  );
}

function Sources({ name }: { name: NameDocument }) {
  const cited = name.originals.some((original) => original.meaning.source === "override");
  return (
    <div className="bn-sources">
      <p>Scripture quotations are from the Berean Standard Bible (public domain).</p>
      <p>People data: <a href="https://www.STEPBible.org" className="underline">STEP Bible</a>, Tyndale House (<a href="https://creativecommons.org/licenses/by/4.0/" className="underline">CC BY 4.0</a>); grouped and abridged for these pages.</p>
      <p>Meanings adapted from Strong's Concordance: <a href="https://github.com/openscriptures/HebrewLexicon" className="underline">Open Scriptures Hebrew Bible Project</a> (<a href="https://creativecommons.org/licenses/by/4.0/" className="underline">CC BY 4.0</a> edition); <a href="https://github.com/openscriptures/strongs/tree/master/greek/StrongsGreekDictionaryXML_1.4" className="underline">Greek XML by Ulrik Petersen</a> (public domain); and the Berean's notes.{cited && <span> Additional sources are cited above.</span>}</p>
      {name.ranks && <p>{`US popularity: Social Security Administration, ${name.ranks.year}.`}</p>}
      {name.originals.some((original) => /Easton/.test(original.meaning.cite)) && <p>Also cited: Easton's Illustrated Bible Dictionary (1897), public domain.</p>}
      {name.originals.some((original) => hitchcockLine(original)) && <p>Older dictionary meanings: Hitchcock's Bible Names Dictionary (1869).</p>}
    </div>
  );
}
