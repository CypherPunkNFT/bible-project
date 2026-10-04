import { ArrowLeft, ArrowRight, Check, Copy, GitBranch, List, Plus, Share2 } from "lucide-react";
import { hierarchy, tree } from "d3-hierarchy";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TestimonyTree } from "@/components/TestimonyTree";
import { formatTestimonyDate, TESTIMONY_THEMES, testimonyPath, validateTestimony, type TestimonyNode, type TestimonySubmission } from "@/lib/testimonies";
import { saveTestimonyValue, savedTestimonyValue, testimonyAccessToken, testimonyApi } from "@/lib/testimony-api";
import type { InvitationStatus, InvitationWelcome, TestimonyAccount, TestimonyBranch, TestimonyInvite, TestimonyReport } from "@/lib/testimony-contract";
import "./testimonies-design.css";

const emptyBranch: TestimonyBranch = { nodes: [], ancestors: [], rootId: null, hasMore: false, total: 0 };
const message = (error: unknown) => error instanceof Error ? error.message : "Please try again.";
type Mode = "explore" | "invite" | "write" | "manage" | "access";

function entryToken(kind: "code" | "key") {
  const value = new URLSearchParams(window.location.hash.slice(1)).get(kind);
  const storage = "testimony-entry-" + kind;
  if (value) {
    saveTestimonyValue(storage, value);
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }
  return value ?? savedTestimonyValue<string>(storage) ?? "";
}

