// The drawings for Hurlbut's New Testament lessons, 43 to 88 in the course (owner, 2026-10-25: "real line drawings, not
// icons"). Each picks the one thing a child would remember from the lesson. Pieces and classes: art-kit.tsx.
import type { ReactNode } from "react";
import { ARMS_UP, Flame, Ground, Jar, P, Rays, STAFF, Sheep, Star, Waves } from "./art-kit";

/** A fish facing left, its middle at (x, y). */
const fish = (x: number, y: number) => <>
  <path className="p" d={`M${x - 18} ${y}Q${x - 4} ${y - 12} ${x + 12} ${y}Q${x - 4} ${y + 12} ${x - 18} ${y}Z`} />
  <path d={`M${x + 12} ${y}L${x + 22} ${y - 8}V${y + 8}Z`} /><circle className="a" cx={x - 10} cy={y - 2} r="1.4" />
</>;

/** A basket of loaves standing at (x, y). */
const basket = (x: number, y: number, s = 1) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path className="p" d="M-14 -18Q-8 -32 0 -18Q8 -32 14 -18" /><path className="p" d="M-18 -18H18L14 0H-14Z" />
  <path className="f" d="M-16 -10H16M-8 -18L-6 0M6 -18L6 0" />
</g>;

export const NEW: Record<number, ReactNode> = {
  // The angel by the altar: the incense rising in the temple
  43: <>
    {Star(146, 66, 16)}
    <path className="f" d="M100 92Q90 78 100 68T100 44M108 90Q118 78 110 66" />
    <path d="M72 96V88M128 96V88M70 96H130" /><path className="p" d="M70 96H130V104H70Z" /><path className="p" d="M76 104H124V156H76Z" />
    <path className="f" d="M84 116H116M84 144H116" /><Ground y={158} />
  </>,
  // The stable and the shepherds: the baby in the manger
  44: <>
    {Star(100, 46, 14)}
    <path d="M68 128L58 156M132 128L142 156M84 128L74 156M116 128L126 156" />
    <path className="p" d="M82 106Q84 92 100 92Q118 92 120 106Z" /><circle className="p" cx="84" cy="98" r="6" />
    <path className="p" d="M56 106H144L132 128H68Z" />
    <path className="f" d="M64 106L60 96M78 106L76 94M124 106L128 96M138 106L142 98" /><Ground y={158} />
  </>,
  // The wise men: the star, and their three gifts
  45: <>
    <path className="a" d="M100 34L106 56L128 62L106 68L100 90L94 68L72 62L94 56Z" /><path className="f" d="M100 92V116" />
    <path className="p" d="M52 156V132H82V156Z" /><path d="M48 132H86M67 132V156" />
    <path className="p" d="M92 156Q88 140 96 132H104Q112 140 108 156Z" /><path d="M96 132V126H104V132" />
    <path className="p" d="M118 156V138H148V156Z" /><path className="p" d="M118 138Q133 126 148 138" /><circle className="a" cx="133" cy="146" r="2" />
  </>,
  // The boy Jesus in the temple with the teachers
  46: <>
    <path d="M34 66H166" /><path className="p" d="M40 152V66H52V152ZM148 152V66H160V152Z" />
    {P(72, 154, 1.15)}{P(128, 154, 1.15)}{P(100, 154, 0.85)}
    <rect className="a" x="89" y="134" width="22" height="6" rx="2" /><Ground y={156} />
  </>,
  // John the Baptist: water poured out at the river
  47: <>
    <path className="p" d="M78 72Q100 54 124 68L128 82Q104 94 82 86Z" /><path className="f" d="M88 84L92 66M102 88V62M116 86V66" />
    <path className="a" d="M104 92Q100 108 102 128" /><ellipse className="f" cx="102" cy="140" rx="20" ry="4" />
    <path d="M148 150Q150 112 144 84M158 150Q156 118 164 96" /><path className="a" d="M144 84V72M164 96V84" strokeWidth="4" />
    <Waves y={152} />
  </>,
  // Jesus in the desert and by the river: the stones, and the dove
  48: <>
    <path className="p" d="M78 76Q96 70 108 78L134 60Q130 82 114 88Q100 96 86 88Q76 84 78 76Z" />
    <path className="f" d="M98 80L120 66" /><path d="M78 76L70 78L78 81" />
    <path className="ao" d="M54 54a8 8 0 1 0 0.1 0" />
    <ellipse className="p" cx="64" cy="146" rx="14" ry="9" /><ellipse className="p" cx="98" cy="150" rx="12" ry="8" /><ellipse className="p" cx="132" cy="144" rx="15" ry="10" />
    <path className="f" d="M34 160Q70 152 100 158T166 156" />
  </>,
  // The water turned to wine: the stone jars
  49: <>{Jar(62, 154, 0.95)}{Jar(100, 156, 1.15, true)}{Jar(138, 154, 0.95)}<path className="f" d="M36 158H164" /></>,
  // At Jacob's well
  50: <>
    <path d="M64 112V64M136 112V64M58 64H142M100 64V94" /><path className="p" d="M92 94H108L106 106H94Z" />
    <path className="p" d="M60 112V150Q100 162 140 150V112Z" /><ellipse className="p" cx="100" cy="112" rx="40" ry="10" />
    <path className="f" d="M60 128Q100 138 140 128M80 116V146M120 116V146M100 120V152" /><path className="a" d="M94 100H106" />
  </>,
  // At Nazareth: the scroll read in the synagogue
  51: <>
    <path className="p" d="M50 78Q75 70 100 78Q125 70 150 78V132Q125 124 100 132Q75 124 50 132Z" /><path d="M46 70V140M154 70V140M100 78V132" />
    <path className="a" d="M60 90H90" /><path className="f" d="M60 100H90M60 110H86M60 120H90M110 90H140M110 100H136M110 110H140M110 120H132" />
  </>,
  // Many mighty works: the friend let down through the roof
  52: <>
    <path className="p" d="M40 156V96H160V156Z" /><path d="M34 96H80M120 96H166" /><path className="a" d="M80 96L84 90M120 96L116 90" />
    <path d="M84 56V110M116 56V110" /><path className="p" d="M76 110H124V120H76Z" /><circle className="p" cx="86" cy="106" r="5" />
    <path className="f" d="M136 156V130H150V156M50 112H64V126H50Z" />
  </>,
  // On the mountain: Jesus teaching the crowd, the birds above
  53: <>
    <path className="f" d="M126 62Q130 58 134 62Q138 58 142 62M56 68Q59 65 62 68Q65 65 68 68" />
    <path className="p" d="M30 156Q92 80 170 156Z" />{P(96, 124, 0.85)}
    <circle className="f" cx="56" cy="144" r="5" /><circle className="f" cx="70" cy="136" r="5" /><circle className="f" cx="128" cy="134" r="5" /><circle className="f" cx="144" cy="144" r="5" />
    <path className="a" d="M50 156Q52 148 58 146M146 156Q148 148 154 148" />
  </>,
  // The captain's servant: the Roman soldier's helmet
  54: <>
    <path className="a" d="M70 86Q100 40 130 86" /><path className="f" d="M80 76L76 64M90 66L88 52M100 62V48M110 66L112 52M120 76L124 64" />
    <path className="p" d="M64 132Q60 86 100 82Q140 86 136 132H124V108Q100 100 76 108V132Z" />
    <path className="p" d="M76 108V146L88 140V110ZM124 108V146L112 140V110Z" /><path className="f" d="M70 100Q100 92 130 100" />
  </>,
  // The storm on the lake
  55: <>
    <path className="a" d="M58 44L50 64H60L52 82" /><path className="f" d="M140 50L134 62M152 58L146 70M128 44L122 56" />
    <path d="M100 118V56" /><path className="p" d="M102 60L134 108H102Z" />
    <path className="p" d="M54 118H146L132 140H68Z" />
    <path d="M32 140Q48 128 64 140T96 140T128 140T160 140" /><path className="f" d="M42 154Q58 142 74 154T106 154T138 154" />
  </>,
  // The little girl raised to life
  56: <>
    <path d="M40 120V160M160 134V160" /><path className="p" d="M40 134H160V146H40Z" />
    <path className="p" d="M62 134Q60 110 70 108Q80 110 80 134Z" /><circle className="p" cx="70" cy="100" r="8" />
    <path className="p" d="M76 134Q110 120 156 134Z" />
    <path className="f" d="M150 88L120 96L124 106L152 100" /><path d="M120 96Q104 100 90 110" />
    <path className="a" d="M70 84V78M56 90L52 86M84 90L88 86" />
  </>,
  // John the Baptist in prison: the barred window
  57: <>
    <path className="f" d="M36 100H62M138 100H164M36 130H62M138 130H164M48 100V130M152 100V130M40 70H62M138 70H160" />
    <path className="p" d="M70 150V86Q100 56 130 86V150Z" /><path d="M85 74V150M100 68V150M115 74V150M70 112H130" />
    <path className="a" d="M120 98A8 8 0 1 1 112 90A6 6 0 0 0 120 98Z" />
  </>,
  // The four thousand fed: the baskets left over
  58: <>{basket(76, 124, 0.8)}{basket(124, 124, 0.8)}{basket(58, 156)}{basket(100, 156)}{basket(142, 156)}</>,
  // The glory of Jesus on the mountain
  59: <>
    <path className="a" d="M118 62V40M106 64L94 48M130 64L142 48M100 74L80 66M136 74L156 66" />
    <path className="p" d="M30 156L82 82L100 98L118 72L170 156Z" />
    <circle className="f" cx="108" cy="80" r="2.5" /><circle className="a" cx="118" cy="76" r="3" /><circle className="f" cx="128" cy="80" r="2.5" />
    <path className="f" d="M48 54Q58 44 70 50Q80 44 88 52" />
  </>,
  // The two sisters: Martha's pitcher and cup
  60: <>
    <path d="M104 112Q120 116 106 136" />
    <path className="p" d="M74 156Q60 130 74 104L68 92H104L98 104Q112 130 98 156Z" /><path className="f" d="M70 120Q86 126 102 120" />
    <path className="p" d="M118 136H146L142 156H122Z" /><path className="a" d="M122 142H142" />
    <path className="f" d="M40 158H160" />
  </>,
  // The man born blind: his eyes opened
  61: <>
    <path className="a" d="M100 56V42M74 64L66 52M126 64L134 52M56 78L44 70M144 78L156 70" />
    <path className="p" d="M50 100Q100 56 150 100Q100 144 50 100Z" /><circle className="p" cx="100" cy="100" r="16" /><circle className="a" cx="100" cy="100" r="6" />
    <path className="f" d="M64 150Q100 140 136 150Q100 160 64 150Z" />
  </>,
  // The good shepherd: the crook and the sheep
  62: <><path d="M48 160V62Q48 44 64 44Q78 44 78 58" />{Sheep(100, 120)}<Ground y={158} /></>,
  // Lazarus raised to life: out of the tomb
  63: <>
    <path className="p" d="M30 156Q36 76 100 70Q164 76 170 156Z" />
    <path className="s" d="M78 156V118Q100 96 122 118V156Z" />
    <path className="p" d="M92 156V120Q100 108 108 120V156Z" /><path className="f" d="M92 128L108 124M92 138L108 134M92 148L108 144" />
    <circle className="p" cx="148" cy="140" r="16" /><path className="a" d="M70 108L62 102M130 108L138 102M100 90V82" />
  </>,
  // Parables in Perea: the lost coin found, by lamplight
  64: <>
    <path d="M60 52L98 122" /><path className="p" d="M90 118L112 130L108 156L80 146Z" /><path className="f" d="M92 132L88 148M100 134L98 152" />
    <circle className="a" cx="140" cy="146" r="6" /><path className="a" d="M140 130V124M152 136L157 131M128 136L123 131" />
    <path className="p" d="M126 70H156Q154 80 144 80Q132 80 126 70Z" />{Flame(156, 68, 14)}
    <path className="f" d="M40 160H160" />
  </>,
  // Jesus and the little children
  65: <>
    {P(100, 154, 1.3, <path d="M-8 -26Q-20 -20 -28 -12M8 -26Q20 -20 28 -12" />)}{P(60, 154, 0.8)}{P(140, 154, 0.85)}
    <Ground y={154} />
  </>,
  // Jesus at Jericho: Zacchaeus in the sycamore tree
  66: <>
    <path d="M100 156V108M100 120L76 96M100 112L126 92" />
    <path className="p" d="M50 96C36 80 50 54 74 60C80 40 118 38 126 56C148 50 164 70 154 88C162 104 144 116 128 108C116 118 86 118 74 108C58 114 44 106 50 96Z" />
    <path className="p" d="M112 90Q116 82 124 84L126 100H112Z" /><circle className="p" cx="119" cy="76" r="6" />
    <path className="f" d="M62 80Q70 76 76 82M138 70Q144 66 150 72M86 56Q94 52 100 58" /><Ground y={158} />
  </>,
  // Palm Sunday: the palm branches
  67: <>
    <path d="M60 156Q90 110 140 56" />
    <path d="M68 144L54 138M68 144L72 128M78 128L62 122M78 128L84 112M90 112L74 104M90 112L98 96M104 96L88 86M104 96L112 80M118 80L104 70M118 80L126 66M130 66L120 56M130 66L138 54" />
    <path className="a" d="M140 156Q110 110 60 56M132 144L146 138M132 144L128 128M122 128L138 122M122 128L116 112M110 112L126 104M110 112L102 96M96 96L112 86M96 96L88 80M82 80L96 70M82 80L74 66M70 66L80 56M70 66L62 54" />
    <path className="f" d="M40 160Q100 150 160 160" />
  </>,
  // The last visits to the temple: the widow's two coins
  68: <>
    <circle className="a" cx="98" cy="50" r="5" /><circle className="a" cx="112" cy="36" r="5" /><path className="f" d="M90 40V32M120 24V18" />
    <path className="p" d="M84 96L76 66H124L116 96Z" /><path className="p" d="M60 156V96H140V156Z" />
    <path className="f" d="M92 76H108M70 112H130M70 140H130" /><Ground y={158} />
  </>,
  // On the Mount of Olives: the olive tree
  69: <>
    <path d="M96 146Q90 120 100 108Q108 98 100 84M100 108Q112 104 118 92" />
    <path className="p" d="M58 86Q56 66 80 66Q88 50 108 56Q126 46 140 62Q156 66 150 84Q144 96 124 92Q110 100 96 94Q72 100 58 86Z" />
    <circle className="a" cx="80" cy="80" r="2.5" /><circle className="a" cx="112" cy="70" r="2.5" /><circle className="a" cx="134" cy="80" r="2.5" /><circle className="a" cx="98" cy="84" r="2.5" />
    <path className="f" d="M30 156Q100 120 170 156" />
  </>,
  // At the supper: the bread and the cup
  70: <>
    <path className="f" d="M44 56Q60 48 74 58M58 52L54 44M66 54L70 46" />
    <path className="p" d="M118 88H150Q150 112 134 114Q118 112 118 88Z" /><path d="M134 114V138M122 140H146" /><path className="a" d="M121 94H147" />
    <path className="p" d="M48 140Q48 116 74 116Q94 116 96 140Z" /><path className="p" d="M80 140Q84 126 98 128Q106 132 104 140Z" />
    <path className="f" d="M60 126L66 120M72 124L78 118" /><path d="M36 146H164" />
  </>,
  // The trial of Jesus: the rooster that crowed
  71: <>
    <path className="a" d="M72 120Q46 104 52 72M74 112Q56 88 66 64M76 104Q66 84 80 66" />
    <path className="p" d="M70 126Q66 96 92 92Q96 72 112 72Q124 74 122 90Q130 110 120 128Q106 142 88 140Q74 138 70 126Z" />
    <path className="a" d="M106 72Q106 62 112 66Q114 58 120 64Q124 60 124 70" /><path d="M122 82L132 86L122 90" />
    <path className="a" d="M120 92Q122 100 116 100" /><circle cx="114" cy="80" r="1.5" />
    <path d="M92 140V156M104 138V156M86 156H98M98 156H110" />
  </>,
  // Jesus on the cross
  72: <>
    <path className="f" d="M100 40V30M70 48L64 40M130 48L136 40" />
    <path className="p" d="M94 132V44H106V132Z" /><path className="p" d="M70 64H130V74H70Z" />
    <path className="p" d="M30 156Q100 112 170 156Z" />
  </>,
  // The first Easter day: the stone rolled away
  73: <>
    <path className="ao" d="M56 50a10 10 0 1 0 0.1 0" />{Rays(56, 60, 15, 21)}
    <path className="p" d="M30 156Q34 84 96 80Q150 84 156 156Z" />
    <path className="s" d="M70 156V122Q90 100 110 122V156Z" />
    <circle className="p" cx="146" cy="138" r="20" /><path className="a" d="M90 110V102M74 116L68 110M106 116L112 110" />
  </>,
  // On the shore: the fire of coals and the fish
  74: <>
    <path className="f" d="M30 78Q100 68 170 78M40 90Q100 82 160 90" />
    <path className="a" d="M84 138Q70 124 78 108Q82 116 86 112Q86 100 96 92Q102 112 94 126Q92 134 84 138Z" />
    <path d="M64 150L104 138M64 138L104 150" />{fish(132, 118)}{fish(134, 144)}
    <Ground y={160} />
  </>,
  // Review of the people in the gospel story
  75: <>{P(50, 154, 1, STAFF)}{P(84, 154, 1.1)}{P(116, 154, 1.1)}{P(150, 154, 1)}<path className="a" d="M146 130Q156 126 164 132Q156 138 146 134Z" /><Ground y={156} /></>,
  // Review of the places: the lake, the river and the cities
  76: <>
    <path className="p" d="M86 52Q70 60 72 80Q74 100 92 108Q112 110 120 90Q126 66 112 54Q100 46 86 52Z" />
    <path d="M88 86H104L101 90H91Z" /><path className="a" d="M96 86V72L104 84Z" />
    <path d="M100 108Q92 130 104 150Q110 160 102 166" /><path className="p" d="M96 166Q92 176 100 180Q108 176 104 166Z" />
    <circle className="a" cx="58" cy="86" r="4" /><circle className="a" cx="138" cy="110" r="4" /><circle className="a" cx="78" cy="150" r="4" />
    <path className="f d" d="M58 86Q66 120 78 150" />
  </>,
  // The first days: tongues of fire on every head
  77: <>
    <path className="f" d="M40 70Q80 56 120 66T164 58M48 84Q86 74 124 82" />
    {P(62, 160, 1)}{P(100, 160, 1.1)}{P(138, 160, 1)}
    {Flame(62, 110, 18)}{Flame(100, 105, 20)}{Flame(138, 110, 18)}
  </>,
  // The Beautiful Gate: the lame man walking and leaping
  78: <>
    <path className="p" d="M50 156V76Q100 36 150 76V156H128V90Q100 66 72 90V156Z" /><path className="a" d="M60 74Q100 44 140 74" />
    {P(100, 152, 0.95, ARMS_UP)}<path className="f" d="M116 156L134 136" /><Ground y={158} />
  </>,
  // Philip and the chariot
  79: <>
    <path d="M136 100L168 112" /><circle className="p" cx="110" cy="70" r="7" />
    <path className="p" d="M62 110Q60 84 84 84H136V110Z" /><rect className="a" x="116" y="74" width="16" height="6" rx="2" />
    <circle className="p" cx="82" cy="128" r="26" /><path className="f" d="M82 102V154M56 128H108M64 110L100 146M100 110L64 146" /><circle cx="82" cy="128" r="4" />
    <Ground y={156} />
  </>,
  // The voice that spoke to Saul: the light on the road
  80: <>
    <circle className="a" cx="100" cy="40" r="6" />
    <path className="a" d="M96 48L70 120M98 48L86 124M100 48V126M102 48L114 124M104 48L130 120" />
    <path className="f" d="M90 46L48 110M110 46L152 110" />
    <path className="p" d="M76 136L120 134L122 144L76 146Z" /><circle className="p" cx="68" cy="140" r="7" />
    <path className="f" d="M30 152Q100 140 170 152" />
  </>,
  // About Peter: the great sheet let down from heaven
  81: <>
    <path className="a" d="M76 40Q100 28 124 40" /><path className="f" d="M50 96L84 40M150 96L116 40" />
    <path className="p" d="M50 96H150L136 140Q100 152 64 140Z" />
    <path className="f" d="M70 118Q78 108 88 116M104 110Q110 104 116 110Q122 104 128 110M92 132Q100 126 108 132" />
    <path className="f" d="M40 160H160" />
  </>,
  // The first missionaries: two travellers, and the ship
  82: <>
    <path className="f" d="M120 94H170" /><path className="p" d="M132 84H164L158 92H138Z" /><path className="p" d="M148 84V60L162 82Z" />
    {P(64, 154, 1.15, STAFF)}{P(106, 154, 1.15, STAFF)}<path className="f d" d="M30 160Q100 150 170 156" />
  </>,
  // Paul's second journey: singing at midnight, the prison door shaken open
  83: <>
    <path className="a" d="M138 64V46L150 42V60" /><circle className="a" cx="135" cy="65" r="3" /><circle className="a" cx="147" cy="61" r="3" />
    <path className="p" d="M44 152V64H100V152Z" /><path className="s" d="M52 152V72H92V152Z" />
    <path className="p" d="M92 72L120 84V160L92 152Z" /><path d="M99 78V154M106 80V156M113 82V158M92 104L120 112M92 128L120 136" />
    <path className="f" d="M56 92Q64 86 72 92T88 92" />
    <path className="a" d="M30 160L46 154L56 162L72 154L84 162M130 158L146 152L156 160L170 154" />
  </>,
  // Paul's third journey: the books of magic burned at Ephesus
  84: <>
    <path className="a" d="M100 122Q72 112 80 88Q86 98 92 94Q90 74 104 60Q106 76 114 80Q118 70 124 66Q132 92 122 110Q116 120 100 122Z" />
    <rect className="p" x="66" y="124" width="70" height="14" rx="2" transform="rotate(-4 101 131)" /><rect className="p" x="58" y="138" width="84" height="14" rx="2" />
    <path className="f" d="M66 145H134M76 128H128M60 76V72M142 74V70M70 60V56" />
  </>,
  // Paul a prisoner: the cuff on his wrist, chained to the wall
  85: <>
    <path className="f" d="M150 40V160M150 70H170M150 110H170M150 140H170" /><circle className="p" cx="150" cy="150" r="6" />
    <ellipse className="p" cx="132" cy="140" rx="8" ry="4.5" transform="rotate(30 132 140)" /><ellipse className="p" cx="118" cy="130" rx="8" ry="3" transform="rotate(40 118 130)" />
    <ellipse className="p" cx="104" cy="118" rx="8" ry="4.5" transform="rotate(40 104 118)" />
    <path className="p" d="M44 84Q70 74 96 84V104Q70 94 44 104Z" /><path className="f" d="M48 94Q70 86 92 94" /><circle className="a" cx="94" cy="104" r="3" />
    <path className="f" d="M40 160H140" />
  </>,
  // Paul in the storm: the ship breaking up near the island
  86: <>
    <path className="f" d="M136 132Q148 112 168 120" />
    <path d="M100 120V80L112 64" /><path className="a" d="M102 84L130 96L104 108" />
    <path className="p" d="M38 120H162L148 146H56Z" /><path className="f" d="M50 132H150" />
    <path className="a" d="M30 154Q46 140 62 152T94 152T126 152T160 150" /><path className="f" d="M42 166Q58 156 74 166T106 166T138 166" />
  </>,
  // Paul at Rome: the letters he wrote
  87: <>
    <path className="f" d="M46 150V74Q100 34 154 74V150M64 150V84Q100 56 136 84V150" />
    <path className="p" d="M64 96H124V150H64Z" /><path className="f" d="M72 108H112M72 118H116M72 128H108M72 138H112" />
    <path className="p" d="M150 64Q160 72 156 84Q140 98 122 110Q134 86 150 64Z" /><path className="a" d="M122 110L118 118" />
  </>,
  // Review of the early church
  88: <>
    <path className="a" d="M100 46V28M93 35H107" />
    <path className="p" d="M90 104V64H110V104Z" /><path className="p" d="M86 64L100 46L114 64Z" />
    <path className="p" d="M56 156V110L100 90L144 110V156Z" /><path d="M92 156V136Q100 126 108 136V156" />
    <path className="f" d="M68 122V136M132 122V136M98 74V84" /><Ground y={158} />
  </>,
};
