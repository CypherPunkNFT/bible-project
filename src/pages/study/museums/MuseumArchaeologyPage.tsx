import { StudyTrail } from "@/components/study/StudyTrail";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { loadMuseumIndex } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { GROUP_LABELS, GROUP_LEADS, type MuseumCard, type MuseumGroup } from "@/lib/museums";
import { MuseumEmblem } from "./MuseumEmblems";
import "./museums.css";

const GROUPS: MuseumGroup[] = ["collections", "holders", "coming-soon"];

/** Thin dividers, four figures, each one true. The 55,448 is deliberately not among them. */
function Stats({ figures }: { figures: [string, string][] }) {
  return (
    <dl className="mu-stats">
      {figures.map(([value, label]) => (
        <div key={label}>
          <dt>{value}</dt>
          <dd>{label}</dd>
        </div>
      ))}
    </dl>
  );
}

function Card({ card }: { card: MuseumCard }) {
  const soon = card.state === "coming-soon";
  return (
    <li className={`mu-card${soon ? " mu-card-soon" : ""}`}>
      <Link to={`/study/museum-archaeology/${card.slug}`}>
        <MuseumEmblem emblem={card.emblem} name={card.name} />
        <div>
          <h3>{card.name}</h3>
          {card.place && card.place !== "—" ? <p className="mu-place">{card.place}</p> : null}
          <p className="mu-card-lead">{card.lead}</p>
        </div>
        <footer>
          {soon ? (
            <span className="mu-soon">Coming soon</span>
          ) : (
            <span className="mu-card-counts">
              {card.records.toLocaleString()} {card.records === 1 ? "record" : "records"}
              {card.photographs > 0 ? ` · ${card.photographs} photographed` : ""}
              {card.catalogue_rows > 0 ? ` · ${card.catalogue_rows} in the catalogue` : ""}
            </span>
          )}
          <ArrowUpRight size={17} aria-hidden="true" />
        </footer>
      </Link>
    </li>
  );
}

