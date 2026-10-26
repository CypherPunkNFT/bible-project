export const collectionTones:Record<string,string>={sermons:'#69c7bb',scripture:'#d69c79',theology:'#a99bd6',apologetics:'#d48faf','christian-life':'#96b784',ministry:'#d7b569',history:'#83aed5',standards:'#cf9191',research:'#9badaf',cited:'#d7b569'};
/** Decorative ink drawings. Source identities live in the catalogue, not this artwork. */
export function CollectionArt({id}:{id:string}) {
 const book=<><path d="M42 50 Q68 38 96 52 Q124 38 150 50 V99 Q122 89 96 102 Q69 89 42 99Z"/><path d="M96 52V102M49 58Q71 49 87 58M49 67Q71 58 87 67M105 58Q125 49 143 58M105 67Q125 58 143 67"/></>;
 const motifs:Record<string,React.ReactNode>={
 sermons:<>{book}<path d="M65 104L70 126H124L129 104M79 126V136M115 126V136M67 136H128M96 20V34M73 25L79 37M119 25L113 37"/></>,
 scripture:<>{book}<circle cx="134" cy="46" r="24"/><path d="M130 28L141 51L119 62ZM151 63L167 81"/><path d="M55 111H124M64 119H114"/></>,
 theology:<><path d="M48 40H74V126H48ZM79 27H107V126H79ZM111 48L134 42L155 122L131 128ZM53 51H69M53 111H69M85 40H101M85 111H101M119 59L136 55M133 112L147 108M38 131H165"/><path d="M90 63H97M93 59V77"/></>,
 apologetics:<><path d="M36 39H117V87H81L61 105V87H36ZM91 96H126L146 114V96H163V59H126"/><path d="M58 54H99M58 65H86M133 72H148M133 82H148"/><circle cx="56" cy="124" r="3"/><circle cx="158" cy="35" r="3"/></>,
 'christian-life':<><path d="M69 118H127L136 85H59ZM77 119L74 132H123L119 119M96 85V50M96 66Q65 67 65 43Q89 42 96 66ZM96 52Q123 53 126 26Q102 26 96 52ZM96 82Q120 82 132 63Q106 60 96 82Z"/><path d="M47 137H144M45 84L40 73M144 91L153 84"/></>,
 ministry:<><path d="M52 126V71L96 32L140 71V126ZM76 126V89Q96 63 116 89V126M96 17V43M86 26H106M41 126H153M61 71H72M120 71H131"/><circle cx="96" cy="57" r="7"/><path d="M41 116V92H52M140 92H152V116"/></>,
 history:<><path d="M65 32H140Q157 32 157 46H82Q82 32 65 32Q48 32 48 46V112Q48 127 64 127H137Q121 127 121 112V46M64 127Q80 127 80 112H121"/><path d="M65 57H106M65 69H106M65 81H99M135 63V104M133 104L144 93M133 104L126 96"/></>,
 standards:<><path d="M44 34H76V125H44ZM81 34H114V125H81ZM119 34H151V125H119M39 130H157M50 43H70M87 43H108M125 43H145M50 112H70M87 112H108M125 112H145M60 60V92M97 60V92M135 60V92"/><path d="M90 27V16H105V27"/></>,
 research:<><path d="M41 54H84L96 67H157V124H41ZM47 54V40H139V67M61 40V28H152V67"/><path d="M58 86H113M58 98H101M128 92H145M137 84V101"/></>,
 cited:<>{book}<path d="M61 31Q49 31 49 43H62V28M79 31Q67 31 67 43H80V28M119 113H153M119 122H143"/></>,
 };
 return <svg viewBox="0 0 200 155" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="100" cy="78" r="65" fill="currentColor" fillOpacity=".035" strokeOpacity=".14"/><path d="M15 78H26M174 78H185M100 4V12M100 144V151" opacity=".3"/>{motifs[id]??book}</svg>;
}
