import { ArrowLeft, ArrowRight, Check, Copy, GitBranch, List, Mail, Plus, RotateCcw, Share2 } from "lucide-react";
import { hierarchy, tree } from "d3-hierarchy";
import QRCode from "qrcode";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { TESTIMONY_DEMO } from "@/data/testimony-demo";
import { immediatePublication, testimonyBranch, testimonyPath, validateTestimony, type TestimonyNode } from "@/lib/testimonies";
import "./testimonies-design.css";

const TONES = ["poetry", "epistles", "gospels", "history"];

export default function TestimoniesDesignPage() {
  const requested = new URLSearchParams(window.location.search).get("from");
  const recognizedInvite = TESTIMONY_DEMO.find((n) => n.id === requested);
  const initial = recognizedInvite?.id ?? "daniel";
  const [nodes, setNodes] = useState<TestimonyNode[]>(TESTIMONY_DEMO);
  const [selectedId, setSelected] = useState(initial);
  const [rootId, setRoot] = useState("daniel");
  const [mode, setMode] = useState<"explore" | "invite" | "write">(recognizedInvite ? "write" : "explore");
  const [display, setDisplay] = useState("tree");
  const [notice, setNotice] = useState(requested && !recognizedInvite ? "That sample invitation is unavailable. Choose a sample person to try a new invitation." : "");
  const selected = nodes.find((n) => n.id === selectedId)!;
  const branch = useMemo(() => testimonyBranch(nodes, rootId), [nodes, rootId]);
  const path = testimonyPath(nodes, selectedId);
  const rootPath = testimonyPath(nodes, rootId);
  const childCount = nodes.filter((n) => n.parentId === selectedId).length;
  const positions = useMemo(() => {
    const root = hierarchy(branch[0], (node) => branch.filter((n) => n.parentId === node.id));
    const layout = tree<TestimonyNode>().nodeSize([118, 240])(root);
    const points = layout.descendants();
    const min = Math.min(...points.map((p) => p.x));
    return points.map((p) => ({ node: p.data, left: p.y + 24, top: p.x - min + 36, depth: p.depth }));
  }, [branch]);
  const width = Math.max(...positions.map((p) => p.left)) + 224;
  const height = Math.max(...positions.map((p) => p.top)) + 132;
  async function submit(input: { name: string; title: string; body: string }) {
    const id = crypto.randomUUID();
    const decision = await immediatePublication.evaluate({ ...input, authorId: id, revisionId: crypto.randomUUID(), contentHash: "preview-only" });
    if (decision.action !== "publish") { setNotice("This story needs another look before it can appear."); return; }
    setNodes((current) => [...current, { ...input, id, parentId: selectedId, theme: "A new story" }]);
    setSelected(id); setRoot("daniel"); setMode("explore");
    setNotice("Your sample story is now visible in this preview, connected to " + selected.name + ". Nothing was published online.");
  }
  return <div className="testimony-design mx-auto max-w-7xl px-4 sm:px-6">
    <div className="testimony-preview-banner"><span>Design preview</span> Fictional sample stories. Changes stay in this tab; no live accounts, invitations or database connection.</div>
    <header className="testimony-intro"><div><p className="testimony-kicker"><GitBranch size={16} /> A living collection of testimonies</p><h1>One story can<br /><em>open another.</em></h1><p>Listen to a life. Follow a connection. Invite someone to add their story of faith.</p></div><div className="testimony-intro-note"><span>Every branch begins<br />with a conversation.</span><p>The lines show who invited whom.<br />Each person speaks in their own words.</p></div></header>
    <nav className="testimony-navigation" aria-label="Testimony design"><button type="button" aria-current={mode === "explore" ? "page" : undefined} onClick={() => setMode("explore")}><GitBranch size={16} />Explore the branches</button><button type="button" aria-current={mode !== "explore" ? "page" : undefined} onClick={() => setMode("invite")}><Plus size={16} />Try an invitation</button><button type="button" onClick={() => { setNodes(TESTIMONY_DEMO); setRoot("daniel"); setSelected("daniel"); setMode("explore"); setNotice(""); }}><RotateCcw size={14} />Reset preview</button></nav>
    {notice && <p className="testimony-notice" role="status"><Check size={16} />{notice}</p>}
    {mode === "explore" ? <div className="testimony-workspace"><section className="testimony-map" aria-label="Invitation branches">
      <header><div><p className="testimony-kicker">Follow the invitations</p><h2>{branch[0].name}'s branch <span>{branch.length} stories</span></h2></div><div className="testimony-view-toggle" role="group" aria-label="Branch display"><button type="button" aria-pressed={display === "tree"} onClick={() => setDisplay("tree")} aria-label="Tree view"><GitBranch size={17} /></button><button type="button" aria-pressed={display === "list"} onClick={() => setDisplay("list")} aria-label="List view"><List size={17} /></button></div></header>
      <nav className="testimony-breadcrumb" aria-label="Branch path">{rootPath.map((n, i) => <span key={n.id}>{i > 0 && <ArrowRight size={11} />}<button type="button" onClick={() => setRoot(n.id)}>{n.name}</button></span>)}</nav>
      {display === "tree" ? <div className="testimony-map-scroll" tabIndex={0} role="region" aria-label="Scrollable testimony tree"><div className="testimony-map-surface" style={{ width, height }}>
        <svg width={width} height={height} aria-hidden="true">{positions.map((p) => { const parent = positions.find((a) => a.node.id === p.node.parentId); if (!parent) return null; const fromX = parent.left + 194, fromY = parent.top + 43, toX = p.left, toY = p.top + 43; return <path key={p.node.id} d={"M" + fromX + "," + fromY + " C" + (fromX + 24) + "," + fromY + " " + (toX - 24) + "," + toY + " " + toX + "," + toY} />; })}</svg>
        {positions.map((p) => <button key={p.node.id} type="button" className="testimony-tree-node" aria-pressed={selectedId === p.node.id} onClick={() => setSelected(p.node.id)} style={{ left: p.left, top: p.top, "--node-tone": "var(--" + TONES[p.depth % TONES.length] + ")" } as CSSProperties}><span className="testimony-avatar">{p.node.name.slice(0, 1)}</span><span><strong>{p.node.name}</strong><small>{p.node.theme}</small></span><ArrowRight size={13} /></button>)}
      </div></div> : <ol className="testimony-list">{branch.map((n) => <li key={n.id}><button type="button" aria-pressed={selectedId === n.id} onClick={() => setSelected(n.id)}><span><strong>{n.name}</strong><small>{n.parentId ? "Invited by " + nodes.find((a) => a.id === n.parentId)?.name : "This branch begins here"}</small></span><span>{n.title}</span><ArrowRight size={16} /></button></li>)}</ol>}
      <footer>Each line is an accepted invitation. <span>Scroll to explore · Select a person to read</span></footer>
    </section><aside className="testimony-story" aria-label="Selected testimony"><p className="testimony-kicker">A story in this branch</p><div className="testimony-author"><span className="testimony-avatar">{selected.name.slice(0, 1)}</span><div><h2>{selected.name}</h2><p>{selected.parentId ? "Invited by " + nodes.find((n) => n.id === selected.parentId)?.name : "This branch begins here"}</p></div></div><h3>{selected.title}</h3><p className="testimony-story-body">{selected.body}</p><div className="testimony-story-path"><span>The invitation path</span><p>{path.map((n) => n.name).join(" → ")}</p></div><button type="button" className="testimony-primary" onClick={() => { setRoot(selectedId); setNotice(""); }}>Explore this branch <span>{testimonyBranch(nodes, selectedId).length} stories</span></button><button type="button" className="testimony-secondary" onClick={() => { setMode("invite"); setNotice(""); }}>Preview an invite from {selected.name} <Plus size={15} /></button><p className="testimony-small">{childCount ? selected.name + " has invited " + childCount + " " + (childCount === 1 ? "person" : "people") + " in this example." : "The next conversation can begin a new branch."}</p></aside></div>
      : mode === "invite" ? <InvitePreview person={selected} onOpen={() => setMode("write")} />
      : <WritePreview key={selectedId} person={selected} onBack={() => setMode("invite")} onSubmit={submit} />}
    <section className="testimony-steps" aria-label="How a branch grows">{[["01", "Invite someone", "A personal link and QR code carry your connection."], ["02", "They tell their story", "Their words, their public name, their choice to share."], ["03", "The branch grows", "Submission makes the story visible; they can invite the next person."]].map(([n, title, text]) => <div key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></div>)}</section>
  </div>;
}