export default function TestimoniesPage() {
  const location = useLocation(), navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("explore");
  const [branch, setBranch] = useState<TestimonyBranch>(emptyBranch);
  const [page, setPage] = useState(0), [selectedId, setSelected] = useState("");
  const [story, setStory] = useState<TestimonyNode | null>(null), [storyError, setStoryError] = useState("");
  const [display, setDisplay] = useState("tree"), [loading, setLoading] = useState(true);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [me, setMe] = useState<TestimonyAccount | null>(null), [siteUrl, setSiteUrl] = useState("");
  const [welcome, setWelcome] = useState<InvitationWelcome | null>(null), [invitationToken, setInvitationToken] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [accessUrl, setAccessUrl] = useState(() => savedTestimonyValue<string>("testimony-private-url") ?? "");
  const [revision, setRevision] = useState(0);
  const meRequest = useRef(0);
  const refreshMe = useCallback(async () => { const request = ++meRequest.current; const current = await testimonyApi<TestimonyAccount | null>("me"); if (request === meRequest.current) setMe(current); return current; }, []);
  const loadBranch = useCallback(async (root?: string | null, nextPage = 0) => {
    setLoading(true); setError("");
    try {
      const result = await testimonyApi<TestimonyBranch>("branches?" + new URLSearchParams({ ...(root ? { root } : {}), page: String(nextPage) }));
      setBranch(result); setPage(nextPage); setSelected(result.rootId ?? ""); setRevision((v) => v + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refreshMe().catch((cause) => setError(message(cause)));
    void testimonyApi<{ siteUrl: string }>("settings").then((value) => setSiteUrl(value.siteUrl)).catch((cause) => setError(message(cause)));
    void loadBranch(new URLSearchParams(window.location.search).get("branch"));
  }, [loadBranch, refreshMe]);

  useEffect(() => {
    let active = true;
    if (location.pathname.endsWith("/join")) {
      const token = entryToken("code"); setInvitationToken(token); setMode("write"); setWelcome(null); setInviteError("");
      if (!token) setInviteError("Open the complete invitation link you received to share your testimony.");
      else void testimonyApi<InvitationWelcome>("invitations/inspect", "POST", { token }).then((value) => { if (active) setWelcome(value); }).catch((cause) => { if (active) setInviteError(message(cause)); });
    } else if (location.pathname.endsWith("/access")) {
      const token = entryToken("key"); setMode("access");
      if (token) void testimonyApi("session", "POST", { token }).then(async () => {
        if (!active) return; saveTestimonyValue("testimony-entry-key", null); await refreshMe(); navigate("/testimonies", { replace: true }); setMode("manage");
      }).catch((cause) => { if (active) setError(message(cause)); });
    }
    return () => { active = false; };
  }, [location.pathname, refreshMe, navigate]);

  const selected = branch.nodes.find((n) => n.id === selectedId);
  useEffect(() => {
    setStory(null); setStoryError("");
    if (!selectedId || selected?.available === false) return;
    const controller = new AbortController();
    void testimonyApi<TestimonyNode>("stories/" + encodeURIComponent(selectedId), "GET", undefined, controller.signal).then(setStory).catch((cause) => { if (!controller.signal.aborted) setStoryError(message(cause)); });
    return () => controller.abort();
  }, [selectedId, selected?.available, revision]);

  const positions = useMemo(() => {
    if (!branch.nodes.length) return [];
    const root = hierarchy(branch.nodes[0], (person) => branch.nodes.filter((n) => n.parentId === person.id));
    const points = tree<TestimonyNode>().nodeSize([118, 240]).separation(() => 1)(root).descendants();
    const min = Math.min(...points.map((p) => p.x));
    return points.map((p) => ({ node: p.data, left: p.y + 24, top: p.x - min + 36, depth: p.depth }));
  }, [branch.nodes]);
  const pathNodes = [...branch.ancestors, ...branch.nodes];
  const path = testimonyPath(pathNodes, selectedId);
  const details = story ?? selected;
  const pendingSubmission = savedTestimonyValue<{ invitationToken: string; fields: string }>("testimony-submission");
  const canRecover = pendingSubmission?.invitationToken === invitationToken;
  async function publish(value: TestimonySubmission) {
    const previous = savedTestimonyValue<{ invitationToken: string; accessToken: string; requestId: string; fields: string }>("testimony-submission");
    const serialized = JSON.stringify(value);
    const attempt = previous?.invitationToken === invitationToken && previous.fields === serialized ? previous : { invitationToken, accessToken: testimonyAccessToken(), requestId: crypto.randomUUID(), fields: serialized };
    saveTestimonyValue("testimony-submission", attempt);
    const result = await testimonyApi<{ personId: string; accessUrl: string }>("submissions", "POST", { ...value, ...attempt });
    saveTestimonyValue("testimony-submission", null); saveTestimonyValue("testimony-draft", null); saveTestimonyValue("testimony-entry-code", null);
    saveTestimonyValue("testimony-private-url", result.accessUrl); setAccessUrl(result.accessUrl);
    setNotice("Your testimony has been published. Save your private access link, then invite someone to share their story.");
    navigate("/testimonies", { replace: true }); setMode("manage");
    await Promise.allSettled([refreshMe(), loadBranch(result.personId)]);
  }
  async function signOut() {
    try { await testimonyApi("session", "DELETE"); ++meRequest.current; setMe(null); setAccessUrl(""); saveTestimonyValue("testimony-private-url", null); }
    catch (cause) { setError(message(cause)); }
  }
  function openExplore(root?: string) { setMode("explore"); navigate("/testimonies" + (root ? "?branch=" + encodeURIComponent(root) : "")); void loadBranch(root); }

  return <div className="testimony-design mx-auto max-w-7xl px-4 sm:px-6">
    <div className="testimony-account-access"><button type="button" onClick={() => { navigate("/testimonies"); setMode(me ? "manage" : "access"); }}>{me ? "My testimony" : "Private access"}</button></div>
    <header className="testimony-intro"><div><p className="testimony-kicker"><GitBranch size={16} /> A living collection of testimonies</p><h1>One story can<br /><em>open another.</em></h1><p>Listen to a life. Follow a connection. Invite someone to add their story of faith.</p></div><div className="testimony-intro-note"><span>Every branch begins<br />with a conversation.</span><p>The lines show who invited whom.<br />Each person speaks in their own words.</p></div></header>
    <nav className="testimony-navigation" aria-label="Testimonies">
      <button type="button" aria-current={mode === "explore" ? "page" : undefined} onClick={() => openExplore()}><GitBranch size={16} />Explore the branches</button>
      <button type="button" aria-current={mode === "invite" ? "page" : undefined} onClick={() => { navigate("/testimonies"); setMode("invite"); setNotice(""); }}><Plus size={16} />Invite someone</button>
    </nav>
    {notice && <p className="testimony-notice" role="status"><Check size={16} />{notice}</p>}
    {error && <div className="testimony-notice testimony-error" role="alert">{error}<button type="button" onClick={() => { void loadBranch(branch.rootId); void refreshMe().catch((cause) => setError(message(cause))); }}>Try again</button></div>}
    {accessUrl && <PrivateAccessLink url={accessUrl} onSaved={() => { setAccessUrl(""); saveTestimonyValue("testimony-private-url", null); }} />}
    {mode === "explore" && (loading ? <p className="testimony-empty" role="status">Loading the branches…</p> : branch.nodes.length === 0 ? <section className="testimony-empty"><GitBranch size={32} /><h2>Every branch begins with a story.</h2><p>No testimonies have been shared yet. If you have an invitation, open its link to begin.</p></section> : <div className="testimony-workspace">
      <section className="testimony-map" aria-label="Invitation branches">
        <header><div><p className="testimony-kicker">Follow the invitations</p><h2>{branch.nodes[0].available ? branch.nodes[0].name + "'s branch" : "A continuing branch"}<span>{branch.nodes.filter((n) => n.available).length} stories shown</span></h2></div><div className="testimony-view-toggle" role="group" aria-label="Branch display"><button type="button" aria-pressed={display === "tree"} onClick={() => setDisplay("tree")} aria-label="Tree view"><GitBranch size={17} /></button><button type="button" aria-pressed={display === "list"} onClick={() => setDisplay("list")} aria-label="List view"><List size={17} /></button></div></header>
        <nav className="testimony-breadcrumb" aria-label="Branch path">{branch.ancestors.map((n, index) => <span key={n.id}>{index > 0 && <ArrowRight size={11} />}<button type="button" onClick={() => openExplore(n.id)}>{n.name}</button></span>)}</nav>
        {display === "tree" ? <TestimonyTree key={branch.rootId + ":" + page} positions={positions} width={Math.max(...positions.map((p) => p.left)) + 224} height={Math.max(...positions.map((p) => p.top)) + 132} selectedId={selectedId} onSelect={setSelected} /> : <ol className="testimony-list">{branch.nodes.map((n) => <li key={n.id}><button type="button" aria-pressed={selectedId === n.id} onClick={() => setSelected(n.id)}><span><strong>{n.name}</strong>{n.publishedAt && <small><time dateTime={n.publishedAt}>Shared {formatTestimonyDate(n.publishedAt)}</time></small>}</span><span>{n.title}</span><ArrowRight size={16} /></button></li>)}</ol>}
        <footer><span>Drag to move · Pinch or wheel to zoom<br />Open a person's branch to follow more connections.</span>{(page > 0 || branch.hasMore) && <div className="testimony-pagination"><button disabled={page === 0} onClick={() => void loadBranch(branch.rootId, page - 1)}>Previous</button><span>Page {page + 1}</span><button disabled={!branch.hasMore} onClick={() => void loadBranch(branch.rootId, page + 1)}>Next</button></div>}</footer>
      </section>
      <aside className="testimony-story" aria-label="Selected testimony">
        <p className="testimony-kicker">A story in this branch</p>
        {details && <><div className="testimony-author"><span className="testimony-avatar">{details.available === false ? "·" : details.name.slice(0, 1)}</span><div><h2>{details.name}</h2><p>{details.parentId ? "Invited by " + (path.at(-2)?.name ?? "a contributor") : "This branch begins here"}</p></div></div>
          {details.available !== false && <dl className="testimony-details" aria-label="Story details"><div><dt>Story theme</dt><dd>{details.theme || "Not chosen"}</dd></div><div><dt>Shared on</dt><dd><time dateTime={details.publishedAt}>{formatTestimonyDate(details.publishedAt)}</time></dd></div>{details.happenedWhen && <div className="testimony-period"><dt>When it happened</dt><dd>{details.happenedWhen}</dd></div>}</dl>}
          <h3>{details.title}</h3><p className="testimony-story-body">{details.available === false ? "The stories connected to this person can still be explored." : storyError || (story ? story.body : "Loading the story…")}</p>
          <div className="testimony-story-path"><span>The invitation path</span><p>{path.map((n) => n.name).join(" → ")}</p></div>
          <button type="button" className="testimony-primary" onClick={() => openExplore(details.id)}>Explore this branch <ArrowRight size={15} /></button>
          {details.available !== false && <ReportStory personId={details.id} />}
        </>}
      </aside>
    </div>)}
    {mode === "write" && (inviteError ? <section className="testimony-empty" role="alert"><h2>Invitation unavailable</h2><p>{inviteError}</p>{canRecover && <><p>If your connection was interrupted after submitting, you can recover your saved submission.</p><button className="testimony-primary" onClick={async () => { try { await publish(JSON.parse(pendingSubmission!.fields) as TestimonySubmission); setInviteError(""); } catch (cause) { setInviteError(message(cause)); } }}>Recover my submission</button></>}</section> : !welcome ? <p className="testimony-empty" role="status">Opening your invitation…</p> : me ? <section className="testimony-empty"><h2>You're signed in as {me.person.name}.</h2><p>You already have a testimony. If this invitation is for another person, sign out so they can tell their story.</p><button className="testimony-secondary" onClick={() => void signOut()}>Sign out and continue</button></section> : <TestimonyForm key={invitationToken} welcome={welcome} draftKey={invitationToken} onBack={() => openExplore()} onSubmit={publish} />)}
    {mode === "invite" && <InvitationPanel name={me?.person.name} canInvite={me?.state === "public"} onAccess={() => setMode(me ? "manage" : "access")} />}
    {mode === "access" && <AccessForm onSignIn={async (token) => { await testimonyApi("session", "POST", { token }); await refreshMe(); setError(""); navigate("/testimonies", { replace: true }); setMode("manage"); }} />}
    {mode === "manage" && me && <section className="testimony-management">
      <header><div><p className="testimony-kicker">Your testimony</p><h2>{me.person.name}</h2><p>{me.state === "public" ? "Your story is public." : "Your story is not currently public."}</p></div><button className="testimony-secondary" onClick={async () => { await signOut(); setMode("explore"); }}>Sign out</button></header>
      <div className="testimony-account-actions"><button className="testimony-secondary" onClick={() => openExplore(me.person.id)}>View my branch</button><button className="testimony-secondary" onClick={async () => { try { const result = await testimonyApi<{ url: string }>("access-link", "POST", {}); setAccessUrl(result.url); saveTestimonyValue("testimony-private-url", result.url); setNotice("Your new private access link replaces the previous one."); } catch (cause) { setError(message(cause)); } }}>Replace private access link</button>{siteUrl && <a className="testimony-secondary" href={siteUrl + "/testimonies?branch=" + me.person.id}>Public story link <ArrowRight size={14} /></a>}</div>
      {me.blocked ? <p className="testimony-empty">This story has been hidden by the site owner and cannot be republished.</p> : <TestimonyForm key={me.person.id + ":" + me.version} existing={me} onBack={() => openExplore(me.person.id)} onSubmit={async (value) => { await testimonyApi("my-story", "POST", { ...value, version: me.version }); await refreshMe(); await loadBranch(me.person.id); setNotice("Your testimony has been published with your changes."); }} />}
      {me.state === "public" && <div className="testimony-withdraw"><p>Withdraw your story to remove its name and text from public view. Existing branches stay connected anonymously.</p><button className="testimony-secondary" onClick={async () => { try { await testimonyApi("withdraw", "POST", {}); await refreshMe(); await loadBranch(me.person.id); setNotice("Your story is no longer public. Unused invitations have been revoked."); } catch (cause) { setError(message(cause)); } }}>Withdraw my testimony</button></div>}
      <InvitationHistory key={me.state} />
      {me.owner && <ReportsInbox />}
    </section>}
    <section className="testimony-steps" aria-label="How a branch grows">{[["01", "Invite someone", "A personal link and QR code carry your connection."], ["02", "They tell their story", "Their words, their public name, their choice to share."], ["03", "The branch grows", "Their story joins yours; they can invite the next person."]].map(([n, title, description]) => <div key={n}><span>{n}</span><h3>{title}</h3><p>{description}</p></div>)}</section>
  </div>;
}

function PrivateAccessLink({ url, onSaved }: { url: string; onSaved: () => void }) {
  return <section className="testimony-private-link"><h2>Keep your private access link.</h2><p>This lets you return to edit your testimony and invite others, including on another device. Anyone with this link can manage your story. Keep it private.</p><CopyableLink url={url} label="Private access link" /><button type="button" className="testimony-secondary" onClick={onSaved}>I've saved my link <Check size={15} /></button></section>;
}
function CopyableLink({ url, label }: { url: string; label: string }) {
  const [status, setStatus] = useState("");
  return <div className="testimony-copy-link"><label>{label}<input value={url} readOnly onFocus={(event) => event.currentTarget.select()} /></label><button type="button" className="testimony-secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); setStatus("Link copied."); } catch { setStatus("Select and copy the link above."); } }}><Copy size={15} />Copy link</button><span className="testimony-small" role="status">{status}</span></div>;
}
function InvitationPanel({ name, canInvite, onAccess }: { name?: string; canInvite: boolean; onAccess: () => void }) {
  const [invite, setInvite] = useState<TestimonyInvite | null>(null), [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  useEffect(() => { let active = true; if (invite) void QRCode.toDataURL(invite.url, { width: 256, margin: 4, errorCorrectionLevel: "M", color: { dark: "#1f1b16", light: "#ffffff" } }).then((value) => { if (active) setQr(value); }).catch(() => { if (active) setError("The QR code could not be drawn. You can still use the invitation link."); }); return () => { active = false; }; }, [invite]);
  async function create() { setBusy(true); setError(""); try { setInvite(await testimonyApi<TestimonyInvite>("invitations", "POST", {})); } catch (cause) { setError(message(cause)); } finally { setBusy(false); } }
  if (preview) return <section className="testimony-guest-preview" aria-label="Guest experience preview">
    <p className="testimony-small">This is what your guest will see.</p>
    <TestimonyForm preview welcome={name ? { name, personId: null, root: false } : undefined} onBack={() => setPreview(false)} />
  </section>;
  return <section className="testimony-invite-panel"><div>
    <p className="testimony-kicker">An invitation from {name ?? "you"}</p>
    <h2>Your story could<br /><em>make room for another.</em></h2>
    <p>“I'd love to hear what God has done in your life. Would you share your testimony and become part of this growing collection of stories?”</p>
    <div className="testimony-invite-connection"><span className="testimony-avatar">{name?.slice(0, 1) ?? "Y"}</span><strong>{name ?? "You"}</strong><ArrowRight size={21} /><span className="testimony-avatar testimony-avatar-empty">?</span><span>Your guest</span></div>
    <p className="testimony-small">When your guest publishes their testimony, it joins your branch. Each invitation is for one person.</p>
    <div className="testimony-invite-actions">
      {canInvite ? <button type="button" className="testimony-primary" onClick={() => void create()} disabled={busy}>{busy ? "Creating invitation…" : invite ? "Create another invitation" : "Create invitation"}<Plus size={16} /></button> : <button type="button" className="testimony-primary" onClick={onAccess}>{name ? "Open my testimony" : "Open private access"}<ArrowRight size={16} /></button>}
      <button type="button" className="testimony-secondary" onClick={() => setPreview(true)}>See the guest experience <ArrowRight size={15} /></button>
    </div>
    {!canInvite && <p className="testimony-small">{name ? "Publish your story to start inviting others." : "Already shared your story? Open your private access link to invite someone into your own branch."}</p>}
    {error && <p role="alert" className="testimony-form-error">{error}</p>}
  </div><div className="testimony-share-card"><p className="testimony-kicker">One invitation · Two ways in</p>{invite ? <>
    {qr && <img src={qr} width={256} height={256} alt="QR code for your testimony invitation" />}
    <CopyableLink url={invite.url} label="Invitation link" />
    <div><a className="testimony-secondary" href={"sms:?body=" + encodeURIComponent("I'd love to hear your testimony. " + invite.url)}><Share2 size={15} />Text invitation</a></div>
    <p className="testimony-small">Available until {formatTestimonyDate(invite.expiresAt)}, or until someone uses it. You can revoke an unused invitation in My testimony.</p>
  </> : <p className="testimony-small testimony-share-placeholder">Your invitation link and QR code will appear here.</p>}</div></section>;
}
function TestimonyForm({ welcome, existing, draftKey, preview = false, onBack, onSubmit }: { welcome?: InvitationWelcome; existing?: TestimonyAccount; draftKey?: string; preview?: boolean; onBack: () => void; onSubmit?: (value: TestimonySubmission) => Promise<void> }) {
  const [value, setValue] = useState<TestimonySubmission>(() => {
    const draft = savedTestimonyValue<{ key: string; value: TestimonySubmission }>("testimony-draft");
    if (draftKey && draft?.key === draftKey) return draft.value;
    return { name: existing?.person.name ?? "", title: existing?.person.title ?? "", body: existing?.person.body ?? "", theme: existing?.person.theme ?? "", happenedWhen: existing?.person.happenedWhen ?? "", publicConsent: true };
  });
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (draftKey) saveTestimonyValue("testimony-draft", { key: draftKey, value }); }, [value, draftKey]);
  const change = (key: keyof TestimonySubmission, next: string | boolean) => setValue((current) => ({ ...current, [key]: next }));
  async function submit(event: FormEvent) { event.preventDefault(); if (preview || !onSubmit) return; const submission = { ...value, publicConsent: true }; const issue = validateTestimony(submission); if (issue) { setError(issue); return; } setError(""); setBusy(true); try { await onSubmit(submission); } catch (cause) { setError(message(cause)); } finally { setBusy(false); } }
  return <section className="testimony-write"><div className="testimony-write-intro"><button type="button" className="testimony-back" onClick={onBack}><ArrowLeft size={14} />{preview ? "Back to your invitation" : "Back to the branches"}</button><p className="testimony-kicker">{existing ? "Your story, in your words" : welcome?.root ? "Begin the first branch" : welcome?.name ? welcome.name + " invited you" : "You’re invited"}</p><h2>Tell it in<br /><em>your own words.</em></h2><p>A testimony does not need a dramatic ending. Share where you began, how you encountered faith in Christ, and what is changing in your life.</p><ul><li>What was life like before?</li><li>What brought you toward Christ?</li><li>What has changed—and what are you still learning?</li></ul>{welcome && !welcome.root && <p className="testimony-small">Your testimony will join {welcome.name}'s branch.</p>}</div><form onSubmit={submit} className="testimony-form">
    <label>Public name<input value={value.name} onChange={(e) => change("name", e.target.value)} maxLength={60} autoComplete="nickname" placeholder="First name or chosen name" required /></label>
    <label>A title for your story<input value={value.title} onChange={(e) => change("title", e.target.value)} maxLength={120} placeholder="What would you like someone to remember?" required /></label>
    <label>Story theme (optional)<select value={value.theme} onChange={(e) => change("theme", e.target.value)} aria-describedby="testimony-theme-help"><option value="">Leave it open</option>{TESTIMONY_THEMES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <p id="testimony-theme-help" className="testimony-field-help">The short label beneath your name in the tree. Choose what fits your story.</p>
    <label>When it happened (optional)<input value={value.happenedWhen} onChange={(e) => change("happenedWhen", e.target.value)} maxLength={80} placeholder="e.g. Spring 2022, 2019–2024, or an ongoing journey" aria-describedby="testimony-date-help" /></label>
    <p id="testimony-date-help" className="testimony-field-help">A date, year or season is enough. The separate “Shared on” date is recorded automatically.</p>
    <label>Your testimony<textarea value={value.body} onChange={(e) => change("body", e.target.value)} maxLength={12000} rows={9} placeholder="Tell your story here…" required /></label><span className="testimony-small">{value.body.length.toLocaleString()} / 12,000 characters</span>
    <p className="testimony-small">Publishing makes your story, its details and your public name visible to visitors.</p>
    {error && <p role="alert" className="testimony-form-error">{error}</p>}<button type="submit" className="testimony-primary" disabled={busy || preview}>{busy ? "Publishing…" : existing?.state === "public" ? "Publish changes" : "Publish testimony"}<ArrowRight size={16} /></button>
  </form></section>;
}
function AccessForm({ onSignIn }: { onSignIn: (token: string) => Promise<void> }) {
  const [link, setLink] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <section className="testimony-access"><h2>Return to your story.</h2><p>Paste the private access link you saved when you shared your testimony.</p><form onSubmit={async (event) => { event.preventDefault(); setError(""); setBusy(true); try { const token = new URLSearchParams(new URL(link).hash.slice(1)).get("key"); if (!token) throw new Error("Use your complete private access link."); await onSignIn(token); } catch (cause) { setError(message(cause)); } finally { setBusy(false); } }}><label>Private access link<input type="url" value={link} onChange={(event) => setLink(event.target.value)} autoComplete="off" required /></label><button className="testimony-primary" disabled={busy}>{busy ? "Opening…" : "Open my testimony"}<ArrowRight size={16} /></button>{error && <p role="alert" className="testimony-form-error">{error}</p>}</form><p className="testimony-small">If you are still signed in on another device, open My testimony there to get a replacement link.</p></section>;
}
function InvitationHistory() {
  const [items, setItems] = useState<InvitationStatus[]>([]), [error, setError] = useState("");
  const load = useCallback(async () => { try { setItems(await testimonyApi<InvitationStatus[]>("invitations")); } catch (cause) { setError(message(cause)); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <section className="testimony-invitation-history"><h2>Your invitations</h2>{error && <p role="alert">{error}</p>}{!items.length ? <p className="testimony-small">Your invitations will appear here when you create them.</p> : <ul>{items.map((item) => <li key={item.id}><span>Created {formatTestimonyDate(item.createdAt)}<small>{item.used ? "Accepted" : item.revoked ? "Revoked" : new Date(item.expiresAt).getTime() < Date.now() ? "Expired" : "Available until " + formatTestimonyDate(item.expiresAt)}</small></span>{!item.used && !item.revoked && <button className="testimony-secondary" onClick={async () => { try { await testimonyApi("invitations/" + item.id, "DELETE"); await load(); } catch (cause) { setError(message(cause)); } }}>Revoke invitation</button>}</li>)}</ul>}</section>;
}
function ReportStory({ personId }: { personId: string }) {
  const [reason, setReason] = useState(""), [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  return <details className="testimony-report"><summary>Report a concern</summary><form onSubmit={async (event) => { event.preventDefault(); setBusy(true); try { await testimonyApi("reports", "POST", { personId, reason }); setReason(""); setStatus("Thank you. Your concern has been sent to the site owner."); } catch (cause) { setStatus(message(cause)); } finally { setBusy(false); } }}><label>Your concern<textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} minLength={3} required /></label><button className="testimony-secondary" disabled={busy}>Send report</button><p className="testimony-small" role="status">{status}</p></form></details>;
}
function ReportsInbox() {
  const [reports, setReports] = useState<TestimonyReport[]>([]), [error, setError] = useState("");
  const load = useCallback(async () => { try { setReports(await testimonyApi<TestimonyReport[]>("reports")); } catch (cause) { setError(message(cause)); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function resolve(id: string, hide: boolean) { try { await testimonyApi("reports/" + id, "POST", { hide }); await load(); } catch (cause) { setError(message(cause)); } }
  return <section className="testimony-invitation-history"><h2>Reported concerns</h2>{error && <p role="alert">{error}</p>}{!reports.length && <p className="testimony-small">No open reports.</p>}{reports.map((report) => <article key={report.id}><h3>{report.name}: {report.title}</h3><p>{report.reason}</p><div className="testimony-account-actions"><button className="testimony-secondary" onClick={() => void resolve(report.id, true)}>Hide story and resolve</button><button className="testimony-secondary" onClick={() => void resolve(report.id, false)}>Resolve without hiding</button></div></article>)}</section>;
}
