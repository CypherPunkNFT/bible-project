import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { loadMuseum, loadMuseumIndex } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import {
  BASIS_TONE,
  OBJECT_KINDS,
  isMuseumSlug,
  objectKind,
  objectSubtitle,
  type Museum,
  type MuseumObject,
  type ObjectKind,
} from "@/lib/museums";
import { MuseumEmblem } from "./MuseumEmblems";
import "./museums.css";

/** How many objects open with. The rest arrive a page at a time rather than as one long scroll. */
const PAGE = 12;

function Photo({ object }: { object: MuseumObject }) {
  const photo = object.photo;
  if (!photo) return null;
  return (
    <figure className="mu-photo">
      <img
        src={photo.view}
        width={photo.width}
        height={photo.height}
        alt={`${object.title}, photographed`}
        loading="lazy"
        decoding="async"
      />
      <figcaption>
        {photo.commons_page ? (
          <a href={photo.commons_page} target="_blank" rel="noopener noreferrer">
            {photo.credit}
            <ArrowUpRight size={12} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <span>{photo.credit}</span>
        )}
        <span className="mu-licence">
          {photo.licence_url ? (
            <a href={photo.licence_url} target="_blank" rel="noopener noreferrer">
              {photo.licence}
            </a>
          ) : (
            photo.licence
          )}
          {photo.share_alike ? " · share-alike" : ""}
        </span>
      </figcaption>
    </figure>
  );
}

/** The two sentences from the project's own archaeology catalogue: the reach, and the limit.
 *
 * Shown in full only where the row is about this very object. Where the corpus matched it on a
 * shared name — the Met's bead amulet of Merneptah against the row for the Merneptah stele — the row
 * is a pointer and nothing more. Printing the stele's claims under the amulet would be the exact
 * overreach the project's own methods study was written to argue against.
 */
function CatalogueRows({ object }: { object: MuseumObject }) {
  if (object.catalogue.length === 0) return null;
  return (
    <div className="mu-catalogue">
      {object.catalogue.map((row) =>
        row.match === "object" ? (
          <div key={row.id}>
            <p className="mu-row-id">
              Archaeology catalogue · row {row.id}
              {row.assessment ? <small>{row.assessment}</small> : null}
            </p>
            {row.supported ? (
              <p>
                <strong>What it supports.</strong> {row.supported}
              </p>
            ) : null}
            {row.unsupported ? (
              <p className="mu-limit">
                <strong>What it does not.</strong> {row.unsupported}
              </p>
            ) : null}
            {!row.supported && !row.unsupported && row.scope ? (
              <p>
                <strong>Its reach, and its limit.</strong> {row.scope}
              </p>
            ) : null}
            {row.passages ? <p className="mu-limit">Bears on: {row.passages}</p> : null}
          </div>
        ) : (
          <div key={row.id} className="mu-related">
            <p className="mu-row-id mu-row-related">Related row · {row.id}</p>
            <p className="mu-limit">
              Our archaeology catalogue has a row for <strong>{row.name}</strong>, which shares a name with this
              record. This object is not that one, so that row&apos;s conclusions are not repeated here.
            </p>
          </div>
        ),
      )}
    </div>
  );
}