function InvitePreview({ person, onOpen }: { person: TestimonyNode; onOpen: () => void }) {
  const url = window.location.origin + "/testimonies/design?from=" + encodeURIComponent(person.id);
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  const isSeed = TESTIMONY_DEMO.some((n) => n.id === person.id);
  useEffect(() => { let current = true; QRCode.toDataURL(url, { width: 256, margin: 4, errorCorrectionLevel: "M", color: { dark: "#1f1b16", light: "#ffffff" } }).then((value) => { if (current) setQr(value); }).catch(() => { if (current) setMessage("The QR preview could not be drawn. Use the link instead."); }); return () => { current = false; }; }, [url]);
  async function copy() { try { await navigator.clipboard.writeText(url); setMessage("Preview link copied."); } catch { setMessage("Select and copy the preview link below."); } }
  return <section className="testimony-invite-panel"><div><p className="testimony-kicker">An invitation from {person.name}</p><h2>Your story could<br /><em>make room for another.</em></h2><p>“I'd love to hear what God has done in your life. Would you share your testimony and become part of this growing collection of stories?”</p><div className="testimony-invite-connection"><span className="testimony-avatar">{person.name.slice(0, 1)}</span><strong>{person.name}</strong><ArrowRight size={21} /><span className="testimony-avatar testimony-avatar-empty">?</span><span>Your guest</span></div><p className="testimony-small">The guest will see who invited them and confirm the connection before sharing.</p><button type="button" className="testimony-primary" onClick={onOpen}>Try the guest's experience <ArrowRight size={16} /></button></div><div className="testimony-share-card"><p className="testimony-kicker">One invitation · Two ways in</p>{qr && <img src={qr} width={256} height={256} alt="QR code for this local design preview" />}<label>Preview link<input value={url} readOnly onFocus={(e) => e.currentTarget.select()} /></label><div><button type="button" className="testimony-secondary" onClick={copy}><Copy size={15} />Copy link</button>{isSeed && <a className="testimony-secondary" href={"sms:?body=" + encodeURIComponent("Testimony design preview (not a live invitation): " + url)}><Share2 size={15} />Text link</a>}</div><p className="testimony-small">This QR opens the local design preview. It needs reachable hosting to work on another device. Live invitations will use private, single-use codes stored in the database.{!isSeed && " This new sample person exists only in this tab; use the guest preview button here."}</p><p className="testimony-small" role="status">{message}</p></div></section>;
}

