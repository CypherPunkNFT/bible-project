import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { loadCreedBundle, loadCreedDocument, loadCreedsIndex } from "@/lib/data";
import {
  documentTypeLabel,
  findCard,
  sectionKindLabel,
  unrestatedReason,
  verseLabel,
  type CreedBundle,
  type CreedDocument,
  type CreedPart,
  type CreedReference,
  type CreedSection, yearWithEra } from "@/lib/creeds";
import { studyRefLink } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import "./creeds.css";

/** A reference, its Berean words where the Berean text has them, and a way into the reader. */
function Reference({ reference, verses, open }: { reference: CreedReference; verses: Record<string, string>; open: boolean }) {
  const catalog = useCatalog();
  const link = reference.span ? studyRefLink(catalog, reference.span) : undefined;
  return (
    <li className="creed-ref">
      <p className="creed-ref-head">
        {link ? <Link to={link}>{reference.reference}</Link> : <span>{reference.reference}</span>}
        {reference.note ? <em>{reference.note}</em> : null}
      </p>
      {open && reference.verses?.length ? (
        <p className="creed-ref-text">
          {reference.verses.map((id) => (
            <span key={id}>
              <sup>{verseLabel(id, reference.span)}</sup>
              {verses[String(id)] ?? ""}{" "}
            </span>
          ))}
          {reference.more && link ? (
            <Link className="creed-ref-more" to={link}>
              read on
            </Link>
          ) : null}
        </p>
      ) : null}
    </li>
  );
}