function ObjectEntry({ object, museum }: { object: MuseumObject; museum: Museum }) {
  const facts: [string, string][] = [
    ["Date", object.date],
    ["Culture", object.culture],
    ["Period", object.period],
    ["Findspot", object.findspot],
    ["Medium", object.medium],
    ["Dimensions", object.dimensions],
    ["Museum number", object.accession],
    ["Recorded holder", object.recorded_as + (object.holder_uncertain ? " — the source marks this as uncertain" : "")],
  ];
  const shown = facts.filter(([, value]) => value && value.trim());
  return (
    <article className={`mu-object${object.photo ? " mu-object-photo" : ""}`} id={object.id}>
      <header>
        <div>
          <h3>{object.title}</h3>
          {objectSubtitle(object) ? <p className="mu-object-sub">{objectSubtitle(object)}</p> : null}
        </div>
        <span className={`mu-basis mu-basis-${object.basis}`}>{BASIS_TONE[object.basis]}</span>
      </header>
      <Photo object={object} />
      <div className="mu-object-body">
        {object.why ? <p className="mu-why">{object.why}</p> : null}
        {object.description ? <p className="mu-description">{object.description}</p> : null}
        <dl className="mu-facts">
          {shown.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <CatalogueRows object={object} />
        <p className="mu-how">{object.basis_label}</p>
        {object.people.length > 0 || object.places.length > 0 ? (
          <p className="mu-named">
            Named in the record: {[...object.people, ...object.places].join(" · ")}
          </p>
        ) : null}
        <div className="mu-object-links">
          {object.source_url ? (
            <a href={object.source_url} target="_blank" rel="noopener noreferrer">
              {museum.group === "collections" ? "This record at the source" : "The record this comes from"}
              <ArrowUpRight size={13} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          {object.record_url && object.record_url !== object.source_url ? (
            <a href={object.record_url} target="_blank" rel="noopener noreferrer">
              The holder&apos;s own page
              <ArrowUpRight size={13} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function MuseumPage() {
  const { slug = "" } = useParams();
  const valid = isMuseumSlug(slug);
  const index = useAsync(loadMuseumIndex, "museums/index");
  const museum = useAsync(() => (valid ? loadMuseum(slug) : Promise.reject(new Error("bad slug"))), `museums/${slug}`);
  const [limit, setLimit] = useState(PAGE);
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [kind, setKind] = useState<ObjectKind | null>(null);
  const name = museum.status === "ready" ? museum.value.name : "A museum";
  useEffect(() => {
    const old = document.title;
    document.title = `${name} · Museum-Grade Archaeology · Bible Guide`;
    return () => {
      document.title = old;
    };
  }, [name]);
  useEffect(() => {
    setLimit(PAGE);
    setOnlyPhotos(false);
    setKind(null);
  }, [slug]);

  const known = index.status === "ready" ? index.value.cards.some((card) => card.slug === slug) : true;
  const kinds = useMemo(
    () => new Map(museum.status === "ready" ? museum.value.objects.map((object) => [object, objectKind(object)]) : []),
    [museum],
  );
  const objects = useMemo(() => {
    if (museum.status !== "ready") return [];
    return museum.value.objects.filter(
      (object) => (!onlyPhotos || object.photo) && (!kind || kinds.get(object) === kind),
    );
  }, [museum, onlyPhotos, kind, kinds]);
  const kindCounts = OBJECT_KINDS.map(([id, label]) => ({
    id,
    label,
    count: [...kinds.values()].filter((value) => value === id).length,
  })).filter((entry) => entry.count > 0);

  if (!valid || !known || museum.status === "error") {
    return (
      <div className="mu-page">
        <nav className="mu-breadcrumb" aria-label="Study navigation">
          <Link to="/study/museum-archaeology">
            <ArrowLeft size={14} aria-hidden="true" />
            Museum-Grade Archaeology
          </Link>
        </nav>
        <h1>Not a museum on this page</h1>
        <p className="mu-unavailable">
          There is no museum at this address. Open the list of collections and choose one.
        </p>
      </div>
    );
  }
  if (museum.status === "loading") {
    return (
      <div className="mu-page">
        <p className="mu-loading">Opening the records…</p>
      </div>
    );
  }

  const held = museum.value;
  const soon = held.state === "coming-soon";
  const photographs = held.objects.filter((object) => object.photo).length;

  return (
    <div className="mu-page mu-museum">
      <nav className="mu-breadcrumb" aria-label="Study navigation">
        <Link to="/study/museum-archaeology">
          <ArrowLeft size={14} aria-hidden="true" />
          Museum-Grade Archaeology
        </Link>
        <span>{held.place && held.place !== "—" ? held.place : held.kind}</span>
      </nav>

      <header className="mu-museum-head">
        <MuseumEmblem emblem={held.emblem} name={held.name} size={110} />
        <div>
          <p className="mu-kicker">
            {held.group === "collections"
              ? "An open collection these records came from"
              : held.group === "holders"
                ? "Named in these records as the holder"
                : "Not yet held"}
          </p>
          <h1>{held.name}</h1>
          {held.place && held.place !== "—" ? <p className="mu-place">{held.place}</p> : null}
          {held.lead ? <p className="mu-intro">{held.lead}</p> : null}
        </div>
      </header>

      {soon ? (
        <section className="mu-soon-panel" aria-labelledby="mu-soon-title">
          <p className="mu-kicker">Coming soon</p>
          <h2 id="mu-soon-title">
            Nothing here <em>yet.</em>
          </h2>
          <p>{held.why_coming_soon}</p>
          <Link to="/study/museum-archaeology">
            Back to the collections
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <dl className="mu-stats mu-museum-stats">
            <div>
              <dt>{held.totals.records.toLocaleString()}</dt>
              <dd>{held.totals.records === 1 ? "record held" : "records held"}</dd>
            </div>
            <div>
              <dt>{held.totals.listed.toLocaleString()}</dt>
              <dd>listed on this page</dd>
            </div>
            <div>
              <dt>{photographs}</dt>
              <dd>openly licensed photographs</dd>
            </div>
            <div>
              <dt>{held.totals.catalogue_rows}</dt>
              <dd>matched to our catalogue</dd>
            </div>
          </dl>

          {held.note ? <p className="mu-note">{held.note}</p> : null}

          {held.totals.listed < held.totals.records ? (
            <p className="mu-caption mu-cut">
              {held.totals.records.toLocaleString()} records are held for this collection and{" "}
              {held.totals.listed.toLocaleString()} are listed here — the ones its own records tie to something
              biblical, audited first. The rest are in the research corpus, not on this page.
            </p>
          ) : null}

          {held.recorded_as.length > 1 ? (
            <details className="mu-details">
              <summary>
                Written {held.recorded_as.length} different ways by its cataloguers
                <Plus size={15} aria-hidden="true" />
              </summary>
              <ul className="mu-recorded">
                {held.recorded_as.map((recorded) => (
                  <li key={recorded}>{recorded}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {held.objects.length > 0 ? (
            <section className="mu-objects" aria-labelledby="mu-objects-title">
              <div className="mu-section-head">
                <div>
                  <p className="mu-kicker">The objects</p>
                  <h2 id="mu-objects-title">
                    What we hold <em>for this collection.</em>
                  </h2>
                </div>
                {photographs > 0 ? (
                  <button type="button" className="mu-disclose" aria-pressed={onlyPhotos}
                    onClick={() => { setOnlyPhotos(!onlyPhotos); setLimit(PAGE); }}>
                    {onlyPhotos ? "Show every object" : `Only the ${photographs} photographed`}
                  </button>
                ) : null}
              </div>
              {kindCounts.length > 1 ? (
                <div className="mu-kinds" role="group" aria-label="Kinds of object">
                  {[{ id: null, label: "Everything", count: held.objects.length }, ...kindCounts].map((entry) => (
                    <button
                      key={entry.id ?? "all"}
                      type="button"
                      className="mu-kind"
                      aria-pressed={kind === entry.id}
                      onClick={() => {
                        setKind(entry.id);
                        setLimit(PAGE);
                      }}
                    >
                      {entry.label}
                      <span>{entry.count.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mu-object-list">
                {objects.slice(0, limit).map((object) => (
                  <ObjectEntry key={object.id} object={object} museum={held} />
                ))}
              </div>
              {objects.length === 0 ? (
                <p className="mu-unavailable">None of this kind has a photograph. Show every object to see them.</p>
              ) : null}
              {objects.length > limit ? (
                <button type="button" className="mu-more" onClick={() => setLimit(limit + PAGE)}>
                  Show {Math.min(PAGE, objects.length - limit)} more
                  <span>
                    {limit} of {objects.length}
                  </span>
                </button>
              ) : null}
            </section>
          ) : (
            <p className="mu-unavailable">
              Our sources name this collection as a holder but carry no object record we can show for it yet.
            </p>
          )}
        </>
      )}

      <footer className="mu-footer">
        <div>
          <Link to="/study/museum-archaeology">
            Every collection
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/study/from-discovery-to-history">
            How to read an object
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="mu-caption">
          Records and photographs are the museums&apos; and archives&apos; own, used under the licences each one
          states. A record here is a record, not an endorsement of any reading of the object.
        </p>
      </footer>
    </div>
  );
}