function WritePreview({ person, onBack, onSubmit }: { person: TestimonyNode; onBack: () => void; onSubmit: (input: { name: string; title: string; body: string }) => Promise<void> }) {
  const [name, setName] = useState(""); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [publicConsent, setPublic] = useState(false); const [connectionConsent, setConnection] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); const issue = validateTestimony({ name, title, body, publicConsent, connectionConsent }); if (issue) { setError(issue); return; } setError(""); setBusy(true); try { await onSubmit({ name: name.trim(), title: title.trim(), body: body.trim() }); } finally { setBusy(false); } }
  return <section className="testimony-write"><div className="testimony-write-intro"><button type="button" className="testimony-back" onClick={onBack}><ArrowLeft size={14} />Invitation</button><p className="testimony-kicker">{person.name} invited you</p><h2>Tell it in<br /><em>your own words.</em></h2><p>A testimony does not need a dramatic ending. Share where you began, how you encountered faith in Christ, and what is changing in your life.</p><ul><li>What was life like before?</li><li>What brought you toward Christ?</li><li>What has changed—and what are you still learning?</li></ul><p className="testimony-small"><Mail size={15} />The live system will verify your email privately so you can return to edit or withdraw your story.</p></div><form onSubmit={submit} className="testimony-form"><label>Public name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" placeholder="First name or chosen name" required /></label><label>A title for your story<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What would you like someone to remember?" required /></label><label>Your testimony<textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={12000} rows={9} placeholder="Use sample text while exploring this design…" required /></label><span className="testimony-small">{body.length.toLocaleString()} / 12,000 characters · Written stories first</span><label className="testimony-consent"><input type="checkbox" checked={publicConsent} onChange={(e) => setPublic(e.target.checked)} />I choose to make this story and public name visible to visitors.</label><label className="testimony-consent"><input type="checkbox" checked={connectionConsent} onChange={(e) => setConnection(e.target.checked)} />I confirm that {person.name} invited me and agree to show that connection.</label>{error && <p role="alert" className="testimony-form-error">{error}</p>}<button type="submit" className="testimony-primary" disabled={busy}>{busy ? "Adding…" : "Add sample story to the branch"}<ArrowRight size={16} /></button><p className="testimony-small">Live policy: publish immediately on submission. This preview changes only this tab. No AI review runs.</p></form></section>;
}