function Section({
  section,
  verses,
  showScripture,
  documentType,
}: {
  section: CreedSection;
  verses: Record<string, string>;
  showScripture: boolean;
  documentType: string | null;
}) {
  const [open, setOpen] = useState(false);
  const proofCount = (section.proofs ?? []).reduce((total, proof) => total + proof.references.length, 0);
  const shown = showScripture || open;
  const kind = sectionKindLabel(section.kind);
  return (
    <article className={`creed-section depth-${Math.min(section.depth, 2)}`} id={`s-${section.id}`}>
      {section.heading && section.depth === 0 && !section.question ? <h3 className="creed-section-heading">{section.heading}</h3> : null}
      <div className="creed-section-body">
        {section.number ? (
          <p className="creed-section-number">
            {kind ? `${kind} ` : ""}
            {section.number}
          </p>
        ) : null}
        <div>
          {section.question ? <h4 className="creed-question">{section.question}</h4> : null}
          {section.heading && (section.question || section.depth > 0) ? <p className="creed-section-sub">{section.heading}</p> : null}
          {section.text ? <p className="creed-answer">{section.text}</p> : null}
          {section.passageReference ? (
            <p className="creed-passage-note">
              The whole of this confession is {section.passageReference}, given here in the Berean Standard Bible.
            </p>
          ) : null}

          {section.parallel
            ? Object.entries(section.parallel).map(([language, body]) => (
                <details key={language} className="creed-parallel">
                  <summary>The {language} text</summary>
                  {body.split(/\n{2,}/).map((paragraph, position) => (
                    <p key={position}>{paragraph}</p>
                  ))}
                </details>
              ))
            : null}

          {section.restated?.length ? (
            <p className="creed-restated">
              Scripture quoted here is given in the Berean Standard Bible: {section.restated.join("; ")}.
            </p>
          ) : null}
          {section.unrestated?.length ? (
            <details className="creed-unrestated">
              <summary>
                {section.unrestated.length === 1 ? "One quotation here is" : `${section.unrestated.length} quotations here are`}{" "}
                left in this document's own older wording
                {section.unrestated.some((flagged) => flagged.reference)
                  ? `: ${section.unrestated.map((flagged) => flagged.reference || "reference not given").join("; ")}`
                  : ""}
              </summary>
              <ul>
                {section.unrestated.map((flagged) => (
                  <li key={`${flagged.reference}-${flagged.reason}`}>
                    <strong>{flagged.reference || "A quotation with no reference"}</strong> — {unrestatedReason(flagged.reason)}.
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {proofCount > 0 ? (
            <div className="creed-proofs">
              <button type="button" onClick={() => setOpen(!open)} aria-expanded={shown} disabled={showScripture}>
                {shown ? "Scripture proof-texts" : `Scripture proof-texts (${proofCount})`}
              </button>
              <ol className="creed-proof-groups">
                {(section.proofs ?? []).map((proof) => (
                  <li key={proof.marker || "all"}>
                    {proof.marker ? <span className="creed-marker">{proof.marker}</span> : null}
                    <ul className="creed-refs">
                      {proof.references.map((reference) => (
                        <Reference
                          key={`${reference.osis}-${reference.reference}`}
                          reference={reference}
                          verses={verses}
                          open={shown}
                        />
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
      {documentType === "catechism" && section.depth === 0 ? <hr className="creed-rule" /> : null}
    </article>
  );
}

function Parts({
  parts,
  current,
  onPick,
}: {
  parts: CreedPart[];
  current: CreedPart;
  onPick: (part: CreedPart) => void;
}) {
  if (parts.length < 2) return null;
  return (
    <nav className="creed-parts" aria-label="Contents">
      <p className="creed-parts-label">Contents</p>
      <div className="creed-parts-list">
        {parts.map((part) => (
          <button
            key={part.id}
            type="button"
            className={part.id === current.id ? "selected" : ""}
            aria-current={part.id === current.id ? "true" : undefined}
            onClick={() => onPick(part)}
          >
            {part.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function CreedDocumentPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [showScripture, setShowScripture] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  const index = useAsync(loadCreedsIndex, "creeds-index");
  // Only an id the index knows is ever fetched, so a made-up address cannot probe the data folder.
  const known = index.status === "ready" ? findCard(index.value, id) : undefined;
  const record = useAsync<CreedDocument | null>(
    () => (known ? loadCreedDocument(id) : Promise.resolve(null)),
    `creed-document:${known ? id : ""}`,
  );

  const loaded = record.status === "ready" ? record.value : null;
  const asked = params.get("part");
  const parts: CreedPart[] = loaded ? loaded.parts : [];
  const part = parts.find((candidate) => candidate.id === asked) ?? parts[0];

  const bundle = useAsync<CreedBundle | null>(
    () => (part ? loadCreedBundle(id, part.bundle) : Promise.resolve(null)),
    `creed-bundle:${id}:${part?.bundle ?? ""}`,
  );

  useEffect(() => {
    if (!loaded) return;
    document.title = `${loaded.title} · Catechisms & Creeds · Bible Guide`;
    return () => {
      document.title = "Bible Guide";
    };
  }, [loaded]);

  useEffect(() => {
    if (!asked || !body.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    body.current.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
  }, [asked]);

  // A bundle holds whole parts, numbered from the document's first section; the part's own slice is
  // its position inside that bundle.
  const text = bundle.status === "ready" ? bundle.value : null;
  const sections = useMemo<CreedSection[]>(() => {
    if (!text || !part || !loaded) return [];
    const holder = loaded.bundles.find((candidate) => candidate.id === part.bundle);
    if (!holder) return [];
    const start = part.from - holder.from;
    return text.sections.slice(start, start + part.sections);
  }, [text, part, loaded]);

  if (index.status === "loading" || record.status === "loading") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <p className="animate-pulse font-serif text-muted">Loading…</p>
      </div>
    );
  }
  if (index.status === "error" || record.status === "error" || !known || !loaded) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <Link className="creed-back" to="/study/creeds">
          ← Catechisms &amp; Creeds
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold">Not in this collection</h1>
        <p className="mt-3 text-muted">
          There is no document at this address. <Link to="/study/creeds">Open the collection</Link> to see the{" "}
          {index.status === "ready" ? index.value.counts.documents : ""} that are here.
        </p>
      </div>
    );
  }

  const found = loaded;
  const family = known.family;
  const pick = (next: CreedPart) => {
    const search = new URLSearchParams(params);
    search.set("part", next.id);
    setParams(search);
  };

  return (
    <div className="creeds-page creed-document" style={{ "--tone": `var(--${family.tone})` } as CSSProperties}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-16">
        <header className="creed-doc-intro">
          <nav className="creed-doc-nav">
            <Link className="creed-back" to="/study/creeds">
              ← Catechisms &amp; Creeds
            </Link>
            <Link className="creed-family-link" to={`/study/creeds?family=${family.id}`}>
              {family.title}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </nav>
          <p className="eyebrow">
            {documentTypeLabel(found.documentType)} · {yearWithEra(found.yearLabel)}
            {found.tradition ? ` · ${found.tradition}` : ""}
          </p>
          <h1>{found.title}</h1>
          {found.alternativeTitles?.length ? <p className="creed-also">Also called {found.alternativeTitles.join(", ")}.</p> : null}
          {found.originStory ? <p className="creed-origin">{found.originStory}</p> : null}

          <dl className="creed-figures">
            <div>
              <dt>Written</dt>
              <dd>{yearWithEra(found.yearLabel)}</dd>
            </div>
            <div>
              <dt>Tradition</dt>
              <dd>{found.tradition ?? "Scripture's own words"}</dd>
            </div>
            <div>
              <dt>{found.documentType === "catechism" ? "Questions" : "Sections"}</dt>
              <dd>{found.counts.sections.toLocaleString("en-US")}</dd>
            </div>
            {found.counts.references > 0 && (
              <div>
                <dt>Proof-texts</dt>
                <dd>{found.counts.references.toLocaleString("en-US")}</dd>
              </div>
            )}
            {found.counts.quotations > 0 && (
              <div>
                <dt>Quoted in the Berean text</dt>
                <dd>{found.counts.quotations.toLocaleString("en-US")}</dd>
              </div>
            )}
          </dl>

          <div className="creed-doc-meta">
            {found.authors?.length ? (
              <p>
                <span>Written by</span> {found.authors.join(", ")}
              </p>
            ) : null}
            {found.location ? (
              <p>
                <span>At</span> {found.location}
              </p>
            ) : null}
            {found.originalLanguage ? (
              <p>
                <span>Originally in</span> {found.originalLanguage}
              </p>
            ) : null}
          </div>

          {found.otherEdition ? (
            <p className="creed-other-edition">
              This creed is held here twice, from two different editors.{" "}
              <Link to={`/study/creeds/${found.otherEdition}`}>Read the other edition</Link>.
            </p>
          ) : null}
          {found.note ? <p className="creed-note">{found.note}</p> : null}

          <div className="creed-scripture-switch">
            <label>
              <input type="checkbox" checked={showScripture} onChange={(event) => setShowScripture(event.target.checked)} />
              <span>
                Show every proof-text in full, in the {found.scripture.abbreviation ?? "BSB"}
              </span>
            </label>
            {found.counts.quotations > 0 ? (
              <p>
                {found.counts.quotations.toLocaleString("en-US")}{" "}
                {found.counts.quotations === 1 ? "quotation in this document is" : "quotations in this document are"} given
                in the Berean Standard Bible.
                {found.counts.unrestated > 0
                  ? ` ${found.counts.unrestated.toLocaleString("en-US")} more are left in the document's own older wording, each marked where it stands.`
                  : ""}
              </p>
            ) : found.counts.unrestated > 0 ? (
              <p>
                This document's quotations are left in its own older wording — {found.counts.unrestated.toLocaleString("en-US")}{" "}
                of them, each marked where it stands. Its proof-text references are shown in the Berean Standard Bible.
              </p>
            ) : (
              <p>This document states its doctrine rather than quoting verses; its references are shown in the Berean Standard Bible.</p>
            )}
          </div>
        </header>

        {part ? <Parts parts={parts} current={part} onPick={pick} /> : null}

        <div ref={body} className="creed-body">
          {bundle.status === "loading" ? (
            <p className="animate-pulse font-serif text-muted">Loading the text…</p>
          ) : !text ? (
            <p className="text-muted">This part of the text could not be loaded. Please try again.</p>
          ) : (
            sections.map((section) => (
              <Section
                key={section.id}
                section={section}
                verses={text.verses}
                showScripture={showScripture}
                documentType={found.documentType}
              />
            ))
          )}
        </div>

        {parts.length > 1 && part ? (
          <nav className="creed-step" aria-label="Move through the document">
            {parts[parts.indexOf(part) - 1] ? (
              <button type="button" onClick={() => pick(parts[parts.indexOf(part) - 1])}>
                ← {parts[parts.indexOf(part) - 1].label}
              </button>
            ) : (
              <span />
            )}
            {parts[parts.indexOf(part) + 1] ? (
              <button type="button" onClick={() => pick(parts[parts.indexOf(part) + 1])}>
                {parts[parts.indexOf(part) + 1].label} →
              </button>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        <footer className="creed-credits">
          <h2>This text and its sources</h2>
          <ul>
            {found.source.url ? (
              <li>
                <a href={found.source.url} target="_blank" rel="noopener noreferrer">
                  {found.source.title}
                </a>
                <span>
                  {found.source.publisher ? `${found.source.publisher} · ` : ""}
                  {found.source.licence}
                  {found.source.retrieved ? ` · read ${found.source.retrieved}` : ""}
                </span>
              </li>
            ) : null}
            <li>
              <a href={found.scripture.home ?? "https://berean.bible/"} target="_blank" rel="noopener noreferrer">
                {found.scripture.title}
              </a>
              <span>{found.scripture.licence}</span>
            </li>
          </ul>
          <p>
            The document's own wording is unchanged apart from the quoted verses described above. Its proof-text
            references were resolved against this site's own copy of the Berean Standard Bible; the{" "}
            {found.counts.referenceOnly > 0
              ? `${found.counts.referenceOnly} reference${found.counts.referenceOnly === 1 ? "" : "s"} the Berean text does not carry are shown as references with no verse words`
              : "references it does not carry would be shown as references with no verse words"}
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
