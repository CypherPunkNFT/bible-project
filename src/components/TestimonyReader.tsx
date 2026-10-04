import { ArrowLeft, RotateCcw, Type, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatTestimonyDate, testimonyWordCount, type TestimonyNode } from "@/lib/testimonies";

export function TestimonyReader({ person, story, error, onRetry, onClose }: {
  person: TestimonyNode; story: TestimonyNode | null; error: string; onRetry: () => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [large, setLarge] = useState(false), [progress, setProgress] = useState(0);
  const words = testimonyWordCount(story?.body ?? "");
  useEffect(() => {
    const element = dialog.current!;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    element.showModal(); document.body.style.overflow = "hidden";
    return () => {
      element.close(); document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarGutter = previousGutter;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="testimony-reader" aria-labelledby="testimony-reader-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="testimony-reader-toolbar">
      <span><span className="testimony-avatar">{person.name.slice(0, 1)}</span>{person.name}'s testimony</span>
      <div><button type="button" aria-label="Larger text" aria-pressed={large} onClick={() => setLarge((value) => !value)}><Type size={19} /></button><button type="button" aria-label="Close full testimony" onClick={onClose}><X size={22} /></button></div>
    </header>
    <progress className="testimony-reading-progress" value={progress} max={100} aria-hidden="true" />
    <div className={"testimony-reader-scroll" + (large ? " is-large" : "")} tabIndex={0} role="region" aria-label="Full testimony text" onScroll={(event) => {
      const element = event.currentTarget, distance = element.scrollHeight - element.clientHeight;
      setProgress(distance > 0 ? Math.min(100, 100 * element.scrollTop / distance) : 100);
    }}>
      <article>
        <header className="testimony-reader-heading">
          <p className="testimony-kicker">{person.theme || "A life in their own words"}</p>
          <h2 id="testimony-reader-title">{person.title}</h2>
          <p className="testimony-reader-byline">By {person.name}{person.publishedAt && <> · Shared <time dateTime={person.publishedAt}>{formatTestimonyDate(person.publishedAt)}</time></>}{story && <> · {words.toLocaleString()} words · {Math.max(1, Math.ceil(words / 200))} min read</>}</p>
          {person.happenedWhen && <p className="testimony-small">When it happened: {person.happenedWhen}</p>}
          <p className="testimony-reader-blurb">{person.blurb}</p>
        </header>
        {error ? <div role="alert" className="testimony-reader-error"><p>{error}</p><button type="button" className="testimony-secondary" onClick={onRetry}>Try again <RotateCcw size={15} /></button></div> : story ? <div className="testimony-reader-prose">{story.body.split(/\n\s*\n/u).filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : <p role="status" className="testimony-small">Opening the full testimony…</p>}
        {story && <footer className="testimony-reader-end"><span>Thank you for taking time to listen.</span><button type="button" className="testimony-secondary" onClick={onClose}><ArrowLeft size={15} />Back to the tree</button></footer>}
      </article>
    </div>
  </dialog>;
}
