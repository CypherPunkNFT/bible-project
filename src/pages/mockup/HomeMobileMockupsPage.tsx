// MOCK-UP: the homepage's opening as a phone shows it, five ways side by side (owner, 2026-10-31: "lets get mobile_mockups to
// see what we can do here"). Each frame is /home_mockup9 at phone size with one layout letter; the first frame is the
// homepage as it is now. Opened at /home_mobile_mockups on this computer's preview only.
import "./home-openings/home-mockup9.css";

const PHONES = [
  { src: "/", name: "Now", line: "The homepage as it is today." },
  { src: "/home_mockup9?m=a", name: "A · Calm", line: "The word wall far fainter; the city larger." },
  { src: "/home_mockup9?m=b", name: "B · Inside the city", line: "The city fills the screen behind the words; no wall." },
  { src: "/home_mockup9?m=c", name: "C · Doorways under the button", line: "The six squares, title only, three to a row." },
  { src: "/home_mockup9?m=d", name: "D · One screen", line: "Smaller city; the six doorways as a list of names." },
  { src: "/home_mockup9?m=e", name: "E · Words first", line: "Title and button on top, the city under them, then the squares." },
];

export default function HomeMobileMockupsPage() {
  return <main className="hm9-phones">
    <h1>Home on a phone</h1>
    <p>Each frame is a real phone-sized window (390 × 844) onto the page; scroll inside it.</p>
    <div>{PHONES.map((phone) => <figure key={phone.src}>
      <iframe src={phone.src} title={phone.name} width="390" height="844" loading="lazy" />
      <figcaption><strong>{phone.name}</strong>{phone.line}</figcaption>
    </figure>)}</div>
  </main>;
}
