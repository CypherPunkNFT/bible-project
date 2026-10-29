import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadChapterTopics, loadHymnsByChapter } from "@/lib/data";
import type { HymnsByChapter } from "@/lib/hymn-pages";
import { loadHarmony, loadLetters, loadMiracles, loadNames, loadProphets } from "@/lib/study";
import { topicUrl, type ChapterTopics } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { usePeopleData } from "@/pages/teachers/shared/data";
import { studiesFor, type StudyData } from "./chapter-studies";

const SHOWN = 6;
const TOPICS_SHOWN = 12;
const NO_HYMNS: HymnsByChapter = {};
const NO_TOPICS: ChapterTopics = { chapters: {}, names: {} };
const loadStudies = (): Promise<StudyData> =>
  Promise.all([loadHarmony(), loadMiracles(), loadNames(), loadLetters(), loadProphets()]).then(([harmony, miracles, names, letters, prophets]) => ({ harmony, miracles, names, letters, prophets }));

/** Under the chosen chapter's summary: the hymns sung on it, the teachers' works that take it as their text, then every
 *  study on the site connected to it. All from the site's own data, matched by verse. */
export function ChapterCompanions({ code, bookNumber, chapter, name }: { code: string; bookNumber: number; chapter: number; name: string }) {
  const hymns = useAsync(() => loadHymnsByChapter(code).catch(() => NO_HYMNS), `structure-hymns:${code}`);
  const topics = useAsync(() => loadChapterTopics(code).catch(() => NO_TOPICS), `structure-topics:${code}`);
  const studies = useAsync(loadStudies, "structure-studies");
  const people = usePeopleData();

  const sung = hymns.status === "ready" ? hymns.value[String(chapter)] : undefined;
  const songs = sung ? [...sung.on, ...sung.echo] : [];
  const works = useMemo(() => (people.data?.people ?? []).flatMap((person) => person.passages
    .filter((w) => Math.floor(w.v / 1e6) === bookNumber && Math.floor(w.v / 1e3) % 1000 === chapter)
    .map((work) => ({ person, work }))), [people.data, bookNumber, chapter]);
  const groups = studies.status === "ready" ? studiesFor(studies.value, code, bookNumber, chapter) : [];
  const chapterTopics = topics.status === "ready" ? topics.value.chapters[String(chapter)] ?? [] : [];
  const topicNames = topics.status === "ready" ? topics.value.names : {};

  return (
    <div className="shape-companions">
      <div className="shape-companion-columns">
        <section aria-labelledby="shape-hymns">
          <p id="shape-hymns" className="lib-small-caps">Hymns on this chapter{songs.length ? ` · ${songs.length}` : ""}</p>
          {hymns.status === "loading" ? <p className="lib-muted">…</p> : songs.length ? <ul className="shape-works">
            {songs.slice(0, SHOWN).map((h) => <li key={h.id}><Link to={`/study/hymns/${h.id}`}><span>{h.t.replace(/[,;:]$/, "")}</span><small>{h.a} · {h.y} · {h.r}</small></Link></li>)}
            {songs.length > SHOWN && <li className="shape-more"><Link to="/study/hymns">+{songs.length - SHOWN} more in the hymns collection</Link></li>}
          </ul> : <p className="lib-muted">No hymn in our collection is written on {name}.</p>}
        </section>
        <section aria-labelledby="shape-teachers">
          <p id="shape-teachers" className="lib-small-caps">Teachers who preached it{works.length ? ` · ${works.length}` : ""}</p>
          {!people.data && !people.error ? <p className="lib-muted">…</p> : works.length ? <ul className="shape-works">
            {works.slice(0, SHOWN).map(({ person, work }, i) => <li key={`${person.id}-${i}`}>
              {work.u ? <a href={work.u} target="_blank" rel="noreferrer"><span>{work.t}<ArrowUpRight size={12} aria-hidden="true" /></span><small>{person.short} · {work.r}{work.d ? ` · ${work.d.slice(0, 4)}` : ""}</small></a>
                : <div><span>{work.t}</span><small>{person.short} · {work.r}</small></div>}
            </li>)}
            {works.length > SHOWN && <li className="shape-more"><Link to="/teachers">+{works.length - SHOWN} more on the Teachers page</Link></li>}
          </ul> : <p className="lib-muted">None of our teachers' works takes {name} as its main text yet.</p>}
        </section>
      </div>
      <section className="shape-studies" aria-labelledby="shape-studies">
        <p id="shape-studies" className="lib-small-caps">Studies connected to {name}</p>
        {studies.status === "loading" ? <p className="lib-muted">…</p> : <dl>
          {groups.map((group) => <div key={group.kind}><dt>{group.kind}</dt><dd>
            {group.links.slice(0, 10).map((link, i) => <Link key={i} to={link.href}>{link.title}{link.note && <small> · {link.note}</small>}</Link>)}
            {group.links.length > 10 && <span className="lib-muted">+{group.links.length - 10} more</span>}
          </dd></div>)}
          {chapterTopics.length > 0 && <div><dt>Topics</dt><dd>
            {chapterTopics.slice(0, TOPICS_SHOWN).map(([id]) => <Link key={id} to={topicUrl(id)}>{topicNames[id] ?? id}</Link>)}
            {chapterTopics.length > TOPICS_SHOWN && <Link className="lib-muted" to="/topics">+{chapterTopics.length - TOPICS_SHOWN} more</Link>}
          </dd></div>}
          {!groups.length && !chapterTopics.length && <p className="lib-muted">No study on the site is connected to {name} yet.</p>}
        </dl>}
      </section>
    </div>
  );
}
