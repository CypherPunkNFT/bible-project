// The drawings for Hurlbut's Old Testament lessons, 1 to 42 (owner, 2026-10-25: "real line drawings, not icons"). Each
// picks the one thing a child would remember from the lesson. Pieces and classes: art-kit.tsx.
import type { ReactNode } from "react";
import { CROWN, Crown, Flame, Ground, Jar, P, Rays, STAFF, Star, Waves } from "./art-kit";

export const OLD: Record<number, ReactNode> = {
  // The beautiful garden: the tree with its fruit, and the river
  1: <>
    <path d="M100 152V104M100 124L86 112M100 118L114 106" />
    <path className="p" d="M100 108C72 112 58 92 70 78C64 58 86 46 100 56C112 44 138 54 134 74C150 86 132 112 100 108Z" />
    <circle className="a" cx="84" cy="82" r="4" /><circle className="a" cx="112" cy="72" r="4" /><circle className="a" cx="118" cy="94" r="4" /><circle className="a" cx="90" cy="98" r="3.5" />
    <Ground y={154} /><path className="f" d="M50 170Q66 164 82 170T114 170T146 170" />
  </>,
  // The earliest people: the ark under the rainbow
  2: <>
    <path className="a" d="M40 116A60 60 0 0 1 160 116" /><path className="f" d="M50 116A50 50 0 0 1 150 116M60 116A40 40 0 0 1 140 116" />
    <path className="p" d="M76 122V104H124V122Z" /><path className="p" d="M70 106L100 92L130 106Z" /><path className="f" d="M92 112H108" />
    <path className="p" d="M46 122H154L140 146H60Z" /><path className="f" d="M58 132H142" />
    <Waves y={154} />
  </>,
  // Abram: his tent under the stars he was told to count
  3: <>
    {Star(100, 34, 7)}{Star(62, 56, 5)}{Star(140, 54, 6)}
    <path className="f" d="M80 44V48M78 46H82M122 38V42M120 40H124M48 84V88M46 86H50M154 82V86M152 84H156M86 64V66M116 66V68" />
    <path className="p" d="M50 150L100 82L150 150Z" /><path className="s" d="M100 104L86 150H114Z" /><path d="M100 82V104" />
    <path className="f" d="M100 82L40 150M100 82L160 150" /><Ground y={152} />
  </>,
  // Abram and Lot: two ways part, one to the green plain, one to the hills
  4: <>
    <path className="f" d="M88 170L100 140M112 170L100 140M100 140L62 128M100 140L138 128" />
    <path className="f" d="M110 92L130 68L146 84L158 72L172 94" /><path d="M30 96Q56 88 82 96" />
    <path className="a" d="M40 94Q44 80 50 92M60 92Q64 78 70 90" />
    {P(58, 132, 1.15, STAFF)}{P(142, 132, 1.15, STAFF)}
  </>,
  // Isaac and his sons: Jacob's pot of red stew, and Esau's bow
  5: <>
    <path d="M150 62Q172 100 150 138M150 62V138" />
    <path className="f" d="M84 104Q78 94 86 86T84 68M100 104Q94 92 102 82T100 60M116 104Q110 94 118 86T116 68" />
    <path className="p" d="M62 114H138Q138 156 100 156Q62 156 62 114Z" /><path d="M56 114H144" /><path className="a" d="M70 122Q100 128 130 122" />
    <path className="a" d="M86 168Q90 160 96 164Q100 156 104 164Q110 160 114 168Z" />
  </>,
  // Jacob: the ladder to heaven over his stone pillow
  6: <>
    {Star(124, 30, 8)}<path className="f" d="M112 44L104 36M136 44L144 36" />
    <path d="M78 160L104 36M106 160L132 36" />
    <path d="M81 145H109M85 128H113M88 110H116M92 93H120M96 76H124M99 58H127" />
    <path className="p" d="M36 160Q38 144 54 144Q68 144 70 160Z" /><Ground y={160} />
  </>,
  // Joseph in Egypt: the pyramid, and the grain stored for the hungry years
  7: <>
    <path className="ao" d="M140 52a9 9 0 1 0 0.1 0" />
    <path className="p" d="M36 150L80 84L124 150Z" /><path className="f" d="M80 84L92 150M58 117H102" />
    <path d="M146 152V104M146 120L134 100M146 120L158 100M146 128L132 112M146 128L160 112M140 134H152" />
    <path className="a" d="M146 104Q142 94 146 86Q150 94 146 104ZM134 100Q128 92 130 84Q136 90 134 100ZM158 100Q164 92 162 84Q156 90 158 100Z" />
    <Ground y={154} />
  </>,
  // Joseph and his brothers: the coat of many colours
  8: <>
    <path className="p" d="M76 50L100 58L124 50L150 74L136 88L128 80V156H72V80L64 88L50 74Z" />
    <path d="M88 52Q100 68 112 52" />
    <path className="a" d="M72 96H128M72 120H128M72 144H128M58 80L66 72M142 80L134 72" />
    <path className="f" d="M72 108H128M72 132H128" />
  </>,
  // The youth of Moses: the basket among the reeds
  9: <>
    <path d="M44 148Q46 102 40 72M54 148Q52 112 60 82M150 148Q152 106 146 76M160 148Q158 116 166 90" />
    <path className="a" d="M40 72V60M60 82V70M146 76V64M166 90V78" strokeWidth="4" />
    <path className="p" d="M62 130Q100 150 138 130L132 114H68Z" /><path className="p" d="M66 114Q100 100 134 114" />
    <path className="f" d="M70 122H130M78 116L74 136M90 116L88 140M100 116V142M112 116L114 140M124 116L128 136" />
    <Waves y={150} />
  </>,
  // Leaving Egypt: the way through the sea, the fire going before
  10: <>
    <path d="M32 152V82Q32 62 50 62Q64 62 62 76Q60 84 52 80M50 152V92Q50 78 64 78Q78 78 76 92Q74 100 66 96M68 152V104Q68 94 78 96" />
    <path d="M168 152V82Q168 62 150 62Q136 62 138 76Q140 84 148 80M150 152V92Q150 78 136 78Q122 78 124 92Q126 100 134 96M132 152V104Q132 94 122 96" />
    <path className="f" d="M40 120V136M58 112V128M160 120V136M142 112V128" />
    <path className="f" d="M84 168L92 92M116 168L108 92" />
    {Flame(100, 80, 30)}
  </>,
  // In the wilderness: the mountain in the cloud, and the two tablets
  11: <>
    <path className="p" d="M30 156L82 82L102 104L122 72L170 156Z" />
    <path className="p" d="M100 72Q98 58 112 60Q118 48 132 54Q148 52 146 66Q138 72 126 68Q114 76 100 72Z" />
    <path className="a" d="M126 42L120 54H128L122 66" />
    <path className="p" d="M78 158V132Q78 124 86 124Q94 124 94 132V158ZM98 158V132Q98 124 106 124Q114 124 114 132V158Z" />
    <path className="f" d="M82 136H90M82 142H90M82 148H90M102 136H110M102 142H110M102 148H110" />
  </>,
  // How Jericho was taken: the wall falls at the trumpet's sound
  12: <>
    <path className="p" d="M68 66Q90 50 122 48Q134 46 140 36L146 40Q140 56 126 58Q96 62 74 74Z" />
    <path className="a" d="M150 34Q156 38 154 46M156 28Q164 36 160 48" />
    <path className="p" d="M36 152V104H58V96H70V104H92V152Z" /><path className="f" d="M36 118H92M36 134H92M54 104V118M76 118V134M54 134V152M82 104V118" />
    <rect className="p" x="104" y="138" width="20" height="11" transform="rotate(-14 114 143)" /><rect className="p" x="128" y="140" width="20" height="11" transform="rotate(10 138 145)" />
    <rect className="p" x="116" y="124" width="20" height="11" transform="rotate(24 126 129)" /><rect className="p" x="146" y="126" width="16" height="10" transform="rotate(-30 154 131)" />
    <Ground y={154} />
  </>,
  // The land of Canaan won: the sun and the moon stand still
  13: <>
    <path className="ao" d="M76 56a14 14 0 1 0 0.1 0" />{Rays(76, 70, 20, 26)}
    <path className="f" d="M140 50A14 14 0 1 0 140 76A10 10 0 1 1 140 50Z" />
    <path className="p" d="M30 152Q60 112 92 132Q122 104 170 152Z" /><path className="f" d="M56 140L62 134M120 132L128 124" />
  </>,
  // The earlier judges: Gideon's jar, the torch inside
  14: <>
    <path className="a" d="M100 94Q84 80 92 62Q96 70 100 66Q102 54 110 46Q118 66 110 82Q108 90 100 94Z" />
    <path className="p" d="M82 96Q70 112 72 132Q76 156 100 156Q124 156 128 132Q130 112 118 96Z" /><path d="M82 96H118" />
    <path className="f" d="M80 120Q100 126 120 120" />
    <path className="p" d="M140 152L150 138L162 148L152 158Z" /><path className="p" d="M40 150L46 140L58 146L50 156Z" />
    <Ground y={158} />
  </>,
  // The later judges: Samson between the two pillars
  15: <>
    <path className="p" d="M42 54H158V66H42Z" /><path className="a" d="M100 54L96 60L102 66" />
    <path className="p" d="M58 66H78V150H58ZM122 66H142V150H122Z" /><path d="M52 66H84M116 66H148M52 150H84M116 150H148" />
    <path className="f" d="M64 72V144M72 72V144M128 72V144M136 72V144" />
    {P(100, 150, 0.85, <path d="M-8 -24L-24 -32M8 -24L24 -32" />)}
  </>,
  // The last of the judges: the boy Samuel hears his name by the lamp
  16: <>
    <path d="M150 160V86M140 160H160" /><path className="p" d="M136 86H164Q160 96 150 96Q140 96 136 86Z" />{Flame(150, 84, 20)}
    <path className="p" d="M36 140H120V152H36Z" /><path d="M36 128V160M120 140V160" />
    <path className="p" d="M54 140Q80 126 116 140Z" /><circle className="p" cx="48" cy="134" r="7" />
    <path className="f" d="M58 112Q64 106 62 98M66 116Q76 106 72 92" /><Ground y={162} />
  </>,
  // The first king: the horn of oil poured over a crown
  17: <>
    <path className="p" d="M80 58Q106 40 138 50L134 62Q112 56 94 68Z" /><path className="f" d="M92 54L100 64M108 48L114 58" />
    <path className="a" d="M90 74Q86 82 90 86Q94 82 90 74Z" /><circle className="a" cx="96" cy="96" r="2.5" />
    {Crown(70, 130, 150, 34)}<path className="f" d="M72 140H128" />
  </>,
  // Review, Joshua to Saul: the leader, the judge and the king
  18: <>{P(58, 152, 1.2, STAFF)}{P(100, 152, 1.35)}{P(142, 152, 1.2, CROWN)}<Ground y={154} /></>,
  // Review of the places: a map with its road
  19: <>
    <path className="p" d="M42 58H158V146H42Z" /><path d="M36 52V152M164 52V152" />
    <path className="f" d="M146 58Q134 100 146 146M62 86L70 76L78 86M108 134L118 122L128 134" />
    <path className="a d" d="M56 130Q76 100 96 112T138 74" />
    <circle className="a" cx="56" cy="130" r="4" /><circle className="a" cx="138" cy="74" r="4" />
  </>,
  // Saul as king: his spear and shield
  20: <>
    <path d="M54 160L146 44" strokeWidth="2" /><path className="p" d="M146 44L158 30L152 52Z" />
    <circle className="p" cx="92" cy="114" r="34" /><circle className="f" cx="92" cy="114" r="24" /><circle className="a" cx="92" cy="114" r="5" />
  </>,
  // The boy David: his sling and five smooth stones
  21: <>
    <circle cx="100" cy="46" r="4" /><path d="M96 50Q84 80 92 104M104 50Q116 80 108 104" />
    <path className="p" d="M88 102Q100 122 112 102Q100 108 88 102Z" /><circle className="a" cx="100" cy="108" r="3" />
    <ellipse className="p" cx="58" cy="148" rx="9" ry="6" /><ellipse className="p" cx="79" cy="153" rx="8" ry="6" /><ellipse className="p" cx="100" cy="148" rx="9" ry="6" />
    <ellipse className="p" cx="121" cy="153" rx="8" ry="6" /><ellipse className="p" cx="142" cy="148" rx="9" ry="6" />
    <path className="f" d="M40 160H160" />
  </>,
  // David and Saul: the harp David played
  22: <>
    <path className="p" d="M64 58Q56 110 78 152H122Q144 110 136 58Q128 56 124 64Q120 100 110 138H90Q80 100 76 64Q72 56 64 58Z" />
    <path d="M70 72H130" /><path className="f" d="M88 72L92 138M96 72V138M104 72V138M112 72L108 138" />
    <path className="a" d="M150 76V58L160 54V72" /><circle className="a" cx="147" cy="77" r="3" /><circle className="a" cx="157" cy="73" r="3" />
  </>,
  // The end of Saul's reign: the crown fallen on the mountain
  23: <>
    <path className="f" d="M50 60Q60 50 74 56Q86 48 96 58M120 48Q132 40 146 48" />
    <path d="M40 132L64 106M72 98L90 78" /><path className="p" d="M90 78L100 66L96 84Z" />
    <path className="p" d="M30 156Q70 104 110 120Q140 108 170 156Z" />
    <g transform="rotate(18 104 140)">{Crown(86, 122, 148, 24)}</g>
  </>,
  // David, king of Israel: Jerusalem, the city on the hill
  24: <>
    <path d="M100 86V60" /><path className="a" d="M100 60L118 66L100 72Z" />
    <path className="p" d="M44 148V112H58V104H66V112H84V96H94V86H106V96H116V112H134V104H142V112H156V148Z" />
    <path d="M92 148V132Q100 122 108 132V148" /><path className="f" d="M52 124V130M146 124V130M78 120V126M122 120V126" />
    <path className="f" d="M30 160Q100 140 170 160" />
  </>,
  // David and Absalom: the great oak, and the mule running on
  25: <>
    <path d="M90 156V100M90 112L68 88M90 106L116 86" />
    <path className="p" d="M52 92C36 80 48 56 68 60C74 40 102 40 108 54C126 44 148 60 140 78C152 92 136 108 118 100C108 110 84 108 74 100C64 106 50 102 52 92Z" />
    <path d="M128 142L124 156M134 142L136 156M146 142L144 156M152 140L156 154" />
    <path className="p" d="M122 136Q124 126 140 126Q154 126 156 136Q150 142 140 142H130Q122 142 122 136Z" />
    <path className="p" d="M154 130L164 118L170 124L160 134Z" /><path d="M164 118L162 110M167 120L168 112" />
    <Ground y={158} />
  </>,
  // Solomon: the scales of a wise judge
  26: <>
    <path d="M100 158V58M80 158H120M56 70H144" /><circle className="a" cx="100" cy="56" r="4" />
    <path className="f" d="M56 70L42 112M56 70L70 112M144 70L130 112M144 70L158 112" />
    <path className="p" d="M38 112H74Q70 124 56 124Q42 124 38 112ZM126 112H162Q158 124 144 124Q130 124 126 112Z" />
  </>,
  // The temple, with its two great pillars
  27: <>
    <path className="p" d="M50 86L100 60L150 86Z" /><path className="p" d="M56 150V86H144V150Z" />
    <path d="M90 150V114H110V150" /><path className="p" d="M64 150V98H74V150ZM126 150V98H136V150Z" />
    <path className="a" d="M62 98H76M124 98H138" /><path className="f" d="M40 158H160M46 152H154" />
  </>,
  // Review: a scroll with the lessons ticked off
  28: <>
    <path className="p" d="M56 50H144V150H56Z" /><path d="M50 46V154M150 46V154" />
    <path className="a" d="M66 72L70 76L78 66M66 96L70 100L78 90M66 120L70 124L78 114" />
    <path className="f" d="M86 72H132M86 96H128M86 120H134M86 140H120" />
  </>,
  // The two kingdoms: one crown becomes two
  29: <>
    {Crown(34, 86, 132, 32)}{Crown(114, 166, 132, 32)}
    <path className="f" d="M34 124H86M114 124H166" />
    <path className="a" d="M100 64L94 84L104 100L96 120L102 140L98 156" />
  </>,
  // Elijah: the raven bringing bread by the brook
  30: <>
    <path className="p" d="M64 88Q84 72 108 80L150 62L132 86Q122 102 96 100Q76 100 64 88Z" />
    <path className="f" d="M88 84Q106 90 126 80" /><path d="M64 88L52 92L64 95" /><circle className="a" cx="74" cy="86" r="1.6" />
    <ellipse className="p" cx="44" cy="100" rx="7" ry="5" /><path className="a" d="M40 100H48" />
    <path className="p" d="M40 144Q46 128 62 132Q72 128 76 144Z" />
    <path className="f" d="M30 150Q70 140 100 150T170 146M44 162Q84 154 124 162" />
  </>,
  // On Carmel: the altar of stones, and the fire from heaven
  31: <>
    <path className="a" d="M100 112Q70 104 76 80Q82 90 88 86Q84 66 98 50Q100 66 108 70Q112 58 120 54Q130 80 122 100Q116 110 100 112Z" />
    <path d="M64 120L136 112M64 112L136 120" />
    <path className="p" d="M56 152V120H144V152Z" />
    <path className="f" d="M56 136H144M78 120V136M100 120V136M122 120V136M66 136V152M88 136V152M112 136V152M134 136V152M46 160H154" />
  </>,
  // The prophet Elisha: the widow's oil filling every jar
  32: <>
    <path className="p" d="M104 54Q108 42 124 44L132 52Q128 62 116 66Q106 66 104 54Z" /><path d="M124 44L130 38" />
    <path className="a" d="M106 66Q100 84 100 104" />
    {Jar(60, 154, 0.9)}{Jar(100, 154, 1.05)}{Jar(140, 154, 0.9)}
    <path className="f" d="M36 156H164" />
  </>,
  // Elisha and Jonah: the great fish
  33: <>
    <path className="f" d="M34 64Q50 58 66 64T98 64T130 64T162 64" />
    <path className="p" d="M40 112Q70 76 124 92Q140 98 150 106L168 88L164 116L170 140L148 124Q130 140 96 140Q58 140 40 112Z" />
    <circle className="a" cx="62" cy="106" r="3" /><path d="M40 112Q52 118 64 116" /><path className="f" d="M80 98Q88 112 80 128M98 104Q104 114 98 126" />
    <Waves y={156} />
  </>,
  // The ten tribes lost: the chain broken, the people led away
  34: <>
    <ellipse className="p" cx="44" cy="92" rx="15" ry="8" /><path d="M58 92H74" /><ellipse className="p" cx="80" cy="92" rx="12" ry="7" />
    <ellipse className="p" cx="156" cy="92" rx="15" ry="8" /><path d="M142 92H126" /><ellipse className="p" cx="120" cy="92" rx="12" ry="7" />
    <path className="a" d="M96 80L100 72M100 92H108M96 104L100 112" />
    {P(74, 158, 0.85)}{P(100, 158, 0.85)}{P(126, 158, 0.85)}<path className="f" d="M40 160H160" />
  </>,
  // The early kings of Judah: Joash, the boy king, with the priest
  35: <>
    <path className="p" d="M130 150V66H146V150Z" /><path d="M124 66H152M124 150H152" /><path className="f" d="M136 72V144M140 72V144" />
    {P(66, 154, 1.3, STAFF)}{P(108, 154, 0.9, CROWN)}<Ground y={156} />
  </>,
  // The later kings of Judah: Hezekiah's shadow goes back on the steps
  36: <>
    <path className="ao" d="M152 50a8 8 0 1 0 0.1 0" />
    <path className="p" d="M38 156V140H58V124H78V108H98V92H118V156Z" />
    <path d="M132 156V64" /><path className="a" d="M132 64L68 124" />
    <path className="f" d="M60 84Q74 70 90 74M86 70L90 74L86 78" /><Ground y={158} />
  </>,
  // In Babylon: the harps hung on the willows by the river
  37: <>
    <path d="M78 156Q84 120 78 80" />
    <path d="M78 80Q102 76 112 118M78 80Q106 70 132 104M78 80Q58 78 50 118M78 80Q60 66 40 100" />
    <path d="M120 90V104" /><path className="p" d="M108 104Q104 124 112 134H128Q136 124 132 104Z" /><path d="M110 108H130" />
    <path className="f" d="M116 110V130M120 110V132M124 110V130" />
    <path className="f" d="M30 160Q70 152 100 160T170 156" />
  </>,
  // Daniel: the lion that did not bite
  38: <>
    <circle className="p" cx="72" cy="72" r="9" /><circle className="p" cx="128" cy="72" r="9" />
    <path className="p" d="M100 48C120 48 128 56 136 64C150 68 152 82 152 94C160 108 152 122 144 130C140 144 126 150 114 150C108 156 92 156 86 150C74 150 60 144 56 130C48 122 40 108 48 94C48 82 50 68 64 64C72 56 80 48 100 48Z" />
    <path className="p" d="M76 96Q78 76 100 76Q122 76 124 96Q126 120 112 134Q100 142 88 134Q74 120 76 96Z" />
    <path d="M86 98Q90 102 94 98M106 98Q110 102 114 98" /><path className="a" d="M94 114H106L100 120Z" /><path d="M100 120V126M92 128Q100 132 108 128" />
  </>,
  // The return from Babylon: the wall built again
  39: <>
    <path className="p" d="M36 156V108H56V100H76V92H100V116H122V156Z" />
    <path className="f" d="M36 124H122M36 140H122M56 108V124M80 124V140M100 108V124M56 140V156M100 140V156M78 92V108" />
    <rect className="a" x="80" y="80" width="16" height="8" />
    <path d="M132 156L150 84M146 156L164 84" /><path d="M135 144H149M138 132H152M141 120H155M144 108H158M147 96H161" />
  </>,
  // Queen Esther: the crown, and the king's golden sceptre held out
  40: <>
    {Crown(56, 144, 110, 34)}<path className="f" d="M56 102H144" />
    <circle className="a" cx="100" cy="72" r="3" /><circle className="a" cx="100" cy="92" r="4" />
    <path d="M56 160L138 124" strokeWidth="2.4" /><circle className="a" cx="144" cy="121" r="6" />
  </>,
  // The end of the Old Testament: the sun of righteousness rising
  41: <>
    <path className="a" d="M57.5 120.6L45.9 117.5M68.9 100.9L60.4 92.4M88.6 89.5L85.5 77.9M111.4 89.5L114.5 77.9M131.1 100.9L139.6 92.4M142.5 120.6L154.1 117.5" />
    <path className="p" d="M64 132A36 36 0 0 1 136 132Z" />
    <path d="M30 132H170" /><path className="f" d="M70 146H130M84 158H116" />
  </>,
  // Review of the Jewish people: their story on an open scroll
  42: <>
    <path className="p" d="M48 70H152V130H48Z" /><rect className="p" x="34" y="62" width="16" height="76" rx="6" /><rect className="p" x="150" y="62" width="16" height="76" rx="6" />
    <path className="f" d="M58 82H96M58 92H92M58 102H98M58 112H90M106 82H142M106 92H138M106 102H142M106 112H134" />
    <path className="a" d="M58 122H80" />
  </>,
};