export default function MuseumArchaeologyPage() {
  const index = useAsync(loadMuseumIndex, "museums/index");
  const [params, setParams] = useSearchParams();
  const [showOthers, setShowOthers] = useState(false);
  useEffect(() => {
    const old = document.title;
    document.title = "Museum-Grade Archaeology · Bible Project";
    return () => {
      document.title = old;
    };
  }, []);

  const asked = params.get("group");
  const group = GROUPS.find((candidate) => candidate === asked) ?? null;
  const byGroup = useMemo(() => {
    const cards = index.status === "ready" ? index.value.cards : [];
    const shown = group ? cards.filter((card) => card.group === group) : cards;
    const out = new Map<MuseumGroup, MuseumCard[]>();
    for (const card of shown) out.set(card.group, [...(out.get(card.group) ?? []), card]);
    return out;
  }, [index, group]);

  if (index.status === "loading") {
    return (
      <div className="mu-page study-frame">
        <p className="mu-loading">Opening the museum records…</p>
      </div>
    );
  }
  if (index.status === "error") {
    return (
      <div className="mu-page study-frame">
        <StudyTrail area="history" />
        <h1>Museum-Grade Archaeology</h1>
        <p className="mu-unavailable">
          These museum records are not in this version of the site. They are generated from the project's own
          research corpus by <code>scripts/build-museums.py</code>.
        </p>
      </div>
    );
  }

  const { counts, generated, cards: all, other_holders: others } = index.value;
  const photographed = all.reduce((most, card) => Math.max(most, card.photographs), 0);
  const cabinet = all
    .filter((card) => card.thumb)
    .sort((a, b) => b.catalogue_rows - a.catalogue_rows || b.photographs - a.photographs)
    .slice(0, 12);

  return (
    <div className="mu-page study-frame">
      <header className="mu-landing">
        <div>
          <StudyTrail area="history" />
          <p className="mu-kicker">Museum records · Open licences · Named objects</p>
          <h1>
            Museum-grade
            <br />
            <em>archaeology.</em>
          </h1>
          <p className="mu-lead">
            Not a list of proofs. A list of <em>objects</em>, and of the museums that have them.
          </p>
          <p className="mu-intro">
            Every record on these pages was taken from a museum or archive that publishes its catalogue openly, and
            every photograph was copied only because its own source stated an open licence. Each object carries the
            museum's own number, its date as the museum records it, where it was found, and — where our archaeology
            catalogue has an audited row for it — what that row says the object does and does not support.
          </p>
        </div>
        <Stats
          figures={[
            [String(counts.cards), "museums & collections"],
            [counts.catalogue_rows_matched.toLocaleString(), `of ${counts.catalogue_rows} catalogue rows matched`],
            [String(counts.photographs), "openly licensed photographs"],
            [counts.institutions_recorded.toLocaleString(), "institutions named as holders"],
          ]}
        />
      </header>

      {cabinet.length > 0 ? (
        <section className="mu-cabinet" aria-labelledby="mu-cabinet-title">
          <div className="mu-section-head">
            <div>
              <p className="mu-kicker">01 / The cabinet</p>
              <h2 id="mu-cabinet-title">
                Look at <em>the thing itself.</em>
              </h2>
            </div>
            <p>
              One photograph from each of the collections that has one. Every picture on this site but these is our own
              drawing; these are the objects.
            </p>
          </div>
          <ul className="mu-cabinet-grid">
            {cabinet.map((card) => (
              <li key={card.slug}>
                <Link to={`/study/museum-archaeology/${card.slug}`}>
                  <img src={card.thumb} alt="" loading="lazy" decoding="async" />
                  <span>{card.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mu-caption">
            Photographs are shown at the museums' own open licences, each credited on its own object. No museum here
            endorses a biblical reading of its objects.
          </p>
        </section>
      ) : null}

      <section className="mu-rooms" aria-labelledby="mu-rooms-title">
        <div className="mu-section-head">
          <div>
            <p className="mu-kicker">02 / The museums</p>
            <h2 id="mu-rooms-title">
              Choose a <em>collection.</em>
            </h2>
          </div>
          <p>
            Two different relationships, never added together: the collections these records were fetched from, and the
            institutions those records name as holding the object. One tablet is both a catalogue record and a British
            Museum object.
          </p>
        </div>

        <div className="mu-filters" role="group" aria-label="Filter the museums">
          {[["", "All", all.length] as const, ...GROUPS.map((candidate) => [
            candidate,
            GROUP_LABELS[candidate],
            all.filter((card) => card.group === candidate).length,
          ] as const)].map(([value, label, count]) => (
            <button
              key={label}
              type="button"
              aria-pressed={(group ?? "") === value}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (value) next.set("group", value);
                else next.delete("group");
                setParams(next, { replace: true, preventScrollReset: true });
              }}
            >
              {label}
              <small>{count}</small>
            </button>
          ))}
        </div>

        {GROUPS.filter((candidate) => (byGroup.get(candidate) ?? []).length > 0).map((candidate) => (
          <div key={candidate} className="mu-group">
            <h3>{GROUP_LABELS[candidate]}</h3>
            <p className="mu-group-lead">{GROUP_LEADS[candidate]}</p>
            <ul className="mu-grid">
              {(byGroup.get(candidate) ?? []).map((card) => (
                <Card key={card.slug} card={card} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {others.length > 0 ? (
        <section className="mu-others" aria-labelledby="mu-others-title">
          <div className="mu-section-head">
            <div>
              <p className="mu-kicker">03 / Named, but with no page here</p>
              <h2 id="mu-others-title">
                Everyone else <em>the records name.</em>
              </h2>
            </div>
            <p>
              The cuneiform catalogues record a holder for almost every tablet, and these {others.length} institutions
              and private collections are named among them. We hold catalogue rows about their objects, no photographs,
              and nothing fetched from the institutions themselves — so they have a line here rather than a page.
            </p>
          </div>
          <button type="button" className="mu-disclose" onClick={() => setShowOthers(!showOthers)}>
            {showOthers ? "Hide the list" : `Show all ${others.length}`}
            <Plus size={15} aria-hidden="true" />
          </button>
          {showOthers ? (
            <ul className="mu-other-list">
              {others.map((holder) => (
                <li key={holder.name}>
                  <span>{holder.name}</span>
                  <small>
                    {holder.records.toLocaleString()} {holder.records === 1 ? "record" : "records"}
                  </small>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <footer className="mu-footer">
        <p>
          An object in a case is not an argument.
          <br />
          <em>It is where one can begin.</em>
        </p>
        <div>
          <Link to="/study/from-discovery-to-history">
            How to read an object
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/study/academic?area=history">
            History &amp; archaeology
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="mu-caption">
          Built from this project's own research corpus, retrieved {generated || "2026-10-17"}. The most photographed
          collection here holds {photographed} of these pictures. Sources, licences and checksums are registered in the
          project's source register.
        </p>
      </footer>
    </div>
  );
}
