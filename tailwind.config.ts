import animate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

// Every colour resolves to a token in src/index.css, as on the CypherPunk NFT site, so opacity
// modifiers (`bg-ink/10`) keep working and the dark theme is one block of token overrides.
type ColorFn = (args: { opacityValue?: string }) => string;

const token = (name: string): string => {
  const fn: ColorFn = ({ opacityValue }) =>
    opacityValue === undefined
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`;
  return fn as unknown as string;
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
        hebrew: "var(--font-hebrew)",
      },
      colors: {
        page: token("--page"),
        surface: token("--surface"),
        "surface-2": token("--surface-2"),
        ink: token("--ink"),
        muted: token("--muted"),
        line: token("--line"),
        accent: token("--accent"),
        red: token("--red-letter"),
        history: token("--history"),
        poetry: token("--poetry"),
        prophets: token("--prophets"),
        gospels: token("--gospels"),
        epistles: token("--epistles"),
        revelation: token("--revelation"),
        apocrypha: token("--apocrypha"),
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      screens: { xs: "420px" },
    },
  },
  plugins: [animate],
} satisfies Config;
