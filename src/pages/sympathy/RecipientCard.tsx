// /sympathy/card/<key> (design 5.5): what the person grieving sees when they open a link a friend sent. The verse, large,
// in the chosen style, "Sent to you with sympathy", a link to read it in the Bible and one to more words of comfort, and
// a very small site name. No card maker, no list of other pages, no crisis strip, nothing to sign up for; drawn outside
// the site's header and footer (App.tsx). Not indexed. A mistyped or cut-off link still shows a card, never "not found".
import { useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { DEFAULT_CARD_KEY, passageByKey, passageKey, SYMPATHY_PATH } from "@/data/sympathy";
import { usePageHead } from "@/components/usePageHead";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { passageReference, readHref } from "@/pages/life-events/passage";
import { styleFrom } from "./message";
import { Ornament } from "./Ornament";
import { useSympathyPassages } from "./useSympathyPassages";

function useNoIndex() {
  useEffect(() => {
    const meta = Object.assign(document.createElement("meta"), { name: "robots", content: "noindex" });
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

export function RecipientCard() {
  useNoIndex();
  // Outside the site layout, so it names the tab from its own heading itself.
  usePageHead();
  const params = useParams();
  const [search] = useSearchParams();
  const catalog = useCatalog();
  const found = passageByKey(params["*"]);
  const passage = found ?? passageByKey(DEFAULT_CARD_KEY)!;
  const style = styleFrom(search.get("style"));
  const passages = useMemo(() => [passage], [passage]);
  const { state, retry } = useSympathyPassages(`card:${passageKey(passage)}`, passages);
  const book = bookByNum(catalog, Math.floor(passage.from / 1_000_000));
  const reference = passageReference(passage, () => book?.name ?? "");
  const shown = state.status === "ready" ? state.value[0] : null;

  return (
    <main id="main" className={`sy-recipient sy-recipient-${style}`}>
      <div className="sy-recipient-card">
        <Ornament style={style} colour="currentColor" width={style === "plain" ? 120 : 150} />
        {!found && <p className="sy-recipient-missing">{`We couldn't find the exact verse this link pointed to. Here are words of comfort from ${reference}.`}</p>}
        {shown && <blockquote className="scripture sy-recipient-verse" lang="en">{shown.text}</blockquote>}
        {state.status === "loading" && <p className="sy-status" role="status">Loading the verse…</p>}
        {state.status === "error" && (
          <p className="sy-status" role="alert">The verse could not be loaded. Check your connection and try again. <button type="button" className="sy-small-button" onClick={retry}>Retry</button></p>
        )}
        <h1 className="sy-recipient-ref">{reference}</h1>
        <p className="sy-recipient-sent">Sent to you with sympathy.</p>
      </div>
      <p className="sy-recipient-links">
        {book && <a href={readHref(passage, book.code)}>Read it in the Bible</a>}
        <Link to={`${SYMPATHY_PATH}#verses`}>More words of comfort</Link>
      </p>
      <p className="sy-recipient-site">Bible Guide</p>
    </main>
  );
}
