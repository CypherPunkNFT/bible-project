// The drawings for Rulers and their choices: one thin stroke, round caps, one colour for the wash. No person and no face. Fixed strings written here, never built from data.
window.RCArt = {
  hero: `<svg class="rc-scene" viewBox="0 0 520 420" aria-hidden="true">
    <circle class="rc-orbit" cx="260" cy="214" r="196"/>
    <circle class="rc-faint" cx="260" cy="214" r="170"/>
    <path class="rc-faint" d="M372 54h96"/>
    <path d="M388 54v-14M452 54v-14M380 40h80"/>
    <path class="rc-line-faint" d="M420 54V296"/>
    <path class="rc-line" d="M420 54V296"/>
    <path class="rc-wash" d="M420 296c-9 10-11 18-11 24 0 8 5 15 11 24 6-9 11-16 11-24 0-6-2-14-11-24Z"/>
    <path d="M420 296c-9 10-11 18-11 24 0 8 5 15 11 24 6-9 11-16 11-24 0-6-2-14-11-24Z"/>
    <path class="rc-wash" d="M170 200l-22-62 42 28 34-52 34 52 42-28-22 62Z"/>
    <path d="M170 200l-22-62 42 28 34-52 34 52 42-28-22 62Z"/>
    <path d="M172 208h104"/>
    <circle cx="148" cy="132" r="4"/><circle cx="224" cy="108" r="4"/><circle cx="300" cy="132" r="4"/>
    <path class="rc-faint" d="M206 188l18-22 18 22-18 12Z"/>
    <path d="M74 300c50-22 100-22 150 2 50-24 100-24 150-2v44c-50-22-100-22-150 2-50-24-100-24-150-2Z"/>
    <path d="M224 302v44"/>
    <path d="M74 300c-14 0-22 8-22 20s8 24 22 24"/>
    <path d="M374 300c14 0 22 8 22 20s-8 24-22 24"/>
    <path class="rc-faint" d="M92 310c36-12 74-12 112 2M92 320c36-12 74-12 112 2M92 330c36-12 74-12 112 2M244 312c38-14 76-14 112-2M244 322c38-14 76-14 112-2M244 332c38-14 76-14 112-2"/>
    <path class="rc-star" d="M92 92l2.4 6.6L101 101l-6.6 2.4L92 110l-2.4-6.6L83 101l6.6-2.4Z"/>
    <path class="rc-star" d="M330 248l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8Z"/>
    <path class="rc-star" d="M116 232l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Z"/>
    <path d="M36 372c150-8 298-8 448 0"/>
    <path class="rc-faint" d="M78 388c122-5 242-5 364 0"/>
  </svg>`,
  accession: `<svg viewBox="0 0 120 80" aria-hidden="true"><path class="rc-wash" d="M38 50l-8-24 15 10 15-20 15 20 15-10-8 24Z"/><path d="M38 50l-8-24 15 10 15-20 15 20 15-10-8 24Z"/><path d="M38 58h44"/><path class="rc-faint" d="M14 70c30-6 62-6 92 0"/></svg>`,
  counsel: `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M10 40h30"/><path d="M40 40c20 0 26-20 62-22"/><path class="rc-dash" d="M40 40c20 0 26 20 62 22"/><circle cx="104" cy="18" r="4"/><circle class="rc-wash" cx="104" cy="62" r="4"/><circle cx="104" cy="62" r="4"/></svg>`,
  worship: `<svg viewBox="0 0 120 80" aria-hidden="true"><path class="rc-wash" d="M32 42c6-8 22-10 36-8l14-10 2 12c6 2 8 8 8 12H34c-4 0-4-4-2-6Z"/><path d="M32 42c6-8 22-10 36-8l14-10 2 12c6 2 8 8 8 12H34c-4 0-4-4-2-6Z"/><path d="M42 48v14M60 48v14M78 48v14"/><path d="M28 62h66"/><path class="rc-faint" d="M14 72h92"/></svg>`,
  justice: `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M14 66l14-44h64l14 44Z"/><path class="rc-wash" d="M46 66l8-44h12l8 44Z"/><path class="rc-faint" d="M34 66l10-44M50 66l6-44M70 66l-6-44M86 66l-10-44M26 44h68M20 56h80"/></svg>`,
  correction: `<svg viewBox="0 0 120 80" aria-hidden="true"><path class="rc-wash" d="M38 40c0-8 8-11 14-8 4-6 16-5 18 2 8 0 12 8 7 14-3 6-12 6-16 3-6 4-14 3-17-3-4 0-6-4-6-8Z"/><path d="M38 40c0-8 8-11 14-8 4-6 16-5 18 2 8 0 12 8 7 14-3 6-12 6-16 3-6 4-14 3-17-3-4 0-6-4-6-8Z"/><path d="M50 54v12M68 54v12"/><path class="rc-faint" d="M14 70h92"/></svg>`,
  verdict: `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M22 16v52M98 16v52"/><path class="rc-faint" d="M34 26h34M34 38h40M34 50h28"/><path class="rc-faint" d="M86 26H64M86 38H52M86 50H70"/><circle class="rc-wash" cx="60" cy="38" r="6"/><circle cx="60" cy="38" r="6"/></svg>`,
  fork: `<svg viewBox="0 0 90 120" preserveAspectRatio="none" aria-hidden="true"><path d="M2 60h24"/><path class="rc-ink" d="M26 60c24 0 28-38 62-38"/><path class="rc-dash" d="M26 60c24 0 28 38 62 38"/></svg>`,
  land: `<svg viewBox="0 0 220 150" aria-hidden="true"><path d="M26 124l26-92h116l26 92Z"/><path class="rc-wash" d="M26 124l26-92h116l26 92Z"/><path class="rc-faint" d="M60 124l16-92M92 124l8-92M128 124l-8-92M160 124l-16-92"/><path class="rc-faint" d="M46 60h128M38 88h144M31 110h158"/><path d="M6 124h208"/></svg>`,
  knot: `<svg viewBox="0 0 80 100" preserveAspectRatio="none" aria-hidden="true"><path d="M18 0c0 30 22 30 22 50s-22 20-22 50"/><path d="M62 0c0 30-22 30-22 50s22 20 22 50"/></svg>`,
  first: `<svg viewBox="0 0 80 100" preserveAspectRatio="none" aria-hidden="true"><path class="rc-ink" d="M18 0v100"/><path class="rc-dash" d="M62 0v100"/></svg>`,
  second: `<svg viewBox="0 0 80 100" preserveAspectRatio="none" aria-hidden="true"><path class="rc-dash" d="M18 0v100"/><path class="rc-ink" d="M62 0v100"/></svg>`,
  seal: `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M16 18h72v48H16Z"/><path class="rc-faint" d="M26 30h52M26 40h52M26 50h30"/><circle class="rc-wash" cx="84" cy="58" r="13"/><circle cx="84" cy="58" r="13"/><path d="M78 58l6-7 6 7-6 7Z"/></svg>`,
  bobCharge: `<svg viewBox="0 0 16 16" aria-hidden="true"><path class="rc-fill" d="M8 1l6 7-6 7-6-7Z"/></svg>`,
  bobRight: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/></svg>`,
  bobBoth: `<svg viewBox="0 0 16 16" aria-hidden="true"><path class="rc-fill" d="M8 2.5a5.5 5.5 0 0 0 0 11Z"/><circle cx="8" cy="8" r="5.5"/></svg>`,
  bobNone: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>`,
  foot: `<svg viewBox="0 0 1200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d="M0 96c120-14 210-24 320-16 60 4 110-30 190-30s130 26 180 28c130 6 300-22 510 12"/>
    <path d="M520 62V36h18v8h14v-8h18v8h14v-8h18v26"/>
    <path d="M556 62V52a7 7 0 0 1 14 0v10"/>
    <path class="rc-faint" d="M410 66h110M602 62h120"/>
    <path class="rc-faint" d="M220 100c190-8 590-8 780 0"/>
    <path class="rc-star" d="M300 26l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8Z"/>
    <path class="rc-star" d="M880 20l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Z"/>
  </svg>`,
};
