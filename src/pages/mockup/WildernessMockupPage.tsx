// MOCK-UP (/wilderness_mockup, local preview only): nine versions of the homepage quiz's card for question 4 ("How long
// did Israel wander in the wilderness?"), each with its own drawing, so the owner can pick one. The card is the homepage
// tile (Tiles in QuizVersions.tsx); the drawings use the same line style and motions (home-quiz.css). None names a number.
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "@/components/home/home-hub.css";
import "../home-quiz.css";
import "../home/quiz-versions.css";
import { QUESTIONS } from "../quiz-data";
import { QuizScene } from "../QuizScenes";

const strokes = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Sketch = ({ children }: { children: ReactNode }) => <svg className="qs-scene" viewBox="0 0 320 240" {...strokes} aria-hidden="true">{children}</svg>;
const Stars = ({ at }: { at: [number, number][] }) => <g className="qs-twinkle qs-faint">{at.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.3" />)}</g>;

const DESIGNS: { name: string; note: string; art: ReactNode }[] = [
  { name: "Soft dunes", note: "Two dunes, sand blowing off the crest.", art: <Sketch>
    <path className="qs-faint" d="M140 166C176 148 206 128 236 126C258 126 282 146 312 162" />
    <path className="qs-paper" d="M118 198C160 190 196 162 226 146C232 143 238 144 242 149C254 168 270 186 300 198Z" />
    <path className="qs-faint" d="M241 148C244 164 252 182 268 198" />
    <path className="qs-paper" d="M12 198C52 196 92 170 128 140C140 130 150 122 158 120C164 119 168 122 172 128C184 152 202 180 240 198Z" />
    <path d="M168 124C166 146 176 174 206 198" />
    <path className="qs-faint" d="M174 146L186 144M178 160L194 158M184 174L204 172M192 186L216 185M250 166L258 165M256 180L268 179M48 186Q70 176 88 166M80 178Q100 168 116 154" />
    <path d="M4 199Q160 194 316 199" />
    <path className="qs-faint" d="M24 214Q42 210 60 214T96 214M136 222Q154 218 172 222T208 222M230 211Q246 207 262 211T294 211" />
    <g className="qs-wind qs-faint"><path d="M160 114Q176 106 194 108M164 122Q182 116 202 118M240 140Q252 134 266 136" /></g>
  </Sketch> },
  { name: "The camp at night", note: "Tents under the moon and stars, a pennant moving in the wind.", art: <Sketch>
    <Stars at={[[40, 40], [92, 28], [140, 50], [190, 30], [300, 64], [70, 84]]} />
    <path className="qs-paper" d="M250 34A20 20 0 1 0 266 70A15 15 0 1 1 250 34Z" />
    <path className="qs-faint" d="M28 172L48 150L68 172M118 170L140 146L162 170M246 170L266 148L286 170" />
    <path className="qs-paper" d="M56 198L98 144L140 198Z" /><path className="qs-tearfill" d="M98 160L88 198H108Z" /><path d="M98 144V136" />
    <path className="qs-paper" d="M168 198L214 136L260 198Z" /><path className="qs-tearfill" d="M214 154L203 198H225Z" /><path d="M214 136V124" />
    <g className="qs-wiggle" style={{ transformOrigin: "214px 124px" }}><path className="qs-accent" d="M214 124L228 127L214 131" /></g>
    <path d="M20 199H300" /><path className="qs-faint" d="M40 214Q60 210 80 214M150 220Q170 216 190 220M240 212Q258 208 276 212" />
  </Sketch> },
  { name: "Pillar of fire", note: "A tall column of fire over the sleeping camp, flickering.", art: <Sketch>
    <Stars at={[[46, 44], [90, 76], [236, 40], [282, 82], [264, 30], [60, 110]]} />
    <g className="qs-flicker" style={{ transformOrigin: "160px 200px" }}>
      <path className="qs-paper" d="M160 200C138 182 142 152 148 124C152 100 144 78 152 50C160 70 168 84 166 104C174 92 174 78 172 66C186 94 186 126 178 154C174 176 182 188 160 200Z" />
      <path className="qs-accent" d="M160 196C150 186 152 170 156 156C158 168 162 172 164 178C168 170 168 162 168 162C174 178 172 192 160 196Z" />
    </g>
    <path className="qs-faint" d="M52 200L74 174L96 200M98 200L116 180L134 200M188 200L206 180L224 200M226 200L248 174L270 200" />
    <path d="M24 201H296" /><path className="qs-faint" d="M44 216Q64 212 84 216M200 218Q222 214 244 218" />
  </Sketch> },
  { name: "Pillar of cloud", note: "The cloud that went before them by day, a trail leading under it.", art: <Sketch>
    <path className="qs-faint" d="M20 186C60 172 100 164 136 168C166 172 196 180 226 182C256 184 280 176 304 170" />
    <g className="qs-float"><g transform="translate(206 206) scale(1.5) translate(-104 -209)">
      <path className="qs-paper" d="M84 209C86 200 82 194 86 186C80 180 82 172 88 170C82 162 86 154 92 152C88 144 96 136 104 140C110 134 120 140 118 148C126 150 126 160 120 164C126 170 124 180 118 182C122 190 116 198 118 209Z" />
      <path className="qs-faint" d="M90 170Q100 166 110 170M90 186Q100 182 112 186M94 152Q102 148 110 152" />
    </g></g>
    <path d="M20 207H300" />
    <path className="qs-accent qs-stream" d="M36 228C80 224 116 218 150 214C174 212 190 210 200 208" />
  </Sketch> },
  { name: "The road to the mountain", note: "A winding trail across the sand to a mountain under cloud.", art: <Sketch>
    <g className="qs-float"><path className="qs-faint" d="M146 72Q150 58 164 62Q172 50 186 58Q200 56 200 70Z" /></g>
    <path className="qs-paper" d="M66 170L118 104L136 120L170 72L206 116L222 104L266 170Z" />
    <path className="qs-faint" d="M170 72L164 104L176 128M118 104L122 132" />
    <path d="M30 171H290" />
    <path className="qs-accent qs-stream" d="M214 228C156 224 124 214 150 204C180 194 190 188 164 182C146 178 152 174 168 172" />
    <path className="qs-faint" d="M40 196Q60 192 80 196M236 200Q256 196 276 200" />
  </Sketch> },
  { name: "Manna in the morning", note: "Bread from heaven on the ground at sunrise, beside a clay jar.", art: <Sketch>
    <path className="qs-faint" d="M44 200A32 32 0 0 1 108 200M76 152V140M48 164L40 156M104 164L112 156" />
    <g className="qs-twinkle qs-faint"><circle cx="140" cy="60" r="2" /><circle cx="176" cy="44" r="2" /><circle cx="210" cy="74" r="2" /><circle cx="120" cy="96" r="2" /><circle cx="250" cy="52" r="2" /><circle cx="164" cy="112" r="2" /></g>
    <path className="qs-paper" d="M198 200C186 200 182 188 184 174C186 160 196 154 198 146H222C224 154 234 160 236 174C238 188 234 200 222 200Z" />
    <path d="M194 146H226" /><path className="qs-faint" d="M190 172H230M188 184H232" />
    <path d="M24 201H296" />
    {[[40, 208], [62, 212], [92, 206], [118, 214], [146, 208], [168, 216], [254, 208], [276, 214], [130, 196], [154, 198]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="qs-paper" cx={cx} cy={cy} r="3.2" />)}
  </Sketch> },
  { name: "Water from the rock", note: "A split rock with water pouring out into a pool, a staff beside it.", art: <Sketch>
    <path className="qs-paper" d="M70 200C64 170 76 136 104 120C132 106 170 110 188 128C206 146 212 176 204 200Z" />
    <path d="M150 112L144 136L152 150L146 166" /><path className="qs-faint" d="M96 150L112 144M170 136L184 146M100 176L120 172" />
    <path className="qs-accent qs-stream" d="M146 166C150 180 160 192 176 202M148 170C156 186 172 196 196 204" />
    <g className="qs-ripple" style={{ transformOrigin: "212px 206px" }}><ellipse className="qs-faint" cx="212" cy="206" rx="40" ry="6" /></g>
    <ellipse cx="212" cy="206" rx="24" ry="3.5" />
    <path d="M258 206L246 104Q242 92 252 90Q260 90 258 98" />
    <path d="M24 207H150M266 207H296" />
  </Sketch> },
  { name: "The bronze serpent", note: "The serpent Moses lifted up on a pole, under the desert sun.", art: <Sketch>
    <g className="qs-twinkle qs-faint"><circle cx="252" cy="52" r="12" /><path d="M252 30V24M274 52H280M268 36L272 32M268 68L272 72M230 52H224" /></g>
    <path d="M160 210V58M136 74H184" />
    <path className="qs-accent" d="M160 190C140 182 140 170 160 164C180 158 180 146 160 140C140 134 140 122 160 116C180 110 180 98 160 92C150 88 146 82 152 76" strokeWidth="2.2" />
    <circle className="qs-accent" cx="153" cy="74" r="3.2" />
    <path d="M40 211H280" /><path className="qs-faint" d="M60 222Q80 218 100 222M210 220Q232 216 254 220M118 211L124 205L132 211M196 211L200 207L206 211" />
  </Sketch> },
  { name: "The palms of Elim", note: "Four palms round a pool, waves of sand behind.", art: <Sketch>
    <path className="qs-faint" d="M30 150C56 140 80 138 104 144C128 150 146 138 172 134C198 130 218 144 244 142C266 140 282 134 296 138" />
    <path className="qs-faint" d="M20 176C48 164 80 160 110 166C140 172 166 160 196 156C228 152 262 162 300 174" />
    <path className="qs-faint" d="M20 198C44 190 70 188 94 192M128 196C146 190 168 190 190 194M226 190C250 184 276 186 300 196" />
    <path d="M58 210C59 190 57 174 62 152M64 210C65 192 63 176 67 154" />
    <g className="qs-sway" style={{ transformOrigin: "64px 153px", animationDelay: "-1s" }}><path className="qs-accent" d="M64 153Q52 146 42 152M64 153Q58 142 48 138M64 153Q70 142 82 140M64 153Q76 148 86 156" /></g>
    <path d="M258 210C259 192 262 176 268 156M264 210C265 194 268 178 273 158" />
    <g className="qs-sway" style={{ transformOrigin: "270px 157px", animationDelay: "-3s" }}><path className="qs-accent" d="M270 157Q256 150 246 158M270 157Q264 144 252 142M270 157Q278 144 290 144M270 157Q284 152 294 162" /></g>
    <path d="M104 210C106 176 102 142 112 104M116 210C118 176 114 144 122 106" />
    <g className="qs-sway" style={{ transformOrigin: "117px 104px" }}><path className="qs-accent" d="M117 104Q96 90 74 104M117 104Q104 80 84 76M117 104Q126 80 146 78M117 104Q140 94 156 110" /></g>
    <circle className="qs-accent" cx="113" cy="110" r="2.4" /><circle className="qs-accent" cx="120" cy="111" r="2.4" />
    <path d="M206 210C208 182 204 158 212 132M216 210C218 184 214 160 220 134" />
    <g className="qs-sway" style={{ transformOrigin: "216px 133px", animationDelay: "-2s" }}><path className="qs-accent" d="M216 133Q200 122 184 130M216 133Q206 116 190 112M216 133Q226 116 242 116M216 133Q234 126 248 140" /></g>
    <ellipse className="qs-paper" cx="160" cy="212" rx="44" ry="7" />
    <g className="qs-ripple" style={{ transformOrigin: "160px 212px" }}><ellipse className="qs-faint" cx="160" cy="212" rx="24" ry="3.5" /></g>
    <path d="M24 211H116M204 211H296" />
  </Sketch> },
  { name: "Rolling dunes", note: "Low dunes, row behind row, under a pale sun.", art: <Sketch>
    <g className="qs-twinkle"><circle className="qs-faint" cx="248" cy="56" r="13" /></g>
    <path className="qs-paper" stroke="none" d="M20 116C38 113.3 48 106.9 61 106.9C68 106.9 78 116 89 116L89 124L20 124Z" /><path className="qs-faint" d="M20 116C38 113.3 48 106.9 61 106.9C68 106.9 78 116 89 116" />
    <path className="qs-paper" stroke="none" d="M68 116C87 113.5 98 107.8 112 107.8C120 107.8 130 116 142 116L142 124L68 124Z" /><path className="qs-faint" d="M68 116C87 113.5 98 107.8 112 107.8C120 107.8 130 116 142 116" />
    <path className="qs-paper" stroke="none" d="M115 116C138 112.9 150 105.7 168 105.7C176 105.7 189 116 203 116L203 124L115 124Z" /><path className="qs-faint" d="M115 116C138 112.9 150 105.7 168 105.7C176 105.7 189 116 203 116" />
    <path className="qs-paper" stroke="none" d="M165 116C182 113.4 191 107.5 204 107.5C210 107.5 220 116 230 116L230 124L165 124Z" /><path className="qs-faint" d="M165 116C182 113.4 191 107.5 204 107.5C210 107.5 220 116 230 116" />
    <path className="qs-paper" stroke="none" d="M206 116C231 114.0 244 109.2 263 109.2C272 109.2 285 116 300 116L300 124L206 124Z" /><path className="qs-faint" d="M206 116C231 114.0 244 109.2 263 109.2C272 109.2 285 116 300 116" />
    <path className="qs-paper" stroke="none" d="M20 142C52 137.2 69 126.1 94 126.1C106 126.1 123 142 143 142L143 150L20 150Z" /><path className="qs-faint" d="M20 142C52 137.2 69 126.1 94 126.1C106 126.1 123 142 143 142" />
    <path className="qs-paper" stroke="none" d="M89 142C111 138.2 123 129.3 139 129.3C148 129.3 159 142 173 142L173 150L89 150Z" /><path className="qs-faint" d="M89 142C111 138.2 123 129.3 139 129.3C148 129.3 159 142 173 142" />
    <path className="qs-paper" stroke="none" d="M147 142C176 138.5 192 130.2 214 130.2C225 130.2 240 142 258 142L258 150L147 150Z" /><path className="qs-faint" d="M147 142C176 138.5 192 130.2 214 130.2C225 130.2 240 142 258 142" />
    <path className="qs-paper" stroke="none" d="M221 142C242 138.8 253 131.4 269 131.4C276 131.4 287 142 300 142L300 150L221 150Z" /><path className="qs-faint" d="M221 142C242 138.8 253 131.4 269 131.4C276 131.4 287 142 300 142" />
    <path className="qs-paper" stroke="none" d="M20 172C48 167.3 64 156.2 85 156.2C96 156.2 111 172 129 172L129 180L20 180Z" /><path d="M20 172C48 167.3 64 156.2 85 156.2C96 156.2 111 172 129 172" />
    <path className="qs-paper" stroke="none" d="M88 172C121 166.6 139 153.9 165 153.9C178 153.9 196 172 217 172L217 180L88 180Z" /><path d="M88 172C121 166.6 139 153.9 165 153.9C178 153.9 196 172 217 172" />
    <path className="qs-paper" stroke="none" d="M160 172C185 167.2 199 156.0 218 156.0C228 156.0 242 172 257 172L257 180L160 180Z" /><path d="M160 172C185 167.2 199 156.0 218 156.0C228 156.0 242 172 257 172" />
    <path className="qs-paper" stroke="none" d="M219 172C240 167.7 251 157.6 267 157.6C276 157.6 287 172 300 172L300 180L219 180Z" /><path d="M219 172C240 167.7 251 157.6 267 157.6C276 157.6 287 172 300 172" />
    <path className="qs-paper" stroke="none" d="M20 206C55 201.2 74 190.0 102 190.0C115 190.0 134 206 156 206L156 214L20 214Z" /><path d="M20 206C55 201.2 74 190.0 102 190.0C115 190.0 134 206 156 206" />
    <path className="qs-paper" stroke="none" d="M106 206C139 201.5 158 191.0 184 191.0C197 191.0 215 206 236 206L236 214L106 214Z" /><path d="M106 206C139 201.5 158 191.0 184 191.0C197 191.0 215 206 236 206" />
    <path className="qs-paper" stroke="none" d="M188 206C217 200.3 233 187.1 255 187.1C266 187.1 282 206 300 206L300 214L188 214Z" /><path d="M188 206C217 200.3 233 187.1 255 187.1C266 187.1 282 206 300 206" />
    <path className="qs-faint" d="M44 220Q56 216 68 220M150 224Q164 220 178 224M240 220Q252 216 264 220" />
    <g className="qs-wind qs-faint"><path d="M60 86Q72 80 86 82M70 94Q84 90 98 92" /></g>
  </Sketch> },
  { name: "Crests and shadows", note: "Three rows of dunes, the shaded side of each one marked.", art: <Sketch>
    <path className="qs-paper" stroke="none" d="M20 130C48 125.3 63 114.3 85 114.3C96 114.3 111 130 128 130L128 138L20 138Z" /><path className="qs-faint" d="M20 130C48 125.3 63 114.3 85 114.3C96 114.3 111 130 128 130" />
    <path className="qs-faint" d="M96 122l-10 0M104 125l-10 0M113 129l-10 0" />
    <path className="qs-paper" stroke="none" d="M97 130C128 125.3 146 114.3 170 114.3C182 114.3 199 130 219 130L219 138L97 138Z" /><path className="qs-faint" d="M97 130C128 125.3 146 114.3 170 114.3C182 114.3 199 130 219 130" />
    <path className="qs-faint" d="M182 122l-11 0M192 125l-11 0M202 129l-11 0" />
    <path className="qs-paper" stroke="none" d="M187 130C208 126.6 219 118.8 235 118.8C243 118.8 255 130 268 130L268 138L187 138Z" /><path className="qs-faint" d="M187 130C208 126.6 219 118.8 235 118.8C243 118.8 255 130 268 130" />
    <path className="qs-faint" d="M243 125l-7 0M250 127l-7 0M256 130l-7 0" />
    <path className="qs-paper" stroke="none" d="M247 130C260 127.3 268 121.0 279 121.0C284 121.0 291 130 300 130L300 138L247 138Z" /><path className="qs-faint" d="M247 130C260 127.3 268 121.0 279 121.0C284 121.0 291 130 300 130" />
    <path className="qs-faint" d="M284 126l-5 0M288 128l-5 0M293 130l-5 0" />
    <path className="qs-paper" stroke="none" d="M20 168C56 161.0 76 144.8 103 144.8C117 144.8 137 168 159 168L159 176L20 176Z" /><path d="M20 168C56 161.0 76 144.8 103 144.8C117 144.8 137 168 159 168" />
    <path className="qs-faint" d="M117 154l-12 0M128 159l-12 0M139 164l-12 0" />
    <path className="qs-paper" stroke="none" d="M110 168C138 163.9 154 154.2 176 154.2C187 154.2 202 168 220 168L220 176L110 176Z" /><path d="M110 168C138 163.9 154 154.2 176 154.2C187 154.2 202 168 220 168" />
    <path className="qs-faint" d="M187 161l-10 0M196 164l-10 0M205 167l-10 0" />
    <path className="qs-paper" stroke="none" d="M185 168C215 161.5 231 146.3 254 146.3C265 146.3 282 168 300 168L300 176L185 176Z" /><path d="M185 168C215 161.5 231 146.3 254 146.3C265 146.3 282 168 300 168" />
    <path className="qs-faint" d="M265 155l-10 0M275 160l-10 0M284 165l-10 0" />
    <path className="qs-paper" stroke="none" d="M20 208C57 201.9 77 187.7 105 187.7C119 187.7 139 208 162 208L162 216L20 216Z" /><path d="M20 208C57 201.9 77 187.7 105 187.7C119 187.7 139 208 162 208" />
    <path className="qs-faint" d="M119 196l-13 0M131 201l-13 0M142 205l-13 0" />
    <path className="qs-paper" stroke="none" d="M116 208C149 201.4 166 186.0 191 186.0C204 186.0 221 208 241 208L241 216L116 216Z" /><path d="M116 208C149 201.4 166 186.0 191 186.0C204 186.0 221 208 241 208" />
    <path className="qs-faint" d="M204 195l-11 0M214 200l-11 0M224 205l-11 0" />
    <path className="qs-paper" stroke="none" d="M194 208C222 202.5 237 189.6 258 189.6C268 189.6 283 208 300 208L300 216L194 216Z" /><path d="M194 208C222 202.5 237 189.6 258 189.6C268 189.6 283 208 300 208" />
    <path className="qs-faint" d="M268 198l-10 0M277 202l-10 0M285 206l-10 0" />
    <g className="qs-wind qs-faint"><path d="M64 98Q76 92 90 94M70 106Q84 102 98 104" /></g>
  </Sketch> },
  { name: "Dunes to the horizon", note: "Rows of dunes growing smaller to the horizon, the sun setting behind.", art: <Sketch>
    <g className="qs-twinkle qs-faint"><circle cx="60" cy="40" r="1.3" /><circle cx="120" cy="26" r="1.3" /><circle cx="270" cy="34" r="1.3" /><circle cx="236" cy="56" r="1" /></g>
    <path className="qs-accent" d="M190 98A16 16 0 0 1 222 98" />
    <path className="qs-paper" stroke="none" d="M20 98C34 97.0 42 94.7 53 94.7C59 94.7 67 98 76 98L76 106L20 106Z" /><path className="qs-faint" d="M20 98C34 97.0 42 94.7 53 94.7C59 94.7 67 98 76 98" />
    <path className="qs-paper" stroke="none" d="M59 98C74 97.2 81 95.4 92 95.4C98 95.4 106 98 115 98L115 106L59 106Z" /><path className="qs-faint" d="M59 98C74 97.2 81 95.4 92 95.4C98 95.4 106 98 115 98" />
    <path className="qs-paper" stroke="none" d="M97 98C111 96.9 119 94.4 130 94.4C136 94.4 143 98 152 98L152 106L97 106Z" /><path className="qs-faint" d="M97 98C111 96.9 119 94.4 130 94.4C136 94.4 143 98 152 98" />
    <path className="qs-paper" stroke="none" d="M134 98C144 97.2 150 95.5 158 95.5C162 95.5 167 98 174 98L174 106L134 106Z" /><path className="qs-faint" d="M134 98C144 97.2 150 95.5 158 95.5C162 95.5 167 98 174 98" />
    <path className="qs-paper" stroke="none" d="M164 98C174 97.3 179 95.7 187 95.7C191 95.7 196 98 203 98L203 106L164 106Z" /><path className="qs-faint" d="M164 98C174 97.3 179 95.7 187 95.7C191 95.7 196 98 203 98" />
    <path className="qs-paper" stroke="none" d="M193 98C205 97.2 211 95.4 220 95.4C225 95.4 231 98 239 98L239 106L193 106Z" /><path className="qs-faint" d="M193 98C205 97.2 211 95.4 220 95.4C225 95.4 231 98 239 98" />
    <path className="qs-paper" stroke="none" d="M221 98C235 97.2 243 95.2 254 95.2C260 95.2 268 98 276 98L276 106L221 106Z" /><path className="qs-faint" d="M221 98C235 97.2 243 95.2 254 95.2C260 95.2 268 98 276 98" />
    <path className="qs-paper" stroke="none" d="M256 98C268 97.0 274 94.7 282 94.7C287 94.7 293 98 300 98L300 106L256 106Z" /><path className="qs-faint" d="M256 98C268 97.0 274 94.7 282 94.7C287 94.7 293 98 300 98" />
    <path className="qs-paper" stroke="none" d="M20 108C33 106.7 40 103.7 49 103.7C54 103.7 61 108 69 108L69 116L20 116Z" /><path className="qs-faint" d="M20 108C33 106.7 40 103.7 49 103.7C54 103.7 61 108 69 108" />
    <path className="qs-paper" stroke="none" d="M53 108C68 106.8 76 104.1 87 104.1C93 104.1 101 108 110 108L110 116L53 116Z" /><path className="qs-faint" d="M53 108C68 106.8 76 104.1 87 104.1C93 104.1 101 108 110 108" />
    <path className="qs-paper" stroke="none" d="M93 108C110 106.6 120 103.5 133 103.5C139 103.5 148 108 159 108L159 116L93 116Z" /><path className="qs-faint" d="M93 108C110 106.6 120 103.5 133 103.5C139 103.5 148 108 159 108" />
    <path className="qs-paper" stroke="none" d="M136 108C149 107.1 156 104.9 166 104.9C171 104.9 178 108 187 108L187 116L136 116Z" /><path className="qs-faint" d="M136 108C149 107.1 156 104.9 166 104.9C171 104.9 178 108 187 108" />
    <path className="qs-paper" stroke="none" d="M168 108C183 106.9 191 104.5 203 104.5C209 104.5 218 108 227 108L227 116L168 116Z" /><path className="qs-faint" d="M168 108C183 106.9 191 104.5 203 104.5C209 104.5 218 108 227 108" />
    <path className="qs-paper" stroke="none" d="M210 108C223 106.9 230 104.5 240 104.5C245 104.5 252 108 260 108L260 116L210 116Z" /><path className="qs-faint" d="M210 108C223 106.9 230 104.5 240 104.5C245 104.5 252 108 260 108" />
    <path className="qs-paper" stroke="none" d="M238 108C254 106.5 263 103.0 275 103.0C281 103.0 290 108 300 108L300 116L238 116Z" /><path className="qs-faint" d="M238 108C254 106.5 263 103.0 275 103.0C281 103.0 290 108 300 108" />
    <path className="qs-paper" stroke="none" d="M20 120C41 118.5 53 115.1 69 115.1C77 115.1 88 120 101 120L101 128L20 128Z" /><path className="qs-faint" d="M20 120C41 118.5 53 115.1 69 115.1C77 115.1 88 120 101 120" />
    <path className="qs-paper" stroke="none" d="M65 120C87 118.5 98 114.9 115 114.9C123 114.9 134 120 148 120L148 128L65 128Z" /><path className="qs-faint" d="M65 120C87 118.5 98 114.9 115 114.9C123 114.9 134 120 148 120" />
    <path className="qs-paper" stroke="none" d="M112 120C131 118.3 141 114.5 156 114.5C163 114.5 173 120 185 120L185 128L112 128Z" /><path className="qs-faint" d="M112 120C131 118.3 141 114.5 156 114.5C163 114.5 173 120 185 120" />
    <path className="qs-paper" stroke="none" d="M165 120C180 118.0 189 113.3 201 113.3C207 113.3 215 120 225 120L225 128L165 128Z" /><path className="qs-faint" d="M165 120C180 118.0 189 113.3 201 113.3C207 113.3 215 120 225 120" />
    <path className="qs-paper" stroke="none" d="M202 120C220 117.8 230 112.7 244 112.7C251 112.7 261 120 272 120L272 128L202 128Z" /><path className="qs-faint" d="M202 120C220 117.8 230 112.7 244 112.7C251 112.7 261 120 272 120" />
    <path className="qs-paper" stroke="none" d="M250 120C263 118.5 270 115.0 280 115.0C285 115.0 292 120 300 120L300 128L250 128Z" /><path className="qs-faint" d="M250 120C263 118.5 270 115.0 280 115.0C285 115.0 292 120 300 120" />
    <path className="qs-paper" stroke="none" d="M20 136C46 132.7 60 125.0 80 125.0C90 125.0 104 136 120 136L120 144L20 144Z" /><path className="qs-faint" d="M20 136C46 132.7 60 125.0 80 125.0C90 125.0 104 136 120 136" />
    <path className="qs-paper" stroke="none" d="M93 136C111 133.6 120 128.1 134 128.1C141 128.1 150 136 161 136L161 144L93 144Z" /><path className="qs-faint" d="M93 136C111 133.6 120 128.1 134 128.1C141 128.1 150 136 161 136" />
    <path className="qs-paper" stroke="none" d="M136 136C158 133.8 170 128.7 187 128.7C196 128.7 208 136 221 136L221 144L136 144Z" /><path className="qs-faint" d="M136 136C158 133.8 170 128.7 187 128.7C196 128.7 208 136 221 136" />
    <path className="qs-paper" stroke="none" d="M186 136C208 133.7 219 128.3 236 128.3C244 128.3 255 136 268 136L268 144L186 144Z" /><path className="qs-faint" d="M186 136C208 133.7 219 128.3 236 128.3C244 128.3 255 136 268 136" />
    <path className="qs-paper" stroke="none" d="M239 136C255 134.4 263 130.7 276 130.7C282 130.7 290 136 300 136L300 144L239 144Z" /><path className="qs-faint" d="M239 136C255 134.4 263 130.7 276 130.7C282 130.7 290 136 300 136" />
    <path className="qs-paper" stroke="none" d="M20 158C50 153.4 67 142.8 90 142.8C102 142.8 118 158 137 158L137 166L20 166Z" /><path d="M20 158C50 153.4 67 142.8 90 142.8C102 142.8 118 158 137 158" />
    <path className="qs-paper" stroke="none" d="M88 158C122 154.7 140 147.0 166 147.0C179 147.0 197 158 218 158L218 166L88 166Z" /><path d="M88 158C122 154.7 140 147.0 166 147.0C179 147.0 197 158 218 158" />
    <path className="qs-paper" stroke="none" d="M177 158C200 154.3 212 145.7 230 145.7C238 145.7 251 158 265 158L265 166L177 166Z" /><path d="M177 158C200 154.3 212 145.7 230 145.7C238 145.7 251 158 265 158" />
    <path className="qs-paper" stroke="none" d="M228 158C247 155.0 257 148.0 271 148.0C278 148.0 288 158 300 158L300 166L228 166Z" /><path d="M228 158C247 155.0 257 148.0 271 148.0C278 148.0 288 158 300 158" />
    <path className="qs-paper" stroke="none" d="M20 186C53 179.6 70 164.8 96 164.8C108 164.8 126 186 146 186L146 194L20 194Z" /><path d="M20 186C53 179.6 70 164.8 96 164.8C108 164.8 126 186 146 186" />
    <path className="qs-paper" stroke="none" d="M111 186C141 180.3 157 166.9 181 166.9C192 166.9 208 186 227 186L227 194L111 194Z" /><path d="M111 186C141 180.3 157 166.9 181 166.9C192 166.9 208 186 227 186" />
    <path className="qs-paper" stroke="none" d="M190 186C218 180.4 234 167.2 256 167.2C267 167.2 282 186 300 186L300 194L190 194Z" /><path d="M190 186C218 180.4 234 167.2 256 167.2C267 167.2 282 186 300 186" />
    <path className="qs-paper" stroke="none" d="M20 216C67 209.9 93 195.6 129 195.6C147 195.6 173 216 202 216L202 224L20 224Z" /><path d="M20 216C67 209.9 93 195.6 129 195.6C147 195.6 173 216 202 216" />
    <path className="qs-paper" stroke="none" d="M127 216C172 210.4 196 197.3 231 197.3C248 197.3 272 216 300 216L300 224L127 224Z" /><path d="M127 216C172 210.4 196 197.3 231 197.3C248 197.3 272 216 300 216" />
  </Sketch> },
  { name: "Sand and acacias", note: "Waves of sand, flat-topped acacia trees in the middle and far rows, a low sun.", art: <Sketch>
    <g className="qs-twinkle"><circle className="qs-faint" cx="160" cy="54" r="12" /></g>
    <path className="qs-faint" d="M20 118C28 118.7 52.8 122.7 67.9 122.2C83 121.7 96.1 115.2 110.6 115.2C125.2 115.2 140.7 122.7 155.3 122.4C169.9 122.1 182.2 113.9 198.2 113.6C214.2 113.4 234.5 119.6 251.5 120.8C268.4 122 291.9 120.8 300 120.8" />
    <path className="qs-faint" d="M236 120.4L236 111.4M236 113L230.4 105.8M236 112.2L241.6 105" /><path className="qs-paper qs-faint" d="M220 105.8C224 97.8 247.2 97 252.8 105C242.4 108.2 229.6 108.2 220 105.8Z" />
    <path className="qs-faint" d="M70 123.2L70 115.7M70 117L65.5 111.1M70 116.3L74.5 110.5" /><path className="qs-paper qs-faint" d="M57 111.1C60.2 104.6 79.1 104 83.7 110.5C75.2 113.1 64.8 113.1 57 111.1Z" />
    <path className="qs-faint" d="M20 146C29.5 147.1 57.3 153.7 77.1 152.7C97 151.6 120 140.2 139 140C158 139.8 170.7 151.2 191.1 151.3C211.5 151.4 243.5 142.4 261.6 140.7C279.8 138.9 293.6 140.7 300 140.7" />
    <path className="qs-faint" d="M112 146.1L112 133.5M112 135.8L103.9 125.4M112 134.7L120.1 124.2" /><path className="qs-paper qs-faint" d="M88.8 125.4C94.6 113.8 128.2 112.6 136.4 124.2C121.3 128.9 102.7 128.9 88.8 125.4Z" />
    <path d="M20 176C35 175 81 168.8 110.1 170.3C139.3 171.7 163.4 182.1 195 184.5C226.6 186.9 282.5 184.5 300 184.5" />
    <path  d="M214 185.5L214 167.8M214 171.1L202.3 156.1M214 169.5L225.7 154.4" /><path className="qs-paper" d="M180.6 156.1C188.9 139.4 237.4 137.7 249.1 154.4C227.4 161.1 200.6 161.1 180.6 156.1Z" />
    <path d="M20 206C39 204.4 95.6 195.4 133.7 196.5C171.9 197.6 221.3 210.1 249 212.8C276.7 215.5 291.5 212.8 300 212.8" />
    <path className="qs-faint" d="M44 222Q58 218 72 222M150 226Q166 222 182 226M236 220Q250 216 264 220" />
  </Sketch> },
  { name: "Palms in the distance", note: "Waves of sand, a cluster of palms far off and one nearer, birds overhead.", art: <Sketch>
    <g className="qs-float qs-faint"><path d="M180 46Q185 41 190 46Q195 41 200 46M202 60Q206 56 210 60Q214 56 218 60" /></g>
    <path className="qs-faint" d="M20 118C27.2 118.8 47.5 123.5 63.3 122.8C79.1 122.1 97.8 114 114.9 113.8C132 113.6 148.3 121.4 165.9 121.5C183.6 121.5 202.2 113.9 220.6 114.1C238.9 114.2 263 120.8 276.2 122.2C289.4 123.5 296 122.2 300 122.2" />
    <path className="qs-faint" d="M246.6 119C247.3 107.9 246.6 99.3 249.4 92.1M249.4 119C250.2 107.9 249.4 99.3 251.6 92.1" /><g className="qs-sway" style={{ transformOrigin: "250.5px 92.1px", animationDelay: "0s" }}><path className="qs-accent qs-faint" d="M250.5 92.1Q244.8 87.8 239 92.1M250.5 92.1Q247.6 84.9 241.9 83.5M250.5 92.1Q253.4 84.9 259.2 83.5M250.5 92.1Q256.3 87.8 262.8 92.8" /></g>
    <path className="qs-faint" d="M20 146C29.4 145.3 55.7 140.7 76.4 141.7C97.1 142.7 121 151.8 144.3 151.9C167.6 151.9 194 142.6 216 142.2C238 141.8 262.1 148.4 276.1 149.6C290.1 150.8 296 149.6 300 149.6" />
    <path className="qs-faint" d="M93.8 144.8C94.9 128.5 93.8 115.4 98.2 104.5M98.2 144.8C99.3 128.5 98.2 115.4 101.5 104.5" /><g className="qs-sway" style={{ transformOrigin: "99.8px 104.5px", animationDelay: "0s" }}><path className="qs-accent qs-faint" d="M99.8 104.5Q91.1 98 82.4 104.5M99.8 104.5Q95.5 93.6 86.7 91.4M99.8 104.5Q104.2 93.6 112.9 91.4M99.8 104.5Q108.5 98 118.3 105.6" /></g>
    <path className="qs-faint" d="M110.2 148.2C111.1 134.6 110.2 123.8 113.8 114.8M113.8 148.2C114.7 134.6 113.8 123.8 116.5 114.8" /><g className="qs-sway" style={{ transformOrigin: "115.2px 114.8px", animationDelay: "0s" }}><path className="qs-accent qs-faint" d="M115.2 114.8Q108 109.4 100.8 114.8M115.2 114.8Q111.6 105.8 104.4 104M115.2 114.8Q118.8 105.8 126 104M115.2 114.8Q122.4 109.4 130.5 115.7" /></g>
    <path className="qs-faint" d="M122 150.7C123 135.6 122 123.4 126 113.3M126 150.7C127 135.6 126 123.4 129.1 113.3" /><g className="qs-sway" style={{ transformOrigin: "127.5px 113.3px", animationDelay: "0s" }}><path className="qs-accent qs-faint" d="M127.5 113.3Q119.5 107.3 111.4 113.3M127.5 113.3Q123.5 103.2 115.4 101.2M127.5 113.3Q131.6 103.2 139.7 101.2M127.5 113.3Q135.6 107.3 144.7 114.3" /></g>
    <path d="M20 176C31.4 177.1 62.9 183.9 88.6 182.6C114.3 181.2 146.8 167.9 174.1 167.9C201.4 168 231.6 180.3 252.6 182.7C273.6 185.2 292.1 182.7 300 182.7" />
    <path d="M227 180.8C228.5 158.5 227 140.2 233 125M233 180.8C234.6 158.5 233 140.2 237.6 125" /><g className="qs-sway" style={{ transformOrigin: "235.3px 125px", animationDelay: "0s" }}><path className="qs-accent" d="M235.3 125Q223.2 115.9 211 125M235.3 125Q229.2 109.8 217.1 106.8M235.3 125Q241.4 109.8 253.6 106.8M235.3 125Q247.5 115.9 261.2 126.6" /></g>
    <path d="M20 206C39.1 207 100.6 212.7 134.5 211.9C168.4 211 195.9 202.7 223.5 200.9C251.1 199 287.2 200.9 300 200.9" />
    <path className="qs-faint" d="M44 222Q58 218 72 222M150 226Q166 222 182 226M236 220Q250 216 264 220" />
  </Sketch> },
  { name: "Scattered trees", note: "Waves of sand dotted with acacia, broom bushes and a palm, sand blowing.", art: <Sketch>
    <g className="qs-wind qs-faint"><path d="M40 70Q54 64 70 66M48 78Q62 74 78 76" /></g>
    <path className="qs-faint" d="M20 118C27.2 118.8 48.6 123.2 63.2 122.6C77.9 121.9 90.7 114.3 107.9 114.1C125.1 113.9 146.7 121.6 166.4 121.5C186 121.4 207.4 113.6 225.8 113.7C244.1 113.8 264.3 120.7 276.7 122.1C289.1 123.5 296.1 122.1 300 122.1" />
    <path className="qs-faint" d="M60 123.5L60 117.4" /><path className="qs-paper qs-faint" d="M50.6 116.7C47 112.4 51.4 106.6 56.4 108.1C58.6 103 65.8 103.8 66.5 108.8C71.5 108.8 72.2 115.3 68.6 116.7Z" />
    <path className="qs-faint" d="M196 118.6L196 110.4M196 111.8L191 105.4M196 111.1L201 104.6" /><path className="qs-paper qs-faint" d="M181.6 105.4C185.2 98.2 206.1 97.4 211.1 104.6C201.8 107.5 190.2 107.5 181.6 105.4Z" />
    <path className="qs-faint" d="M20 146C31.3 145.1 64.2 140 87.6 140.8C111 141.6 136.3 150.7 160.6 150.9C184.8 151.1 209.7 143.4 232.9 141.9C256.2 140.4 288.8 141.9 300 141.9" />
    <path className="qs-faint" d="M260.3 142.9C261.1 129.8 260.3 119.3 263.7 110.6M263.7 142.9C264.6 129.8 263.7 119.3 266.4 110.6" /><g className="qs-sway" style={{ transformOrigin: "265px 110.6px", animationDelay: "0s" }}><path className="qs-accent qs-faint" d="M265 110.6Q258.1 105.4 251.1 110.6M265 110.6Q261.6 101.9 254.6 100.2M265 110.6Q268.5 101.9 275.5 100.2M265 110.6Q272 105.4 279.8 111.5" /></g>
    <path className="qs-faint" d="M150 151.4L150 142.2" /><path className="qs-paper qs-faint" d="M134.9 141.1C129.1 134.1 136.1 124.8 144.2 127.2C147.7 119 159.3 120.2 160.4 128.3C168.6 128.3 169.7 138.8 163.9 141.1Z" />
    <path d="M20 176C33.1 174.7 69.8 167.2 98.6 168.3C127.4 169.4 162.3 182.9 192.6 182.8C222.8 182.8 262.2 170.7 280.1 168.2C298 165.8 296.7 168.2 300 168.2" />
    <path  d="M92 169.5L92 152.6M92 155.7L80.9 141.4M92 154.1L103.1 139.8" /><path className="qs-paper" d="M60.2 141.4C68.2 125.5 114.3 123.9 125.4 139.8C104.7 146.2 79.3 146.2 60.2 141.4Z" />
    <path d="M232 177.6L232 166.5" /><path className="qs-paper" d="M213.2 165C205.9 156.3 214.6 144.7 224.8 147.6C229.1 137.5 243.6 138.9 245.1 149.1C255.2 149.1 256.6 162.1 249.4 165Z" />
    <path d="M20 206C37 204.8 85.5 197.4 122.2 198.6C159 199.7 211 210.5 240.6 212.9C270.2 215.3 290.1 212.9 300 212.9" />
    <path className="qs-faint" d="M44 222Q58 218 72 222M150 226Q166 222 182 226M236 220Q250 216 264 220" />
  </Sketch> },
  { name: "Elim in the wilderness", note: "The four palms of Elim and their pool in front; acacias and broom bushes across the sand behind.", art: <Sketch>
    <g className="qs-wind qs-faint"><path d="M34 62Q48 56 64 58M42 70Q56 66 72 68" /></g>
    <path className="qs-faint" d="M20 116C29.4 116.6 59.1 120 76.2 119.3C93.3 118.6 106.6 111.8 122.6 111.8C138.6 111.8 156 119.2 172.3 119.4C188.6 119.5 205.2 112.6 220.4 112.7C235.7 112.8 250.5 118.8 263.8 120.1C277.1 121.3 294 120.1 300 120.1" />
    <path className="qs-faint" d="M44 118.3L44 113.1" /><path className="qs-paper qs-faint" d="M36.2 112.5C33.2 108.9 36.8 104.1 41 105.3C42.8 101.1 48.8 101.7 49.4 105.9C53.6 105.9 54.2 111.3 51.2 112.5Z" />
    <path className="qs-faint" d="M186 119.1L186 111.1M186 112.5L181.1 106.2M186 111.8L190.9 105.5" /><path className="qs-paper qs-faint" d="M172 106.2C175.5 99.2 195.8 98.5 200.7 105.5C191.6 108.3 180.4 108.3 172 106.2Z" />
    <path className="qs-faint" d="M20 144C32.3 143.3 71.2 138.6 93.7 139.7C116.1 140.8 134.9 150.8 154.8 150.6C174.7 150.5 194.5 138.7 213.2 138.7C231.9 138.8 252.4 148.8 266.8 150.9C281.3 152.9 294.5 150.9 300 150.9" />
    <path className="qs-faint" d="M20 174C35.5 175 86.5 181.1 113.1 179.9C139.7 178.8 157.7 167.2 179.9 167C202.1 166.8 226.3 176.8 246.3 178.8C266.3 180.8 291.1 178.8 300 178.8" />
    <path className="qs-faint" d="M162 170.3L162 158.3M162 160.5L154.3 150.6M162 159.4L169.7 149.5" /><path className="qs-paper qs-faint" d="M140 150.6C145.5 139.6 177.4 138.5 185.1 149.5C170.8 153.9 153.2 153.9 140 150.6Z" />
    <path d="M58.8 212C60.4 188.6 58.8 169.4 65.2 153.4M65.2 212C66.8 188.6 65.2 169.4 70 153.4" /><g className="qs-sway" style={{ transformOrigin: "67.6px 153.4px", animationDelay: "-1s" }}><path className="qs-accent" d="M67.6 153.4Q54.8 143.8 42 153.4M67.6 153.4Q61.2 137.4 48.4 134.2M67.6 153.4Q74 137.4 86.8 134.2M67.6 153.4Q80.4 143.8 94.8 155" /></g>
    <path d="M263 212C264.5 190 263 172 269 157M269 212C270.5 190 269 172 273.5 157" /><g className="qs-sway" style={{ transformOrigin: "271.2px 157px", animationDelay: "-3s" }}><path className="qs-accent" d="M271.2 157Q259.2 148 247.2 157M271.2 157Q265.2 142 253.2 139M271.2 157Q277.2 142 289.2 139M271.2 157Q283.2 148 296.8 158.5" /></g>
    <path d="M104.1 212C107 169.7 104.1 134.3 115.9 104.8M115.9 212C118.8 169.7 115.9 134.3 124.8 104.8" /><g className="qs-sway" style={{ transformOrigin: "120.3px 104.8px", animationDelay: "0s" }}><path className="qs-accent" d="M120.3 104.8Q96.7 87.1 73.1 104.8M120.3 104.8Q108.5 75.3 84.9 69.4M120.3 104.8Q132.1 75.3 155.7 69.4M120.3 104.8Q143.9 87.1 170.5 107.8" /></g>
    <circle className="qs-accent" cx="116" cy="111" r="2.4" /><circle className="qs-accent" cx="123" cy="112" r="2.4" />
    <path d="M206.6 212C208.8 180.2 206.6 153.8 215.4 131.8M215.4 212C217.6 180.2 215.4 153.8 222 131.8" /><g className="qs-sway" style={{ transformOrigin: "218.7px 131.8px", animationDelay: "-2s" }}><path className="qs-accent" d="M218.7 131.8Q201.1 118.6 183.5 131.8M218.7 131.8Q209.9 109.8 192.3 105.4M218.7 131.8Q227.5 109.8 245.1 105.4M218.7 131.8Q236.3 118.6 256.1 134" /></g>
    <ellipse className="qs-paper" cx="160" cy="212" rx="44" ry="7" />
    <g className="qs-ripple" style={{ transformOrigin: "160px 212px" }}><ellipse className="qs-faint" cx="160" cy="212" rx="24" ry="3.5" /></g>
    <path d="M24 211H116M204 211H296" />
  </Sketch> },
  { name: "Two palms, many trees", note: "Two tall palms by the pool; more trees scattered over the sand.", art: <Sketch>
    <g className="qs-wind qs-faint"><path d="M34 62Q48 56 64 58M42 70Q56 66 72 68" /></g>
    <path className="qs-faint" d="M20 116C26.7 116.8 44.1 121.8 60.2 121C76.3 120.1 99.7 111.3 116.6 111C133.6 110.7 147.5 118.7 161.9 119C176.3 119.3 189.4 112.8 203 113C216.6 113.2 227.3 119 243.5 120.2C259.6 121.4 290.6 120.2 300 120.2" />
    <path className="qs-faint" d="M58 121.9L58 114.9M58 116.1L53.8 110.7M58 115.5L62.2 110.1" /><path className="qs-paper qs-faint" d="M46 110.7C49 104.7 66.4 104.1 70.6 110.1C62.8 112.5 53.2 112.5 46 110.7Z" />
    <path className="qs-faint" d="M176 118.4L176 113.5" /><path className="qs-paper qs-faint" d="M168.8 113C166.1 109.7 169.4 105.3 173.2 106.4C174.9 102.5 180.4 103.1 180.9 106.9C184.8 106.9 185.3 111.9 182.6 113Z" />
    <path className="qs-faint" d="M272 121.2L272 114.7M272 115.8L268.1 110.9M272 115.3L275.9 110.3" /><path className="qs-paper qs-faint" d="M261 110.9C263.8 105.4 279.7 104.8 283.6 110.3C276.4 112.5 267.6 112.5 261 110.9Z" />
    <path className="qs-faint" d="M20 144C32.4 144.8 71.3 149.5 94.1 148.7C117 147.9 135.4 139 157.2 139.2C179.1 139.4 201.4 148.1 225.2 149.9C249 151.7 287.5 149.9 300 149.9" />
    <path className="qs-faint" d="M38.2 145.8C39.1 132.2 38.2 121.4 41.8 112.4M41.8 145.8C42.7 132.2 41.8 121.4 44.5 112.4" /><g className="qs-sway" style={{ transformOrigin: "43.1px 112.4px", animationDelay: "0s" }}><path className="qs-accent qs-faint" d="M43.1 112.4Q35.9 107 28.8 112.4M43.1 112.4Q39.5 103.4 32.3 101.6M43.1 112.4Q46.8 103.4 54 101.6M43.1 112.4Q50.4 107 58.5 113.3" /></g>
    <path className="qs-faint" d="M20 174C33.7 175 74.6 180.8 102.1 179.8C129.5 178.9 157.6 168.2 184.8 168.1C212.1 167.9 246.2 177 265.4 178.8C284.6 180.6 294.2 178.8 300 178.8" />
    <path className="qs-faint" d="M268 179.8L268 167.8M268 170L260.3 160.1M268 168.9L275.7 159" /><path className="qs-paper qs-faint" d="M246 160.1C251.5 149.1 283.4 148 291.1 159C276.8 163.4 259.2 163.4 246 160.1Z" />
    <path d="M104.1 212C107 169.7 104.1 134.3 115.9 104.8M115.9 212C118.8 169.7 115.9 134.3 124.8 104.8" /><g className="qs-sway" style={{ transformOrigin: "120.3px 104.8px", animationDelay: "0s" }}><path className="qs-accent" d="M120.3 104.8Q96.7 87.1 73.1 104.8M120.3 104.8Q108.5 75.3 84.9 69.4M120.3 104.8Q132.1 75.3 155.7 69.4M120.3 104.8Q143.9 87.1 170.5 107.8" /></g>
    <circle className="qs-accent" cx="116" cy="111" r="2.4" /><circle className="qs-accent" cx="123" cy="112" r="2.4" />
    <path d="M191.4 212C193.7 178.8 191.4 151.2 200.6 128.2M200.6 212C202.9 178.8 200.6 151.2 207.5 128.2" /><g className="qs-sway" style={{ transformOrigin: "204.1px 128.2px", animationDelay: "-2s" }}><path className="qs-accent" d="M204.1 128.2Q185.7 114.4 167.2 128.2M204.1 128.2Q194.9 105.2 176.5 100.6M204.1 128.2Q213.2 105.2 231.7 100.6M204.1 128.2Q222.5 114.4 243.2 130.5" /></g>
    <ellipse className="qs-paper" cx="150" cy="212" rx="40" ry="6" />
    <g className="qs-ripple" style={{ transformOrigin: "150px 212px" }}><ellipse className="qs-faint" cx="150" cy="212" rx="22" ry="3.2" /></g>
    <path d="M24 211H110M190 211H296" />
  </Sketch> },
  { name: "An oasis in the wide wilderness", note: "Chosen: a small cluster of palms round a pool in the middle; trees far off on every side. Now on the homepage card.", art: <QuizScene scene="tents" /> },
];

export default function WildernessMockupPage() {
  const question = QUESTIONS.find((item) => item.scene === "tents")!;
  return <main className="qv-page">
    <header className="qv-page-head home-wrap">
      <p className="home-eyebrow">Mock-up · question 4</p>
      <h1>Drawings for <em>the wilderness</em></h1>
      <p>The same card again and again, each with a different drawing; the last rows are dunes, then waves of sand with desert trees. Tell me the number of the one you want.</p>
    </header>
    <ol className="qv-tiles wm-grid home-wrap" data-more>{DESIGNS.map(({ name, note, art }, i) => <li key={name}>
      <p className="wm-label"><strong>{i + 1}</strong> {name}<span>{note}</span></p>
      <div className="qv-tile">
        <span className="qv-tile-top"><span>04</span><span>{question.part}</span></span>
        <span className="qv-tile-art">{art}</span>
        <span className="qv-tile-ask">{question.ask}</span>
      </div>
      <Link className="qv-tile-more" to="/study/questions">See all the questions<ArrowRight size={13} aria-hidden /></Link>
    </li>)}</ol>
  </main>;
}
