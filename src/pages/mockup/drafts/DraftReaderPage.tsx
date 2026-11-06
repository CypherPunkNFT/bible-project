import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { draftBySlug } from "./draft-studies";
import { renderDraftMarkdown } from "./draft-markdown";
import "./drafts.css";

const TEXTS = import.meta.glob<string>("/content/studies/*/*/content.md", { query: "?raw", import: "default" });

/** /study/drafts_mockup/:slug — one Scripture & Theology draft's written text, opened from its draft card on
 *  /study/theology_mockup. Local preview only, like every mock-up; the text is shown exactly as written. */
export default function DraftReaderPage() {
  const { slug } = useParams();
  const draft = draftBySlug(slug);
  const [text, setText] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    if (!draft) return;
    const load = TEXTS[`/content/studies/${draft.category}/${draft.slug}/content.md`];
    if (!load) { setFailure(`No content.md found for draft ${draft.number} in content/studies/${draft.category}/${draft.slug}/`); return; }
    load().then(setText, (error: unknown) => setFailure(`Could not load draft ${draft.number}: ${String(error)}`));
  }, [draft]);
  const back = { path: "/study/theology_mockup", label: "Scripture & Theology" };
  if (!draft) return <article className="draft-reader"><StudyBackLink fallback={back} /><p className="draft-reader-missing">There is no draft study called “{slug}”.</p></article>;
  return <article className="draft-reader">
    <StudyBackLink fallback={back} />
    <div className="draft-reader-meta"><span>Draft · Study {String(draft.number).padStart(2, "0")}</span><span>Page to come</span>{draft.mockupUrl && <a href={draft.mockupUrl}>See its design mock-up</a>}</div>
    {failure ? <p className="draft-reader-missing">{failure}</p> : text === null ? <p className="draft-reader-missing">Loading the draft…</p> : <div className="draft-reader-body">{renderDraftMarkdown(text)}</div>}
  </article>;
}
