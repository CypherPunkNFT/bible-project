// MOCK-UP: "What leaves your device?" on the Privacy page. Choose a moment (reading, a video, the audio Bible, a message,
// a testimony, the app) and the lines it uses light up, with what travels along them told underneath. Every sentence
// restates the policy in PrivacyPage.tsx; change both together. Styles: legal-mockup.css (.fm-*).
import { BookOpen, CirclePlay, Cloud, Feather, Headphones, Mail, MapPin, MonitorSmartphone, Send, Smartphone, type LucideIcon } from "lucide-react";
import { useState } from "react";

type Node = "cloudflare" | "youtube" | "archive" | "zoho" | "map";
type Line = "dev-cf" | "dev-yt" | "dev-ar" | "cf-zoho" | "cf-map";

interface Moment { id: string; label: string; icon: LucideIcon; lines: Line[]; nodes: Node[]; text: string }

const MOMENTS: Moment[] = [
  { id: "read", label: "Reading a page", icon: BookOpen, lines: ["dev-cf"], nodes: ["cloudflare"],
    text: "Cloudflare, our host, delivers the page. It handles your internet address and basic details of the request, as any web host does. Your settings and progress are saved in your browser, not sent to us." },
  { id: "video", label: "Watching a video", icon: CirclePlay, lines: ["dev-cf", "dev-yt"], nodes: ["cloudflare", "youtube"],
    text: "Videos play from YouTube in its privacy-enhanced mode. When you open a page with a video, YouTube (Google) receives your internet address, and Google's privacy policy applies." },
  { id: "listen", label: "Listening", icon: Headphones, lines: ["dev-cf", "dev-ar"], nodes: ["cloudflare", "archive"],
    text: "The audio Bible, read by LibriVox volunteers, streams from the Internet Archive when you press play; copies you download come from our own files on Cloudflare. Where you stopped is saved in your browser." },
  { id: "message", label: "Sending a message", icon: Send, lines: ["dev-cf", "cf-zoho"], nodes: ["cloudflare", "zoho"],
    text: "Your message, with your name and email if you give them, goes to our mailbox at Zoho. A one-way code counts messages per hour to stop abuse, and is deleted when it expires." },
  { id: "testimony", label: "Sharing a testimony", icon: Feather, lines: ["dev-cf", "cf-map"], nodes: ["cloudflare", "map"],
    text: "The name, title and story you choose appear publicly at once, placed on the map by your approximate town, rounded to about 10 km. We keep no internet address, email or device details with it." },
  { id: "app", label: "Using the app", icon: Smartphone, lines: ["dev-cf"], nodes: ["cloudflare"],
    text: "The Bible texts are built into the app and need no internet. Study pages download from bibleguide.io the first time you open them, and the app checks for updates when it starts." },
];

const KEPT = ["Theme and reader settings", "Reading progress", "Where you stopped listening", "Bible question results", "Apologetics notebook", "App bookmarks and notes"];

const NODES: { id: Node; x: number; y: number; title: string; line: string; icon: LucideIcon }[] = [
  { id: "cloudflare", x: 318, y: 132, title: "Cloudflare", line: "our host, every page", icon: Cloud },
  { id: "youtube", x: 566, y: 18, title: "YouTube", line: "pages with a video", icon: CirclePlay },
  { id: "archive", x: 566, y: 96, title: "archive.org", line: "audio, on pressing play", icon: Headphones },
  { id: "zoho", x: 566, y: 174, title: "Zoho Mail", line: "our mailbox", icon: Mail },
  { id: "map", x: 566, y: 252, title: "Testimony map", line: "public, what you share", icon: MapPin },
];

const LINES: Record<Line, string> = {
  "dev-cf": "M246 162H318",
  "dev-yt": "M246 74C400 74 420 47 566 47",
  "dev-ar": "M246 110C400 110 420 125 566 125",
  "cf-zoho": "M490 162C530 162 530 203 566 203",
  "cf-map": "M490 162C530 162 530 281 566 281",
};

export function FlowMap() {
  const [chosen, setChosen] = useState(MOMENTS[0]);
  return (
    <div className="fm">
      <div className="fm-moments" role="group" aria-label="Choose a moment">
        {MOMENTS.map((m) => <button key={m.id} type="button" aria-pressed={m.id === chosen.id} onClick={() => setChosen(m)}><m.icon aria-hidden />{m.label}</button>)}
      </div>
      <div className="fm-scroll">
        <svg className="fm-map" viewBox="0 0 740 316" role="img" aria-label={`${chosen.label}: ${chosen.text}`}>
          {(Object.keys(LINES) as Line[]).map((id) => <path key={id} className={`fm-line${chosen.lines.includes(id) ? " is-on" : ""}`} d={LINES[id]} />)}
          <g className="fm-device">
            <rect className="fm-box" x="12" y="20" width="234" height="276" rx="18" />
            <MonitorSmartphone x="32" y="38" width="22" height="22" aria-hidden />
            <text className="fm-title" x="64" y="55">Your browser or phone</text>
            <text className="fm-small" x="32" y="84">Kept here, never sent to us</text>
            {KEPT.map((item, i) => <g key={item}><circle className="fm-dot" cx="38" cy={112 + i * 30} r="3" /><text className="fm-item" x="52" y={116 + i * 30}>{item}</text></g>)}
          </g>
          {NODES.map((n) => <g key={n.id} className={`fm-node${chosen.nodes.includes(n.id) ? " is-on" : ""}`}>
            <rect className="fm-box" x={n.x} y={n.y} width="172" height="58" rx="14" />
            <n.icon x={n.x + 14} y={n.y + 18} width="22" height="22" aria-hidden />
            <text className="fm-title" x={n.x + 46} y={n.y + 26}>{n.title}</text>
            <text className="fm-small" x={n.x + 46} y={n.y + 44}>{n.line}</text>
          </g>)}
        </svg>
      </div>
      <ol className="fm-stack" aria-hidden>
        {NODES.map((n) => <li key={n.id} className={chosen.nodes.includes(n.id) ? "is-on" : undefined}><n.icon aria-hidden /><b>{n.title}</b><span>{n.line}</span></li>)}
      </ol>
      <p className="fm-says" aria-live="polite"><chosen.icon aria-hidden /><span><b>{chosen.label}.</b> {chosen.text}</span></p>
    </div>
  );
}
